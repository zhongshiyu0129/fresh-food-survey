(function (root) {
  'use strict';

  const L = root.SurveyLogic;
  const { version, monthly, premiums, organicReasons } = L;
  const scales = {
    time1: '购买食品的时间不够',
    time2: '准备或烹饪食品的时间不够',
    food1: '愿意尝试不同种类的食品',
    food2: '食品的选择与品质对生活质量很重要',
    food3: '愿意花时间了解食品相关信息',
    attention: '认真作答题',
  };
  const profileLabels = {
    province: '省 / 直辖市', city: '市 / 州', district: '区 / 县',
    gender: '性别', age: '年龄', education: '教育程度',
    role: '家庭采购角色',
    householdSize: '家庭共同生活人数',
    householdIncome: '家庭可支配收入', areaType: '常住地类型',
    onlineAccess: '线上服务可及性', marketDistance: '农贸市场步行距离',
    special: '家庭特殊饮食需求成员',
  };
  const dietLabels = {
    veg: '蔬菜', fruit: '新鲜水果', meat: '畜禽肉', fish: '水产品',
    eggs_per_day_estimate: '蛋类（个/天）',
    outsideMeals: '在外就餐顿数', typical: '近7天饮食代表性',
    health: '自评健康', special: '本人特殊饮食情况',
  };
  const familySpecial = {child:'0—6岁婴幼儿',teen:'7—17岁未成年人',older:'60岁及以上老人',chronic:'需控制饮食的慢性病患者',pregnancy:'孕妇 / 哺乳期女性',none:'没有上述成员',private:'不便回答'};
  const dietSpecial = {none:'无',disease:'因疾病或医生建议控制饮食',weight:'主动减重或控制体重',vegetarian:'素食或其他长期特殊饮食',pregnancy:'妊娠期或哺乳期',other:'其他',private:'不便回答'};
  const ranges={veg:[['zero','基本不吃（0克）'],['low','大于0、不足100克'],['low2','100—199克'],['low3','200—299克'],['middle','300—399克'],['middle2','400—499克'],['high','500克及以上']],fruit:[['zero','基本不吃（0克）'],['low','大于0、不足100克'],['low2','100—199克'],['middle','200—299克'],['middle2','300—350克'],['upper','351—399克'],['upper2','400—499克'],['high','500克及以上']],meat:[['zero','基本不吃（0克）'],['low','大于0、不足40克'],['low2','40—49克'],['middle','50—75克'],['upper','76—100克'],['upper2','101—199克'],['high','200克及以上']],fish:[['zero','基本不吃（0克）'],['low','大于0、不足40克'],['low2','40—49克'],['middle','50—75克'],['upper','76—100克'],['upper2','101—199克'],['high','200克及以上']]};


  const obj = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const text = (value, max = 100) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const choice = (value, options) => options.includes(value) ? value : '';
  const choices = (value, options) => Array.isArray(value) ? [...new Set(value.filter(v => options.includes(v)))] : [];
  const exclusive = (value, options) => {
    const list = choices(value, Object.keys(options));
    if (list.includes('none')) return ['none'];
    if (list.includes('private')) return ['private'];
    return list;
  };
  function decimal(value, max) {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    if (typeof value === 'string' && !/^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(value.trim())) return '';
    const number = Number(value);
    // Keep out-of-range numeric values visible to the existing validation.
    return Number.isFinite(number) && number >= 0 && number <= max ? String(number) : '';
  }
  const keyed = (keys, callback) => Object.fromEntries(keys.map(key => [key, callback(key)]));

  function mainState(payload) {
    const s = L.blank();
    const data = obj(payload);
    if (data.version !== version || data.demo === true) return s;
    s.consent = data.consent === true;
    s.purchased = choice(data.purchased, ['yes', 'no']);
    const profile = obj(data.profile);
    s.profile = keyed(Object.keys(profileLabels), k => text(profile[k]));
    s.profile.special = exclusive(profile.special, familySpecial);
    s.channels = choices(data.channels, L.channels.map(h => h.id));
    s.otherChannel = s.channels.includes('other') ? text(data.otherChannel, 80) : '';
    s.categories = choices(data.categories, L.categories.map(c => c.id));
    s.frequency = keyed(s.channels, h => choice(obj(data.frequency)[h], Object.keys(monthly)));
    s.spendBands = keyed(s.categories, c => choice(obj(data.spendBands)[c], L.spendBands(c).map(band => band.id)));
    s.categoryChannels = keyed(s.categories, c => choices(obj(data.categoryChannels)[c], s.channels));
    s.shares = keyed(s.categories, c => keyed(s.categoryChannels[c], h => decimal(obj(obj(data.shares)[c])[h], 100)));
    s.detailChannels = choices(data.detailChannels, s.channels).slice(0, 2);
    if (s.channels.length === 1) s.detailChannels = [...s.channels];
    s.costs = keyed(s.detailChannels, h => {
      const cost = obj(obj(data.costs)[h]);
      return { time:choice(cost.time, Object.keys(L.timeBands)), fee:choice(cost.fee, Object.keys(L.feeBands)) };
    });
    s.channelReasons = keyed(s.detailChannels, h => {
      const answer = obj(obj(data.channelReasons)[h]);
      const reasons = choices(answer.reasons, Object.keys(L.channelReasons));
      return { reasons, other:reasons.includes('other') ? text(answer.other, 300) : '' };
    });
    s.scales = keyed(Object.keys(scales), k => choice(obj(data.scales)[k], ['1','2','3','4','5']));
    const diet = obj(data.diet);
    s.diet = keyed(Object.keys(ranges), k => choice(diet[k], ranges[k].map(([code]) => code)));
    s.diet.eggsDaily = decimal(diet.eggsDaily, 50);
    s.diet.outsideMeals = choice(diet.outsideMeals, ['0顿','1—3顿','4—7顿','8—14顿','15—21顿']);
    s.diet.typical = choice(diet.typical, ['基本一致','因生病、节食等明显减少','因聚餐、节假日等明显增加','因出差、旅行等结构明显不同','其他情况']);
    s.diet.health = choice(diet.health, ['非常不好','比较不好','一般','比较好','非常好','不便回答']);
    s.diet.special = exclusive(diet.special, dietSpecial);
    if (typeof data.startedAt === 'string' && /^\d{4}-\d{2}-\d{2}T[0-9:.]+Z$/.test(data.startedAt) && !Number.isNaN(Date.parse(data.startedAt))) s.startedAt = data.startedAt;
    return s;
  }

  function supplementState(saved, payload) {
    const s = L.blank();
    s.channels = saved.channels_used;
    s.categories = saved.categories_purchased;
    const data = obj(payload);
    const channels = choices(data.channels, s.channels);
    s.organic = {
      aware:choice(data.aware, ['yes','no']),
      bought:choice(data.bought, ['yes','no']),
      types:choices(data.types, Object.keys(L.certificationTypes)),
      frequency:choice(data.frequency, Object.keys(monthly)),
      amountBand:choice(data.amountBand, L.spendBands('organic').map(band => band.id)),
      channels,
      shares:keyed(channels, h => decimal(obj(data.shares)[h], 100)),
      referenceCategory:choice(data.referenceCategory, [...s.categories, 'no-comparison']),
      observedPremium:choice(data.observedPremium, Object.keys(premiums)),
      reasons:choices(data.reasons, organicReasons),
      reasonsOther:text(data.reasonsOther),
    };
    return s;
  }

  root.SurveySchema = {version, ranges, scales, profileLabels, dietLabels, familySpecial, dietSpecial, monthly, premiums, organicReasons, mainState, supplementState};
})(typeof window !== 'undefined' ? window : globalThis);
