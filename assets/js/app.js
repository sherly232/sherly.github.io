/* ===========================================================
 * 干饭雷达 · 应用逻辑
 * =========================================================== */

/* ---------- 工具 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const round1 = (n) => Math.round(n * 10) / 10;
const stallOf = (d) => STALLS.find((s) => s.id === d.stall);
const canteenOf = (d) => CANTEENS.find((c) => c.id === stallOf(d).canteen);

/* ---------- 本地存储 ---------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem('ganfan_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ganfan_' + k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- 状态 ---------- */
let state = {
  favs: LS.get('favs', []),
  myReviews: LS.get('myReviews', []),
  profile: LS.get('profile', { spice: 2, budget: 15, queue: 10, cats: [], avoid: [] }),
  queueReports: LS.get('queueReports', {}),   // stallId -> 分钟
  queueVoteAt: LS.get('queueVoteAt', {})
};

/* ---------- 聚合：每道菜的统计 ---------- */
const dishStats = {};
function buildStats() {
  DISHES.forEach((d) => {
    const rs = REVIEWS.filter((r) => r.dish === d.id).concat(state.myReviews.filter((r) => r.dish === d.id));
    const n = rs.length;
    const avg = n ? rs.reduce((a, r) => a + r.overall, 0) / n : d.base;
    const dims = { taste: 0, portion: 0, value: 0, look: 0 };
    rs.forEach((r) => { for (const k in dims) dims[k] += r.r[k] / n; });
    for (const k in dims) dims[k] = round1(dims[k]);
    // 近 7 天口碑
    const recent = rs.filter((r) => r.daysAgo <= 7);
    const recentAvg = recent.length ? recent.reduce((a, r) => a + r.overall, 0) / recent.length : avg;
    const badRatio = rs.length ? rs.filter((r) => r.overall < 3.2).length / rs.length : 0;
    // 热度：基数 + 评论数
    const hot = d.hot + n * 1.5;
    const queue = stallQueue(stallOf(d).id);
    dishStats[d.id] = {
      ...d, n, avg: round1(avg), dims, recentAvg: round1(recentAvg), badRatio, hot: round1(hot), queue,
      trend: round1(recentAvg - avg)
    };
  });
}

/* 实时排队：基准 + 时段系数 + 用户上报 */
function nowMeal() {
  const h = new Date().getHours();
  if (h < 9) return { k: 'breakfast', name: '早餐', e: '🌅' };
  if (h < 11) return { k: 'lunch', name: '早午餐', e: '🍱' };
  if (h < 14) return { k: 'lunch', name: '午餐', e: '🍱' };
  if (h < 17) return { k: 'snack', name: '下午茶', e: '🍡' };
  if (h < 21) return { k: 'dinner', name: '晚餐', e: '🍚' };
  return { k: 'night', name: '夜宵', e: '🌃' };
}
function stallQueue(sid) {
  const st = STALLS.find((s) => s.id === sid);
  if (!st) return 0;
  const rep = state.queueReports[sid];
  if (rep != null) return rep;
  const m = nowMeal();
  const peak = (m.k === 'lunch' || m.k === 'dinner') ? 1.5 : (m.k === 'night' ? 1.3 : 0.8);
  // 夜宵广场白天不排队
  const cClosed = (st.canteen === 'c5' && (m.k === 'breakfast' || m.k === 'lunch')) ? 0.2 : 1;
  return Math.max(0, Math.round(st.queue * peak * cClosed));
}
function canteenOpen(c) {
  const m = nowMeal();
  if (c.id === 'c5') return m.k === 'dinner' || m.k === 'night' || m.k === 'snack';
  if (m.k === 'night') return false;
  return true;
}

/* ---------- 口味匹配度 ---------- */
function matchScore(d) {
  const st = dishStats[d.id];
  const p = state.profile;
  let s = 100;
  // 辣度
  s -= Math.abs(d.sp - p.spice) * 9;
  // 预算
  if (d.p > p.budget) s -= (d.p - p.budget) * 4.5;
  else s += (p.budget - d.p) * 0.6;
  // 排队
  if (st.queue > p.queue) s -= (st.queue - p.queue) * 3.2;
  // 评分
  s += (st.avg - 3.8) * 22;
  // 近期口碑
  s += st.trend * 12;
  // 差评率
  s -= st.badRatio * 45;
  // 偏好品类
  if (p.cats.length) {
    const hit = p.cats.some((c) => d.tags.includes(c) || stallOf(d).cat === c);
    s += hit ? 14 : -8;
  }
  // 忌口
  if (p.avoid.some((a) => d.tags.includes(a))) s -= 70;
  return Math.round(Math.max(0, Math.min(100, s)));
}

/* ---------- 渲染：菜品卡 ---------- */
function dishCard(d, opt = {}) {
  const st = dishStats[d.id], s = stallOf(d), c = canteenOf(d);
  const fav = state.favs.includes(d.id);
  const cover = ['#FFF1E8', '#FFE9F0', '#EAF7EE', '#FFF6E0', '#EEF3FF', '#F3EEFF'][d.id.charCodeAt(3) % 6];
  const m = opt.mode === 'match' ? matchScore(d) : null;
  return `<div class="dish-card" data-dish="${d.id}">
    <div class="dc-cover" style="background:${cover}">
      <span>${d.e}</span>
      <button class="dc-fav" data-fav="${d.id}">${fav ? '❤️' : '🤍'}</button>
      ${d.isNew ? '<span class="dc-badge new">本周上新</span>' : (st.badRatio > 0.35 ? '<span class="dc-badge">慎点</span>' : '')}
    </div>
    <div class="dc-body">
      <div class="dc-name">${esc(d.name)}</div>
      <div class="dc-from">${c.emoji} ${esc(s.name)} · ${s.floor}</div>
      <div class="dc-meta">
        <span class="dc-score">${st.avg.toFixed(1)}<small> 分 (${st.n})</small></span>
        <span class="dc-price">¥${d.p}</span>
      </div>
      <div class="dc-tags">
        ${d.tags.slice(0, 3).map((t) => `<span class="mini-tag">${t}</span>`).join('')}
        ${st.trend < -0.3 ? '<span class="mini-tag hot">口碑下滑</span>' : ''}
      </div>
      ${m != null ? `<div class="dc-match">匹配度 ${m}%</div>` : ''}
    </div>
  </div>`;
}

/* ---------- 视图切换 ---------- */
function switchView(v) {
  $$('.view').forEach((el) => el.classList.toggle('active', el.id === 'view-' + v));
  $$('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (v === 'home') renderHome();
  if (v === 'discover') renderDiscover();
  if (v === 'rank') renderRank();
  if (v === 'me') renderMe();
  if (v === 'review') renderReviewView();
}

/* ---------- 首页 ---------- */
function renderHome() {
  const m = nowMeal();
  const h = new Date().getHours();
  $('#mealEmoji').textContent = m.e;
  $('#mealName').textContent = m.name;
  $('#heroEmoji').textContent = m.e;
  $('#greetTitle').textContent = (h < 9 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好') + '，今天吃点什么？';
  $('#hsDishes').textContent = DISHES.length;
  $('#hsOpen').textContent = CANTEENS.filter(canteenOpen).length;
  const warns = warnList();
  $('#hsWarn').textContent = warns.length;

  // 推荐
  const mode = $('#recommendSeg .seg-btn.active').dataset.mode;
  const open = DISHES.filter((d) => canteenOpen(canteenOf(d)));
  let list = open.slice();
  if (mode === 'match') list.sort((a, b) => matchScore(b) - matchScore(a));
  else if (mode === 'hot') list.sort((a, b) => dishStats[b.id].hot - dishStats[a.id].hot);
  else if (mode === 'value') list.sort((a, b) => (dishStats[b.id].dims.value - b.p * 0.04) - (dishStats[a.id].dims.value - a.p * 0.04));
  else list.sort((a, b) => dishStats[a.id].queue - dishStats[b.id].queue);
  $('#recommendGrid').innerHTML = list.slice(0, 8).map((d) => dishCard(d, { mode })).join('');

  // 预警
  $('#warnList').innerHTML = warns.slice(0, 4).map((d) => {
    const st = dishStats[d.id], s = stallOf(d), c = canteenOf(d);
    const reasons = [];
    if (st.trend < -0.3) reasons.push('近期口碑下滑');
    if (st.badRatio > 0.3) reasons.push('差评集中');
    if (st.queue > 12) reasons.push('排队过久');
    return `<div class="warn-item" data-dish="${d.id}">
      <span class="wi-emoji">${d.e}</span>
      <div class="wi-main">
        <div class="wi-title">${esc(d.name)}</div>
        <div class="wi-sub">${c.emoji} ${esc(s.name)} · ¥${d.p}</div>
        <div class="wi-reason">⚠️ ${reasons.join(' / ')}</div>
      </div>
      <div class="wi-score"><b>${st.avg.toFixed(1)}</b><span>近7天 ${st.recentAvg.toFixed(1)}</span></div>
    </div>`;
  }).join('') || '<div class="empty">今天没有明显的雷点，放心冲 🎉</div>';

  // 排队
  const qs = STALLS.map((s) => ({ s, q: stallQueue(s.id) })).sort((a, b) => b.q - a.q);
  $('#queueList').innerHTML = qs.slice(0, 6).map(({ s, q }) => {
    const pct = Math.min(100, (q / 25) * 100);
    const color = q > 14 ? '#EF4444' : q > 8 ? '#F59E0B' : '#16A34A';
    return `<div class="queue-item">
      <span class="qi-name">${esc(s.name)}</span>
      <div class="qi-bar"><div class="qi-fill" style="width:${pct}%;background:${color}"></div></div>
      <span class="qi-time" style="color:${color}">${q} 分钟</span>
      <button class="qi-btn" data-report="${s.id}">上报</button>
    </div>`;
  }).join('');
}

function warnList() {
  return DISHES.filter((d) => {
    const st = dishStats[d.id];
    return st.trend < -0.25 || st.badRatio > 0.3 || (st.avg < 3.5 && st.queue > 10);
  }).sort((a, b) => (dishStats[a.id].trend - dishStats[a.id].badRatio) - (dishStats[b.id].trend - dishStats[b.id].badRatio));
}

/* ---------- 帮我决定 ---------- */
let slotDishes = [];
function rollDishes() {
  const open = DISHES.filter((d) => canteenOpen(canteenOf(d)));
  const pool = open.slice().sort((a, b) => matchScore(b) - matchScore(a)).slice(0, 18);
  slotDishes = [];
  const used = new Set();
  while (slotDishes.length < 3 && used.size < pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    if (used.has(i)) continue;
    used.add(i); slotDishes.push(pool[i]);
  }
  return slotDishes;
}
function renderSlots(list) {
  $$('#decideStage .slot').forEach((el, i) => {
    const d = list[i];
    const st = dishStats[d.id], s = stallOf(d);
    el.classList.add('filled'); el.classList.remove('picked');
    el.innerHTML = `<div class="slot-inner" data-dish="${d.id}">
      <span class="s-emoji">${d.e}</span>
      <span class="s-name">${esc(d.name)}</span>
      <span class="s-meta">¥${d.p} · ${st.avg.toFixed(1)}分 · ${st.queue}分钟</span>
      <span class="s-meta">${s.emoji} ${esc(s.name)}</span>
    </div>`;
  });
  $('#decideResult').hidden = true;
}
function animateRoll(done) {
  const slots = $$('#decideStage .slot');
  let t = 0;
  const timer = setInterval(() => {
    slots.forEach((el) => {
      const d = DISHES[Math.floor(Math.random() * DISHES.length)];
      el.classList.add('filled');
      el.innerHTML = `<div class="slot-inner"><span class="s-emoji">${d.e}</span><span class="s-name">${esc(d.name)}</span></div>`;
    });
    if (++t > 8) { clearInterval(timer); done(); }
  }, 90);
}

/* ---------- 发现页 ---------- */
let filters = { canteen: 'all', price: 'all', taste: 'all', sort: 'match', q: '' };
const PRICE_OPTS = [['all', '不限'], ['p1', '10元以下'], ['p2', '10-20元'], ['p3', '20元以上']];
const TASTE_OPTS = [['all', '不限'], ['辣', '辣'], ['清淡', '清淡'], ['素', '素'], ['高蛋白', '高蛋白'], ['低卡', '低卡'], ['夜宵', '夜宵'], ['招牌', '招牌']];
const SORT_OPTS = [['match', '口味匹配'], ['score', '评分最高'], ['hot', '最热门'], ['price', '价格最低'], ['queue', '排队最短']];

function renderFilterBar() {
  $('#fCanteen').innerHTML = [['all', '全部食堂'], ...CANTEENS.map((c) => [c.id, c.emoji + c.short])]
    .map(([v, t]) => `<button class="chip ${filters.canteen === v ? 'on' : ''}" data-f="canteen" data-v="${v}">${t}</button>`).join('');
  $('#fPrice').innerHTML = PRICE_OPTS.map(([v, t]) => `<button class="chip ${filters.price === v ? 'on' : ''}" data-f="price" data-v="${v}">${t}</button>`).join('');
  $('#fTaste').innerHTML = TASTE_OPTS.map(([v, t]) => `<button class="chip ${filters.taste === v ? 'on' : ''}" data-f="taste" data-v="${v}">${t}</button>`).join('');
  $('#fSort').innerHTML = SORT_OPTS.map(([v, t]) => `<button class="chip ${filters.sort === v ? 'on' : ''}" data-f="sort" data-v="${v}">${t}</button>`).join('');
}
function renderDiscover() {
  renderFilterBar();
  let list = DISHES.slice();
  const q = filters.q.trim();
  if (q) list = list.filter((d) => (d.name + stallOf(d).name + canteenOf(d).name + d.tags.join('')).includes(q));
  if (filters.canteen !== 'all') list = list.filter((d) => stallOf(d).canteen === filters.canteen);
  if (filters.price === 'p1') list = list.filter((d) => d.p < 10);
  if (filters.price === 'p2') list = list.filter((d) => d.p >= 10 && d.p <= 20);
  if (filters.price === 'p3') list = list.filter((d) => d.p > 20);
  if (filters.taste !== 'all') list = list.filter((d) => d.tags.includes(filters.taste));
  const s = filters.sort;
  if (s === 'match') list.sort((a, b) => matchScore(b) - matchScore(a));
  else if (s === 'score') list.sort((a, b) => dishStats[b.id].avg - dishStats[a.id].avg);
  else if (s === 'hot') list.sort((a, b) => dishStats[b.id].hot - dishStats[a.id].hot);
  else if (s === 'price') list.sort((a, b) => a.p - b.p);
  else list.sort((a, b) => dishStats[a.id].queue - dishStats[b.id].queue);
  $('#discoverCount').textContent = `共 ${list.length} 道菜`;
  $('#discoverEmpty').hidden = list.length > 0;
  $('#discoverGrid').innerHTML = list.map((d) => dishCard(d, { mode: s === 'match' ? 'match' : null })).join('');
}

/* ---------- 榜单 ---------- */
function renderRank() {
  const kind = $('#rankSeg .seg-btn.active').dataset.rank;
  let list = [], html = '';
  if (kind === 'stall') {
    list = STALLS.map((s) => {
      const ds = DISHES.filter((d) => d.stall === s.id);
      const avg = ds.reduce((a, d) => a + dishStats[d.id].avg, 0) / ds.length;
      return { ...s, avg: round1(avg), q: stallQueue(s.id), c: CANTEENS.find((c) => c.id === s.canteen) };
    }).sort((a, b) => b.avg - a.avg);
    html = list.map((s, i) => rankRow(i, s.emoji, s.name, `${s.c.emoji} ${s.c.short} · ${s.floor} · ${s.cat}`, s.avg.toFixed(1), '分')).join('');
  } else {
    let ds = DISHES.slice();
    if (kind === 'new') ds = ds.filter((d) => d.isNew);
    ds = ds.map((d) => ({ d, st: dishStats[d.id] }));
    if (kind === 'must') ds.sort((a, b) => (b.st.avg * 20 + b.st.hot * 0.1) - (a.st.avg * 20 + a.st.hot * 0.1));
    else if (kind === 'avoid') ds.sort((a, b) => (a.st.avg + a.st.trend) - (b.st.avg + b.st.trend));
    else if (kind === 'value') ds.sort((a, b) => (b.st.dims.value - b.d.p * 0.05) - (a.st.dims.value - a.d.p * 0.05));
    else if (kind === 'queue') ds.sort((a, b) => b.st.queue - a.st.queue);
    else ds.sort((a, b) => b.st.avg - a.st.avg);
    ds = ds.slice(0, 12);
    html = ds.map(({ d, st }, i) => {
      const s = stallOf(d), c = canteenOf(d);
      let right, sub;
      if (kind === 'avoid') { right = st.avg.toFixed(1); sub = `差评率 ${Math.round(st.badRatio * 100)}% · ${c.emoji}${s.name}`; }
      else if (kind === 'value') { right = '¥' + d.p; sub = `性价比 ${st.dims.value} · ${c.emoji}${s.name}`; }
      else if (kind === 'queue') { right = st.queue + '分'; sub = `预估等待 · ${c.emoji}${s.name}`; }
      else { right = st.avg.toFixed(1); sub = `${st.n} 条点评 · ${c.emoji}${s.name}`; }
      return rankRow(i, d.e, d.name, sub, right, kind === 'avoid' || kind === 'queue' ? '' : '分', kind === 'avoid', d.id);
    }).join('');
  }
  $('#rankWrap').innerHTML = html || '<div class="empty">暂无数据</div>';
}
function rankRow(i, emoji, name, sub, right, unit, bad, dishId) {
  const cls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
  return `<div class="rank-item" ${dishId ? `data-dish="${dishId}"` : ''}>
    <div class="rk-no ${cls}">${i + 1}</div>
    <div class="rk-emoji">${emoji}</div>
    <div class="rk-main">
      <div class="rk-title">${esc(name)}</div>
      <div class="rk-sub">${esc(sub)}</div>
    </div>
    <div class="rk-right"><b class="${bad ? 'rk-bad' : ''}">${right}</b><span>${unit}</span></div>
  </div>`;
}

/* ---------- 点评 ---------- */
let rateVals = { taste: 4, portion: 4, value: 4, look: 4 };
const RV_TAG_POOL = ['分量足', '阿姨手松', '入味', '锅气足', '性价比高', '出餐快', '食材新鲜', '太咸了', '分量偏少', '阿姨手抖', '排队久', '有点油', '踩雷了', '味道不稳定'];
const RATE_DIMS = [['taste', '口味'], ['portion', '分量'], ['value', '性价比'], ['look', '卖相']];

function renderRateBox() {
  $('#rateBox').innerHTML = RATE_DIMS.map(([k, label]) => `
    <div class="rate-item">
      <div class="ri-label"><span>${label}</span><b id="rv_${k}">${rateVals[k]}.0</b></div>
      <div class="stars" data-k="${k}">
        ${[1, 2, 3, 4, 5].map((n) => `<span class="star ${n <= rateVals[k] ? 'on' : ''}" data-star="${n}">★</span>`).join('')}
      </div>
    </div>`).join('');
}
function renderReviewView() {
  $('#rvDish').innerHTML = DISHES.map((d) => {
    const s = stallOf(d), c = canteenOf(d);
    return `<option value="${d.id}">${c.short} / ${s.name} / ${d.name} ¥${d.p}</option>`;
  }).join('');
  renderRateBox();
  $('#rvTags').innerHTML = RV_TAG_POOL.map((t) => `<button class="chip" data-rtag="${t}">${t}</button>`).join('');
  renderMyReviews();
}
function renderMyReviews() {
  const list = state.myReviews.slice().reverse();
  $('#myReviewCount').textContent = `已发布 ${list.length} 条`;
  $('#myReviews').innerHTML = list.length ? list.map((r) => {
    const d = DISHES.find((x) => x.id === r.dish);
    return `<div class="review-item">
      <div class="rv-head">
        <div class="rv-avatar">🍚</div>
        <span class="rv-user">${esc(r.user)}</span>
        <span class="rv-time">${r.daysAgo === 0 ? '刚刚' : r.daysAgo + '天前'}</span>
      </div>
      <div class="rv-dish">${d ? esc(d.name) : '未知菜品'} · 综合 ${r.overall}</div>
      <div class="rv-text">${esc(r.text || '（未填写评价）')}</div>
      <div class="rv-dims">
        <span>口味 ${r.r.taste}</span><span>分量 ${r.r.portion}</span>
        <span>性价比 ${r.r.value}</span><span>卖相 ${r.r.look}</span>
        ${r.tags.map((t) => `<span>#${t}</span>`).join('')}
        <button class="rv-del" data-del="${r.id}">删除</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">还没写过点评，上面发一条试试～</div>';
}

/* ---------- 我的 ---------- */
const CAT_OPTS = ['荤', '素', '主食', '汤', '小吃', '甜品', '辣', '清淡', '高蛋白', '低卡', '早餐', '夜宵', '下饭', '聚餐'];
function renderMe() {
  const p = state.profile;
  $('#sSpice').value = p.spice; $('#sBudget').value = p.budget; $('#sQueue').value = p.queue;
  updateSliderLabels();
  $('#pCats').innerHTML = CAT_OPTS.map((c) => `<button class="chip ${p.cats.includes(c) ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('');
  $('#pAvoid').innerHTML = CAT_OPTS.map((c) => `<button class="chip warn ${p.avoid.includes(c) ? 'on' : ''}" data-avoid="${c}">${c}</button>`).join('');

  const best = DISHES.slice().sort((a, b) => matchScore(b) - matchScore(a))[0];
  const topCat = {};
  state.myReviews.forEach((r) => { (r.tags || []).forEach((t) => topCat[t] = (topCat[t] || 0) + 1); });
  const topTags = Object.entries(topCat).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
  $('#pfName').textContent = p.spice >= 4 ? '无辣不欢型' : p.spice <= 1 ? '清淡养生型' : p.budget >= 25 ? '品质干饭型' : '性价比战士';
  $('#pfAvatar').textContent = p.spice >= 4 ? '🌶️' : p.budget >= 25 ? '🍽️' : '🍚';
  $('#pfTags').innerHTML = [
    ['🌶️', ['滴辣不沾', '微辣', '中辣', '挺能吃辣', '很能吃辣', '无辣不欢'][p.spice]],
    ['💰', '预算 ¥' + p.budget],
    ['⏱️', '排队 ≤' + p.queue + '分'],
    ...topTags.map((t) => ['🏷️', t])
  ].map(([e, t]) => `<span class="ptag">${e} ${esc(t)}</span>`).join('');
  $('#pfStats').innerHTML = `
    <span><b>${state.myReviews.length}</b>条点评</span>
    <span><b>${state.favs.length}</b>个收藏</span>
    <span>最佳匹配：<b>${best ? esc(best.name) : '-'}</b></span>`;

  $('#favCount').textContent = `${state.favs.length} 道菜`;
  const favs = DISHES.filter((d) => state.favs.includes(d.id));
  $('#favEmpty').hidden = favs.length > 0;
  $('#favGrid').innerHTML = favs.map((d) => dishCard(d)).join('');
}
function updateSliderLabels() {
  const p = state.profile;
  $('#vSpice').textContent = ['滴辣不沾', '微辣', '中辣', '挺能吃辣', '很能吃辣', '无辣不欢'][p.spice];
  $('#vBudget').textContent = p.budget + ' 元';
  $('#vQueue').textContent = p.queue + ' 分钟';
}

/* ---------- 详情弹窗 ---------- */
function openDish(id) {
  const d = DISHES.find((x) => x.id === id); if (!d) return;
  const st = dishStats[id], s = stallOf(d), c = canteenOf(d);
  const rs = [...REVIEWS.filter((r) => r.dish === id), ...state.myReviews.filter((r) => r.dish === id)]
    .sort((a, b) => a.daysAgo - b.daysAgo);
  const tagCount = {};
  rs.forEach((r) => r.tags.forEach((t) => tagCount[t] = (tagCount[t] || 0) + 1));
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const cover = ['#FFF1E8', '#FFE9F0', '#EAF7EE', '#FFF6E0', '#EEF3FF', '#F3EEFF'][id.charCodeAt(3) % 6];
  const fav = state.favs.includes(id);
  const isBad = (t) => BAD_TAGS.includes(t);

  $('#modalBody').innerHTML = `
    <div class="m-hero">
      <div class="m-emoji" style="background:${cover}">${d.e}</div>
      <div>
        <div class="m-title">${esc(d.name)}</div>
        <div class="m-sub">${c.emoji} ${esc(c.name)} · ${esc(s.name)} ${s.floor}</div>
        <div class="m-sub">辣度 ${'🌶️'.repeat(d.sp) || '不辣'} · 参考价 ¥${d.p}</div>
      </div>
    </div>
    <div class="m-score-row">
      <div class="msr-big">${st.avg.toFixed(1)}<span> /5</span></div>
      <div class="msr-dims">
        <div><i>口味</i> ${st.dims.taste}</div><div><i>分量</i> ${st.dims.portion}</div>
        <div><i>性价比</i> ${st.dims.value}</div><div><i>卖相</i> ${st.dims.look}</div>
      </div>
    </div>
    <div class="m-block">
      <h4>实时状态</h4>
      <div class="m-tags">
        <span class="m-tag">⏱️ 预计排队 ${st.queue} 分钟</span>
        <span class="m-tag">🔥 热度 ${Math.round(st.hot)}</span>
        <span class="m-tag">🎯 匹配度 ${matchScore(d)}%</span>
        <span class="m-tag ${st.trend < -0.2 ? 'bad' : 'good'}">📉 近期 ${st.trend >= 0 ? '+' : ''}${st.trend.toFixed(1)}</span>
      </div>
    </div>
    ${topTags.length ? `<div class="m-block"><h4>大家都在说</h4><div class="m-tags">
      ${topTags.map(([t, n]) => `<span class="m-tag ${isBad(t) ? 'bad' : 'good'}">${esc(t)} ${n}</span>`).join('')}
    </div></div>` : ''}
    <div class="m-actions">
      <button class="btn-primary" id="mFav">${fav ? '❤️ 取消收藏' : '🤍 收藏'}</button>
      <button class="btn-ghost" id="mGoReview">✍️ 写点评</button>
    </div>
    <div class="m-block" style="margin-top:16px">
      <h4>全部点评 (${rs.length})</h4>
      ${rs.slice(0, 6).map((r) => `<div class="m-review">
        <div class="rv-head">
          <div class="rv-avatar">🍚</div>
          <span class="rv-user">${esc(r.user)}</span>
          <span class="rv-time">${r.daysAgo === 0 ? '刚刚' : r.daysAgo + '天前'}</span>
        </div>
        <div class="rv-text">${esc(r.text)}</div>
        <div class="rv-dims"><span>综合 <b>${r.overall}</b></span><span>口味 ${r.r.taste}</span><span>分量 ${r.r.portion}</span><span>性价比 ${r.r.value}</span></div>
      </div>`).join('') || '<div class="empty" style="padding:16px">还没有点评</div>'}
    </div>`;
  $('#modalMask').hidden = false;
  $('#mFav').onclick = () => { toggleFav(id); openDish(id); };
  $('#mGoReview').onclick = () => { closeModal(); switchView('review'); $('#rvDish').value = id; };
}
function closeModal() { $('#modalMask').hidden = true; }

/* ---------- 交互 ---------- */
function toggleFav(id) {
  const i = state.favs.indexOf(id);
  if (i >= 0) { state.favs.splice(i, 1); toast('已取消收藏'); }
  else { state.favs.push(id); toast('已收藏 ❤️'); }
  LS.set('favs', state.favs);
  const v = $('.view.active').id.replace('view-', '');
  if (v === 'home') renderHome(); else if (v === 'discover') renderDiscover(); else if (v === 'me') renderMe();
}
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, 1800);
}

function init() {
  buildStats();
  renderHome(); renderDiscover(); renderReviewView(); renderMe(); renderRank();

  // 导航
  $$('.nav-item').forEach((b) => b.onclick = () => switchView(b.dataset.view));
  $$('.tab').forEach((b) => b.onclick = () => switchView(b.dataset.view));

  // 帮我决定
  $('#btnRoll').onclick = () => animateRoll(() => { renderSlots(rollDishes()); toast('点一张卡片就开吃！'); });
  $('#btnRollDirect').onclick = () => {
    animateRoll(() => {
      const list = rollDishes(); renderSlots(list);
      const best = list[0];
      const st = dishStats[best.id], s = stallOf(best), c = canteenOf(best);
      $$('#decideStage .slot')[0].classList.add('picked');
      $('#decideResult').hidden = false;
      $('#decideResult').innerHTML = `<div class="dr-title">就吃它：${best.e} ${esc(best.name)}</div>
        <div class="dr-text">${c.emoji} ${esc(c.name)} ${esc(s.name)} ${s.floor} · ¥${best.p} · ${st.avg.toFixed(1)}分 · 预计排队 ${st.queue} 分钟<br>匹配度 ${matchScore(best)}%，${c.walk} 分钟路程，出发吧！</div>`;
    });
  };

  // 推荐模式
  $$('#recommendSeg .seg-btn').forEach((b) => b.onclick = () => {
    $$('#recommendSeg .seg-btn').forEach((x) => x.classList.remove('active'));
    b.classList.add('active'); renderHome();
  });

  // 搜索 / 筛选
  $('#btnSearch').onclick = () => { filters.q = $('#searchInput').value; renderDiscover(); };
  $('#searchInput').oninput = (e) => { filters.q = e.target.value; renderDiscover(); };
  $('#btnResetFilter').onclick = () => { filters = { canteen: 'all', price: 'all', taste: 'all', sort: 'match', q: '' }; $('#searchInput').value = ''; renderDiscover(); };
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-f]');
    if (chip) { filters[chip.dataset.f] = chip.dataset.v; renderDiscover(); }
  });

  // 菜品卡点击
  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]');
    if (fav) { e.stopPropagation(); toggleFav(fav.dataset.fav); return; }
    const rep = e.target.closest('[data-report]');
    if (rep) {
      e.stopPropagation();
      const sid = rep.dataset.report;
      const v = prompt('这个窗口现在大概要排多久？（分钟）', stallQueue(sid));
      if (v !== null && !isNaN(+v) && +v >= 0) {
        state.queueReports[sid] = Math.round(+v); LS.set('queueReports', state.queueReports);
        buildStats(); renderHome(); toast('感谢上报，排队已更新 👍');
      }
      return;
    }
    const card = e.target.closest('[data-dish]');
    if (card) openDish(card.dataset.dish);
  });

  // 榜单
  $$('#rankSeg .seg-btn').forEach((b) => b.onclick = () => {
    $$('#rankSeg .seg-btn').forEach((x) => x.classList.remove('active'));
    b.classList.add('active'); renderRank();
  });

  // 点评：星级
  $('#rateBox').addEventListener('click', (e) => {
    const st = e.target.closest('[data-star]'); if (!st) return;
    const k = st.closest('.stars').dataset.k;
    rateVals[k] = +st.dataset.star; renderRateBox();
  });
  $('#rateBox').addEventListener('mouseover', (e) => {
    const st = e.target.closest('[data-star]'); if (!st) return;
    const box = st.closest('.stars');
    $$('.star', box).forEach((x) => x.classList.toggle('on', +x.dataset.star <= +st.dataset.star));
    $('#rv_' + box.dataset.k).textContent = st.dataset.star + '.0';
  });

  // 点评标签
  let pickedTags = [];
  $('#rvTags').addEventListener('click', (e) => {
    const b = e.target.closest('[data-rtag]'); if (!b) return;
    b.classList.toggle('on');
    const t = b.dataset.rtag;
    pickedTags = b.classList.contains('on') ? [...pickedTags, t] : pickedTags.filter((x) => x !== t);
  });

  $('#btnSubmitReview').onclick = () => {
    const id = $('#rvDish').value;
    const overall = round1(rateVals.taste * .4 + rateVals.portion * .2 + rateVals.value * .3 + rateVals.look * .1);
    state.myReviews.push({
      id: 'my' + Date.now(), dish: id,
      user: $('#rvUser').value.trim() || '匿名干饭人',
      r: { ...rateVals }, overall, tags: pickedTags,
      text: $('#rvText').value.trim(), daysAgo: 0, likes: 0
    });
    LS.set('myReviews', state.myReviews);
    pickedTags = []; $('#rvText').value = '';
    buildStats(); renderMyReviews(); renderHome(); renderDiscover();
    toast('点评已发布，感谢贡献 🎉');
  };

  document.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      state.myReviews = state.myReviews.filter((r) => r.id !== del.dataset.del);
      LS.set('myReviews', state.myReviews); buildStats(); renderMyReviews(); renderHome(); toast('已删除');
    }
  });

  // 口味画像
  $('#sSpice').oninput = (e) => { state.profile.spice = +e.target.value; updateSliderLabels(); };
  $('#sBudget').oninput = (e) => { state.profile.budget = +e.target.value; updateSliderLabels(); };
  $('#sQueue').oninput = (e) => { state.profile.queue = +e.target.value; updateSliderLabels(); };
  $('#pCats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    const c = b.dataset.cat, arr = state.profile.cats;
    arr.includes(c) ? arr.splice(arr.indexOf(c), 1) : arr.push(c);
    b.classList.toggle('on');
  });
  $('#pAvoid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-avoid]'); if (!b) return;
    const c = b.dataset.avoid, arr = state.profile.avoid;
    arr.includes(c) ? arr.splice(arr.indexOf(c), 1) : arr.push(c);
    b.classList.toggle('on');
  });
  $('#btnSaveProfile').onclick = () => {
    LS.set('profile', state.profile); buildStats(); renderMe(); renderHome(); renderDiscover();
    toast('口味画像已保存，推荐已更新 ✨');
  };

  // 弹窗
  $('#modalClose').onclick = closeModal;
  $('#modalMask').onclick = (e) => { if (e.target.id === 'modalMask') closeModal(); };
  $('#btnHelp').onclick = () => {
    toast('干饭雷达 · AI Coding 演示作品｜数据为演示种子数据');
  };

  // 初始化推荐位
  renderSlots(rollDishes());
  setInterval(() => { buildStats(); if ($('#view-home').classList.contains('active')) renderHome(); }, 60000);
}

document.addEventListener('DOMContentLoaded', init);
