'use strict';
const L=SurveyLogic,KEY='fresh-food-survey-pages-preview-v1';
let saved=null;try{saved=JSON.parse(sessionStorage.getItem(KEY));}catch{}
const S = L.migrateDraft(saved);
let errors=[],toastTimer;
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=p=>p.split('.').reduce((o,k)=>o?.[k],S);
function put(p,v){const a=p.split('.');let o=S;for(const k of a.slice(0,-1)){if(!o[k]||typeof o[k]!=='object')o[k]={};o=o[k];}o[a.at(-1)]=v;}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(S));}catch{toast('当前浏览器无法保存草稿，请保持此页面打开。');}}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
const nameH=h=>L.channels.find(x=>x.id===h)?.name||h;
const chosen=()=>L.channels.filter(h=>S.channels.includes(h.id));
const bought=()=>L.categories.filter(c=>S.categories.includes(c.id));
const val=p=>esc(get(p));
const selected=(p,v)=>String(get(p)??'')===String(v)?' selected':'';
const opts=arr=>arr.map(x=>Array.isArray(x)?x:[x,x]);
const req='<span class="required" aria-label="必答">*</span>';
function label(code,t,required=true){return `<span class="question-label">${code?`<span class="qcode">${code}</span>`:''}${t}${required?req:''}</span>`;}
function select(p,arr,placeholder='请选择',refresh=false,id=''){return `<select ${id?`id="${esc(id)}"`:`aria-label="${esc(placeholder)}"`} data-field="${p}" ${refresh?'data-refresh="1"':''}><option value="">${esc(placeholder)}</option>${opts(arr).map(([v,t])=>`<option value="${esc(v)}"${selected(p,v)}>${esc(t)}</option>`).join('')}</select>`;}
function field(code,t,p,arr,extra=''){return `<div class="question">${label(code,t)}${select(p,arr,t)}${extra}</div>`;}
function input(p,placeholder='',type='text',unit='',id='',disabled=false){return `<div class="unit-input"><input class="input" ${id?`id="${esc(id)}"`:`aria-label="${esc(placeholder||p)}"`} data-field="${p}" type="${type}" ${type==='number'?'min="0" step="any" inputmode="decimal"':''} value="${val(p)}" placeholder="${esc(placeholder)}" ${disabled?'disabled':''}>${unit?`<span class="unit">${unit}</span>`:''}</div>`;}
function choices(p,arr,multi=false,refresh=false,columns=''){return `<div class="choice-grid ${columns}">${opts(arr).map(([v,t])=>`<label class="choice"><input type="${multi?'checkbox':'radio'}" ${multi?`data-array="${p}"`:`data-field="${p}" name="${p}"`} value="${esc(v)}" ${multi?(get(p)||[]).includes(v)?'checked':'':String(get(p)??'')===String(v)?'checked':''} ${refresh?'data-refresh="1"':''}><span>${esc(t)}</span></label>`).join('')}</div>`;}
function notice(t,type=''){return `<div class="notice ${type}"><span class="notice-icon" aria-hidden="true">${type==='amber'?'◌':'ⓘ'}</span><div>${t}</div></div>`;}
function card(title,body,small=''){return `<section class="form-card">${title?`<div class="card-head"><h2>${title}</h2>${small?`<small>${small}</small>`:''}</div>`:''}${body}</section>`;}
const steps = [
  { id: 1, title: '个人基本情况', description: '先从你的基本情况开始。' },
  { id: 2, title: '家庭与生活环境', description: '帮助我们理解不同家庭的采购与饮食背景。' },
  { id: 3, title: '购买渠道与品类', description: '勾选过去30天实际使用过的渠道和买过的品类。' },
  { id: 4, title: '品类与渠道分配', description: '按品类选择金额区间，再填写实际使用的渠道。' },
  { id: 5, title: '购物成本与感受', description: '回忆过去30天最常用渠道的购物时间和额外费用。' },
  { id: 6, title: '近7天的饮食', description: '包括在家、餐馆、外卖和食堂中吃到的食物。' },
  { id: 8, title: '有机与绿色食品', description: '请回答以下与你的情况相关的题目。' },
];
function errorBox(){return errors.length?`<div class="notice error error-summary" role="alert" tabindex="-1"><div><strong>还有${errors.length}处需要填写或修改</strong><ul>${errors.map(e=>`<li>${esc(e.msg)}</li>`).join('')}</ul></div></div>`:'';}
function shell(body) {
  const currentIndex = steps.findIndex(({ id }) => id === S.step);
  const { title, description } = steps[currentIndex];
  const page = currentIndex + 1;
  const total = steps.length;
  const navigation = steps.map(({ id, title }, index) => {
    const state = index === currentIndex ? 'active' : index < currentIndex ? 'done' : '';
    const number = index < currentIndex ? '✓' : String(index + 1).padStart(2, '0');
    return `<button class="step-link ${state}" data-go="${id}" ${index === currentIndex ? 'aria-current="step"' : ''}><span class="step-number">${number}</span>${title}</button>`;
  }).join('');
  return `<div class="survey-layout">
    <aside class="rail">
      <p class="rail-title">问卷目录</p>
      <nav aria-label="问卷步骤">${navigation}</nav>
      <div class="rail-tip"><strong>慢慢回忆，如实估算。</strong>金额与份量可按实际情况估算。<br><br>关闭此标签页前可返回继续填写。</div>
      <button class="text-button" data-go="0">← 返回介绍</button>
    </aside>
    <div class="form-main">
      <header class="form-header">
        <div class="section-meta"><span>FRESH FOOD STUDY · 生鲜消费研究</span><span>${String(page).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></div>
        <div class="progress"><span style="width:${page / total * 100}%"></span></div>
        <h1>${title}</h1><p>${description}</p>
      </header>
      ${errorBox()}${body}
    </div>
  </div>`;
}
function actions(next='下一步',previous=true){return `<div class="form-actions">${previous?`<button class="secondary" data-prev>← 上一步</button>`:'<span></span>'}<div class="action-right"><span class="hint hide-mobile">草稿自动保存</span><button class="primary" data-next>${next} <span aria-hidden="true">→</span></button></div></div>`;}
const illustration=`<div class="illustration" aria-hidden="true"><span class="float-label">一份日常，一份真实</span><svg viewBox="0 0 470 390" fill="none"><ellipse cx="239" cy="215" rx="171" ry="134" fill="#d3ddc8"/><circle cx="230" cy="189" r="149" fill="#fbfcf6"/><circle cx="230" cy="189" r="131" stroke="#e5ebdc" stroke-width="2"/><path d="M116 137c-3-48 50-66 72-28 27-33 65-4 46 34-17 33-60 53-91 41-20-8-28-24-27-47Z" fill="#6d8c57"/><path d="M133 124c12 15 31 36 49 46m-24-71 23 68m37-44-34 44" stroke="#b2c196" stroke-width="3" stroke-linecap="round"/><path d="M108 158c10-28 51-17 48 12 28-19 55 5 39 31-14 22-49 34-71 17-20-15-25-39-16-60Z" fill="#93a976"/><path d="m126 165 30 37m-9-51 9 48" stroke="#ccd7b7" stroke-width="3" stroke-linecap="round"/><circle cx="273" cy="134" r="41" fill="#d47a53"/><circle cx="279" cy="133" r="30" fill="#dd8c63"/><path d="m271 94 8-15m-6 17c10-14 25-11 31-6-7 10-21 13-31 6Z" fill="#70884f"/><ellipse cx="285" cy="218" rx="43" ry="31" transform="rotate(-25 285 218)" fill="#e2bb65"/><path d="m254 218 46-18m-36 30 44-18" stroke="#efd591" stroke-width="4" stroke-linecap="round"/><path d="M185 238c-15-31 27-54 43-28 7 11 14 27 10 42-7 25-43 26-53-14Z" fill="#e7ddbf"/><path d="M195 226c-12-17 12-34 22-15" stroke="#f5efdf" stroke-width="4" stroke-linecap="round"/><ellipse cx="230" cy="285" rx="34" ry="9" fill="#dae2cd"/><path d="M365 83v227m-12-227v58c0 19 26 19 26 0V83M365 83v64" stroke="#8b9b78" stroke-width="5" stroke-linecap="round"/><path d="M70 97v202m0-202c-17 0-22 64 0 64" stroke="#8b9b78" stroke-width="5" stroke-linecap="round"/><path d="m330 57 8 9m-2-26 3 11m11 6 11-1" stroke="#a1b38c" stroke-width="2" stroke-linecap="round"/><circle cx="115" cy="296" r="3" fill="#a5b592"/><circle cx="125" cy="305" r="2" fill="#a5b592"/></svg></div>`;
function welcome(){return `<div class="welcome"><section class="hero"><div><span class="eyebrow">EVERYDAY CHOICES, EVERYDAY FOOD</span><h1>从一日三餐，<br>了解<em>生鲜消费。</em></h1><p>你在哪里买菜，又如何安排每天的饮食？<br>我们希望从真实的日常选择中，了解新型流通方式与生鲜食品消费、膳食结构的关系。</p><div class="hero-buttons"><button class="primary" data-go="1">${S.purchased?'继续填写':'开始填写'} <span aria-hidden="true">↗</span></button></div><div class="hero-meta"><span>不收集姓名与联系方式</span><span>可随时返回修改</span><span>支持手机填写</span></div></div>${illustration}</section><section class="welcome-grid"><div class="welcome-info"><span class="num">01</span><h3>回忆最近30天的购买</h3><p>按品类选择支出区间，记录实际使用的渠道。</p></div><div class="welcome-info"><span class="num">02</span><h3>回忆最近7天的饮食</h3><p>根据实际摄入量作答，包括在外就餐。</p></div><div class="welcome-info"><span class="num">03</span><h3>有机与绿色食品</h3><p>最后回答有关认证食品的题目。</p></div></section><p class="welcome-note">这是一份学术问卷的公开试填版，无需登录。答案仅保留在当前标签页，关闭后清除。</p></div>`;}
function profile(){return shell(card('作答前，请先确认',`<div class="question"><p class="hint">问卷用于了解购买渠道与生鲜消费、日常饮食之间的关系。参与自愿，你可以随时停止。试填答案仅保留在当前标签页。</p><label class="small-check"><input type="checkbox" data-field="consent" ${S.consent?'checked':''}>我已阅读说明，自愿参与。</label></div><div class="question">${label('A0','过去30天，你是否亲自购买过生鲜食品？')}${choices('purchased',[['yes','是，购买过'],['no','否，没有购买过']],false,true)}<p class="hint">这里的生鲜指新鲜蔬菜、水果、生肉禽、水产海鲜与鲜蛋；不含熟食、冷冻速食、粮油及常温包装食品。</p></div>`)+ (S.purchased==='yes'?card('关于你',`<div class="question">${label('A1','你目前的常住地是？')}<div class="fields three">${input('profile.province','省 / 直辖市')}${input('profile.city','市 / 州')}${input('profile.district','区 / 县（可不填）')}</div></div><div class="fields">${field('A2','你的性别','profile.gender',['男','女','其他 / 不便回答'])}${field('A3','你的年龄','profile.age',['18岁以下','18—24岁','25—34岁','35—44岁','45—54岁','55—64岁','65岁及以上'])}${field('A5','最高受教育程度（含在读）','profile.education',['初中及以下','高中 / 中专','大专','本科','硕士及以上'])}</div>`):'')+actions(S.purchased==='no'?'结束筛选':'下一步',false));}
function family(){return shell(card('家庭采购与共同生活',`<div class="fields">${field('A7','你在家庭生鲜采购中的角色','profile.role',['主要由我购买','我与其他成员共同购买','主要由其他成员购买，我偶尔参与'])}${field('A10','与你共同居住、共用饮食开支的人数（含本人）','profile.householdSize',['1人','2人','3人','4人','5人','6人及以上'])}${field('A11','家庭每月可支配收入','profile.householdIncome',['5000元以下','5000—9999元','10000—14999元','15000—19999元','20000—29999元','30000元及以上',['不清楚 / 不便回答','不便回答']])}</div><div class="question">${label('A9','家中是否有需要特别考虑饮食的成员？')}${choices('profile.special',[['child','0—6岁婴幼儿'],['teen','7—17岁未成年人'],['older','60岁及以上老人'],['chronic','需控制饮食的慢性病患者'],['pregnancy','孕妇 / 哺乳期女性'],['none','没有上述成员'],['private','不便回答']],true)}</div>`)+card('居住地的购物条件',field('A12','常住地类型','profile.areaType',['城市市区','县城或县级市城区','乡镇','农村村庄'])+field('A13','居住地可使用的线上生鲜服务','profile.onlineAccess',['仅配送到家','仅社区自提','配送到家和社区自提都可以','两种均不可使用',['不清楚','未确认当地是否提供这些服务']])+field('A14','步行到最近农贸市场通常需要多久？','profile.marketDistance',['10分钟及以内','11—20分钟','21—30分钟','30分钟以上','附近没有农贸市场']))+actions());}
const monthly = Object.entries(L.monthly);
const spendOptions = category => L.spendBands(category).map(({ id, label }) => [id, label]);

function channels() {
  const channelCards = L.channels.map(({id, name, icon, desc}) => {
    const active = S.channels.includes(id);
    return `<div class="channel-item">
      <label class="choice">
        <input type="checkbox" data-array="channels" value="${id}" ${active?'checked':''} data-refresh="1">
        <span class="choice-icon" aria-hidden="true">${icon}</span>
        <span><b>${name}</b><small>${desc}</small></span>
      </label>
      ${active ? `<div class="channel-followup">
        ${id === 'other' ? '<label for="channel-other">请注明实际使用的渠道</label>'+input('otherChannel','请注明实际使用的渠道','text','','channel-other') : ''}
        <label for="freq-${id}">B2 过去30天购买次数${req}</label>
        ${select('frequency.'+id,monthly,'请选择次数',false,'freq-'+id)}
      </div>` : ''}
    </div>`;
  }).join('');
  return shell(
    card('过去30天，你亲自用过哪些购买渠道？', `
      <p class="hint">勾选所有用过的渠道，再为每个选中的渠道选择购买次数。</p>
      <div class="choice-grid channels">${channelCards}</div>`, 'B1 · 多选')
    + card('过去30天，你亲自买过哪些生鲜品类？', `
      ${choices('categories',L.categories.map(c=>[c.id,c.icon+' '+c.name]),true,true,'three')}
      <p class="hint">有机与绿色认证食品也计入所属品类。</p>`, 'B3 · 多选')
    + actions()
  );
}

function shareFields(channelsPath, sharesPath, sumId) {
  const shares = L.allocation(S.channels, get(channelsPath), get(sharesPath));
  const ids = Object.keys(shares);
  const options = chosen().map(channel => [channel.id, channel.name]);
  const controls = options.length > 1 ? choices(channelsPath, options, true, true, 'three') : '';
  if (ids.length === 0) return controls;
  if (ids.length === 1) return controls + `<div class="auto-note">${esc(nameH(ids[0]))}占100%。</div>`;

  const rows = ids.map(id => {
    const inputId = `${sumId}-${id}`;
    return `<div class="matrix-row">
      <label for="${inputId}">${esc(nameH(id))}支出占比</label>
      ${input(sharesPath+'.'+id,'请输入占比','number','%',inputId)}
    </div>`;
  }).join('');
  return controls + rows + `<div class="sum-bar" id="${sumId}"><span>已填写占比合计</span><strong aria-live="polite">0%</strong></div>`;
}

function matrix() {
  if (!S.channels.length || !S.categories.length) {
    return shell(card('', `<div class="empty-state">请先选出用过的渠道和买过的品类。
      <p><button class="secondary" data-go="3">去选择渠道与品类 →</button></p></div>`));
  }
  const categoryCards = bought().map(({id, name}) => card(name, `
    <div class="question">
      <label class="question-label" for="spend-${id}"><span class="qcode">B4</span>这类食品一共花了多少钱？${req}</label>
      ${select('spendBands.'+id,spendOptions(id),'请选择支出区间',false,'spend-'+id)}
    </div>
    <div class="question">
      ${label('B5','这类食品在哪些渠道买过？')}
      ${shareFields('categoryChannels.'+id, 'shares.'+id, 'sum-'+id)}
    </div>`, '过去30天')).join('');
  return shell(notice('按品类选择优惠后的商品实付金额，再勾选这个品类实际用过的渠道。只用一个渠道按100%计。用过多个时，请估填各渠道占该品类支出的百分比，合计100%。') + categoryCards + actions());
}

function scaleRows(code, title, rows) {
  const labels = ['很不符合','不符合','一般','符合','很符合'];
  const options = rows.map(([key, text]) => {
    const cells = labels.map((name, index) => {
      const value = String(index + 1);
      return `<td><label><input type="radio" aria-label="${esc(text+' '+name)}" name="scale-${key}" data-field="scales.${key}" value="${value}" ${S.scales[key]===value?'checked':''}><span>${name}</span></label></td>`;
    }).join('');
    return `<tr><td>${text}${req}</td>${cells}</tr>`;
  }).join('');
  return card(title, `<table class="scale-table"><thead><tr><th scope="col">描述</th>${labels.map(text=>`<th scope="col">${text}</th>`).join('')}</tr></thead><tbody>${options}</tbody></table>`, code);
}

function shoppingCosts() {
  if (!S.channels.length) {
    return shell(card('', `<div class="empty-state">请选择实际购买渠道。
      <p><button class="secondary" data-go="3">去选择渠道 →</button></p></div>`));
  }
  const options = chosen().map(({id, name}) => [id, name]);
  const [first] = S.detailChannels;
  const channelPickers = options.length === 1
    ? `<div class="auto-note">你使用的渠道是${esc(options[0][1])}。</div>`
    : `<div class="fields">
      <div class="question">
        <label class="question-label" for="first-channel">第一常用渠道${req}</label>
        ${select('detailChannels.0',options,'请选择第一常用渠道',true,'first-channel')}
      </div>
      ${first ? `<div class="question">
        <label class="question-label" for="second-channel">第二常用渠道（可选）</label>
        ${select('detailChannels.1',options.filter(([id])=>id!==first),'仅回答一个渠道',true,'second-channel')}
      </div>` : ''}
    </div>`;
  const costQuestions = S.detailChannels.map(id => `<div class="channel-cost">
    <h3>${esc(nameH(id))}</h3>
    <div class="fields">
      ${field('','购物时间合计','costs.'+id+'.time',Object.entries(L.timeBands))}
      ${field('','额外费用合计','costs.'+id+'.fee',Object.entries(L.feeBands))}
    </div>
  </div>`).join('');
  return shell(card('过去30天，买生鲜一共花了多少时间和额外费用？', `
    <p class="hint">按 B2 的使用频率，选最常用的一到两个渠道，分别累计各渠道过去30天的投入。时间计入本人参与的挑选、下单、排队、结算和专程往返，扣除配送等待、正常通勤和做饭时间。额外费用包括配送费、包装费、服务费及专程购物的交通、停车费。</p>
    ${channelPickers}${costQuestions}`, 'B6')
    + scaleRows('B7','过去30天，下列描述与你的情况有多符合？',[
      ['time1','我经常觉得留给购买食品的时间不够。'],
      ['time2','我经常觉得留给准备或烹饪食品的时间不够。'],
    ])
    + scaleRows('B8','平时，下列描述与你的情况有多符合？',[
      ['food1','我愿意尝试不同种类的食品。'],
      ['food2','食品的选择与品质对我的生活质量很重要。'],
      ['food3','我愿意花时间了解食品相关的信息和知识。'],
    ])
    + card('',field('B9','请在本题选择「2 不符合」。','scales.attention',[
      ['1','1 很不符合'],['2','2 不符合'],['3','3 一般'],['4','4 符合'],['5','5 很符合'],
    ]))
    + actions()
  );
}
const ranges = SurveySchema.ranges;
const foods = [
  ['C1','veg','🥬','蔬菜','按烹饪前重量估算，土豆等薯类不计入。'],
  ['C2','fruit','🍎','新鲜水果','计入整果和切块的新鲜水果。'],
  ['C3','meat','🍖','畜禽肉','一掌心肉片约50克。'],
  ['C4','fish','🐟','水产品','按烹饪前可食重量，去骨去壳。'],
  ['C5','eggsDaily','🥚','蛋类','含菜里的蛋，按普通鸡蛋大小折算。平均两天吃一个，就填0.5。'],
];

function diet() {
  const rows = foods.map(([code,id,icon,name,help]) => `
    <div class="food-row">
      <label for="diet-${id}">
        <span class="food-name"><span class="food-icon" aria-hidden="true">${icon}</span><span class="qcode">${code}</span>${name}${req}</span>
        <small>${help}</small>
      </label>
      ${id === 'eggsDaily'
        ? input('diet.eggsDaily','例如 0.5','number','个/天','diet-eggsDaily')
        : select('diet.'+id,ranges[id],'请选择估算量',false,'diet-'+id)}
    </div>`).join('');
  return shell(notice('请估算你本人过去7天平均每天吃了多少。在家、餐馆、外卖和食堂吃到的都计入。把没吃的日子也算在7天内，整周没吃就选0或填0。克数可约到整数。')
    + card('过去7天，你平均每天吃了多少这五类食物？',rows)
    + card('其他饮食情况',`
      ${field('C11','过去7天，在餐馆、外卖或食堂解决的正餐有几顿？','diet.outsideMeals',['0顿','1—3顿','4—7顿','8—14顿','15—21顿'])}
      ${field('C12','过去7天的饮食与平时相比，最符合哪种情况？','diet.typical',['基本一致','因生病、节食等明显减少','因聚餐、节假日等明显增加','因出差、旅行等结构明显不同','其他情况'])}
      ${field('C13','与同龄人相比，你目前的健康状况如何？','diet.health',['非常不好','比较不好','一般','比较好','非常好','不便回答'])}
      <div class="question">
        ${label('C14','你本人是否有需要特别调整饮食的情况？')}
        ${choices('diet.special',[
          ['disease','因疾病或医生建议控制饮食'],['weight','主动减重或控制体重'],['vegetarian','长期素食等'],
          ['pregnancy','妊娠期或哺乳期'],['other','其他'],['none','无'],['private','不便回答'],
        ],true)}
      </div>`)
    + actions('进入有机与绿色食品')
  );
}

function organic() {
  const o = S.organic;
  let body = notice('本部分为必答。认证生鲜指前面五类中，包装或销售说明明确带有「有机」或「绿色食品」认证标识的产品。')
    + card('认证食品的了解与购买',`
      <div class="question">
        ${label('G1','在填写这份问卷前，你是否知道有机或绿色食品认证？')}
        ${choices('organic.aware',[['yes','知道'],['no','不知道']])}
      </div>
      <div class="question">
        ${label('G2','过去30天，你是否亲自购买过上述带有认证标识的生鲜食品？')}
        ${choices('organic.bought',[['yes','买过'],['no','没买过']],false,true)}
      </div>`);
  if (o.bought === 'yes') {
    const comparisonOptions = [...bought().map(({id,name})=>[id,name]),['no-comparison','过去30天没见过可比较的普通产品']];
    body += card('过去30天的实际购买',`
      <div class="question">
        ${label('G2a','你买过哪种认证的生鲜食品？')}
        ${choices('organic.types',Object.entries(L.certificationTypes),true)}
      </div>
      ${field('G3','过去30天，你买过几次认证生鲜食品？','organic.frequency',monthly)}
      ${field('G4','过去30天，你买这些认证生鲜食品一共花了多少钱？','organic.amountBand',spendOptions('organic'),'<p class="hint">按优惠后的商品实付金额估算。这部分金额已经计入 B4 的对应品类。</p>')}
      <div class="question">
        ${label('G5','这些钱分别花在哪些渠道？各渠道大约占多少？')}
        <p class="hint">勾选实际买过认证生鲜的渠道。只勾一个按100%计，勾了多个时请填写占比，合计100%。</p>
        ${shareFields('organic.channels','organic.shares','organic-sum')}
      </div>`)
    + card('与普通食品的价差',`
      <div class="question">
        <label class="question-label" for="reference-category"><span class="qcode">G6</span>从你买过的认证生鲜中，选一个品类作为价差比较对象。${req}</label>
        ${select('organic.referenceCategory',comparisonOptions,'请选择比较对象',true,'reference-category')}
      </div>
      ${o.referenceCategory && o.referenceCategory !== 'no-comparison'
        ? field('G7','这个认证产品与同品类、规格和品质相近的普通产品相比，价格大约相差多少？','organic.observedPremium',Object.entries(L.premiums),'<p class="hint">以普通产品价格为基准。普通产品10元、认证产品12元，相当于贵20%。</p>')
        : ''}`);
  }
  if (o.bought === 'no') {
    body += card('过去30天，你没买这类认证生鲜食品的原因是什么？',`
      ${choices('organic.reasons',L.organicReasons,true,true)}
      ${o.reasons.includes('其他') ? `<div class="question">
        <label class="question-label" for="reasons-other">其他原因${req}</label>
        ${input('organic.reasonsOther','请填写其他原因','text','','reasons-other')}
      </div>` : ''}`, 'G9 · 多选');
  }
  return shell(body + `<div class="form-actions">
    <button class="secondary" data-go="6">← 上一步</button>
    <button class="primary" data-finish-organic>完成试填 <span aria-hidden="true">✓</span></button>
  </div>`);
}
function done() {
  const screenedOut = S.purchased === 'no';
  const message = screenedOut
    ? '<h1>感谢你的参与</h1><p>本调查面向过去30天亲自购买过生鲜食品的人，试填在此结束。</p>'
    : '<h1>问卷试填完成</h1><p>感谢体验。答案仅保留在当前标签页。</p>';
  const actions = screenedOut
    ? '<button class="secondary" data-go="1">返回问卷</button>'
    : '<button class="secondary" data-go="8">返回修改答案</button>';
  return '<section class="completion"><div class="complete-icon" aria-hidden="true">✓</div>' + message + '<div class="review-actions">' + actions + '</div></section>';
}
function render(scroll=false){$('#app').innerHTML=S.step===0?welcome():S.step===1?profile():S.step===2?family():S.step===3?channels():S.step===4?matrix():S.step===5?shoppingCosts():S.step===6?diet():S.step===8?organic():done();refreshStats();if(scroll)window.scrollTo({top:0,behavior:'instant'});}
function refreshStats() {
  function update(id, shares) {
    const el = $('#'+id);
    if (!el) return;
    const sum = L.allocationSum(shares);
    el.classList.toggle('good', L.validAllocation(shares));
    el.classList.toggle('bad', sum > 100.001);
    el.querySelector('strong').textContent = +sum.toFixed(2) + '%';
  }
  if (S.step === 4) {
    for (const id of S.categories) {
      update('sum-'+id, L.allocation(S.channels,S.categoryChannels[id],S.shares[id]));
    }
  }
  if (S.step === 8 && S.organic.bought === 'yes') {
    update('organic-sum', L.allocation(S.channels,S.organic.channels,S.organic.shares));
  }
}

function clean() {
  S.channels = L.channels.filter(({id})=>S.channels.includes(id)).map(({id})=>id);
  S.categories = L.categories.filter(({id})=>S.categories.includes(id)).map(({id})=>id);
  S.detailChannels = S.channels.length === 1
    ? [...S.channels]
    : [...new Set(S.detailChannels.filter(id=>S.channels.includes(id)))].slice(0,2);
  const reference = S.organic.referenceCategory;
  if (reference && reference !== 'no-comparison' && !S.categories.includes(reference)) {
    S.organic.referenceCategory = '';
    S.organic.observedPremium = '';
  }
}
function go(step, scroll = true) {
  if (step === 8) {
    for (const { id } of steps) {
      if (id === 8) break;
      const issues = L.validate(S, id);
      if (issues.length) {
        showErrors(issues, id);
        return;
      }
      if (id === 1 && S.purchased === 'no') {
        step = 9;
        break;
      }
    }
    S.mainCompleted = step === 8;
  }
  S.step = step;
  errors = [];
  save();
  render(scroll);
}
function handleField(el) {
  const { array, field, refresh } = el.dataset;
  if (array) {
    let values = get(array) ?? [];
    values = el.checked ? [...new Set([...values,el.value])] : values.filter(value=>value!==el.value);
    if (['profile.special','diet.special'].includes(array)) {
      const exclusive = ['none','private'];
      if (el.checked && exclusive.includes(el.value)) values = [el.value];
      else if (el.checked) values = values.filter(value=>!exclusive.includes(value));
      document.querySelectorAll(`[data-array="${array}"]`).forEach(node=>{ node.checked = values.includes(node.value); });
    }
    put(array,values);
  } else {
    if (field === 'organic.referenceCategory' && get(field) !== el.value) S.organic.observedPremium = '';
    put(field,el.type === 'checkbox' ? el.checked : el.value);
    if (field === 'detailChannels.0' && !el.value) S.detailChannels = [];
  }
  clean();
  if (S.step !== 8) S.mainCompleted = false;
  S.organicCompleted = false;
  save();
  if (!refresh) {
    refreshStats();
    return;
  }
  render();
  const updated = el.id ? document.getElementById(el.id)
    : [...document.querySelectorAll(array ? `[data-array="${array}"]` : `[data-field="${field}"]`)].find(node=>node.value===el.value);
  updated?.focus({preventScroll:true});
}
document.addEventListener('input',e=>{const el=e.target;if(el.matches('input[data-field]:not([type=radio]):not([type=checkbox]),textarea[data-field]'))handleField(el);});
document.addEventListener('change',e=>{const el=e.target;if(el.matches('select[data-field],input[type=radio][data-field],input[type=checkbox][data-field],input[data-array]'))handleField(el);});
function showErrors(issues, step) {
  S.step = step;
  errors = issues;
  save();
  render(true);
  $('.error-summary')?.focus();
}

function finishPreview() {
  if (!S.mainCompleted) {
    go(8);
    return;
  }
  const issues = L.validate(S, 8);
  if (issues.length) {
    showErrors(issues, 8);
    return;
  }
  S.organicCompleted = true;
  go(9);
}

document.addEventListener('click', event => {
  const button = event.target.closest('button,a.brand');
  if (!button) return;
  if (button.matches('a.brand')) {
    event.preventDefault();
    go(0);
  }
  if (button.dataset.go !== undefined) go(Number(button.dataset.go));
  if (button.hasAttribute('data-prev')) go(Math.max(1, S.step - 1));
  if (button.hasAttribute('data-next')) {
    const issues = L.validate(S, S.step);
    if (issues.length) { showErrors(issues, S.step); return; }
    if (S.step === 1 && S.purchased === 'no') { go(9); return; }
    go(S.step === 6 ? 8 : S.step + 1);
  }
  if (button.hasAttribute('data-finish-organic')) finishPreview();
});
clean();
// Route older drafts to the first newly required question when needed.
if (S.step === 7 || S.step === 8 || (S.step === 9 && S.purchased !== 'no' && !S.organicCompleted)) {
  go(8, false);
} else {
  if (saved?.version === 'fresh-survey-2026-v3' || saved?.version === 'fresh-survey-2026-v4') save();
  render();
}
