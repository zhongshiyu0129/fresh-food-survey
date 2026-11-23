(function (root) {
  'use strict';

  const version = 'fresh-survey-2026-v8';
  const channels = [
    {id:'market',name:'农贸市场',kind:'线下',icon:'▦',desc:'到菜市场、农贸集市现场购买。'},
    {id:'supermarket',name:'大型商超',kind:'线下',icon:'▤',desc:'到大型超市或综合生鲜超市现场购买。'},
    {id:'store',name:'社区生鲜店',kind:'线下',icon:'⌂',desc:'到社区小店、蔬果店或路边摊现场购买。'},
    {id:'instant',name:'即时零售到家',kind:'线上',icon:'↗',desc:'线上下单，由附近门店或前置仓配送。'},
    {id:'group',name:'社区团购自提',kind:'线上',icon:'♧',desc:'线上下单，到社区自提点取货。'},
    {id:'ecommerce',name:'电商快递配送',kind:'线上',icon:'□',desc:'在电商平台或直播间下单，通过快递收货。'},
    {id:'other',name:'其他渠道',kind:'其他',icon:'＋',desc:'请注明实际使用的渠道。'},
  ];
  const categories = [
    {id:'veg',name:'新鲜蔬菜',icon:'🥬'},
    {id:'fruit',name:'新鲜水果',icon:'🍎'},
    {id:'meat',name:'生肉禽',icon:'🥩'},
    {id:'fish',name:'水产海鲜',icon:'🐟'},
    {id:'eggs',name:'鲜蛋',icon:'🥚'},
  ];
  const monthly = {
    '1to2':'1–2次', '3to5':'3–5次', '6to10':'6–10次', '11to20':'11–20次', '21plus':'21次及以上',
  };
  const timeBands = {
    under5:'不足5分钟', from5:'5–不足10分钟', from10:'10–不足20分钟',
    from20:'20–不足30分钟', from30:'30–不足60分钟', from60:'60分钟及以上',
  };
  const feeBands = {
    zero:'0元', under3:'大于0且不足3元', from3:'3–不足5元',
    from5:'5–不足10元', from10:'10元及以上',
  };
  const channelReasons = {
    price:'商品价格较低', promotions:'优惠促销较多', fresh:'商品新鲜',
    quality:'品质或食品安全更有保障', variety:'商品种类丰富',
    activeTime:'购买方便，主动花费的时间较少', quickAccess:'能较快拿到商品',
    selection:'方便挑选符合自己需要的商品', habit:'长期使用，已经形成习惯', other:'其他',
  };
  const certificationTypes = { organic:'有机认证', green:'绿色食品认证' };
  const premiums = {
    cheaper:'认证产品更便宜', zero:'同价', '0to10':'贵10%以内', '10to20':'贵超10%至20%',
    '20to50':'贵超20%至50%', '50to100':'贵超50%至100%', over100:'贵超过100%',
  };
  const organicReasons = [
    '价格较高', '不方便买到', '不信任相关认证', '不清楚认证产品的优势',
    '对口感或品质不满意', '这段时间没有需求', '其他',
  ];

  function makeSpendBands(edges) {
    return [0, ...edges].map((min, index) => {
      const max = edges[index] ?? null;
      const id = index === 0 ? 'lt' + max : 'from' + min;
      const label = max === null ? min + '元及以上'
        : index === 0 ? '不足' + max + '元' : min + '–不足' + max + '元';
      return { id, label, min, max };
    });
  }
  const standardSpendBands = makeSpendBands([50, 100, 200, 400, 800]);
  const lowSpendBands = makeSpendBands([20, 50, 100, 200, 400]);
  const spendBands = category => category === 'eggs' || category === 'organic' ? lowSpendBands : standardSpendBands;
  const own = (object, key) => Object.hasOwn(object, key);
  const num = x => x === '' || x == null || !Number.isFinite(Number(x)) ? null : Number(x);
  const nameOf = (items, id) => items.find(item => item.id === id)?.name;

  function blank() {
    return {
      version, step:0, demo:false, consent:false, purchased:'', profile:{},
      channels:[], otherChannel:'', categories:[], frequency:{}, spendBands:{}, categoryChannels:{}, shares:{},
      detailChannels:[], costs:{}, channelReasons:{}, scales:{}, diet:{},
      organic:{aware:'', bought:'', types:[], frequency:'', amountBand:'', channels:[], shares:{}, referenceCategory:'', observedPremium:'', reasons:[], reasonsOther:''},
      mainCompleted:false, organicCompleted:false, startedAt:new Date().toISOString(),
    };
  }

  function allocation(allChannels, chosenChannels, values) {
    if (allChannels.length === 1) return { [allChannels[0]]:100 };
    const selected = allChannels.filter(id => chosenChannels?.includes(id));
    if (selected.length === 1) return { [selected[0]]:100 };
    return Object.fromEntries(selected.map(id => [id, num(values?.[id])]));
  }

  function allocationSum(shares) {
    return Object.values(shares).reduce((sum, share) => sum + (share ?? 0), 0);
  }

  function validAllocation(shares) {
    return Object.values(shares).every(value => value !== null && value >= 0 && value <= 100)
      && Math.abs(allocationSum(shares) - 100) < 0.001;
  }

  function withoutRetiredAnswers(saved) {
    const profile = { ...saved.profile };
    const diet = { ...saved.diet };
    for (const key of ['occupation','personalIncome','householdStructure']) delete profile[key];
    for (const key of ['milk','grain','whole','tuber','soy','nuts']) delete diet[key];
    return { ...saved, version, profile, diet };
  }

  function migrateDraft(saved) {
    if (saved?.version === version) return saved;
    if (['fresh-survey-2026-v4','fresh-survey-2026-v5','fresh-survey-2026-v6','fresh-survey-2026-v7'].includes(saved?.version)) {
      // Monthly totals cannot be reinterpreted as average-per-purchase answers.
      const next = { ...withoutRetiredAnswers(saved), costs:{},
        channelReasons:saved.version === 'fresh-survey-2026-v7' ? (saved.channelReasons ?? {}) : {},
        mainCompleted:false, organicCompleted:false };
      if (next.step > 5) next.step = 5;
      return next;
    }
    const next = blank();
    if (saved?.version !== 'fresh-survey-2026-v3') return next;

    const oldOrganic = saved.organic ?? {};
    const inferChannels = shares => {
      const ids = next.channels.filter(id => num(shares?.[id]) > 0);
      const selected = Object.fromEntries(ids.map(id => [id,num(shares[id])]));
      return validAllocation(selected) ? ids : [];
    };
    const findBand = (category, value) => {
      const amount = num(value);
      return spendBands(category).find(({min, max}) => amount !== null && amount >= min && (max === null || amount < max))?.id ?? '';
    };

    for (const key of ['step','consent','purchased','profile','channels','otherChannel','categories','frequency','shares','detailChannels','scales','diet','startedAt']) {
      if (saved[key] !== undefined) next[key] = saved[key];
    }
    next.profile = { ...next.profile };
    next.diet = { ...next.diet };
    if (next.profile.marketDistance === '不清楚') delete next.profile.marketDistance;
    if (next.diet.typical === '基本和平时一致') next.diet.typical = '基本一致';
    delete next.scales.time3;
    for (const category of next.categories) {
      next.spendBands[category] = findBand(category, saved.expenses?.[category]);
      next.categoryChannels[category] = inferChannels(next.shares[category]);
    }
    const bought = ['yes','no'].includes(oldOrganic.bought) ? oldOrganic.bought : '';
    Object.assign(next.organic, {
      aware:oldOrganic.aware ?? '', bought, amountBand:findBand('organic', oldOrganic.amount),
      channels:inferChannels(oldOrganic.shares), shares:oldOrganic.shares ?? {},
      referenceCategory:oldOrganic.referenceCategory ?? '', observedPremium:oldOrganic.observedPremium ?? '',
      reasons:oldOrganic.reasons ?? [],
    });
    return withoutRetiredAnswers(next);
  }

  function validate(s, step) {
    const issues = [];
    const add = (field, msg) => issues.push({ field, msg });
    const need = (value, key, label) => {
      if (value === undefined || value === null || value === '') add(key, '请填写' + label + '。');
    };
    const requiredFields = (answers, labels) => {
      for (const [key, label] of Object.entries(labels)) need(answers[key], key, label);
    };
    const requireAllocation = (prefix, title, selected, values) => {
      const shares = allocation(s.channels, selected, values);
      if (Object.keys(shares).length === 0) {
        add(prefix, '请勾选' + title + '实际使用的渠道。');
      } else if (Object.values(shares).some(value => value === null || value < 0 || value > 100)) {
        add(prefix, '请为' + title + '勾选的每个渠道填写0–100%的占比。');
      } else if (!validAllocation(shares)) {
        add(prefix, title + '的各渠道占比合计应为100%。');
      }
    };

    if (step === 1) {
      if (!s.consent) add('consent', '请阅读说明并确认自愿参与。');
      need(s.purchased, 'purchased', '过去30天是否亲自购买过生鲜食品');
      if (s.purchased === 'yes') requiredFields(s.profile, {
        province:'常住省份', city:'常住城市', gender:'性别', age:'年龄', education:'受教育程度',
      });
    }
    if (step === 2) {
      requiredFields(s.profile, {
        role:'家庭采购角色', householdSize:'共同居住且共用饮食开支人数',
        householdIncome:'家庭月可支配收入', areaType:'常住地类型', onlineAccess:'线上服务可及情况', marketDistance:'农贸市场步行时间',
      });
      if (!s.profile.special?.length) add('special', '请选择家庭特殊饮食需求成员。没有时请选择「没有上述成员」。');
    }
    if (step === 3) {
      if (!s.channels.length) add('channels', '请至少选择一个实际购买过的渠道。');
      if (s.channels.includes('other') && !s.otherChannel.trim()) add('otherChannel', '请说明其他渠道。');
      for (const channel of s.channels) {
        if (!own(monthly, s.frequency[channel])) add('freq-' + channel, '请选择' + nameOf(channels, channel) + '的购买次数。');
      }
      if (!s.categories.length) add('categories', '请至少选择一类过去30天亲自购买过的生鲜食品。');
    }
    if (step === 4) {
      if (!s.channels.length || !s.categories.length) add('matrix', '请先完成采购渠道与品类选择。');
      for (const category of s.categories) {
        const title = nameOf(categories, category);
        if (!spendBands(category).some(({id}) => id === s.spendBands[category])) {
          add('spend-' + category, '请选择' + title + '的支出区间。');
        }
        requireAllocation('sum-' + category, title, s.categoryChannels[category], s.shares[category]);
      }
    }
    if (step === 5) {
      if (!s.channels.includes(s.detailChannels[0])) add('detailChannels', '请选择第一常用渠道。');
      if (s.detailChannels.length > 2 || new Set(s.detailChannels).size !== s.detailChannels.length) {
        add('detailChannels', '最多选择两个不同渠道。');
      }
      for (const channel of s.detailChannels) {
        const cost = s.costs[channel] ?? {};
        const title = nameOf(channels, channel);
        if (!own(timeBands, cost.time)) add('time-' + channel, '请选择' + title + '的平均每次购物时间。');
        if (!own(feeBands, cost.fee)) add('fee-' + channel, '请选择' + title + '的平均每次额外费用。');
        const reasons = s.channelReasons?.[channel]?.reasons;
        if (!Array.isArray(reasons) || reasons.length < 1 || reasons.length > 3
            || new Set(reasons).size !== reasons.length || reasons.some(reason => !own(channelReasons, reason))) {
          add('reasons-' + channel, '请选择' + title + '的主要选择原因，每个渠道选1–3项。');
        }
        if (Array.isArray(reasons) && reasons.includes('other') && !s.channelReasons[channel]?.other?.trim()) {
          add('reasons-other-' + channel, '请注明选择' + title + '的其他原因。');
        }
      }
      requiredFields(s.scales, {
        time1:'采购时间评价', time2:'准备或烹饪时间评价', food1:'尝试不同食品的看法',
        food2:'食品选择与品质的看法', food3:'了解食品信息的看法', attention:'认真作答确认',
      });
    }
    if (step === 6) {
      requiredFields(s.diet, {
        veg:'蔬菜摄入量', fruit:'水果摄入量', meat:'畜禽肉摄入量', fish:'水产摄入量',
        outsideMeals:'在外就餐顿数', typical:'近7天饮食代表性', health:'自评健康',
      });
      if (num(s.diet.eggsDaily) === null || num(s.diet.eggsDaily) < 0) add('eggsDaily', '请填写平均每天吃几个蛋。');
      if (!s.diet.special?.length) add('dietSpecial', '请选择个人特殊饮食情况。没有时请选择「无」。');
    }
    if (step === 8) {
      const organic = s.organic;
      need(organic.aware, 'aware', '认证食品知晓情况');
      need(organic.bought, 'bought', '过去30天认证生鲜购买情况');
      if (organic.bought === 'yes') {
        if (!organic.types.length) add('types', '请选择买过的认证类型。');
        if (!own(monthly, organic.frequency)) add('organicFrequency', '请选择认证生鲜购买次数。');
        if (!spendBands('organic').some(({id}) => id === organic.amountBand)) add('organicAmount', '请选择认证生鲜支出区间。');
        requireAllocation('organic-sum', '认证生鲜', organic.channels, organic.shares);
        if (organic.referenceCategory !== 'no-comparison') {
          if (!s.categories.includes(organic.referenceCategory)) add('referenceCategory', '请选择价差比较品类或「过去30天没见过可比较的普通产品」。');
          else if (!own(premiums, organic.observedPremium)) add('observedPremium', '请选择观察到的价差。');
        }
      }
      if (organic.bought === 'no') {
        if (!organic.reasons.length) add('organicReasons', '请选择过去30天未购买的原因。');
        if (organic.reasons.includes('其他') && !organic.reasonsOther.trim()) add('reasonsOther', '请填写未购买的其他原因。');
      }
    }
    return issues;
  }

  function bandRecord(category, id) {
    const band = spendBands(category).find(item => item.id === id);
    return band ? { code:band.id, min_yuan:band.min, max_yuan_exclusive:band.max } : null;
  }

  function record(s) {
    if (s.purchased === 'no') return { version:s.version, eligible:false, screening:{purchased_past30:'no'} };
    const categorySpending = {};
    const matrix = [];
    for (const {id} of categories) {
      const purchased = s.categories.includes(id);
      categorySpending[id] = { purchased, spend_band:purchased ? bandRecord(id, s.spendBands[id]) : null };
      if (!purchased) continue;
      const shares = allocation(s.channels, s.categoryChannels[id], s.shares[id]);
      for (const channel of s.channels) {
        const used = own(shares, channel);
        matrix.push({ category:id, channel, used, share_percent:used ? shares[channel] : 0 });
      }
    }

    const organic = s.organic;
    const organicResult = { module_status:s.organicCompleted ? 'completed' : 'not_completed' };
    if (s.organicCompleted) {
      Object.assign(organicResult, { aware:organic.aware, bought:organic.bought });
      if (organic.bought === 'yes') Object.assign(organicResult, {
        certification_types:organic.types,
        frequency:organic.frequency,
        spend_band:bandRecord('organic', organic.amountBand),
        shares_percent:allocation(s.channels, organic.channels, organic.shares),
        reference_category:organic.referenceCategory,
        observed_premium:organic.referenceCategory === 'no-comparison' ? null : organic.observedPremium,
      });
      if (organic.bought === 'no') Object.assign(organicResult, {
        amount_yuan:0, reasons:organic.reasons, reasons_other:organic.reasons.includes('其他') ? organic.reasonsOther : null,
      });
    }
    const { eggsDaily, ...diet } = s.diet;
    return {
      version:s.version, is_demo:s.demo, eligible:s.purchased === 'yes', started_at:s.startedAt,
      exported_at:new Date().toISOString(), main_completed:s.mainCompleted, profile:{...s.profile},
      channels_used:[...s.channels], other_channel:s.channels.includes('other') ? s.otherChannel : null,
      categories_purchased:[...s.categories], category_spending:categorySpending, category_channel_matrix:matrix,
      channel_purchase_frequency:Object.fromEntries(s.channels.map(id => [id, s.frequency[id] ?? null])),
      average_shopping_costs:s.detailChannels.map(channel => ({
        reference_period_days:30, basis:'per_purchase',
        channel, active_time_band:s.costs[channel]?.time ?? null, extra_fee_band:s.costs[channel]?.fee ?? null,
      })),
      channel_choice_reasons:s.detailChannels.map(channel => ({
        channel, reasons:[...(s.channelReasons?.[channel]?.reasons ?? [])],
        reasons_other:s.channelReasons?.[channel]?.reasons?.includes('other') ? (s.channelReasons[channel].other ?? '').trim() : null,
      })),
      scales:{...s.scales}, diet:{...diet, eggs_per_day_estimate:num(eggsDaily)}, organic:organicResult,
      quality:{attention_answer:s.scales.attention ?? null, attention_pass:s.scales.attention === '2', interpretation:'self_report_food_group_comparison'},
    };
  }

  root.SurveyLogic = {
    version, channels, categories, monthly, timeBands, feeBands, channelReasons, certificationTypes, premiums, organicReasons,
    spendBands, blank, num, migrateDraft, allocation, allocationSum, validAllocation, validate, record,
  };
  if (typeof module !== 'undefined') module.exports = root.SurveyLogic;
})(typeof window !== 'undefined' ? window : globalThis);
