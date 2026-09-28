/* 記帳王 — personal finance PWA (vanilla JS) */
'use strict';
const APP_NAME = '記帳王';
const APP_VERSION = '1.0.0';

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const ymOf = s => s.slice(0, 7);
const parseYMD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const daysInMonth = (y, m) => new Date(y, m, 0).getDate(); // m: 1-12
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const round2 = n => Math.round((Number(n) || 0) * 100) / 100;
const nf = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 });
const money = (n, sign = false) => { n = round2(n); const s = (n < 0 ? '-' : (sign && n > 0 ? '+' : '')) + '$' + nf.format(Math.abs(n)); return s; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ymLabel = ym => { const [y, m] = ym.split('-'); return `${y}年${Number(m)}月`; };
const addMonths = (ym, k) => { let [y, m] = ym.split('-').map(Number); m += k; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return `${y}-${pad(m)}`; };
const dateLabel = s => {
  const d = parseYMD(s); const t = today();
  const yd = ymd(new Date(Date.now() - 864e5));
  const base = `${d.getMonth() + 1}月${d.getDate()}日 週${WEEK[d.getDay()]}`;
  return s === t ? base + ' · 今天' : s === yd ? base + ' · 昨天' : (d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + '年' : '') + base;
};
const daysBetween = (a, b) => Math.round((parseYMD(b) - parseYMD(a)) / 864e5);
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const vibrate = () => { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} };
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

const ICONS = {
  back: '<svg viewBox="0 0 24 24"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15.4 5.4 8.8 12l6.6 6.6-1.4 1.4-8-8 8-8z"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="m8.6 5.4 6.6 6.6-6.6 6.6 1.4 1.4 8-8-8-8z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><path d="M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7z"/></svg>',
  backspace: '<svg viewBox="0 0 24 24"><path d="M8 5h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-6-7zm3.4 3.6L10 10l2 2-2 2 1.4 1.4 2-2 2 2L16.8 14l-2-2 2-2-1.4-1.4-2 2z"/></svg>',
};

/* ---------- defaults ---------- */
const PALETTE = ['#f97316', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#eab308', '#f43f5e', '#64748b', '#22c55e', '#06b6d4', '#a855f7', '#84cc16', '#0ea5e9'];
function defaultCategories() {
  const E = [
    ['飲食', '🍜', [['早餐', '🥪'], ['午餐', '🍱'], ['晚餐', '🍲'], ['飲料', '🧋'], ['點心', '🍰'], ['宵夜', '🍢'], ['食材', '🥬']]],
    ['交通', '🚇', [['捷運', '🚇'], ['公車', '🚌'], ['計程車', '🚕'], ['加油', '⛽'], ['停車', '🅿️'], ['高鐵火車', '🚄'], ['機票', '✈️']]],
    ['購物', '🛍️', [['服飾', '👕'], ['日用品', '🧴'], ['3C電子', '💻'], ['美妝保養', '💄'], ['網購', '📦']]],
    ['娛樂', '🎮', [['電影', '🎬'], ['遊戲', '🎮'], ['旅遊', '🏖️'], ['訂閱服務', '📺'], ['運動', '⚽']]],
    ['居家', '🏠', [['房租', '🏠'], ['水電瓦斯', '💡'], ['電話網路', '📶'], ['管理費', '🏢'], ['家具家電', '🛋️']]],
    ['醫療', '🏥', [['門診', '🩺'], ['藥品', '💊'], ['保健', '🧘'], ['保險', '🛡️']]],
    ['學習', '📚', [['書籍', '📖'], ['課程', '🎓'], ['文具', '✏️']]],
    ['人情', '🎁', [['禮物', '🎁'], ['紅包', '🧧'], ['聚餐', '🍻'], ['捐款', '❤️']]],
    ['其他', '📌', [['手續費', '🏦'], ['稅金', '🧾'], ['雜支', '📌']]],
  ];
  const I = [
    ['薪水', '💼', []], ['獎金', '🏆', []],
    ['投資', '📈', [['股利', '💹'], ['利息', '🏦'], ['資本利得', '📈']]],
    ['兼職', '💪', []],
    ['其他', '💰', [['退款', '↩️'], ['發票中獎', '🎫'], ['紅包收入', '🧧'], ['雜項', '💰']]],
  ];
  const out = []; let order = 0;
  const add = (type, list) => list.forEach(([name, icon, subs], i) => {
    const id = `${type[0]}-${i}-${uid()}`;
    out.push({ id, type, name, icon, color: PALETTE[(type === 'income' ? i + 9 : i) % PALETTE.length], parentId: null, order: order++ });
    subs.forEach(([sn, si]) => out.push({ id: uid(), type, name: sn, icon: si, parentId: id, order: order++ }));
  });
  add('expense', E); add('income', I);
  return out;
}
const ACCOUNT_TYPES = { cash: '現金', bank: '銀行', credit: '信用卡', card: '電子票證', ewallet: '電子支付', invest: '投資', other: '其他' };
function defaultAccounts() {
  return [
    { id: uid(), name: '現金', type: 'cash', icon: '💵', initial: 0, order: 0 },
    { id: uid(), name: '銀行帳戶', type: 'bank', icon: '🏦', initial: 0, order: 1 },
    { id: uid(), name: '信用卡', type: 'credit', icon: '💳', initial: 0, order: 2 },
    { id: uid(), name: '悠遊卡', type: 'card', icon: '🎫', initial: 0, order: 3 },
    { id: uid(), name: 'LINE Pay', type: 'ewallet', icon: '📱', initial: 0, order: 4 },
  ];
}

/* ---------- state ---------- */
const S = {
  tx: [], accounts: [], categories: [], templates: [], recurring: [],
  budget: { total: 0, cats: {} },
  settings: { theme: 'system', lastBackup: null, backupDays: 7, backupSnooze: null, defaultAccount: null, lastCat: {}, installedAt: null },
};
const KV_KEYS = ['accounts', 'categories', 'templates', 'recurring', 'budget', 'settings'];
const save = k => DB.set(k, S[k]).catch(e => toast('儲存失敗：' + e.message));
const catById = id => S.categories.find(c => c.id === id);
const acctById = id => S.accounts.find(a => a.id === id);
const parentOf = c => c ? (c.parentId ? catById(c.parentId) : c) : null;
const parents = type => S.categories.filter(c => c.type === type && !c.parentId).sort((a, b) => a.order - b.order);
const subsOf = pid => S.categories.filter(c => c.parentId === pid).sort((a, b) => a.order - b.order);
const visibleAccounts = () => S.accounts.filter(a => !a.hidden).sort((a, b) => a.order - b.order);
const catColor = c => (parentOf(c) || {}).color || '#94a3b8';

async function loadAll() {
  await DB.open();
  const [tx, ...kv] = await Promise.all([DB.getAllTx(), ...KV_KEYS.map(k => DB.get(k))]);
  const first = kv[0] === undefined;
  S.tx = tx || [];
  KV_KEYS.forEach((k, i) => { if (kv[i] !== undefined) S[k] = k === 'settings' ? Object.assign(S.settings, kv[i]) : kv[i]; });
  if (first) {
    S.accounts = defaultAccounts();
    S.categories = defaultCategories();
    const cat = n => S.categories.find(c => c.name === n && c.parentId);
    const cash = S.accounts[0].id, card = S.accounts[3].id;
    S.templates = [
      { id: uid(), name: '早餐', type: 'expense', amount: 60, catId: cat('早餐').id, accountId: cash, note: '' },
      { id: uid(), name: '午餐', type: 'expense', amount: 120, catId: cat('午餐').id, accountId: cash, note: '' },
      { id: uid(), name: '飲料', type: 'expense', amount: 55, catId: cat('飲料').id, accountId: cash, note: '' },
      { id: uid(), name: '捷運', type: 'expense', amount: 30, catId: cat('捷運').id, accountId: card, note: '' },
    ];
    S.settings.defaultAccount = cash;
    S.settings.installedAt = today();
    await Promise.all(KV_KEYS.map(save));
  }
}

/* ---------- computations ---------- */
function accountBalance(aid, upto) {
  const a = acctById(aid); let b = a ? Number(a.initial) || 0 : 0;
  for (const t of S.tx) {
    if (upto && t.date > upto) continue;
    if (t.type === 'expense' && t.accountId === aid) b -= t.amount;
    else if (t.type === 'income' && t.accountId === aid) b += t.amount;
    else if (t.type === 'transfer') {
      if (t.accountId === aid) b -= t.amount + (Number(t.fee) || 0);
      if (t.toAccountId === aid) b += t.amount;
    }
  }
  return round2(b);
}
function txInRange(from, to, list = S.tx) { return list.filter(t => t.date >= from && t.date <= to); }
function monthRange(ym) { const [y, m] = ym.split('-').map(Number); return [`${ym}-01`, `${ym}-${pad(daysInMonth(y, m))}`]; }
function sumBy(list, type) { return round2(list.reduce((s, t) => s + (t.type === type ? t.amount : 0), 0)); }
function sortTx(list) { return list.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time) || (b.createdAt || 0) - (a.createdAt || 0)); }
function monthExpenseByParent(ym) {
  const [f, t] = monthRange(ym); const m = {};
  txInRange(f, t).forEach(x => { if (x.type !== 'expense') return; const p = parentOf(catById(x.catId)); const k = p ? p.id : '_'; m[k] = (m[k] || 0) + x.amount; });
  return m;
}
function txTitle(t) {
  if (t.type === 'transfer') return '轉帳';
  const c = catById(t.catId); return c ? c.name : '未分類';
}
function txIcon(t) {
  if (t.type === 'transfer') return '🔁';
  const c = catById(t.catId); return c ? c.icon : '❔';
}

/* ---------- UI infrastructure ---------- */
function toast(msg, opt = {}) {
  const root = $('#toast-root');
  // only one undo-able toast at a time, so "復原" always refers to the latest action
  if (opt.action) root.innerHTML = '';
  while (root.children.length >= 2) root.firstChild.remove();
  const el = h('<div class="toast"><span></span></div>');
  el.firstChild.textContent = msg;
  let timer;
  const close = () => { clearTimeout(timer); el.classList.remove('in'); setTimeout(() => el.remove(), 300); };
  if (opt.action) {
    const b = document.createElement('button'); b.textContent = opt.action;
    b.onclick = () => { close(); opt.fn(); }; el.appendChild(b);
  }
  root.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  timer = setTimeout(close, opt.duration || (opt.action ? 5000 : 2400));
  return close;
}

function openOverlay(node, { backdropClose = true, onClose } = {}) {
  const root = $('#overlay-root');
  const bd = h('<div class="backdrop"></div>');
  root.append(bd, node);
  requestAnimationFrame(() => requestAnimationFrame(() => { bd.classList.add('in'); node.classList.add('in'); }));
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    bd.classList.remove('in'); node.classList.remove('in');
    setTimeout(() => { bd.remove(); node.remove(); }, 320);
    onClose && onClose();
  };
  if (backdropClose) bd.addEventListener('click', close);
  return close;
}

function actionSheet(title, msg, buttons) {
  return new Promise(res => {
    const el = h(`<div class="action-sheet"><div class="as-group">${title || msg ? `<div class="as-title">${title ? `<b>${esc(title)}</b>` : ''}${esc(msg || '')}</div>` : ''}</div><div class="as-group"><button class="as-btn cancel">取消</button></div></div>`);
    const g = el.firstChild;
    let result = -1;
    buttons.forEach((b, i) => {
      const btn = h(`<button class="as-btn ${b.danger ? 'danger' : ''}">${esc(b.text)}</button>`);
      btn.onclick = () => { result = i; close(); };
      g.appendChild(btn);
    });
    el.querySelector('.cancel').onclick = () => close();
    const close = openOverlay(el, { onClose: () => setTimeout(() => res(result), 0) });
  });
}
const ask = async (title, msg, ok = '確定', danger = false) => (await actionSheet(title, msg, [{ text: ok, danger }])) === 0;

/** Generic form sheet. fields: [{key,label,type,value,options,placeholder,step}] */
function openForm({ title, fields, onSave, onDelete, deleteText = '刪除', saveText = '儲存', extraHTML = '' }) {
  const el = h(`<div class="sheet"><div class="sheet-h"><button class="text-btn f-cancel">取消</button><h2>${esc(title)}</h2><button class="text-btn f-save" style="font-weight:700">${esc(saveText)}</button></div><div class="sheet-body"><div class="cells f-cells"></div>${extraHTML}</div></div>`);
  const cells = el.querySelector('.f-cells');
  fields.forEach(f => {
    let input;
    const v = f.value ?? '';
    if (f.type === 'select') {
      input = `<select data-k="${f.key}">${f.options.map(o => o.group ? `<optgroup label="${esc(o.group)}">${o.items.map(i => `<option value="${esc(i.value)}" ${String(i.value) === String(v) ? 'selected' : ''}>${esc(i.label)}</option>`).join('')}</optgroup>` : `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
    } else if (f.type === 'toggle') {
      input = `<label class="switch"><input type="checkbox" data-k="${f.key}" ${v ? 'checked' : ''}><span></span></label>`;
    } else if (f.type === 'number') {
      input = `<input data-k="${f.key}" type="text" inputmode="decimal" value="${esc(v)}" placeholder="${esc(f.placeholder || '0')}">`;
    } else {
      input = `<input data-k="${f.key}" type="${f.type || 'text'}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${f.type === 'emoji' ? 'class="emoji-input" maxlength="4"' : ''} ${f.type === 'emoji' ? '' : ''}>`;
      input = input.replace('type="emoji"', 'type="text"');
    }
    cells.appendChild(h(`<div class="field" data-row="${f.key}" ${f.hidden ? 'hidden' : ''}><label>${esc(f.label)}</label>${input}</div>`));
  });
  if (onDelete) el.querySelector('.sheet-body').appendChild(h(`<button class="btn danger f-del">${esc(deleteText)}</button>`));
  const getVals = () => {
    const o = {};
    fields.forEach(f => {
      const i = el.querySelector(`[data-k="${f.key}"]`);
      o[f.key] = f.type === 'toggle' ? i.checked : f.type === 'number' ? (i.value.trim() === '' ? null : Number(i.value.replace(/,/g, ''))) : i.value.trim();
    });
    return o;
  };
  const close = openOverlay(el, { backdropClose: false });
  el.querySelector('.f-cancel').onclick = close;
  el.querySelector('.f-save').onclick = async () => { const r = await onSave(getVals(), el); if (r !== false) close(); };
  if (onDelete) el.querySelector('.f-del').onclick = async () => { const r = await onDelete(); if (r !== false) close(); };
  return { el, close, getVals };
}

/* ---------- page stack ---------- */
const pageStack = [];
function pushPage({ title, render, onClose }) {
  const el = h(`<section class="page"><header class="topbar"><div class="tb-left"><button class="icon-btn p-back" aria-label="返回">${ICONS.back}</button></div><h1></h1><div class="tb-right"></div></header><div class="content"></div></section>`);
  const page = { el, render, onClose, content: el.querySelector('.content'), right: el.querySelector('.tb-right'), titleEl: el.querySelector('h1') };
  page.setTitle = t => page.titleEl.textContent = t;
  page.setTitle(title);
  page.refresh = () => { const sc = page.content.scrollTop; page.render(page.content, page); page.content.scrollTop = sc; cleanupCharts(); };
  el.querySelector('.p-back').onclick = popPage;
  $('#pages').appendChild(el);
  pageStack.push(page);
  page.render(page.content, page);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  // edge swipe back
  let sx = null, sy = 0, dx = 0;
  el.addEventListener('touchstart', e => { const t = e.touches[0]; if (t.clientX < 24) { sx = t.clientX; sy = t.clientY; dx = 0; } else sx = null; }, { passive: true });
  el.addEventListener('touchmove', e => { if (sx == null) return; const t = e.touches[0]; dx = t.clientX - sx; if (Math.abs(t.clientY - sy) > 40 && dx < 30) { sx = null; el.style.transform = ''; return; } if (dx > 0) { el.style.transition = 'none'; el.style.transform = `translateX(${dx}px)`; } }, { passive: true });
  el.addEventListener('touchend', () => { if (sx == null) return; el.style.transition = ''; el.style.transform = ''; if (dx > 90) popPage(); sx = null; });
  return page;
}
function popPage() {
  const p = pageStack.pop(); if (!p) return;
  p.el.classList.remove('in'); setTimeout(() => { p.el.remove(); cleanupCharts(); }, 320);
  p.onClose && p.onClose();
}

/* ---------- charts ---------- */
let charts = [];
function cleanupCharts() { charts = charts.filter(c => { if (!c.canvas || !c.canvas.isConnected) { c.destroy(); return false; } return true; }); }
function makeChart(canvas, cfg) {
  if (typeof Chart === 'undefined') { canvas.replaceWith(h('<div class="muted small">圖表元件載入失敗</div>')); return; }
  cleanupCharts();
  const c = new Chart(canvas, cfg); charts.push(c); return c;
}
function chartColors() {
  const cs = getComputedStyle(document.documentElement);
  return { text: cs.getPropertyValue('--text2').trim(), grid: cs.getPropertyValue('--sep').trim(), exp: cs.getPropertyValue('--expense').trim(), inc: cs.getPropertyValue('--income').trim(), card: cs.getPropertyValue('--card').trim() };
}

/* ---------- theme ---------- */
const mqDark = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = S.settings.theme || 'system';
  try { localStorage.setItem('jzw-theme', t); } catch (e) {}
  const dark = t === 'dark' || (t === 'system' && mqDark.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('#meta-theme').setAttribute('content', dark ? '#000000' : '#0e9f73');
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = dark ? '#a1a1aa' : '#6b6b73';
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  }
}
mqDark.addEventListener && mqDark.addEventListener('change', () => { if (S.settings.theme === 'system') { applyTheme(); refreshAll(); } });

/* ---------- transaction rows ---------- */
const acctName = id => (acctById(id) || { name: '（已刪除帳戶）' }).name;
function txRowHTML(t, { showDate = false } = {}) {
  const sub = [];
  if (showDate) sub.push(t.date.slice(5).replace('-', '/'));
  else if (t.time) sub.push(t.time);
  if (t.type === 'transfer') sub.push(`${acctName(t.accountId)} → ${acctName(t.toAccountId)}`);
  else {
    const c = catById(t.catId), p = parentOf(c);
    if (p && c && p !== c) sub.push(p.name);
    sub.push(acctName(t.accountId));
  }
  if (t.note) sub.push(esc(t.note));
  const tags = (t.tags || []).map(x => `<span class="tag">#${esc(x)}</span>`).join(' ');
  const amt = t.type === 'expense' ? '-' + money(t.amount) : t.type === 'income' ? '+' + money(t.amount) : money(t.amount);
  const c = catById(t.catId);
  const bg = t.type === 'transfer' ? 'rgba(59,130,246,.14)' : (catColor(c) + '22');
  return `<div class="tx-row" data-id="${t.id}"><button class="tx-del">刪除</button><div class="tx-main"><div class="tx-ico" style="background:${bg}">${txIcon(t)}</div><div class="tx-mid"><div class="tx-title">${esc(txTitle(t))}${t.recurringId ? ' <span class="pill">週期</span>' : ''}</div><div class="tx-sub">${sub.map(x => typeof x === 'string' ? x : '').join(' · ')} ${tags}</div></div><div class="tx-amt num ${t.type}">${amt}</div></div></div>`;
}
function dayGroupsHTML(list, opts = {}) {
  if (!list.length) return `<div class="empty"><div class="e-ico">🧾</div>${opts.emptyText || '這段期間還沒有記錄<br>點下方 ＋ 開始記帳'}</div>`;
  const groups = new Map();
  sortTx(list).forEach(t => { if (!groups.has(t.date)) groups.set(t.date, []); groups.get(t.date).push(t); });
  let out = '';
  for (const [d, arr] of groups) {
    const e = sumBy(arr, 'expense'), i = sumBy(arr, 'income');
    const tot = [e ? `支出 <span class="expense">${money(e)}</span>` : '', i ? `收入 <span class="income">${money(i)}</span>` : ''].filter(Boolean).join('　');
    out += `<div class="day"><div class="day-h"><span>${dateLabel(d)}</span><span class="d-tot num">${tot}</span></div><div class="tx-list">${arr.map(t => txRowHTML(t)).join('')}</div></div>`;
  }
  return out;
}
let openRow = null;
function closeRow(row) { if (!row) return; row.classList.remove('open'); const m = row.querySelector('.tx-main'); if (m) m.style.transform = ''; if (openRow === row) openRow = null; }
function bindTxRows(container) {
  $$('.tx-row', container).forEach(row => {
    const main = row.querySelector('.tx-main'); const id = row.dataset.id;
    let sx = 0, sy = 0, dx = 0, drag = false, moved = false, lpTimer = null, longPressed = false, base = 0, pid = null;
    main.addEventListener('pointerdown', e => {
      if (openRow && openRow !== row) closeRow(openRow);
      sx = e.clientX; sy = e.clientY; dx = 0; drag = false; moved = false; longPressed = false; pid = e.pointerId;
      base = row.classList.contains('open') ? -84 : 0;
      lpTimer = setTimeout(() => { if (!moved) { longPressed = true; vibrate(); txActions(id); } }, 520);
    });
    main.addEventListener('pointermove', e => {
      if (e.pointerId !== pid) return;
      const mx = e.clientX - sx, my = e.clientY - sy;
      if (!moved && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
        moved = true; clearTimeout(lpTimer);
        if (Math.abs(mx) > Math.abs(my)) { drag = true; main.classList.add('dragging'); try { main.setPointerCapture(pid); } catch (err) {} }
      }
      if (drag) { dx = Math.min(0, Math.max(-130, base + mx)); main.style.transform = `translateX(${dx}px)`; }
    });
    const finish = () => {
      clearTimeout(lpTimer);
      if (drag) {
        main.classList.remove('dragging');
        if (dx < -42) { row.classList.add('open'); main.style.transform = 'translateX(-84px)'; openRow = row; }
        else closeRow(row);
      }
      pid = null;
    };
    main.addEventListener('pointerup', () => {
      const wasTap = !drag && !moved && !longPressed;
      finish();
      if (wasTap) { if (row.classList.contains('open')) closeRow(row); else { const t = S.tx.find(x => x.id === id); t && openEntry({ tx: t }); } }
      drag = false;
    });
    main.addEventListener('pointercancel', () => { finish(); drag = false; });
    main.addEventListener('contextmenu', e => e.preventDefault());
    row.querySelector('.tx-del').addEventListener('click', () => deleteTx(id));
  });
}
async function deleteTx(id) {
  const t = S.tx.find(x => x.id === id); if (!t) return;
  S.tx = S.tx.filter(x => x.id !== id);
  await DB.delTx(id);
  refreshAll();
  toast(`已刪除 ${txTitle(t)} ${money(t.amount)}`, { action: '復原', fn: async () => { S.tx.push(t); await DB.putTx(t); refreshAll(); toast('已復原'); } });
}
async function txActions(id) {
  const t = S.tx.find(x => x.id === id); if (!t) return;
  const i = await actionSheet(`${txTitle(t)} ${money(t.amount)}`, `${t.date} ${t.time || ''}${t.note ? ' · ' + t.note : ''}`,
    [{ text: '編輯' }, { text: '複製一筆（今天）' }, { text: '存為快速範本' }, { text: '刪除', danger: true }]);
  if (i === 0) openEntry({ tx: t });
  else if (i === 1) { const n = { ...t, id: uid(), date: today(), time: nowTime(), createdAt: Date.now(), recurringId: undefined }; delete n.recurringId; await addTx(n); toast('已複製到今天', { action: '復原', fn: () => deleteTxSilent(n.id) }); }
  else if (i === 2) { S.templates.push({ id: uid(), name: txTitle(t), type: t.type, amount: t.amount, catId: t.catId, accountId: t.accountId, toAccountId: t.toAccountId, note: t.note || '' }); save('templates'); refreshAll(); toast('已加入快速範本'); }
  else if (i === 3) deleteTx(id);
}
async function addTx(t) { S.tx.push(t); await DB.putTx(t); refreshAll(); }
async function deleteTxSilent(id) { S.tx = S.tx.filter(x => x.id !== id); await DB.delTx(id); refreshAll(); }

/* ---------- budget helpers ---------- */
function budgetSpent(ym) { const byP = monthExpenseByParent(ym); const total = round2(Object.values(byP).reduce((a, b) => a + b, 0)); return { ym, total, byP }; }
function budgetWarn(t, before) {
  if (t.type !== 'expense') return;
  const ym = ymOf(t.date); const after = budgetSpent(ym); const msgs = [];
  const same = before && before.ym === ym;
  const p = parentOf(catById(t.catId));
  const cb = p && Number(S.budget.cats?.[p.id]) || 0;
  if (cb > 0 && after.byP[p.id] > cb) msgs.push(`「${p.name}」已超出預算 ${money(after.byP[p.id] - cb)}`);
  const tb = Number(S.budget.total) || 0;
  if (tb > 0) {
    if (after.total > tb) msgs.push(`本月總預算已超支 ${money(after.total - tb)}`);
    else if (after.total >= tb * 0.8 && after.total <= tb && !(same && before.total >= tb * 0.8)) msgs.push(`本月預算已使用 ${Math.round(after.total / tb * 100)}%`);
  }
  if (msgs.length) setTimeout(() => toast('⚠️ ' + msgs.join('；'), { duration: 4500 }), 400);
}

/* ---------- entry sheet (add / edit) ---------- */
function evalExpr(expr) {
  if (!expr) return 0;
  const parts = expr.split(/([+−])/); let total = 0, op = '+';
  for (const p of parts) {
    if (p === '+' || p === '−') { op = p; continue; }
    if (p === '' || p === '.') continue;
    const n = parseFloat(p); if (isNaN(n)) continue;
    total = op === '+' ? total + n : total - n;
  }
  return round2(total);
}
function defaultCatFor(type) {
  const last = S.settings.lastCat && S.settings.lastCat[type];
  if (last && catById(last)) return last;
  const p = parents(type)[0]; if (!p) return null;
  const s = subsOf(p.id)[0]; return (s || p).id;
}
function accountOptions(sel, includeHidden = false) {
  return S.accounts.filter(a => includeHidden || !a.hidden || a.id === sel).sort((a, b) => a.order - b.order)
    .map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.icon + ' ' + a.name)}</option>`).join('');
}
function openEntry({ tx = null, type = null, preset = null } = {}) {
  cleanupEntryKeys && cleanupEntryKeys();
  const editing = !!tx;
  const accts = visibleAccounts();
  const defAcct = (acctById(S.settings.lastAccount) && !acctById(S.settings.lastAccount).hidden) ? S.settings.lastAccount : (S.settings.defaultAccount || accts[0]?.id);
  const st = {
    type: tx?.type || type || 'expense', expr: tx ? String(tx.amount) : '', catId: tx?.catId || null,
    accountId: tx?.accountId || defAcct, toAccountId: tx?.toAccountId || null,
    date: tx?.date || today(), time: tx?.time || nowTime(), note: tx?.note || '', tags: (tx?.tags || []).join(' '), fee: tx?.fee || '',
  };
  if (preset) Object.assign(st, preset);
  const fixTo = () => { if (!st.toAccountId || st.toAccountId === st.accountId) st.toAccountId = (accts.find(a => a.id !== st.accountId) || {}).id || null; };
  if (st.type !== 'transfer' && (!st.catId || !catById(st.catId) || catById(st.catId).type !== st.type)) st.catId = defaultCatFor(st.type);
  fixTo();
  const keys = ['7', '8', '9', 'del', '4', '5', '6', '+', '1', '2', '3', '−', '00', '0', '.', 'ok'];
  const el = h(`<div class="sheet full entry">
    <div class="entry-top"><button class="text-btn e-cancel">取消</button>
      <div class="seg"><button data-t="expense" class="t-expense">支出</button><button data-t="income" class="t-income">收入</button><button data-t="transfer" class="t-transfer">轉帳</button></div>
      ${editing ? `<button class="icon-btn e-del" aria-label="刪除" style="color:var(--expense)">${ICONS.trash}</button>` : `<button class="text-btn e-save" style="font-weight:700">儲存</button>`}
    </div>
    ${!editing && S.templates.length ? `<div class="tpl-strip"><div class="chips">${S.templates.map(t => `<button class="chip e-tpl" data-id="${t.id}">${esc(t.type === 'transfer' ? '🔁' : (catById(t.catId) || {}).icon || '⭐')} ${esc(t.name)} <span class="c-amt">${money(t.amount)}</span></button>`).join('')}</div></div>` : ''}
    <div class="entry-scroll">
      <div class="amount-box"><div class="ab-cat"><div class="ab-ico"></div><span class="ab-name"></span></div><div class="ab-right"><div class="ab-expr"></div><div class="ab-amt num"></div></div></div>
      <div class="e-cats"></div>
      <div class="entry-fields"></div>
    </div>
    <div class="keypad">${keys.map(k => `<button class="key ${k === 'ok' ? 'ok' : ['del', '+', '−'].includes(k) ? 'op' : ''}" data-k="${k}">${k === 'del' ? ICONS.backspace : k === 'ok' ? '完成' : k}</button>`).join('')}</div>
  </div>`);

  const renderAmount = () => {
    const v = evalExpr(st.expr);
    el.querySelector('.ab-amt').textContent = money(v);
    el.querySelector('.ab-amt').className = 'ab-amt num ' + st.type;
    el.querySelector('.ab-expr').textContent = /[+−]/.test(st.expr) ? st.expr + ' =' : '';
    const c = catById(st.catId);
    el.querySelector('.ab-ico').textContent = st.type === 'transfer' ? '🔁' : (c ? c.icon : '❔');
    el.querySelector('.ab-name').textContent = st.type === 'transfer' ? '轉帳' : (c ? c.name : '選擇分類');
  };
  const renderSeg = () => {
    $$('.seg button', el).forEach(b => b.classList.toggle('on', b.dataset.t === st.type));
    const ok = el.querySelector('.key.ok'); ok.className = 'key ok t-' + st.type;
  };
  const renderCats = () => {
    const box = el.querySelector('.e-cats');
    if (st.type === 'transfer') { box.innerHTML = ''; return; }
    const cur = catById(st.catId); const curP = parentOf(cur);
    const ps = parents(st.type);
    const subs = curP ? subsOf(curP.id) : [];
    box.innerHTML = `<div class="cat-grid">${ps.map(p => `<button class="cat-tile ${curP && curP.id === p.id ? 'on' : ''}" data-p="${p.id}"><span class="ct-ico">${esc(p.icon)}</span><span>${esc(p.name)}</span></button>`).join('')}</div>
      ${subs.length ? `<div class="sub-chips">${subs.map(s => `<button class="sub-chip ${st.catId === s.id ? 'on' : ''}" data-c="${s.id}">${esc(s.icon)} ${esc(s.name)}</button>`).join('')}<button class="sub-chip ${st.catId === curP.id ? 'on' : ''}" data-c="${curP.id}">不分類</button></div>` : ''}`;
    $$('.cat-tile', box).forEach(b => b.onclick = () => {
      const p = catById(b.dataset.p); const ss = subsOf(p.id);
      const prevCur = catById(st.catId);
      st.catId = (prevCur && parentOf(prevCur).id === p.id) ? st.catId : (ss[0] || p).id;
      renderCats(); renderAmount(); vibrate();
    });
    $$('.sub-chip', box).forEach(b => b.onclick = () => { st.catId = b.dataset.c; renderCats(); renderAmount(); vibrate(); });
    const sOn = box.querySelector('.sub-chip.on'); if (sOn) { const g = box.querySelector('.sub-chips'); const x = sOn.offsetLeft - g.offsetLeft; if (x > g.clientWidth - 60) g.scrollLeft = x - 20; }
  };
  const renderFields = () => {
    const f = el.querySelector('.entry-fields');
    const tr = st.type === 'transfer';
    f.innerHTML = `
      <div class="ef-row"><span class="ef-ico">${tr ? '📤' : '💳'}</span><select class="e-acct" aria-label="帳戶">${accountOptions(st.accountId)}</select><span class="ef-arrow">›</span></div>
      ${tr ? `<div class="ef-row"><span class="ef-ico">📥</span><select class="e-to" aria-label="轉入帳戶">${accountOptions(st.toAccountId)}</select><span class="ef-arrow">›</span></div>
      <div class="ef-row"><span class="ef-ico">🏦</span><input class="e-fee" inputmode="decimal" placeholder="手續費（選填）" value="${esc(st.fee || '')}"></div>` : ''}
      <div class="ef-row"><span class="ef-ico">📅</span><input type="date" class="e-date" value="${st.date}"><input type="time" class="e-time" value="${st.time}"><button class="text-btn e-today" style="font-size:15px;flex:none">現在</button></div>
      <div class="ef-row"><span class="ef-ico">📝</span><input class="e-note" placeholder="備註" value="${esc(st.note)}" maxlength="200" enterkeyhint="done"></div>
      <div class="ef-row"><span class="ef-ico">🏷️</span><input class="e-tags" placeholder="標籤（空白分隔，如 出差 旅遊）" value="${esc(st.tags)}" enterkeyhint="done"></div>`;
    f.querySelector('.e-acct').onchange = e => { st.accountId = e.target.value; if (tr) { fixTo(); renderFields(); } };
    if (tr) { f.querySelector('.e-to').onchange = e => st.toAccountId = e.target.value; f.querySelector('.e-fee').oninput = e => st.fee = e.target.value; }
    f.querySelector('.e-date').onchange = e => st.date = e.target.value || today();
    f.querySelector('.e-time').onchange = e => st.time = e.target.value || '';
    f.querySelector('.e-today').onclick = () => { st.date = today(); st.time = nowTime(); renderFields(); };
    f.querySelector('.e-note').oninput = e => st.note = e.target.value;
    f.querySelector('.e-tags').oninput = e => st.tags = e.target.value;
    $$('input', f).forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') i.blur(); }));
  };
  const renderAll = () => { renderSeg(); renderCats(); renderFields(); renderAmount(); };

  const press = k => {
    vibrate();
    let e = st.expr;
    const lastNum = e.split(/[+−]/).pop();
    if (/^\d$/.test(k) || k === '00') {
      if (e.length >= 18) return;
      if (lastNum.includes('.') && lastNum.split('.')[1].length >= 2) return;
      if (lastNum === '0') { if (k === '0' || k === '00') return; e = e.slice(0, -1); }
      if (lastNum === '' && k === '00') k = '0';
      e += k;
    } else if (k === '.') { if (lastNum.includes('.')) return; e += lastNum === '' ? '0.' : '.'; }
    else if (k === '+' || k === '−') { if (!e) return; if (/[+−]$/.test(e)) e = e.slice(0, -1); e += k; }
    else if (k === 'del') e = e.slice(0, -1);
    else if (k === 'clear') e = '';
    else if (k === 'ok') return doSave();
    st.expr = e; renderAmount();
  };
  $$('.key', el).forEach(b => {
    let t = null, longp = false;
    b.addEventListener('pointerdown', ev => { ev.preventDefault(); longp = false; if (b.dataset.k === 'del') t = setTimeout(() => { longp = true; press('clear'); }, 550); });
    b.addEventListener('pointerup', ev => { ev.preventDefault(); clearTimeout(t); if (!longp) press(b.dataset.k); });
    b.addEventListener('pointerleave', () => clearTimeout(t));
    b.addEventListener('contextmenu', ev => ev.preventDefault());
  });
  $$('.seg button', el).forEach(b => b.onclick = () => {
    if (st.type === b.dataset.t) return;
    st.type = b.dataset.t;
    if (st.type !== 'transfer') { const c = catById(st.catId); if (!c || c.type !== st.type) st.catId = defaultCatFor(st.type); }
    else fixTo();
    renderAll();
  });
  $$('.e-tpl', el).forEach(b => b.onclick = () => {
    const t = S.templates.find(x => x.id === b.dataset.id); if (!t) return;
    Object.assign(st, { type: t.type, expr: String(t.amount), catId: t.catId, accountId: acctById(t.accountId) ? t.accountId : st.accountId, toAccountId: t.toAccountId || st.toAccountId, note: t.note || '' });
    if (st.type === 'transfer') fixTo();
    $$('.e-tpl', el).forEach(x => x.classList.toggle('on', x === b));
    renderAll();
  });

  async function doSave() {
    const amount = evalExpr(st.expr);
    if (!(amount > 0)) { toast('請輸入金額'); const a = el.querySelector('.amount-box'); a.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 250 }); return; }
    const tr = st.type === 'transfer';
    if (tr && (!st.accountId || !st.toAccountId || st.accountId === st.toAccountId)) { toast('請選擇不同的轉出與轉入帳戶'); return; }
    if (!tr && !catById(st.catId)) { toast('請選擇分類'); return; }
    if (!st.accountId) { toast('請先新增帳戶'); return; }
    const before = budgetSpent(ymOf(st.date));
    const t = Object.assign({}, tx || {}, {
      id: tx?.id || uid(), type: st.type, amount, catId: tr ? null : st.catId, accountId: st.accountId,
      toAccountId: tr ? st.toAccountId : null, fee: tr ? round2(parseFloat(st.fee) || 0) : 0,
      date: st.date || today(), time: st.time || '', note: st.note.trim(),
      tags: st.tags.split(/[\s,，#]+/).map(s => s.trim()).filter(Boolean),
      createdAt: tx?.createdAt || Date.now(), updatedAt: Date.now(),
    });
    if (editing) { const i = S.tx.findIndex(x => x.id === t.id); if (i >= 0) S.tx[i] = t; else S.tx.push(t); } else S.tx.push(t);
    await DB.putTx(t);
    if (!tr) { S.settings.lastCat = S.settings.lastCat || {}; S.settings.lastCat[st.type] = st.catId; }
    S.settings.lastAccount = st.accountId; save('settings');
    close(); refreshAll();
    if (editing) toast('已更新');
    else toast(`已記錄 ${txTitle(t)} ${money(amount)}`, { action: '復原', fn: () => deleteTxSilent(t.id) });
    budgetWarn(t, before);
  }
  const onKey = e => {
    if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const map = { '-': '−', '+': '+', '.': '.', Backspace: 'del', Enter: 'ok', Escape: 'esc' };
    const k = /^\d$/.test(e.key) ? e.key : map[e.key];
    if (!k) return; e.preventDefault();
    if (k === 'esc') close(); else press(k);
  };
  document.addEventListener('keydown', onKey);
  cleanupEntryKeys = () => { document.removeEventListener('keydown', onKey); cleanupEntryKeys = null; };
  const close = openOverlay(el, { backdropClose: false, onClose: () => cleanupEntryKeys && cleanupEntryKeys() });
  el.querySelector('.e-cancel').onclick = close;
  if (editing) el.querySelector('.e-del').onclick = async () => { if (await ask('刪除這筆記錄？', `${txTitle(tx)} ${money(tx.amount)}`, '刪除', true)) { close(); deleteTx(tx.id); } };
  else el.querySelector('.e-save').onclick = doSave;
  renderAll();
  return el;
}
var cleanupEntryKeys = null;

async function quickLog(tpl) {
  const acct = acctById(tpl.accountId) ? tpl.accountId : (S.settings.defaultAccount || visibleAccounts()[0]?.id);
  if (tpl.type !== 'transfer' && !catById(tpl.catId)) { toast('範本的分類已不存在，請編輯範本'); return; }
  const t = { id: uid(), type: tpl.type, amount: round2(tpl.amount), catId: tpl.type === 'transfer' ? null : tpl.catId, accountId: acct, toAccountId: tpl.toAccountId || null, fee: 0, date: today(), time: nowTime(), note: tpl.note || '', tags: [], createdAt: Date.now() };
  const before = budgetSpent(ymOf(t.date));
  await addTx(t); vibrate();
  toast(`已記錄 ${tpl.name} ${money(tpl.amount)}`, { action: '復原', fn: () => deleteTxSilent(t.id) });
  budgetWarn(t, before);
}

/* ---------- root views ---------- */
const UI = { tab: 'home', homeMonth: ymOf(today()), repMode: 'month', repMonth: ymOf(today()), repYear: new Date().getFullYear(), repType: 'expense' };
const VIEWS = {};
function viewEl(name) {
  let v = document.getElementById('view-' + name);
  if (!v) { v = h(`<div class="view" id="view-${name}"></div>`); $('#views').appendChild(v); }
  return v;
}
function renderView(name) {
  const v = viewEl(name);
  const oldC = v.querySelector('.content'); const sc = oldC ? oldC.scrollTop : 0;
  VIEWS[name](v);
  const c = v.querySelector('.content'); if (c) c.scrollTop = sc;
  cleanupCharts();
}
function switchTab(name) {
  UI.tab = name;
  $$('#tabbar .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  Object.keys(VIEWS).forEach(n => { const v = document.getElementById('view-' + n); if (v) v.hidden = n !== name; });
  renderView(name);
  viewEl(name).hidden = false;
  while (pageStack.length) popPage();
}
function refreshAll() {
  renderView(UI.tab);
  pageStack.forEach(p => p.refresh());
}
function monthSwitchHTML(ym, cls) {
  return `<div class="month-switch"><button class="icon-btn ${cls}-prev" aria-label="上個月">${ICONS.left}</button><label class="ms-label" style="position:relative">${ymLabel(ym)}<input type="month" class="${cls}-pick" value="${ym}" style="position:absolute;inset:0;opacity:0;width:100%"></label><button class="icon-btn ${cls}-next" aria-label="下個月">${ICONS.right}</button></div>`;
}
function bindMonthSwitch(root, cls, get, set) {
  root.querySelector(`.${cls}-prev`).onclick = () => set(addMonths(get(), -1));
  root.querySelector(`.${cls}-next`).onclick = () => set(addMonths(get(), 1));
  root.querySelector(`.${cls}-pick`).onchange = e => { if (e.target.value) set(e.target.value); };
}

function needBackupReminder() {
  const d = Number(S.settings.backupDays) || 0;
  if (!d || S.tx.length < 1) return 0;
  if (S.settings.backupSnooze === today()) return 0;
  const since = S.settings.lastBackup ? S.settings.lastBackup.slice(0, 10) : (S.settings.installedAt || today());
  const n = daysBetween(since, today());
  return n >= d ? n : 0;
}

VIEWS.home = v => {
  const ym = UI.homeMonth; const [f, t] = monthRange(ym); const list = txInRange(f, t);
  const exp = sumBy(list, 'expense'), inc = sumBy(list, 'income');
  const isCur = ym === ymOf(today());
  const todayExp = sumBy(S.tx.filter(x => x.date === today()), 'expense');
  const tb = Number(S.budget.total) || 0;
  let budgetHTML = '';
  if (tb > 0) {
    const rem = round2(tb - exp), pct = Math.min(100, exp / tb * 100);
    const [y, m] = ym.split('-').map(Number);
    const daysLeft = isCur ? daysInMonth(y, m) - new Date().getDate() + 1 : 0;
    budgetHTML = `<button class="budget-mini h-budget" style="display:block;width:100%;text-align:left;color:inherit"><div class="bm-top"><span>${rem >= 0 ? '剩餘預算' : '已超支'} <b>${money(Math.abs(rem))}</b></span><span>${isCur && rem > 0 ? `每日可花 ${money(Math.floor(rem / daysLeft))}` : `預算 ${money(tb)}`}</span></div><div class="bar ${exp > tb ? 'over' : pct >= 80 ? 'warn' : ''}"><i style="width:${pct}%"></i></div></button>`;
  } else budgetHTML = `<button class="budget-mini h-budget" style="display:block;width:100%;text-align:left;color:inherit"><div class="bm-top" style="margin:0"><span>尚未設定每月預算</span><span>設定 ›</span></div></button>`;
  const remind = needBackupReminder();
  v.innerHTML = `<header class="topbar"><div class="tb-left"><button class="icon-btn h-search" aria-label="搜尋">${ICONS.search}</button></div>${monthSwitchHTML(ym, 'hm')}<div class="tb-right"><button class="text-btn h-cur" ${isCur ? 'style="visibility:hidden"' : ''}>本月</button></div></header>
  <div class="content">
    <div class="summary">
      <div class="s-label">${isCur ? '本月支出' : ymLabel(ym) + ' 支出'}</div>
      <div class="s-big num">${money(exp)}</div>
      <div class="s-row">
        ${isCur ? `<div class="s-cell"><span class="s-label">今日支出</span><b class="num">${money(todayExp)}</b></div>` : ''}
        <div class="s-cell"><span class="s-label">收入</span><b class="num">${money(inc)}</b></div>
        <div class="s-cell"><span class="s-label">結餘</span><b class="num">${money(inc - exp)}</b></div>
      </div>
      ${budgetHTML}
    </div>
    ${remind ? `<div class="banner"><span class="b-ico">💾</span><span class="b-txt">已 ${remind} 天未備份。iPhone 可能清除久未使用的 App 資料，建議立即備份。</span><button class="b-act h-backup">備份</button><button class="b-x h-snooze" aria-label="稍後">×</button></div>` : ''}
    <div class="section-title" style="margin-top:4px"><span>⚡ 快速記一筆</span><button class="text-btn small h-tpl-manage" style="font-size:13px;padding:0">管理</button></div>
    <div class="chips">${S.templates.map(tp => `<button class="chip h-tpl" data-id="${tp.id}">${esc(tp.type === 'transfer' ? '🔁' : (catById(tp.catId) || {}).icon || '⭐')} ${esc(tp.name)} <span class="c-amt">${money(tp.amount)}</span></button>`).join('')}<button class="chip add h-tpl-add">＋ 範本</button></div>
    <div class="h-list">${dayGroupsHTML(list)}</div>
  </div>`;
  bindMonthSwitch(v, 'hm', () => UI.homeMonth, x => { UI.homeMonth = x; renderView('home'); v.querySelector('.content').scrollTop = 0; });
  v.querySelector('.h-cur').onclick = () => { UI.homeMonth = ymOf(today()); renderView('home'); };
  v.querySelector('.h-search').onclick = () => openSearch();
  v.querySelector('.h-budget').onclick = () => openBudget(ym);
  v.querySelector('.h-tpl-manage').onclick = () => openTemplates();
  v.querySelector('.h-tpl-add').onclick = () => editTemplate(null);
  if (remind) { v.querySelector('.h-backup').onclick = () => exportJSON(); v.querySelector('.h-snooze').onclick = () => { S.settings.backupSnooze = today(); save('settings'); renderView('home'); }; }
  $$('.h-tpl', v).forEach(b => {
    let timer = null, lp = false;
    b.addEventListener('pointerdown', () => { lp = false; timer = setTimeout(async () => { lp = true; vibrate(); const tp = S.templates.find(x => x.id === b.dataset.id); if (!tp) return; const i = await actionSheet(tp.name, money(tp.amount), [{ text: '修改後記錄' }, { text: '編輯範本' }, { text: '刪除範本', danger: true }]); if (i === 0) openEntry({ preset: { type: tp.type, expr: String(tp.amount), catId: tp.catId, accountId: acctById(tp.accountId) ? tp.accountId : undefined, toAccountId: tp.toAccountId, note: tp.note || '' } }); else if (i === 1) editTemplate(tp); else if (i === 2) { S.templates = S.templates.filter(x => x !== tp); save('templates'); refreshAll(); } }, 520); });
    b.addEventListener('pointerup', () => { clearTimeout(timer); if (!lp) { const tp = S.templates.find(x => x.id === b.dataset.id); tp && quickLog(tp); } });
    b.addEventListener('pointerleave', () => clearTimeout(timer));
    b.addEventListener('pointercancel', () => { clearTimeout(timer); lp = true; });
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  bindTxRows(v);
};

/* ---------- reports ---------- */
function reportRange() {
  if (UI.repMode === 'month') { const [f, t] = monthRange(UI.repMonth); return { f, t, label: ymLabel(UI.repMonth) }; }
  return { f: `${UI.repYear}-01-01`, t: `${UI.repYear}-12-31`, label: `${UI.repYear}年` };
}
function groupByParent(list, type) {
  const m = new Map();
  list.forEach(x => { if (x.type !== type) return; const p = parentOf(catById(x.catId)); const k = p ? p.id : '_none'; m.set(k, (m.get(k) || 0) + x.amount); });
  return [...m.entries()].map(([id, v]) => ({ id, v: round2(v), c: catById(id) || { name: '未分類', icon: '❔', color: '#94a3b8' } })).sort((a, b) => b.v - a.v);
}
function doughnutCfg(items, total) {
  const cc = chartColors();
  return {
    type: 'doughnut',
    data: { labels: items.map(i => i.c.name), datasets: [{ data: items.map(i => i.v), backgroundColor: items.map((i, k) => i.c.color || PALETTE[k % PALETTE.length]), borderColor: cc.card, borderWidth: 2, hoverOffset: 6 }] },
    options: { maintainAspectRatio: false, cutout: '64%', animation: { duration: 500 }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label} ${money(ctx.raw)} (${total ? (ctx.raw / total * 100).toFixed(1) : 0}%)` } } } },
  };
}
function rankHTML(items, total, cls = 'rk') {
  return items.map(i => `<button class="rank ${cls}" data-id="${i.id}"><div class="tx-ico" style="background:${(i.c.color || '#94a3b8')}22">${esc(i.c.icon)}</div><div class="r-main"><div class="r-top"><span>${esc(i.c.name)}<span class="r-pct">${total ? (i.v / total * 100).toFixed(1) : 0}%</span></span><span class="num">${money(i.v)}</span></div><div class="bar"><i style="width:${total ? i.v / total * 100 : 0}%;background:${i.c.color || 'var(--accent)'}"></i></div></div><span class="chev muted">›</span></button>`).join('');
}
VIEWS.reports = v => {
  const { f, t, label } = reportRange();
  const list = txInRange(f, t);
  const exp = sumBy(list, 'expense'), inc = sumBy(list, 'income');
  const type = UI.repType; const items = groupByParent(list, type); const total = type === 'expense' ? exp : inc;
  const isM = UI.repMode === 'month';
  v.innerHTML = `<header class="topbar"><div class="tb-left"></div>${isM ? monthSwitchHTML(UI.repMonth, 'rm') : `<div class="month-switch"><button class="icon-btn ry-prev">${ICONS.left}</button><span class="ms-label">${UI.repYear}年</span><button class="icon-btn ry-next">${ICONS.right}</button></div>`}<div class="tb-right"></div></header>
  <div class="content">
    <div class="seg block" style="margin-bottom:10px"><button class="r-mode ${isM ? 'on' : ''}" data-m="month">月報</button><button class="r-mode ${!isM ? 'on' : ''}" data-m="year">年報</button></div>
    <div class="stat3" style="margin-bottom:12px"><div class="st"><div class="st-l">收入</div><div class="st-v income num">${money(inc)}</div></div><div class="st"><div class="st-l">支出</div><div class="st-v expense num">${money(exp)}</div></div><div class="st"><div class="st-l">結餘</div><div class="st-v num">${money(inc - exp)}</div></div></div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>${label} 分類占比</b><div class="seg"><button class="r-type ${type === 'expense' ? 'on' : ''}" data-t="expense">支出</button><button class="r-type ${type === 'income' ? 'on' : ''}" data-t="income">收入</button></div></div>
      ${items.length ? `<div class="chart-wrap"><canvas id="c-pie"></canvas><div class="chart-center"><span class="cc-l">總${type === 'expense' ? '支出' : '收入'}</span><span class="cc-v num">${money(total)}</span></div></div><div style="margin-top:6px">${rankHTML(items, total)}</div>` : `<div class="empty" style="padding:30px"><div class="e-ico">📊</div>此期間沒有${type === 'expense' ? '支出' : '收入'}記錄</div>`}
    </div>
    <div class="card"><b>${isM ? '近 12 個月收支趨勢' : UI.repYear + '年 每月收支'}</b><div class="chart-wrap tall" style="margin-top:8px"><canvas id="c-trend"></canvas></div></div>
    ${isM ? `<div class="card"><b>${label} 每日支出</b><div class="chart-wrap" style="height:180px;margin-top:8px"><canvas id="c-daily"></canvas></div></div>` : ''}
  </div>`;
  if (isM) bindMonthSwitch(v, 'rm', () => UI.repMonth, x => { UI.repMonth = x; renderView('reports'); });
  else { v.querySelector('.ry-prev').onclick = () => { UI.repYear--; renderView('reports'); }; v.querySelector('.ry-next').onclick = () => { UI.repYear++; renderView('reports'); }; }
  $$('.r-mode', v).forEach(b => b.onclick = () => { UI.repMode = b.dataset.m; if (UI.repMode === 'year') UI.repYear = Number(UI.repMonth.slice(0, 4)); renderView('reports'); });
  $$('.r-type', v).forEach(b => b.onclick = () => { UI.repType = b.dataset.t; renderView('reports'); });
  $$('.rk', v).forEach(b => b.onclick = () => openDrill(b.dataset.id, f, t, label, type));
  if (items.length) {
    const cfg = doughnutCfg(items, total);
    cfg.options.onClick = (e, els) => { if (els.length) openDrill(items[els[0].index].id, f, t, label, type); };
    makeChart(v.querySelector('#c-pie'), cfg);
  }
  // trend
  const months = isM ? Array.from({ length: 12 }, (_, i) => addMonths(UI.repMonth, i - 11)) : Array.from({ length: 12 }, (_, i) => `${UI.repYear}-${pad(i + 1)}`);
  const mE = [], mI = [];
  months.forEach(m => { const [a, b] = monthRange(m); const l = txInRange(a, b); mE.push(sumBy(l, 'expense')); mI.push(sumBy(l, 'income')); });
  const cc = chartColors();
  const axis = { grid: { color: cc.grid }, ticks: { callback: v2 => v2 >= 10000 ? (v2 / 10000) + '萬' : v2 } };
  const trend = makeChart(v.querySelector('#c-trend'), {
    data: { labels: months.map(m => Number(m.slice(5)) + '月'), datasets: [
      { type: 'bar', label: '收入', data: mI, backgroundColor: cc.inc, borderRadius: 4, maxBarThickness: 14 },
      { type: 'bar', label: '支出', data: mE, backgroundColor: cc.exp, borderRadius: 4, maxBarThickness: 14 },
      { type: 'line', label: '結餘', data: mI.map((x, i) => round2(x - mE[i])), borderColor: '#3b82f6', backgroundColor: '#3b82f6', tension: .35, pointRadius: 2, borderWidth: 2 },
    ] },
    options: { onClick: (e, els) => { if (isM && els.length) { UI.repMonth = months[els[0].index]; renderView('reports'); } }, maintainAspectRatio: false, animation: { duration: 400 }, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { boxWidth: 10, boxHeight: 10 } }, tooltip: { callbacks: { label: c => ` ${c.dataset.label} ${money(c.raw)}` } } }, scales: { x: { grid: { display: false } }, y: axis } },
  });
  if (isM) {
    const [y, m] = UI.repMonth.split('-').map(Number); const n = daysInMonth(y, m); const d = Array(n).fill(0);
    list.forEach(x => { if (x.type === 'expense') d[Number(x.date.slice(8)) - 1] += x.amount; });
    makeChart(v.querySelector('#c-daily'), { type: 'bar', data: { labels: d.map((_, i) => i + 1), datasets: [{ label: '支出', data: d.map(round2), backgroundColor: cc.exp, borderRadius: 3 }] }, options: { maintainAspectRatio: false, animation: { duration: 400 }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: c => `${m}月${c[0].label}日`, label: c => ` 支出 ${money(c.raw)}` } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: axis } } });
  }
};
function openDrill(pid, f, t, label, type) {
  const p = catById(pid); let sel = null;
  pushPage({
    title: p ? `${p.icon} ${p.name}` : '未分類',
    render(c) {
      const all = txInRange(f, t).filter(x => x.type === type && (pid === '_none' ? !parentOf(catById(x.catId)) : (parentOf(catById(x.catId)) || {}).id === pid));
      const total = sumBy(all, type);
      const m = new Map();
      all.forEach(x => { const k = x.catId; m.set(k, (m.get(k) || 0) + x.amount); });
      const items = [...m.entries()].map(([id, v], k) => { const cc = catById(id) || { name: '未分類', icon: '❔' }; return { id, v: round2(v), c: { ...cc, name: cc.id === pid ? `${cc.name}（不分類）` : cc.name, color: PALETTE[(k + 3) % PALETTE.length] } }; }).sort((a, b) => b.v - a.v);
      const shown = sel ? all.filter(x => x.catId === sel) : all;
      c.innerHTML = `<div class="card"><div class="muted small">${label} · 共 ${all.length} 筆</div>
        <div class="chart-wrap" style="height:200px"><canvas class="d-pie"></canvas><div class="chart-center"><span class="cc-l">合計</span><span class="cc-v num">${money(total)}</span></div></div>
        <div>${rankHTML(items, total, 'dk')}</div></div>
        <div class="section-title"><span>${sel ? esc((catById(sel) || {}).name || '') + ' 明細' : '全部明細'}</span>${sel ? '<button class="text-btn d-all" style="font-size:13px;padding:0">顯示全部</button>' : ''}</div>
        ${dayGroupsHTML(shown, { emptyText: '沒有記錄' })}`;
      if (items.length) makeChart(c.querySelector('.d-pie'), doughnutCfg(items, total));
      $$('.dk', c).forEach(b => b.onclick = () => { sel = sel === b.dataset.id ? null : b.dataset.id; this.render(c); });
      const da = c.querySelector('.d-all'); if (da) da.onclick = () => { sel = null; this.render(c); };
      bindTxRows(c);
    },
  });
}

/* ---------- accounts ---------- */
const LIABILITY = a => a.type === 'credit';
VIEWS.accounts = v => {
  const list = S.accounts.slice().sort((a, b) => a.order - b.order);
  let assets = 0, debts = 0;
  const rows = list.map(a => {
    const b = accountBalance(a.id);
    if (!a.hidden) { if (b >= 0) assets += b; else debts += b; }
    return `<button class="cell a-row" data-id="${a.id}"><span class="c-ico">${esc(a.icon)}</span><span class="c-main">${esc(a.name)}${a.hidden ? '<span class="pill">已隱藏</span>' : ''}<div class="c-sub">${ACCOUNT_TYPES[a.type] || '其他'}</div></span><span class="c-val num ${b < 0 ? 'expense' : ''}" style="color:${b < 0 ? 'var(--expense)' : 'var(--text)'};font-weight:600">${money(b)}</span><span class="chev">›</span></button>`;
  }).join('');
  v.innerHTML = `<header class="topbar"><div class="tb-left"></div><h1>帳戶</h1><div class="tb-right"><button class="icon-btn a-add" aria-label="新增帳戶">${ICONS.plus}</button></div></header>
  <div class="content">
    <div class="summary"><div class="s-label">淨資產</div><div class="s-big num">${money(assets + debts)}</div>
      <div class="s-row"><div class="s-cell"><span class="s-label">資產</span><b class="num">${money(assets)}</b></div><div class="s-cell"><span class="s-label">負債</span><b class="num">${money(debts)}</b></div></div></div>
    <div class="cells">${rows || '<div class="empty">尚無帳戶</div>'}</div>
    <button class="btn secondary a-transfer">🔁 帳戶間轉帳</button>
    <p class="muted small" style="padding:0 6px">提示：點帳戶可查看明細、調整餘額。信用卡消費記為支出，繳卡費請用「轉帳」從銀行轉到信用卡。</p>
  </div>`;
  v.querySelector('.a-add').onclick = () => editAccount(null);
  v.querySelector('.a-transfer').onclick = () => openEntry({ type: 'transfer' });
  $$('.a-row', v).forEach(b => b.onclick = () => openAccount(b.dataset.id));
};
function openAccount(id) {
  let ym = ymOf(today());
  pushPage({
    title: (acctById(id) || {}).name || '帳戶',
    render(c, page) {
      const a = acctById(id); if (!a) { c.innerHTML = '<div class="empty">帳戶已刪除</div>'; return; }
      page.setTitle(`${a.icon} ${a.name}`);
      page.right.innerHTML = '<button class="text-btn ap-edit">編輯</button>';
      page.right.querySelector('.ap-edit').onclick = () => editAccount(a);
      const [f, t] = monthRange(ym);
      const list = txInRange(f, t).filter(x => x.accountId === id || x.toAccountId === id);
      let inflow = 0, outflow = 0;
      list.forEach(x => { if (x.type === 'income' || (x.type === 'transfer' && x.toAccountId === id)) inflow += x.amount; else outflow += x.amount + (x.type === 'transfer' ? (Number(x.fee) || 0) : 0); });
      c.innerHTML = `<div class="summary"><div class="s-label">目前餘額</div><div class="s-big num">${money(accountBalance(id))}</div><div class="s-row"><div class="s-cell"><span class="s-label">${ymLabel(ym)} 流入</span><b class="num">${money(inflow)}</b></div><div class="s-cell"><span class="s-label">流出</span><b class="num">${money(outflow)}</b></div><div class="s-cell"><span class="s-label">月底餘額</span><b class="num">${money(accountBalance(id, t))}</b></div></div></div>
        <div class="card" style="padding:4px 8px">${monthSwitchHTML(ym, 'am')}</div>
        ${dayGroupsHTML(list, { emptyText: '這個月沒有此帳戶的記錄' })}`;
      bindMonthSwitch(c, 'am', () => ym, x => { ym = x; page.refresh(); });
      bindTxRows(c);
    },
  });
}
function editAccount(a) {
  const isNew = !a;
  openForm({
    title: isNew ? '新增帳戶' : '編輯帳戶',
    fields: [
      { key: 'icon', label: '圖示', type: 'emoji', value: a?.icon || '💰' },
      { key: 'name', label: '名稱', value: a?.name || '', placeholder: '例如：玉山銀行' },
      { key: 'type', label: '類型', type: 'select', value: a?.type || 'bank', options: Object.entries(ACCOUNT_TYPES).map(([value, label]) => ({ value, label })) },
      { key: 'balance', label: isNew ? '初始餘額' : '目前餘額', type: 'number', value: a ? accountBalance(a.id) : '' },
      { key: 'hidden', label: '隱藏帳戶', type: 'toggle', value: !!a?.hidden },
    ],
    async onSave(v) {
      if (!v.name) { toast('請輸入名稱'); return false; }
      const bal = Number(v.balance) || 0;
      if (isNew) S.accounts.push({ id: uid(), name: v.name, icon: v.icon || '💰', type: v.type, initial: round2(bal), order: S.accounts.length, hidden: v.hidden });
      else { const cur = accountBalance(a.id); Object.assign(a, { name: v.name, icon: v.icon || a.icon, type: v.type, hidden: v.hidden, initial: round2((Number(a.initial) || 0) + bal - cur) }); }
      await save('accounts'); refreshAll(); toast(isNew ? '已新增帳戶' : '已更新帳戶');
    },
    onDelete: isNew ? null : async () => {
      const used = S.tx.some(t => t.accountId === a.id || t.toAccountId === a.id);
      if (used) { toast('此帳戶已有記錄，無法刪除；可改為「隱藏帳戶」'); return false; }
      if (!(await ask('刪除帳戶？', a.name, '刪除', true))) return false;
      S.accounts = S.accounts.filter(x => x !== a); await save('accounts');
      if (pageStack.length) popPage();
      refreshAll();
    },
  });
}

/* ---------- budget page ---------- */
function openBudget(startYm) {
  let ym = startYm || ymOf(today());
  pushPage({
    title: '預算',
    render(c, page) {
      const sp = budgetSpent(ym); const tb = Number(S.budget.total) || 0;
      const isCur = ym === ymOf(today());
      const [y, m] = ym.split('-').map(Number); const dim = daysInMonth(y, m);
      const daysLeft = isCur ? dim - new Date().getDate() + 1 : (ym > ymOf(today()) ? dim : 0);
      const rem = round2(tb - sp.total); const pct = tb ? sp.total / tb * 100 : 0;
      const cls = p => p > 100 ? 'over' : p >= 80 ? 'warn' : '';
      const catBud = S.budget.cats || {};
      const ps = parents('expense');
      const catSum = round2(ps.reduce((s, p) => s + (Number(catBud[p.id]) || 0), 0));
      c.innerHTML = `<div class="card" style="padding:4px 8px">${monthSwitchHTML(ym, 'bm')}</div>
        <div class="card big-bud">
          <div style="display:flex;justify-content:space-between;align-items:center"><span class="muted">每月總預算</span><button class="bt-set b-total" style="color:var(--accent2);font-size:14px;padding:4px 10px;background:var(--accent-soft);border-radius:8px">${tb ? '修改' : '設定'}</button></div>
          <div class="bb-num num">${tb ? money(tb) : '未設定'}</div>
          ${tb ? `<div class="bar ${cls(pct)}" style="height:12px;border-radius:6px;margin-top:8px"><i style="width:${Math.min(100, pct)}%"></i></div>
          <div class="ring-row"><div>已花費<b class="num">${money(sp.total)}</b></div><div style="text-align:center">${rem >= 0 ? '剩餘' : '<span class="expense">超支</span>'}<b class="num ${rem < 0 ? 'expense' : ''}">${money(Math.abs(rem))}</b></div><div style="text-align:right">每日可花<b class="num">${daysLeft && rem > 0 ? money(Math.floor(rem / daysLeft)) : '—'}</b></div></div>
          ${rem < 0 ? `<div class="banner" style="margin:12px 0 0;background:rgba(239,68,68,.12)"><span class="b-ico">⚠️</span><span class="b-txt">本月已超出預算 ${money(-rem)}，請注意支出！</span></div>` : pct >= 80 ? `<div class="banner" style="margin:12px 0 0"><span class="b-ico">⚠️</span><span class="b-txt">已使用 ${Math.round(pct)}% 預算</span></div>` : ''}` : '<div class="muted small" style="margin-top:6px">設定每月總預算，首頁會顯示剩餘金額與每日可花費。</div>'}
        </div>
        <div class="section-title"><span>分類預算</span><span>${catSum ? '分類合計 ' + money(catSum) : ''}</span></div>
        <div class="card">${ps.map(p => {
          const b = Number(catBud[p.id]) || 0; const s = round2(sp.byP[p.id] || 0); const pp = b ? s / b * 100 : 0;
          return `<div class="bud-item"><div class="bud-top"><span class="tx-ico" style="background:${p.color}22">${esc(p.icon)}</span><span class="bt-name">${esc(p.name)}</span><span class="num muted small">${money(s)}${b ? ' / ' + money(b) : ''}</span><button class="bt-set b-cat" data-id="${p.id}">${b ? '修改' : '設定'}</button></div>
          ${b ? `<div class="bar ${cls(pp)}"><i style="width:${Math.min(100, pp)}%"></i></div><div class="bud-foot"><span>${Math.round(pp)}%</span>${s > b ? `<span class="over">⚠️ 超支 ${money(s - b)}</span>` : `<span>剩 ${money(b - s)}</span>`}</div>` : ''}</div>`;
        }).join('')}</div>
        <p class="muted small" style="padding:0 6px">預算每月套用相同金額；記帳時若超出預算會跳出提醒。</p>`;
      bindMonthSwitch(c, 'bm', () => ym, x => { ym = x; page.refresh(); });
      c.querySelector('.b-total').onclick = () => setBudgetForm('每月總預算', tb, v => { S.budget.total = v; });
      $$('.b-cat', c).forEach(b => b.onclick = () => { const p = catById(b.dataset.id); setBudgetForm(`${p.icon} ${p.name} 預算`, catBud[p.id], v => { S.budget.cats = S.budget.cats || {}; if (v) S.budget.cats[p.id] = v; else delete S.budget.cats[p.id]; }); });
    },
  });
}
function setBudgetForm(title, val, apply) {
  openForm({
    title, fields: [{ key: 'amt', label: '每月金額', type: 'number', value: val || '', placeholder: '輸入 0 或留空＝不設定' }],
    async onSave(v) { const n = round2(v.amt || 0); if (n < 0) { toast('金額不可為負'); return false; } apply(n); await save('budget'); refreshAll(); toast(n ? '預算已設定' : '已取消預算'); },
  });
  setTimeout(() => { const i = $('#overlay-root [data-k="amt"]'); i && i.focus(); }, 350);
}

/* ---------- category <select> helpers ---------- */
function catOptions(includeTransfer = true, includeAllOpt = false) {
  const o = [];
  if (includeAllOpt) o.push({ value: '', label: '全部分類' });
  ['expense', 'income'].forEach(type => parents(type).forEach(p => o.push({ group: `${type === 'expense' ? '支出' : '收入'} · ${p.name}`, items: [{ value: p.id, label: `${p.icon} ${p.name}${includeAllOpt ? '（全部）' : '（不分類）'}` }, ...subsOf(p.id).map(s => ({ value: s.id, label: `${s.icon} ${s.name}` }))] })));
  if (includeTransfer) o.push({ group: '轉帳', items: [{ value: '__transfer', label: '🔁 轉帳' }] });
  return o;
}
const acctOpts = (withNone) => [...(withNone ? [{ value: '', label: withNone }] : []), ...S.accounts.map(a => ({ value: a.id, label: `${a.icon} ${a.name}` }))];

/* ---------- search ---------- */
function openSearch(preset = {}) {
  const q = Object.assign({ kw: '', type: '', cat: '', acct: '', from: '', to: '', min: '', max: '' }, preset);
  let results = [];
  pushPage({
    title: '搜尋與篩選',
    render(c, page) {
      if (!c.dataset.built) {
        c.dataset.built = '1';
        page.right.innerHTML = '<button class="text-btn s-export">匯出</button>';
        page.right.querySelector('.s-export').onclick = () => { if (!results.length) return toast('沒有可匯出的結果'); exportCSV(results, '搜尋結果'); };
        const opt = o => o.group ? `<optgroup label="${esc(o.group)}">${o.items.map(opt).join('')}</optgroup>` : `<option value="${esc(o.value)}">${esc(o.label)}</option>`;
        c.innerHTML = `<div class="search-box">${ICONS.search.replace('<svg', '<svg style="width:18px;height:18px;fill:var(--text2)"')}<input class="s-kw" type="search" placeholder="關鍵字（備註、分類、標籤、金額）" enterkeyhint="search"></div>
          <div class="filters">
            <select class="s-type"><option value="">全部類型</option><option value="expense">支出</option><option value="income">收入</option><option value="transfer">轉帳</option></select>
            <select class="s-acct">${acctOpts('全部帳戶').map(opt).join('')}</select>
            <select class="s-cat full">${catOptions(false, true).map(opt).join('')}</select>
            <input class="s-from" type="date" aria-label="開始日期"><input class="s-to" type="date" aria-label="結束日期">
            <input class="s-min" inputmode="decimal" placeholder="最低金額"><input class="s-max" inputmode="decimal" placeholder="最高金額">
          </div>
          <div class="chips s-quick"><button class="chip" data-r="month">本月</button><button class="chip" data-r="last">上月</button><button class="chip" data-r="3m">近 3 個月</button><button class="chip" data-r="year">今年</button><button class="chip" data-r="all">全部時間</button><button class="chip add" data-r="reset">清除條件</button></div>
          <div class="s-results"></div>`;
        const map = { kw: '.s-kw', type: '.s-type', cat: '.s-cat', acct: '.s-acct', from: '.s-from', to: '.s-to', min: '.s-min', max: '.s-max' };
        Object.entries(map).forEach(([k, sel]) => { const i = c.querySelector(sel); i.value = q[k]; i.addEventListener('input', () => { q[k] = i.value; update(); }); i.addEventListener('change', () => { q[k] = i.value; update(); }); });
        $$('.s-quick .chip', c).forEach(b => b.onclick = () => {
          const t = today(), ym = ymOf(t); const r = b.dataset.r;
          if (r === 'month') [q.from, q.to] = monthRange(ym);
          else if (r === 'last') [q.from, q.to] = monthRange(addMonths(ym, -1));
          else if (r === '3m') { q.from = monthRange(addMonths(ym, -2))[0]; q.to = t; }
          else if (r === 'year') { q.from = t.slice(0, 4) + '-01-01'; q.to = t.slice(0, 4) + '-12-31'; }
          else if (r === 'all') { q.from = ''; q.to = ''; }
          else Object.keys(q).forEach(k => q[k] = '');
          Object.entries(map).forEach(([k, sel]) => c.querySelector(sel).value = q[k]);
          update();
        });
        page.update = update;
      }
      function update() {
        const kw = q.kw.trim().toLowerCase();
        const min = q.min === '' ? null : Number(q.min), max = q.max === '' ? null : Number(q.max);
        const catSet = q.cat ? new Set([q.cat, ...subsOf(q.cat).map(s => s.id)]) : null;
        results = S.tx.filter(t => {
          if (q.type && t.type !== q.type) return false;
          if (q.acct && t.accountId !== q.acct && t.toAccountId !== q.acct) return false;
          if (catSet && !catSet.has(t.catId)) return false;
          if (q.from && t.date < q.from) return false;
          if (q.to && t.date > q.to) return false;
          if (min != null && !isNaN(min) && t.amount < min) return false;
          if (max != null && !isNaN(max) && t.amount > max) return false;
          if (kw) {
            const c2 = catById(t.catId), p = parentOf(c2);
            const hay = [t.note, ...(t.tags || []), c2?.name, p?.name, acctName(t.accountId), t.toAccountId ? acctName(t.toAccountId) : '', String(t.amount), t.type === 'transfer' ? '轉帳' : ''].join(' ').toLowerCase();
            if (!kw.split(/\s+/).every(w => hay.includes(w.replace(/^#/, '')))) return false;
          }
          return true;
        });
        const e = sumBy(results, 'expense'), i = sumBy(results, 'income');
        const box = c.querySelector('.s-results');
        box.innerHTML = `<div class="result-sum"><span>共 ${results.length} 筆</span><span>支出 <b class="expense">${money(e)}</b>　收入 <b class="income">${money(i)}</b></span></div>` + dayGroupsHTML(results.slice(0, 500), { emptyText: '找不到符合的記錄' }) + (results.length > 500 ? '<p class="muted small" style="text-align:center">僅顯示前 500 筆，請縮小範圍</p>' : '');
        bindTxRows(box);
      }
      if (page.update) page.update();
    },
  });
}

/* ---------- templates ---------- */
function openTemplates() {
  pushPage({
    title: '快速範本',
    render(c, page) {
      page.right.innerHTML = `<button class="icon-btn t-add">${ICONS.plus}</button>`;
      page.right.querySelector('.t-add').onclick = () => editTemplate(null);
      c.innerHTML = `<p class="muted small" style="padding:0 6px">在首頁點一下範本即可立即記一筆；長按可修改金額後再記。</p>
        <div class="cells">${S.templates.map((t, i) => `<div class="cell"><button class="t-row" data-id="${t.id}" style="display:flex;align-items:center;gap:12px;flex:1;text-align:left;min-width:0"><span class="c-ico">${esc(t.type === 'transfer' ? '🔁' : (catById(t.catId) || {}).icon || '⭐')}</span><span class="c-main">${esc(t.name)}<div class="c-sub">${t.type === 'transfer' ? `${esc(acctName(t.accountId))} → ${esc(acctName(t.toAccountId))}` : `${esc((catById(t.catId) || {}).name || '')} · ${esc(acctName(t.accountId))}`}</div></span><span class="c-val num ${t.type}">${money(t.amount)}</span></button><button class="icon-btn t-up" data-i="${i}" ${i === 0 ? 'style="visibility:hidden"' : ''} aria-label="上移" style="font-size:18px">↑</button></div>`).join('') || '<div class="empty">尚無範本</div>'}</div>
        <button class="btn secondary t-add2">＋ 新增範本</button>`;
      c.querySelector('.t-add2').onclick = () => editTemplate(null);
      $$('.t-row', c).forEach(b => b.onclick = () => editTemplate(S.templates.find(x => x.id === b.dataset.id)));
      $$('.t-up', c).forEach(b => b.onclick = () => { const i = Number(b.dataset.i); [S.templates[i - 1], S.templates[i]] = [S.templates[i], S.templates[i - 1]]; save('templates'); refreshAll(); });
    },
  });
}
function editTemplate(t) {
  const isNew = !t;
  const defCat = defaultCatFor('expense');
  const form = openForm({
    title: isNew ? '新增範本' : '編輯範本',
    fields: [
      { key: 'name', label: '名稱', value: t?.name || '', placeholder: '例如：早餐' },
      { key: 'amount', label: '金額', type: 'number', value: t?.amount ?? '' },
      { key: 'cat', label: '分類', type: 'select', value: t ? (t.type === 'transfer' ? '__transfer' : t.catId) : defCat, options: catOptions(true) },
      { key: 'acct', label: '帳戶', type: 'select', value: t?.accountId || S.settings.defaultAccount, options: acctOpts() },
      { key: 'to', label: '轉入帳戶', type: 'select', value: t?.toAccountId || '', options: acctOpts('（非轉帳免填）') },
      { key: 'note', label: '備註', value: t?.note || '' },
    ],
    async onSave(v) {
      const type = v.cat === '__transfer' ? 'transfer' : (catById(v.cat) || {}).type;
      if (!(v.amount > 0)) { toast('請輸入金額'); return false; }
      if (type === 'transfer' && (!v.to || v.to === v.acct)) { toast('轉帳請選擇不同的轉入帳戶'); return false; }
      const name = v.name || (type === 'transfer' ? '轉帳' : catById(v.cat).name);
      const o = { name, type, amount: round2(v.amount), catId: type === 'transfer' ? null : v.cat, accountId: v.acct, toAccountId: type === 'transfer' ? v.to : null, note: v.note };
      if (isNew) S.templates.push({ id: uid(), ...o }); else Object.assign(t, o);
      await save('templates'); refreshAll(); toast('範本已儲存');
    },
    onDelete: isNew ? null : async () => { S.templates = S.templates.filter(x => x !== t); await save('templates'); refreshAll(); toast('已刪除範本'); },
  });
  return form;
}

/* ---------- recurring ---------- */
const FREQ = { daily: '每天', weekly: '每週', monthly: '每月', yearly: '每年' };
function advanceDate(r) {
  const d = parseYMD(r.nextDate);
  if (r.freq === 'daily') d.setDate(d.getDate() + 1);
  else if (r.freq === 'weekly') d.setDate(d.getDate() + 7);
  else if (r.freq === 'monthly') { let y = d.getFullYear(), m = d.getMonth() + 2; if (m > 12) { m = 1; y++; } return `${y}-${pad(m)}-${pad(Math.min(r.day, daysInMonth(y, m)))}`; }
  else if (r.freq === 'yearly') { const y = d.getFullYear() + 1, m = d.getMonth() + 1; return `${y}-${pad(m)}-${pad(Math.min(r.day, daysInMonth(y, m)))}`; }
  return ymd(d);
}
async function runRecurring() {
  const t = today(); const created = [];
  for (const r of S.recurring) {
    if (!r.active || !r.nextDate) continue;
    let guard = 0;
    while (r.nextDate <= t && (!r.endDate || r.nextDate <= r.endDate) && guard++ < 500) {
      if (r.type === 'transfer' ? (acctById(r.accountId) && acctById(r.toAccountId)) : (catById(r.catId) && acctById(r.accountId))) {
        created.push({ id: uid(), type: r.type, amount: r.amount, catId: r.catId, accountId: r.accountId, toAccountId: r.toAccountId || null, fee: 0, date: r.nextDate, time: '08:00', note: r.note || r.name || '', tags: [], recurringId: r.id, createdAt: Date.now() });
      }
      r.nextDate = advanceDate(r);
    }
  }
  if (created.length) { S.tx.push(...created); for (const x of created) await DB.putTx(x); }
  await save('recurring');
  return created.length;
}
function openRecurring() {
  pushPage({
    title: '週期記帳',
    render(c, page) {
      page.right.innerHTML = `<button class="icon-btn r-add">${ICONS.plus}</button>`;
      page.right.querySelector('.r-add').onclick = () => editRecurring(null);
      c.innerHTML = `<p class="muted small" style="padding:0 6px">房租、訂閱、薪水等固定收支，到期時開啟 App 會自動新增記錄。</p>
        <div class="cells">${S.recurring.map(r => `<button class="cell rc-row" data-id="${r.id}"><span class="c-ico">${esc(r.type === 'transfer' ? '🔁' : (catById(r.catId) || {}).icon || '🔁')}</span><span class="c-main">${esc(r.name || (catById(r.catId) || {}).name || '轉帳')}${r.active ? '' : '<span class="pill">已暫停</span>'}<div class="c-sub">${FREQ[r.freq]}${r.freq === 'monthly' ? ` ${r.day} 日` : ''} · 下次 ${r.nextDate}${r.endDate ? ` · 至 ${r.endDate}` : ''}</div></span><span class="c-val num ${r.type}">${money(r.amount)}</span><span class="chev">›</span></button>`).join('') || '<div class="empty"><div class="e-ico">🔁</div>尚無週期記帳</div>'}</div>
        <button class="btn secondary r-add2">＋ 新增週期記帳</button>`;
      c.querySelector('.r-add2').onclick = () => editRecurring(null);
      $$('.rc-row', c).forEach(b => b.onclick = () => editRecurring(S.recurring.find(x => x.id === b.dataset.id)));
    },
  });
}
function editRecurring(r) {
  const isNew = !r;
  openForm({
    title: isNew ? '新增週期記帳' : '編輯週期記帳',
    fields: [
      { key: 'name', label: '名稱', value: r?.name || '', placeholder: '例如：房租、Netflix' },
      { key: 'amount', label: '金額', type: 'number', value: r?.amount ?? '' },
      { key: 'cat', label: '分類', type: 'select', value: r ? (r.type === 'transfer' ? '__transfer' : r.catId) : (S.categories.find(c => c.name === '房租') || {}).id, options: catOptions(true) },
      { key: 'acct', label: '帳戶', type: 'select', value: r?.accountId || S.settings.defaultAccount, options: acctOpts() },
      { key: 'to', label: '轉入帳戶', type: 'select', value: r?.toAccountId || '', options: acctOpts('（非轉帳免填）') },
      { key: 'freq', label: '頻率', type: 'select', value: r?.freq || 'monthly', options: Object.entries(FREQ).map(([value, label]) => ({ value, label })) },
      { key: 'start', label: isNew ? '開始日期' : '下次日期', type: 'date', value: r?.nextDate || today() },
      { key: 'end', label: '結束日期', type: 'date', value: r?.endDate || '' },
      { key: 'active', label: '啟用', type: 'toggle', value: r ? r.active : true },
    ],
    async onSave(v) {
      const type = v.cat === '__transfer' ? 'transfer' : (catById(v.cat) || {}).type;
      if (!(v.amount > 0)) { toast('請輸入金額'); return false; }
      if (!v.start) { toast('請選擇日期'); return false; }
      if (type === 'transfer' && (!v.to || v.to === v.acct)) { toast('轉帳請選擇不同的轉入帳戶'); return false; }
      const o = { name: v.name, type, amount: round2(v.amount), catId: type === 'transfer' ? null : v.cat, accountId: v.acct, toAccountId: type === 'transfer' ? v.to : null, freq: v.freq, nextDate: v.start, day: Number(v.start.slice(8)), endDate: v.end || null, active: v.active, note: v.name };
      if (isNew) S.recurring.push({ id: uid(), createdAt: Date.now(), ...o }); else Object.assign(r, o);
      const n = await runRecurring(); refreshAll();
      toast(n ? `已儲存，並自動新增 ${n} 筆到期記錄` : '已儲存週期記帳');
    },
    onDelete: isNew ? null : async () => { if (!(await ask('刪除這個週期記帳？', '已產生的記錄會保留', '刪除', true))) return false; S.recurring = S.recurring.filter(x => x !== r); await save('recurring'); refreshAll(); },
  });
}

/* ---------- categories ---------- */
function openCategories() {
  let type = 'expense';
  pushPage({
    title: '分類管理',
    render(c, page) {
      page.right.innerHTML = `<button class="icon-btn c-add" aria-label="新增主分類">${ICONS.plus}</button>`;
      page.right.querySelector('.c-add').onclick = () => editCategory(null, type, null);
      const count = id => S.tx.filter(t => t.catId === id).length;
      c.innerHTML = `<div class="seg block" style="margin-bottom:12px"><button class="c-t ${type === 'expense' ? 'on' : ''}" data-t="expense">支出分類</button><button class="c-t ${type === 'income' ? 'on' : ''}" data-t="income">收入分類</button></div>
        ${parents(type).map((p, i, arr) => `<div class="cells"><div class="cell"><button class="c-edit" data-id="${p.id}" style="display:flex;align-items:center;gap:12px;flex:1;text-align:left"><span class="c-ico" style="background:${p.color}22">${esc(p.icon)}</span><span class="c-main"><b>${esc(p.name)}</b><div class="c-sub">${subsOf(p.id).length} 個子分類 · ${count(p.id) + subsOf(p.id).reduce((s, x) => s + count(x.id), 0)} 筆</div></span></button><button class="icon-btn c-up" data-id="${p.id}" ${i === 0 ? 'style="visibility:hidden"' : ''} aria-label="上移">↑</button><button class="text-btn c-addsub" data-id="${p.id}" style="font-size:14px">＋子分類</button></div>
          ${subsOf(p.id).map(s => `<button class="cell indent c-edit" data-id="${s.id}"><span class="c-ico">${esc(s.icon)}</span><span class="c-main">${esc(s.name)}</span><span class="c-val small">${count(s.id)} 筆</span><span class="chev">›</span></button>`).join('')}</div>`).join('')}
        <button class="btn secondary c-add2">＋ 新增主分類</button>`;
      $$('.c-t', c).forEach(b => b.onclick = () => { type = b.dataset.t; page.refresh(); });
      c.querySelector('.c-add2').onclick = () => editCategory(null, type, null);
      $$('.c-edit', c).forEach(b => b.onclick = () => { const x = catById(b.dataset.id); editCategory(x, x.type, x.parentId); });
      $$('.c-addsub', c).forEach(b => b.onclick = () => editCategory(null, type, b.dataset.id));
      $$('.c-up', c).forEach(b => b.onclick = () => { const ps = parents(type); const i = ps.findIndex(x => x.id === b.dataset.id); if (i > 0) { const o = ps[i].order; ps[i].order = ps[i - 1].order; ps[i - 1].order = o; save('categories'); refreshAll(); } });
    },
  });
}
function editCategory(cat, type, parentId) {
  const isNew = !cat; const isParent = isNew ? !parentId : !cat.parentId;
  const par = parentId ? catById(parentId) : null;
  openForm({
    title: isNew ? (isParent ? '新增主分類' : `新增「${par.name}」子分類`) : '編輯分類',
    fields: [
      { key: 'icon', label: '圖示', type: 'emoji', value: cat?.icon || (isParent ? '📁' : '🔹') },
      { key: 'name', label: '名稱', value: cat?.name || '' },
      ...(isParent ? [{ key: 'color', label: '顏色', type: 'color', value: cat?.color || PALETTE[parents(type).length % PALETTE.length] }] : []),
    ],
    async onSave(v) {
      if (!v.name) { toast('請輸入名稱'); return false; }
      if (isNew) S.categories.push({ id: uid(), type, name: v.name, icon: v.icon || '🔹', color: isParent ? v.color : undefined, parentId: isParent ? null : parentId, order: Math.max(0, ...S.categories.map(c => c.order)) + 1 });
      else Object.assign(cat, { name: v.name, icon: v.icon || cat.icon, ...(isParent ? { color: v.color } : {}) });
      await save('categories'); refreshAll(); toast('分類已儲存');
    },
    onDelete: isNew ? null : async () => {
      let target;
      if (!isParent) target = catById(cat.parentId);
      else {
        const others = parents(type).filter(p => p.id !== cat.id);
        if (!others.length) { toast('至少需保留一個主分類'); return false; }
        target = others.find(p => p.name === '其他') || others[others.length - 1];
      }
      const ids = new Set([cat.id, ...(isParent ? subsOf(cat.id).map(s => s.id) : [])]);
      const n = S.tx.filter(t => ids.has(t.catId)).length;
      if (!(await ask(`刪除「${cat.name}」？`, n ? `${n} 筆記錄將移到「${target.name}」` : (isParent ? '其子分類也會一併刪除' : ''), '刪除', true))) return false;
      const changed = S.tx.filter(t => ids.has(t.catId));
      changed.forEach(t => t.catId = target.id);
      for (const t of changed) await DB.putTx(t);
      S.templates.forEach(t => { if (ids.has(t.catId)) t.catId = target.id; });
      S.recurring.forEach(t => { if (ids.has(t.catId)) t.catId = target.id; });
      if (S.budget.cats) ids.forEach(id => delete S.budget.cats[id]);
      S.categories = S.categories.filter(c => !ids.has(c.id));
      await Promise.all(['categories', 'templates', 'recurring', 'budget'].map(save));
      refreshAll(); toast('已刪除分類');
    },
  });
}

/* ---------- export / backup / restore ---------- */
async function saveFile(name, blob) {
  if (isIOS && navigator.canShare) {
    try {
      const file = new File([blob], name, { type: blob.type });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return true; }
    } catch (e) { if (e.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  return true;
}
function toCSV(list) {
  const q = v => { v = String(v ?? ''); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const TYPE = { expense: '支出', income: '收入', transfer: '轉帳' };
  const rows = [['日期', '時間', '類型', '金額', '主分類', '子分類', '帳戶', '轉入帳戶', '手續費', '備註', '標籤']];
  list.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach(t => {
    const c = catById(t.catId), p = parentOf(c);
    rows.push([t.date, t.time || '', TYPE[t.type], t.amount, t.type === 'transfer' ? '' : (p ? p.name : ''), c && p && c !== p ? c.name : '', acctName(t.accountId), t.toAccountId ? acctName(t.toAccountId) : '', t.fee || '', t.note || '', (t.tags || []).join(' ')]);
  });
  return '\uFEFF' + rows.map(r => r.map(q).join(',')).join('\r\n') + '\r\n';
}
async function exportCSV(list = S.tx, label = '全部記錄') {
  if (!list.length) return toast('沒有記錄可匯出');
  const ok = await saveFile(`記帳王_${label}_${today()}.csv`, new Blob([toCSV(list)], { type: 'text/csv;charset=utf-8' }));
  if (ok) toast(`已匯出 ${list.length} 筆（CSV，可用 Excel 開啟）`);
}
function backupObject() {
  return { app: APP_NAME, format: 'jizhangwang-backup', version: 1, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), data: { tx: S.tx, accounts: S.accounts, categories: S.categories, templates: S.templates, recurring: S.recurring, budget: S.budget, settings: S.settings } };
}
async function exportJSON() {
  const d = new Date(); const stamp = `${ymd(d)}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  const ok = await saveFile(`記帳王備份_${stamp}.json`, new Blob([JSON.stringify(backupObject())], { type: 'application/json' }));
  if (ok) { S.settings.lastBackup = new Date().toISOString(); S.settings.backupSnooze = null; await save('settings'); refreshAll(); toast('備份完成，請將檔案存到「檔案」App 或雲端'); }
}
function pickRestoreFile() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => { const f = inp.files[0]; if (f) await restoreFromText(await f.text()); };
  inp.click();
}
async function restoreFromText(text) {
  let o;
  try { o = JSON.parse(text); } catch (e) { toast('檔案格式錯誤，無法讀取'); return false; }
  const d = o && o.data;
  if (!d || !Array.isArray(d.tx) || !Array.isArray(d.accounts) || !Array.isArray(d.categories)) { toast('這不是記帳王的備份檔'); return false; }
  const when = o.exportedAt ? new Date(o.exportedAt).toLocaleString('zh-TW', { hour12: false }) : '未知時間';
  if (!(await ask('從備份還原？', `備份時間 ${when}，共 ${d.tx.length} 筆記錄。目前的 ${S.tx.length} 筆資料將被取代。`, '還原', true))) return false;
  const valid = d.tx.filter(t => t && t.id && t.date && typeof t.amount === 'number' && ['expense', 'income', 'transfer'].includes(t.type));
  S.tx = valid; S.accounts = d.accounts; S.categories = d.categories;
  S.templates = Array.isArray(d.templates) ? d.templates : []; S.recurring = Array.isArray(d.recurring) ? d.recurring : [];
  S.budget = d.budget && typeof d.budget === 'object' ? d.budget : { total: 0, cats: {} };
  const keepTheme = S.settings.theme;
  S.settings = Object.assign({ theme: keepTheme, backupDays: 7, lastCat: {} }, d.settings || {}, { lastBackup: new Date().toISOString() });
  await DB.replaceAllTx(S.tx);
  await Promise.all(KV_KEYS.map(save));
  applyTheme(); refreshAll();
  toast(`已還原 ${valid.length} 筆記錄`);
  return true;
}
async function resetAll() {
  if (!(await ask('清除所有資料？', '所有記錄、帳戶、分類、預算都會刪除且無法復原。建議先備份。', '全部清除', true))) return;
  if (!(await ask('真的要清除嗎？', '這是最後確認', '確定清除', true))) return;
  S.tx = []; S.accounts = defaultAccounts(); S.categories = defaultCategories(); S.templates = []; S.recurring = []; S.budget = { total: 0, cats: {} };
  S.settings = { theme: S.settings.theme, lastBackup: null, backupDays: 7, lastCat: {}, defaultAccount: S.accounts[0].id, installedAt: today() };
  await DB.replaceAllTx([]); await Promise.all(KV_KEYS.map(save));
  switchTab('home'); toast('已清除所有資料');
}

/* ---------- more ---------- */
VIEWS.more = v => {
  const lb = S.settings.lastBackup ? new Date(S.settings.lastBackup).toLocaleString('zh-TW', { hour12: false, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '從未備份';
  const th = S.settings.theme || 'system';
  const cell = (cls, ico, title, val = '', sub = '') => `<button class="cell ${cls}"><span class="c-ico">${ico}</span><span class="c-main">${title}${sub ? `<div class="c-sub">${sub}</div>` : ''}</span><span class="c-val">${val}</span><span class="chev">›</span></button>`;
  v.innerHTML = `<header class="topbar"><div class="tb-left"></div><h1>更多</h1><div class="tb-right"></div></header>
  <div class="content">
    ${!isStandalone() ? `<div class="banner" style="background:var(--accent-soft)"><span class="b-ico">📲</span><span class="b-txt">用 Safari 開啟，點「分享」→「加入主畫面」，即可像 App 一樣離線使用。</span><button class="b-act m-install" style="background:var(--accent2)">說明</button></div>` : ''}
    <div class="section-title">功能</div>
    <div class="cells">
      ${cell('m-budget', '🎯', '預算設定', S.budget.total ? money(S.budget.total) : '未設定')}
      ${cell('m-search', '🔍', '搜尋與篩選')}
      ${cell('m-tpl', '⚡', '快速範本', S.templates.length + ' 個')}
      ${cell('m-rec', '🔁', '週期記帳', S.recurring.filter(r => r.active).length + ' 個')}
      ${cell('m-cat', '🗂️', '分類管理')}
    </div>
    <div class="section-title">資料與備份</div>
    <div class="cells">
      ${cell('m-backup', '💾', '備份資料（JSON）', '', '上次備份：' + lb)}
      ${cell('m-restore', '📥', '從備份檔還原')}
      ${cell('m-csv', '📤', '匯出 CSV（Excel 可開）', S.tx.length + ' 筆')}
    </div>
    <div class="section-title">設定</div>
    <div class="cells">
      <div class="cell"><span class="c-ico">🌓</span><span class="c-main">外觀</span><div class="seg m-theme"><button data-v="system" class="${th === 'system' ? 'on' : ''}">自動</button><button data-v="light" class="${th === 'light' ? 'on' : ''}">淺色</button><button data-v="dark" class="${th === 'dark' ? 'on' : ''}">深色</button></div></div>
      <label class="cell"><span class="c-ico">⏰</span><span class="c-main">備份提醒</span><select class="m-bdays" style="border:0;background:transparent;font-size:16px;color:var(--text2);text-align:right">${[[0, '關閉'], [3, '每 3 天'], [7, '每 7 天'], [14, '每 14 天'], [30, '每 30 天']].map(([d, l]) => `<option value="${d}" ${Number(S.settings.backupDays) === d ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="cell"><span class="c-ico">💳</span><span class="c-main">預設帳戶</span><select class="m-defacct" style="border:0;background:transparent;font-size:16px;color:var(--text2);text-align:right;max-width:50%">${accountOptions(S.settings.defaultAccount)}</select></label>
    </div>
    <div class="section-title">其他</div>
    <div class="cells">
      ${cell('m-install', '📲', '安裝到主畫面說明')}
      ${cell('m-storage', '🗄️', '儲存空間狀態', '', '資料只存在這支手機（' + DB.mode + '）')}
      <button class="cell danger m-reset">清除所有資料</button>
    </div>
    <div class="about"><img src="icons/icon-192.png" alt="">${APP_NAME} v${APP_VERSION}<br>離線可用 · 資料不上傳 · 無廣告</div>
  </div>`;
  const on = (cls, fn) => $$('.' + cls, v).forEach(b => b.onclick = fn);
  on('m-budget', () => openBudget()); on('m-search', () => openSearch()); on('m-tpl', openTemplates); on('m-rec', openRecurring); on('m-cat', openCategories);
  on('m-backup', exportJSON); on('m-restore', pickRestoreFile); on('m-csv', () => exportCSV());
  on('m-reset', resetAll); on('m-install', showInstallHelp); on('m-storage', showStorage);
  $$('.m-theme button', v).forEach(b => b.onclick = () => { S.settings.theme = b.dataset.v; save('settings'); applyTheme(); refreshAll(); });
  v.querySelector('.m-bdays').onchange = e => { S.settings.backupDays = Number(e.target.value); save('settings'); };
  v.querySelector('.m-defacct').onchange = e => { S.settings.defaultAccount = e.target.value; S.settings.lastAccount = null; save('settings'); toast('已設定預設帳戶'); };
};
function showInstallHelp() {
  pushPage({
    title: '安裝到主畫面', render(c) {
      c.innerHTML = `<div class="card"><ol style="padding-left:20px;line-height:1.9;margin:0">
        <li>請使用 <b>Safari</b> 開啟本網址（Chrome/LINE 內建瀏覽器無法安裝）。</li>
        <li>點下方工具列的 <b>分享</b> 按鈕（方框加向上箭頭）。</li>
        <li>向下捲動，點 <b>「加入主畫面」</b>，名稱保留「記帳王」，按「新增」。</li>
        <li>從主畫面的「記帳王」圖示開啟，就是全螢幕 App，可離線使用。</li></ol></div>
        <div class="card"><b>⚠️ 重要提醒</b><ul style="padding-left:20px;line-height:1.7;margin:8px 0 0">
        <li>資料只存在這支 iPhone，不會上傳雲端。</li>
        <li>iOS 可能清除<b>長時間（數週）未開啟</b>的網頁 App 資料；刪除主畫面圖示也會刪除資料。</li>
        <li>請定期到「更多 → 備份資料」存到「檔案」App 或 iCloud Drive，換手機時用「從備份檔還原」。</li>
        <li>主畫面 App 與 Safari 分頁的資料彼此獨立。</li></ul></div>`;
    },
  });
}
async function showStorage() {
  let msg = `儲存方式：${DB.mode}\n記錄：${S.tx.length} 筆`;
  try {
    if (navigator.storage) {
      const p = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      const est = navigator.storage.estimate ? await navigator.storage.estimate() : null;
      msg += `\n持久保存：${p ? '已啟用' : '未啟用（請定期備份）'}`;
      if (est && est.usage != null) msg += `\n使用量：約 ${(est.usage / 1024).toFixed(0)} KB`;
    }
  } catch (e) {}
  await actionSheet('儲存空間', msg, []);
}

/* ---------- init ---------- */
async function checkDayChange() {
  if (checkDayChange.last !== today()) {
    checkDayChange.last = today();
    const n = await runRecurring();
    if (n) toast(`已自動新增 ${n} 筆週期記錄`);
    refreshAll();
  }
}
async function init() {
  try { await loadAll(); } catch (e) { document.body.insertAdjacentHTML('beforeend', `<div style="padding:40px;text-align:center">資料載入失敗：${esc(e.message)}</div>`); return; }
  applyTheme();
  $$('#tabbar .tab').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
  $('#btn-add').onclick = () => openEntry();
  const n = await runRecurring();
  checkDayChange.last = today();
  switchTab('home');
  if (n) toast(`已自動新增 ${n} 筆週期記錄`);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDayChange(); });
  document.addEventListener('pointerdown', e => { if (openRow && !openRow.contains(e.target)) closeRow(openRow); }, true);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('新版本已就緒', { action: '重新載入', fn: () => location.reload(), duration: 8000 }); });
      });
    }).catch(() => {});
  }
  window.__app = { S, DB, refreshAll, runRecurring, toCSV, backupObject, restoreFromText };
}
init();
