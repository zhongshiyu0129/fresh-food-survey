(function (root) {
  'use strict';

  const version = 'fresh-survey-2026-v3';
  const scales = {
    time1: '购买食品的时间不够',
    time2: '准备或烹饪食品的时间不够',
    time3: '工作、学习或家庭安排压缩购食时间',
    food1: '愿意尝试不同种类的食品',
    food2: '食品的选择与品质对生活质量很重要',
    food3: '愿意花时间了解食品相关信息',
    attention: '认真作答题',
  };
  const profileLabels = {
    province: '省 / 直辖市', city: '市 / 州', district: '区 / 县',
    gender: '性别', age: '年龄', occupation: '职业', education: '教育程度',
    personalIncome: '个人可支配收入', role: '家庭采购角色',
    householdSize: '家庭共同生活人数', householdStructure: '居住结构',
    householdIncome: '家庭可支配收入', areaType: '常住地类型',
    onlineAccess: '线上服务可及性', marketDistance: '农贸市场步行距离',
    purchaseFrequency: '平时采购频率', special: '家庭特殊饮食需求成员',
  };
  const dietLabels = {
    veg: '蔬菜', fruit: '新鲜水果', meat: '畜禽肉', fish: '水产品', milk: '奶及奶制品',
    grain: '谷类、全谷物及杂豆合计', whole: '其中全谷物和杂豆', tuber: '薯类',
    soy: '大豆与豆制品', nuts: '坚果', eggs_per_day_estimate: '蛋类（个/天）',
    outsideMeals: '在外就餐顿数', typical: '近7天饮食代表性',
    health: '自评健康', special: '本人特殊饮食情况',
  };
  const familySpecial = {child:'0—6岁婴幼儿',teen:'7—17岁未成年人',older:'60岁及以上老人',chronic:'需控制饮食的慢性病患者',pregnancy:'孕妇 / 哺乳期女性',none:'没有上述成员',private:'不便回答'};
  const dietSpecial = {none:'无',disease:'因疾病或医生建议控制饮食',weight:'主动减重或控制体重',vegetarian:'素食或其他长期特殊饮食',pregnancy:'妊娠期或哺乳期',other:'其他',private:'不便回答'};
  const frequency = {lt1:'每周不足1次','1to2':'每周1—2次','3to4':'每周3—4次','5to6':'每周5—6次',daily:'每天或几乎每天'};
  const monthly = {'1to2':'1—2次','3to5':'3—5次','6to10':'6—10次','11to20':'11—20次', '21plus':'21次及以上'};
  const premiums = {zero:'0%','0to10':'大于0%、至10%','10to20':'超过10%、至20%','20to50':'超过20%、至50%','50to100':'超过50%、至100%',over100:'超过100%'};
  const organicReasons = ['不信任相关认证','不清楚认证产品的优势','价格较高','不方便买到','对口感或品质不满意','这段时间没有需求','其他'];
  const ranges={veg:[['zero','基本不吃（0克）'],['low','大于0、不足100克'],['low2','100—199克'],['low3','200—299克'],['middle','300—399克'],['middle2','400—499克'],['high','500克及以上']],fruit:[['zero','基本不吃（0克）'],['low','大于0、不足100克'],['low2','100—199克'],['middle','200—299克'],['middle2','300—350克'],['upper','351—399克'],['upper2','400—499克'],['high','500克及以上']],meat:[['zero','基本不吃（0克）'],['low','大于0、不足40克'],['low2','40—49克'],['middle','50—75克'],['upper','76—100克'],['upper2','101—199克'],['high','200克及以上']],fish:[['zero','基本不吃（0克）'],['low','大于0、不足40克'],['low2','40—49克'],['middle','50—75克'],['upper','76—100克'],['upper2','101—199克'],['high','200克及以上']],milk:[['zero','基本不喝（0毫升）'],['low','大于0、不足100毫升'],['low2','100—199毫升'],['low3','200—299毫升'],['middle','300—399毫升'],['middle2','400—500毫升'],['high','超过500毫升']],grain:[['zero','基本不吃（0克）'],['low','大于0、不足100克'],['low2','100—199克'],['middle','200—300克'],['middle2','301—399克'],['upper','400—499克'],['high','500克及以上']],whole:[['zero','基本不吃（0克）'],['low','大于0、不足50克'],['middle','50—150克'],['high','超过150克']],tuber:[['zero','基本不吃（0克）'],['low','大于0、不足50克'],['middle','50—100克'],['upper','101—199克'],['high','200克及以上']],soy:[['zero','没有吃'],['low','平均每天大于0、不足半份'],['middle','平均每天半份至1份（不含1份）'],['one','平均每天1份至1.5份（含）'],['high','平均每天超过1.5份']],nuts:[['zero','基本不吃（0克）'],['low','大于0、不足10克'],['middle','10—15克'],['upper','超过15克、至35克'],['high','超过35克']]};


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
    const L = root.SurveyLogic;
    const s = L.blank();
    const data = obj(payload);
    if (data.version !== version || data.demo === true) return s;
    s.consent = data.consent === true;
    s.purchased = choice(data.purchased, ['yes', 'no']);
    const profile = obj(data.profile);
    s.profile = keyed(Object.keys(profileLabels), k => text(profile[k]));
    s.profile.special = exclusive(profile.special, familySpecial);
    s.profile.purchaseFrequency = choice(profile.purchaseFrequency, Object.keys(frequency));
    s.channels = choices(data.channels, L.channels.map(h => h.id));
    s.otherChannel = s.channels.includes('other') ? text(data.otherChannel, 80) : '';
    s.categories = choices(data.categories, L.categories.map(c => c.id));
    s.expenses = keyed(s.categories, c => decimal(obj(data.expenses)[c], 1000000));
    s.shares = keyed(s.categories, c => keyed(s.channels, h => {
      const entry = obj(obj(data.shares)[c])[h];
      return entry === '' || entry === undefined ? '' : decimal(entry, 100) || 'invalid';
    }));
    s.frequency = keyed(s.channels, h => choice(obj(data.frequency)[h], Object.keys(monthly)));
    s.detailChannels = choices(data.detailChannels, s.channels).slice(0, 2);
    s.orders = keyed(s.detailChannels, h => {
      const order = obj(obj(data.orders)[h]);
      const items = choices(order.items, [...L.categories.map(c => c.id), 'nonfresh']);
      return {
        items: items.some(item => item !== 'nonfresh') ? items : [],
        total: decimal(order.total, 1000000), fresh: decimal(order.fresh, 1000000),
        time: decimal(order.time, 10080), extra: decimal(order.extra, 1000000),
        motives: choices(order.motives, ['食品新鲜','种类丰富','结算方便','主动花费时间较少','价格较低','折扣较多','售后较好','更快获得商品','品质有保障','已经形成习惯','有机或绿色食品多','其他']),
      };
    });
    s.scales = keyed(Object.keys(scales), k => choice(obj(data.scales)[k], ['1','2','3','4','5']));
    const diet = obj(data.diet);
    s.diet = keyed(Object.keys(ranges), k => choice(diet[k], ranges[k].map(([code]) => code)));
    s.diet.eggsDaily = decimal(diet.eggsDaily, 50);
    s.diet.outsideMeals = choice(diet.outsideMeals, ['0顿','1—3顿','4—7顿','8—14顿','15—21顿']);
    s.diet.typical = choice(diet.typical, ['基本和平时一致','因生病、节食等明显减少','因聚餐、节假日等明显增加','因出差、旅行等结构明显不同','其他情况']);
    s.diet.health = choice(diet.health, ['非常不好','比较不好','一般','比较好','非常好','不便回答']);
    s.diet.special = exclusive(diet.special, dietSpecial);
    if (typeof data.startedAt === 'string' && /^\d{4}-\d{2}-\d{2}T[0-9:.]+Z$/.test(data.startedAt) && !Number.isNaN(Date.parse(data.startedAt))) s.startedAt = data.startedAt;
    return s;
  }

  function supplementState(saved, payload) {
    const L = root.SurveyLogic;
    const s = L.blank();
    s.channels = saved.channels_used;
    s.categories = saved.categories_purchased;
    s.expenses = keyed(s.categories, c => saved.category_spending[c].amount_yuan);
    s.shares = keyed(s.categories, c => keyed(s.channels, h => saved.category_channel_matrix.find(row => row.category === c && row.channel === h)?.share_percent));
    const data = obj(payload);
    s.organic = {
      aware: choice(data.aware, ['yes','no']),
      bought: choice(data.bought, ['yes','no','unknown']),
      frequency: choice(data.frequency, Object.keys(frequency)),
      amount: decimal(data.amount, 1000000),
      shareUnknown: false,
      shares: keyed(s.channels, h => {
        const entry = obj(data.shares)[h];
        return entry === '' || entry === undefined ? '' : decimal(entry, 100) || 'invalid';
      }),
      referenceCategory: choice(data.referenceCategory, L.categories.map(c => c.id)),
      observedPremium: choice(data.observedPremium, Object.keys(premiums)),
      willingPremium: choice(data.willingPremium, Object.keys(premiums)),
      reasons: choices(data.reasons, organicReasons),
    };
    return s;
  }

  root.SurveySchema = {version, ranges, scales, profileLabels, dietLabels, familySpecial, dietSpecial, frequency, monthly, premiums, organicReasons, mainState, supplementState};
})(typeof window !== 'undefined' ? window : globalThis);
