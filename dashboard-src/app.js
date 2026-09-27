// =====================================================================
//  НАЛАШТУВАННЯ ПІДКЛЮЧЕННЯ
//  Supabase → кнопка Connect (або Project Settings → API Keys): адреса проєкту і Publishable key.
//  Поки поля порожні, дашборд працює на демо-даних.
// =====================================================================
const CONFIG = {
  SUPABASE_URL: 'https://qsaifketkgkkgqsroskp.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_vIYeBa96J8MDWjECu1550w_SKZwStun',
  SYNC_FUNCTION: 'odyag-sync',
};

(() => {
'use strict';
// ---------------------------------------------------------------- утиліти
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const nf0 = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const uah = (v) => (v == null || !Number.isFinite(v) ? '—' : (v < 0 ? '−' : '') + nf0.format(Math.abs(Math.round(v))) + ' ₴');
const uah2 = (v) => (v == null ? '—' : nf2.format(v) + ' ₴');
const int = (v) => (v == null ? '—' : nf0.format(v));
const pct = (v, d = 1) => (v == null || !Number.isFinite(v) ? '—' : (v * 100).toFixed(d).replace('.', ',') + '%');
const compact = (v) => { const a = Math.abs(v); const s = v < 0 ? '−' : ''; return a >= 1e6 ? s + (a / 1e6).toFixed(1).replace('.', ',') + ' млн' : a >= 1e3 ? s + Math.round(a / 1e3) + ' тис' : s + Math.round(a); };
const div = (a, b) => (b ? a / b : null);
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const P = (s) => new Date(s + 'T00:00:00Z');
const U = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = P(s); d.setUTCDate(d.getUTCDate() + n); return U(d); };
const daysBetween = (a, b) => Math.round((P(b) - P(a)) / 86400e3);
const dim = (s) => { const d = P(s); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); };
const fdate = (s) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : '');
const fdt = (iso) => { if (!iso) return '—'; const d = new Date(iso); return isNaN(d) ? String(iso) : d.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const MON = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
const CAT = { work: 'В роботі', success: 'Продаж', fail: 'Відмова', return: 'Повернення', ignore: 'Не враховувати' };
const rememberBrand = (n) => { if (n) store.set('brand', n); return n; };
const store = { get(k, d) { try { const v = localStorage.getItem('ca_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('ca_' + k, JSON.stringify(v)); } catch { /* ok */ } } };
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

function toast(msg, err = false) {
  const t = $('#toast'); t.textContent = msg; t.classList.toggle('err', err); t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3200);
}
function confirmBox(title, text, okLabel = 'Видалити') {
  return new Promise((resolve) => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3></h3><p></p><div class="acts"><button class="btn" data-a="0">Скасувати</button><button class="btn primary" data-a="1"></button></div></div>`;
    $('h3', bg).textContent = title; $('p', bg).textContent = text; $('[data-a="1"]', bg).textContent = okLabel;
    bg.addEventListener('click', (e) => { const a = e.target.closest('[data-a]'); if (a || e.target === bg) { bg.remove(); resolve(a?.dataset.a === '1'); } });
    document.body.appendChild(bg); $('[data-a="1"]', bg).focus();
  });
}

// ---------------------------------------------------------------- іконки
const I = {
  shop: '<path d="M4 9 5.5 4h13L20 9"/><path d="M4 9h16v2a3 3 0 0 1-5.3 1.9A3 3 0 0 1 12 14a3 3 0 0 1-2.7-1.1A3 3 0 0 1 4 11z"/><path d="M5 13.5V20h14v-6.5M10 20v-4h4v4"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-.8-1.5-1.2-2.8-1.2-1.7 0-2.8.8-2.8 2s1.1 1.7 2.8 2 2.8.8 2.8 2-1.1 2-2.8 2c-1.3 0-2.3-.4-2.8-1.2M12 6v2M12 16v2"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>',
  days: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  months: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  ads: '<path d="M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2z"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/><path d="M6 6V4h12v2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  cols: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
  grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const LOGO = `<svg class="logo-mark" viewBox="0 0 34 34" aria-hidden="true"><rect x="1" y="1" width="32" height="32" rx="9" fill="#e9b8c9"/><path d="M14.2 11.2a2.8 2.8 0 1 1 3.9 2.6c-.7.3-1.1.9-1.1 1.6v.9" fill="none" stroke="#2a1d2c" stroke-width="2" stroke-linecap="round"/><path d="M17 16.3 6.6 22.6c-.9.6-.5 2 .6 2h19.6c1.1 0 1.5-1.4.6-2L17 16.3z" fill="none" stroke="#2a1d2c" stroke-width="2" stroke-linejoin="round"/></svg>`;

// ---------------------------------------------------------------- доступ до даних (Supabase)
function createLiveApi() {
  const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  const chk = ({ data, error }) => { if (error) throw new Error(error.message || String(error)); return data; };
  const ORDER = { people: ['sort', true], payouts: ['date', false], expenses: ['date', false], statuses: ['sort', true], stores: ['sort', true], managers: ['id', true], rules: ['id', true], sync_log: ['id', false], fops: ['sort', true] };
  return {
    mode: 'live',
    async session() { const { data } = await sb.auth.getSession(); return data.session ? { email: data.session.user.email } : null; },
    async signIn(email, password) { const r = await sb.auth.signInWithPassword({ email, password }); if (r.error) throw new Error(/fetch|network|failed/i.test(r.error.message || '') ? 'Немає зв’язку з Supabase. Перевірте адресу в CONFIG та інтернет.' : 'Невірний email або пароль'); return { email }; },
    async signOut() { await sb.auth.signOut(); },
    async settings() { const rows = chk(await sb.from('settings').select('key,value')); return Object.fromEntries(rows.map((r) => [r.key, r.value])); },
    async setSetting(key, value) { chk(await sb.from('settings').upsert({ key, value })); },
    async rpc(name, params) { return chk(await sb.rpc(name, params)); },
    async list(table, opts = {}) {
      let q = sb.from(table).select('*');
      for (const [k, v] of Object.entries(opts.eq || {})) q = q.eq(k, v);
      if ((table === 'expenses' || table === 'payouts') && opts.from) q = q.lte('date', opts.to).gte('date', addDays(opts.from, -400));
      const [col, asc] = ORDER[table] || ['id', true];
      q = q.order(col, { ascending: asc });
      if (table === 'expenses' || table === 'payouts') q = q.order('id', { ascending: false });
      if (table === 'sync_log') q = q.limit(15);
      let rows = chk(await q);
      if ((table === 'expenses' || table === 'payouts') && opts.from) rows = rows.filter((e) => (e.date_to || e.date) >= opts.from);
      return rows;
    },
    async insert(table, row) { return chk(await sb.from(table).insert(row).select().single()); },
    async update(table, id, patch) { return chk(await sb.from(table).update(patch).eq('id', id).select().single()); },
    async remove(table, id) { chk(await sb.from(table).delete().eq('id', id)); },
    async upsert(table, row, onConflict) { return chk(await sb.from(table).upsert(row, { onConflict }).select()); },
    async removeWhere(table, eq) { let q = sb.from(table).delete(); for (const [k, v] of Object.entries(eq)) q = q.eq(k, v); chk(await q); },
    async rows(table, eq = {}) { let q = sb.from(table).select('*'); for (const [k, v] of Object.entries(eq)) q = q.eq(k, v); return chk(await q); },
    // Зміни від інших користувачів у реальному часі
    subscribe(cb) {
      sb.channel('dashboard-live')
        .on('postgres_changes', { event: '*', schema: 'public' }, (p) => { if (p.table === 'settings' && String(p.new?.key || p.old?.key || '').startsWith('ui_')) return; cb(p.table, p); })
        .subscribe((status) => { S.live = status === 'SUBSCRIBED'; updateSyncPill(); });
    },
    async sync(body = {}, fn = CONFIG.SYNC_FUNCTION) {
      const { data, error } = await sb.functions.invoke(fn, { body });
      if (error) { let msg = error.message; try { const j = await error.context.json(); msg = j.error || msg; } catch { /* ok */ } throw new Error(msg); }
      return data;
    },
  };
}

const LIVE = !!(window.__TEST_API__ || (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && window.supabase));
const api = window.__TEST_API__ || (LIVE ? createLiveApi() : createDemoApi());
if (!api.upsert) { api.upsert = async () => []; api.removeWhere = async () => {}; api.rows = async () => []; const r0 = api.rpc; api.rpc = async (n, p) => { try { return await r0(n, p); } catch { return []; } }; }

// ---------------------------------------------------------------- розрахунок звіту
const CHANNELS = [
  ['Meta', /(^|[^a-z])(fb|facebook|insta|instagram|ig|meta)([^a-z]|$)/i],
  ['Google', /google|gads|adwords|youtube/i],
  ['TikTok', /tiktok|(^|[^a-z])tt([^a-z]|$)/i],
  ['Розсилки', /sms|viber|email|e-mail|mail|esputnik|turbosms|sendpulse|telegram/i],
  ['Блогери', /blog|блог|influenc/i],
];
const channelOf = (u) => { if (!u) return 'Без мітки'; for (const [n, re] of CHANNELS) if (re.test(u)) return n; return u; };

function emptyDay() { return { pending: 0, leads: 0, confirmed: 0, unconfirmed: 0, success: 0, fail: 0, returns: 0, work: 0, sales: 0, revenue: 0, cogs: 0, order_costs: 0, return_costs: 0, payed: 0, upsell: 0, ads: 0, other: 0,
  card: 0, cpoAds: 0, cpoOrd: 0, mLeads: 0, mConf: 0, mOrders: 0, mImpr: 0, mClicks: 0, archDays: 0, byCat: {}, adsByCh: {}, byRule: {} }; }
const MGR_CAT = 'Зарплата менеджерів';
const usdRate = () => N(S.settings.usd_rate) || 45;

// Будує денний P&L: дані замовлень + ручні витрати + правила + з/п менеджерів
function buildDays(from, to, daily, expenses, rules, mgrDaily, managers, settings, storeDays = {}, payMap = {}, manual = []) {
  const days = {};
  for (let d = from; d <= to; d = addDays(d, 1)) days[d] = emptyDay();
  const withCosts = settings.order_costs_in_pnl === true; // доставка й комісії з CRM (у старому дашборді одягу не віднімались)
  for (const r of daily) {
    const x = days[String(r.day).slice(0, 10)]; if (!x) continue;
    for (const k of ['leads', 'confirmed', 'unconfirmed', 'success', 'fail', 'returns', 'work', 'sales', 'revenue', 'cogs', 'payed', 'upsell']) x[k] += N(r[k]);
    if (withCosts) { x.order_costs += N(r.order_costs); x.return_costs += N(r.return_costs); }
    if (r.archived) x.archDays = 1;
    // Сума за відмови: фіксована сума за кожну відмову (як у старому дашборді) або вартість доставки з CRM
    if (settings.refusal_mode === 'crm') x.return_costs += N(r.refusal_ship) + N(r.refusal_ship_unknown) * N(settings.refusal_cost_default);
    else x.return_costs += (N(r.fail) + N(r.returns)) * N(settings.refusal_cost_default);
    // Режим «виручка при підтвердженні»: підтверджені, ще не викуплені замовлення теж рахуються як продаж
    if (settings.revenue_mode !== 'sale') { x.sales += N(r.pend_sales); x.revenue += N(r.pend_revenue); x.cogs += N(r.pend_cogs); if (withCosts) x.order_costs += N(r.pend_costs); x.pending += N(r.pend_sales); }
  }
  for (const r of manual) {
    const x = days[String(r.day).slice(0, 10)]; if (!x) continue;
    x.card += N(r.card_payments); x.cpoAds += N(r.cpo_ads); x.cpoOrd += N(r.cpo_orders);
    x.mLeads += N(r.leads_total); x.mConf += N(r.leads_confirmed); x.mOrders += N(r.orders_from_leads); x.mImpr += N(r.impressions); x.mClicks += N(r.clicks);
  }
  const add = (x, cat, v) => { x.byCat[cat] = (x.byCat[cat] || 0) + v; };
  for (const e of expenses) {
    const end = e.date_to && e.date_to >= e.date ? e.date_to : e.date;
    const per = N(e.amount_uah) / (daysBetween(e.date, end) + 1);
    for (let d = e.date > from ? e.date : from; d <= end && d <= to; d = addDays(d, 1)) {
      const x = days[d];
      if (e.category === 'Реклама') { x.ads += per; const ch = e.channel || 'Інше'; x.adsByCh[ch] = (x.adsByCh[ch] || 0) + per; } else x.other += per;
      add(x, e.category, per);
    }
  }
  for (const [d, x] of Object.entries(days)) {
    for (const r of rules) {
      if (!r.active || (r.date_from && d < r.date_from) || (r.date_to && d > r.date_to)) continue;
      // правило конкретного магазину в режимі «Усі» рахуємо від виручки саме цього магазину
      const sd = r.store_id != null ? storeDays[r.store_id] : null;
      const base = sd ? (sd.days[d] || { revenue: 0, sales: 0 }) : x;
      let v;
      if (r.kind === 'percent_payment') { const pm = ((sd ? sd.pay : payMap)[d] || {})[r.method] || { amount: 0, cnt: 0 }; v = pm.amount * N(r.value) / 100 + pm.cnt * N(r.value2); }
      else v = r.kind === 'percent_revenue' ? base.revenue * N(r.value) / 100 : r.kind === 'fixed_monthly' ? N(r.value) / dim(d) : N(r.value) * base.sales;
      if (v) { x.other += v; add(x, r.category, v); x.byRule[r.id] = (x.byRule[r.id] || 0) + v; }
    }
  }
  if (settings.managers_in_pnl !== false) {
    const mm = new Map(managers.map((m) => [m.id, m]));
    for (const r of mgrDaily) {
      const x = days[String(r.day).slice(0, 10)]; const m = mm.get(N(r.manager_id)); if (!x || !m) continue;
      const v = N(m.rate_per_order) * N(r.sales) + N(m.upsell_pct) * N(r.upsell);
      if (v) { x.other += v; add(x, MGR_CAT, v); }
    }
  }
  return days;
}
// Розбивка «Інших витрат» по категоріях (для підказки та карток магазинів)
const otherCats = (t) => Object.entries(t.byCat || {}).filter(([c, v]) => c !== 'Реклама' && Math.abs(v) >= 0.5).sort((a, b) => b[1] - a[1]);
const otherTip = (t) => otherCats(t).filter(([c]) => c !== TAX_CAT && c !== MGR_CAT).map(([c, v]) => `${c}: ${uah(v)}`).join('\n');
const taxOf = (t) => N((t.byCat || {})[TAX_CAT]);
function totals(list) {
  const t = emptyDay();
  for (const x of list) {
    for (const k of Object.keys(t)) if (typeof t[k] === 'number') t[k] += x[k];
    for (const [c, v] of Object.entries(x.byCat)) t.byCat[c] = (t.byCat[c] || 0) + v;
    for (const [c, v] of Object.entries(x.adsByCh)) t.adsByCh[c] = (t.adsByCh[c] || 0) + v;
    for (const [c, v] of Object.entries(x.byRule)) t.byRule[c] = (t.byRule[c] || 0) + v;
  }
  const gross = t.revenue - t.cogs - t.order_costs - t.return_costs;
  const net = gross - t.ads - t.other;
  const closed = t.success + t.fail + t.returns;
  return Object.assign(t, {
    gross, net, closed,
    margin: div(t.revenue - t.cogs, t.revenue), grossMargin: div(gross, t.revenue), netMargin: div(net, t.revenue),
    confRate: div(t.confirmed, t.leads), cpc: t.ads ? div(t.ads, t.confirmed) : null,
    avg: div(t.revenue, t.sales), conv: div(t.success, t.leads), convClosed: div(t.success, closed),
    returnRate: div(t.returns, t.success + t.returns), refuseRate: div(t.fail + t.returns, closed),
    romi: div(gross - t.ads, t.ads), cpl: div(t.ads, t.leads), cpo: t.ads ? div(t.ads, t.sales) : null, drr: div(t.ads, t.revenue),
    // показники старого дашборду одягу
    roas: t.ads ? div(t.revenue, t.ads) : null,
    cplUsd: t.ads ? div(t.ads / usdRate(), t.leads) : null,
    cpoFactUsd: t.ads ? div(t.ads / usdRate(), t.confirmed) : null,
    cpoPlanUsd: t.cpoOrd ? div(t.cpoAds / usdRate(), t.cpoOrd) : null,
    mgrPay: N(t.byCat[MGR_CAT]),
  });
}
function bucketKey(d, g) { if (g === 'month') return d.slice(0, 7); if (g === 'week') { const w = (P(d).getUTCDay() + 6) % 7; return addDays(d, -w); } return d; }
function bucketLabel(k, g) { if (g === 'month') return MON[+k.slice(5, 7) - 1] + ' ' + k.slice(2, 4); return k.slice(8, 10) + '.' + k.slice(5, 7); }
function series(days, g) {
  const m = new Map();
  for (const [d, x] of Object.entries(days)) { const k = bucketKey(d, g); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  return [...m.entries()].map(([k, list]) => ({ key: k, label: bucketLabel(k, g), ...totals(list) }));
}

// ---------------------------------------------------------------- стан
const S = {
  page: store.get('page', 'overview'),
  preset: store.get('preset', 'month'),
  from: null, to: null,
  group: null,
  settings: {}, statuses: [], managers: [], rules: [], stores: [],
  store: store.get('store', null), // null = усі магазини
  data: null, // завантажені дані поточного періоду
  loadingKey: '',
  user: null,
};
const PRESETS = [
  ['today', 'Сьогодні'], ['yesterday', 'Вчора'], ['7d', 'Останні 7 днів'], ['30d', 'Останні 30 днів'],
  ['month', 'Цей місяць'], ['prevmonth', 'Минулий місяць'], ['90d', 'Останні 90 днів'], ['year', 'Цей рік'],
];
function rangeFor(p) {
  const t = new Date(); const to = ymd(t);
  const back = (n) => addDays(to, -n);
  switch (p) {
    case 'today': return [to, to];
    case 'yesterday': return [back(1), back(1)];
    case '7d': return [back(6), to];
    case '30d': return [back(29), to];
    case '90d': return [back(89), to];
    case 'month': return [to.slice(0, 8) + '01', to];
    case 'prevmonth': { const d = new Date(t.getFullYear(), t.getMonth() - 1, 1); return [ymd(d), ymd(new Date(t.getFullYear(), t.getMonth(), 0))]; }
    case 'year': return [to.slice(0, 5) + '01-01', to];
  }
  return store.get('custom', [back(29), to]);
}
function autoGroup(from, to) { const n = daysBetween(from, to) + 1; return n <= 45 ? 'day' : n <= 200 ? 'week' : 'month'; }
function presetLabel() { return (PRESETS.find((p) => p[0] === S.preset) || [0, 'Свій період'])[1]; }
[S.from, S.to] = rangeFor(S.preset);
S.group = autoGroup(S.from, S.to);

// ---------------------------------------------------------------- завантаження
async function loadRefs() {
  const [settings, statuses, managers, rules, stores, people, fops] = await Promise.all([api.settings(), api.list('statuses'), api.list('managers'), api.list('rules'), api.list('stores'), api.list('people').catch(() => []), api.list('fops').catch(() => [])]);
  S.settings = settings; S.statuses = statuses; S.managers = managers; S.rules = rules; S.stores = stores; S.people = people || []; S.fops = fops || [];
  applyStoreColors();
  if (S.store != null && !activeStores().some((x) => x.id === S.store)) { S.store = null; store.set('store', null); }
}
const fin = () => (S.settings.finance_date === 'payment' ? 'payment' : 'order');

// ---------- магазини ----------
const activeStores = () => S.stores.filter((x) => x.active !== false);
const storeLabel = (id) => (id == null ? 'Загальна' : (S.stores.find((x) => x.id === N(id))?.name || 'Сайт #' + id));
// Колір магазину: той самий у всіх вкладках (1-й синій, 2-й помаранчевий, 3-й …)
const STORE_COLORS = ['--s1', '--s2', '--s3'];
// Власні кольори магазинів (Налаштування → Магазини) зберігаються в settings.store_colors: { id: '#rrggbb' }
const storeColors = () => (S.settings.store_colors && typeof S.settings.store_colors === 'object' ? S.settings.store_colors : {});
function applyStoreColors() { for (const [id, c] of Object.entries(storeColors())) if (/^#[0-9a-f]{3,8}$/i.test(c)) document.documentElement.style.setProperty('--st-' + id, c); }
const storeColor = (id) => { if (storeColors()[N(id)]) return '--st-' + N(id); const i = activeStores().findIndex((x) => x.id === N(id)); return i < 0 ? '--ink-3' : STORE_COLORS[i % STORE_COLORS.length]; };
const storeDot = (id) => `<i class="sdot" style="background:var(${storeColor(id)})"></i>`;
const storeTag = (id) => (id == null ? '<span class="muted">Загальна</span>' : `<span class="stag">${storeDot(id)}${esc(storeLabel(id))}</span>`);
// Загальні витрати діляться порівну між активними магазинами (налаштування general_split)
const splitN = () => (S.settings.general_split === 'none' ? 0 : activeStores().length > 1 ? activeStores().length : 0);
// Витрати й правила, що стосуються обраного магазину.
// «Усі магазини» — все. Конкретний магазин — його власні записи + загальні правила
// «% від виручки» і «за продаж» (рахуються від його виручки). Загальні суми (витрати без магазину,
// щомісячні загальні правила) — порівну між магазинами, якщо увімкнено поділ; інакше не входять.
const scopeExpenses = (list, st) => {
  if (st == null) return list;
  const own = list.filter((e) => e.store_id != null && N(e.store_id) === st);
  const n = splitN(); if (!n) return own;
  return [...own, ...list.filter((e) => e.store_id == null).map((e) => ({ ...e, amount_uah: N(e.amount_uah) / n, _share: n }))];
};
const scopeRules = (list, st) => {
  if (st == null) return list;
  const n = splitN();
  return list.filter((r) => (r.store_id != null && N(r.store_id) === st) || (r.store_id == null && (r.kind !== 'fixed_monthly' || n)))
    .map((r) => (r.store_id == null && r.kind === 'fixed_monthly' ? { ...r, value: N(r.value) / n, _share: n } : r));
};
function payMapOf(rows) { const m = {}; for (const r of rows || []) { const d = String(r.day).slice(0, 10); (m[d] = m[d] || {})[r.method] = { amount: N(r.amount), cnt: N(r.cnt) }; } return m; }
function dayMap(rows) { const m = {}; for (const r of rows) m[String(r.day).slice(0, 10)] = { revenue: N(r.revenue), sales: N(r.sales) }; return m; }

// Денний звіт за період для магазину st (null = усі)
const TEAM_CAT = 'Зарплата команди';
// Правила для команди з фіксованою сумою на місяць (власники в прибуток не входять)
const teamRules = () => (S.people || []).filter((p) => p.role === 'team' && p.pay_kind === 'fixed_monthly' && p.active !== false && N(p.value))
  .map((p) => ({ id: 'p' + p.id, name: p.name, kind: 'fixed_monthly', value: N(p.value), category: TEAM_CAT, store_id: p.store_id ?? null, active: true }));
// Податки ФОП: сума на місяць; у звіти потрапляють як витрата в день, коли відмічено «сплачено»
const TAX_CAT = 'Податки';
const fopMonthly = (f) => N(f.single_tax) + N(f.esv) + N(f.military) + N(f.other);
const payoutsAsExpenses = (list) => list.filter((x) => { const p = (S.people || []).find((q) => q.id === N(x.person_id)); return !p || p.role === 'team'; })
  .map((x) => ({ ...x, id: 'po' + x.id, category: TEAM_CAT, channel: null }));
async function fetchDays(from, to, st = S.store) {
  const rules = scopeRules([...S.rules, ...teamRules()], st);
  const needStores = st == null ? [...new Set(rules.filter((r) => r.active && r.store_id != null && r.kind !== 'fixed_monthly').map((r) => N(r.store_id)))] : [];
  const pr = { p_from: from, p_to: to, p_fin: fin(), p_store: st };
  const hasPay = rules.some((r) => r.active && r.kind === 'percent_payment');
  const [daily, mgrDaily, payRows, manual, expAll, ...sd] = await Promise.all([
    api.rpc('stats_daily', pr), api.rpc('stats_manager_daily', pr),
    hasPay ? api.rpc('stats_payment_daily', { p_from: from, p_to: to, p_store: st }).catch(() => []) : Promise.resolve([]),
    api.rpc('stats_manual', { p_from: from, p_to: to, p_store: st }).catch(() => []),
    Promise.all([api.list('expenses', { from, to }), api.list('payouts', { from, to }).catch(() => [])]).then(([e, p]) => [e, payoutsAsExpenses(p)]),
    ...needStores.map((id) => Promise.all([api.rpc('stats_daily', { ...pr, p_store: id }), hasPay ? api.rpc('stats_payment_daily', { p_from: from, p_to: to, p_store: id }).catch(() => []) : []])),
  ]);
  const expenses = scopeExpenses(expAll[0], st);
  const teamExp = scopeExpenses(expAll[1], st);
  const storeDays = Object.fromEntries(needStores.map((id, i) => [id, { days: dayMap(sd[i][0]), pay: payMapOf(sd[i][1]) }]));
  return { days: buildDays(from, to, daily, [...expenses, ...teamExp], rules, mgrDaily, S.managers, S.settings, storeDays, payMapOf(payRows), manual || []), expenses, mgrDaily };
}

async function loadPeriod(force = false) {
  const key = `${S.from}|${S.to}|${fin()}|${S.store}`;
  if (!force && S.data && S.data.key === key) return S.data;
  const len = daysBetween(S.from, S.to) + 1;
  const pFrom = addDays(S.from, -len), pTo = addDays(S.from, -1);
  const pr = { p_from: S.from, p_to: S.to, p_fin: fin(), p_store: S.store };
  const pr2 = { p_from: S.from, p_to: S.to, p_store: S.store };
  const [fd, channels, products, statuses, reasons, payments, mstats] = await Promise.all([
    fetchDays(pFrom, S.to),
    api.rpc('stats_channels', pr), api.rpc('stats_products', pr),
    api.rpc('stats_statuses', pr2), api.rpc('stats_reasons', pr2),
    api.rpc('stats_payments', pr), api.rpc('stats_managers', pr),
  ]);
  const cur = {}, prev = {};
  for (const [d, x] of Object.entries(fd.days)) (d >= S.from ? cur : prev)[d] = x;
  const T = totals(Object.values(cur)), PT = totals(Object.values(prev));
  S.data = { key, days: cur, T, PT, hasPrev: PT.leads >= 10, pFrom, pTo, expenses: fd.expenses.filter((e) => (e.date_to || e.date) >= S.from && e.date <= S.to),
    mgrDaily: (fd.mgrDaily || []).filter((r) => String(r.day).slice(0, 10) >= S.from),
    channels, products, statuses, reasons, payments: Array.isArray(payments) ? payments[0] || {} : payments, mstats };
  return S.data;
}

// ---------------------------------------------------------------- каркас
function shell() {
  const nav = [
    ['Аналітика', [['overview', 'Огляд', 'home'], ['stores', 'Магазини', 'shop'], ['days', 'По днях', 'days'], ['months', 'По місяцях', 'months'], ['products', 'Товари', 'box'], ['ads', 'Реклама', 'ads'], ['managers', 'Менеджери', 'users']]],
    ['Облік', [['payments', 'Оплати на рахунок', 'check'], ['expenses', 'Витрати', 'wallet'], ['salary', 'Зарплата', 'coin'], ['fop', 'ФОП і податки', 'doc']]],
    ['Система', [['settings', 'Налаштування', 'gear']]],
  ];
  $('#app').innerHTML = `
  <div class="app">
    <aside class="side">
      <div class="logo">${LOGO}<div><div class="logo-t">${esc(rememberBrand(S.settings.store_name) || 'Одяг')}</div><div class="logo-s">Аналітика продажів</div></div></div>
      <nav class="nav" aria-label="Розділи">${nav.map(([g, items]) => `<div class="nav-g">${g}</div>` + items.map(([id, t, ic]) => `<a data-page="${id}" class="${S.page === id ? 'on' : ''}" href="#${id}">${icon(ic)}<span>${t}</span></a>`).join('')).join('')}</nav>
      <div class="side-foot">
        <div class="sync-pill" id="syncPill"><i class="dot"></i><span>…</span></div>
        <button class="side-btn" id="syncBtn" title="Підтягнути нові замовлення з SalesDrive">${icon('sync')}<span>Оновити дані</span></button>
        <div class="side-user"><span>${esc(S.user?.email || '')}</span>${S.isOwner ? '<button id="vaultBtn" title="Мій дохід" aria-label="Мій дохід" style="padding:2px 6px">🔒</button>' : ''}${LIVE ? '<button id="logout">Вийти</button>' : ''}</div>
      </div>
    </aside>
    <main class="main" id="main">
      ${LIVE ? '' : '<div class="demo-bar"><b>Демо-режим.</b> Показано згенеровані тестові дані. Щоб підключити свою базу, заповніть CONFIG у файлі.</div>'}
      <div class="topbar"><div><h1 class="page-t" id="pageT"></h1><div class="page-s" id="pageS"></div></div><div class="tools" id="tools"></div></div>
      <div id="page" class="loading-veil"></div>
    </main>
  </div>`;
  $('.nav').addEventListener('click', (e) => { const a = e.target.closest('[data-page]'); if (!a) return; e.preventDefault(); go(a.dataset.page); });
  $('#syncBtn').addEventListener('click', () => runSync({}));
  $('#logout')?.addEventListener('click', async () => { await api.signOut(); location.reload(); });
  $('#vaultBtn')?.addEventListener('click', () => go('vault'));
  updateSyncPill();
}
function updateSyncPill() {
  const el = $('#syncPill'); if (!el) return;
  const last = S.settings.last_sync || S.settings.last_run;
  const mins = last ? (Date.now() - new Date(last)) / 60e3 : Infinity;
  const backfill = S.settings.backfill_done === false || S.settings.backfill_done === 'false';
  $('.dot', el).className = 'dot ' + (backfill ? 'warn' : mins > 90 ? 'bad' : '');
  $('span', el).textContent = (backfill ? 'Завантажується історія…' : last ? 'Оновлено ' + fdt(last) : 'Ще не синхронізовано') + (S.live ? ' · онлайн' : '');
}
function storeTool() {
  return `<div class="seg" id="storeSeg" role="group" aria-label="Магазин"><button data-store="" class="${S.store == null ? 'on' : ''}">Усі магазини</button>${activeStores().map((x) => `<button data-store="${x.id}" class="${S.store === x.id ? 'on' : ''}" style="--sc:var(${storeColor(x.id)})">${storeDot(x.id)}${esc(x.name || 'Сайт #' + x.id)}</button>`).join('')}</div>`;
}
function periodTool() {
  return `<div class="period"><button class="btn period-btn" id="periodBtn" aria-haspopup="true">${icon('cal')}<span class="lbl">${presetLabel()}</span><span class="rng">${fdate(S.from)} – ${fdate(S.to)}</span>${icon('chev')}</button></div>`;
}
function openPeriod() {
  const wrap = $('.period'); if ($('.pop', wrap)) { $('.pop', wrap).remove(); return; }
  const pop = document.createElement('div'); pop.className = 'pop';
  pop.innerHTML = PRESETS.map(([k, t]) => `<button class="row ${S.preset === k ? 'on' : ''}" data-p="${k}">${t}${icon('check').replace('<svg', '<svg class="ck"')}</button>`).join('') +
    `<div class="custom"><label class="f">З<input type="date" id="cFrom" value="${S.from}"></label><label class="f">По<input type="date" id="cTo" value="${S.to}"></label><button class="btn primary" id="cApply">Показати період</button></div>`;
  wrap.appendChild(pop);
  pop.addEventListener('click', (e) => {
    const b = e.target.closest('[data-p]');
    if (b) { setPeriod(b.dataset.p); pop.remove(); }
    if (e.target.closest('#cApply')) {
      const f = $('#cFrom').value, t = $('#cTo').value;
      if (!f || !t || f > t) return toast('Вкажіть коректний період', true);
      store.set('custom', [f, t]); setPeriod('custom'); pop.remove();
    }
  });
  setTimeout(() => document.addEventListener('click', function h(e) { if (!wrap.contains(e.target)) { pop.remove(); document.removeEventListener('click', h); } }), 0);
}
function setPeriod(p) {
  S.preset = p; store.set('preset', p);
  [S.from, S.to] = rangeFor(p); S.group = autoGroup(S.from, S.to);
  render();
}
const PAGES = {};
const TITLES = {
  overview: ['Огляд', 'Головні показники магазину за період'],
  stores: ['Магазини', 'Порівняння магазинів за період'],
  days: ['По днях', 'Щоденний звіт: замовлення, гроші, реклама'],
  months: ['По місяцях', 'Підсумки кожного місяця'],
  products: ['Товари', 'Що продається, що заробляє і що повертають'],
  ads: ['Реклама', 'Витрати та окупність каналів'],
  managers: ['Менеджери', 'Продажі, конверсія і зарплата'],
  expenses: ['Витрати', 'Реклама, податки, SMS та інші витрати'],
  salary: ['Зарплата', 'Виплати власникам і команді'],
  vault: ['Мій дохід', 'Особистий облік: одяг + інші доходи'],
  payments: ['Оплати на рахунок', 'Повні оплати й передоплати з CRM — для звірки з банком'],
  fop: ['ФОП і податки', 'Податки кожного ФОПа й контроль річного ліміту'],
  settings: ['Налаштування', 'Синхронізація, статуси, курси валют'],
};
function go(p) {
  S.page = p; if (p !== 'vault') store.set('page', p);
  $$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.page === p));
  history.replaceState(null, '', '#' + p);
  render();
}
let renderSeq = 0;
async function render() {
  const seq = ++renderSeq;
  if (S.page !== 'days') document.querySelector('.cols-pop')?.remove();
  const [t, s] = TITLES[S.page]; $('#pageT').textContent = t;
  const usesStore = !['settings', 'stores', 'salary', 'fop', 'vault'].includes(S.page) && activeStores().length > 1;
  $('#pageS').innerHTML = esc(s) + (usesStore ? ' · ' + (S.store == null ? 'усі магазини' : storeTag(S.store)) : '');
  document.documentElement.style.setProperty('--store-accent', usesStore && S.store != null ? `var(${storeColor(S.store)})` : 'transparent');
  const usesPeriod = !['settings', 'months', 'salary', 'fop', 'vault'].includes(S.page);
  $('#tools').innerHTML = (usesStore ? storeTool() : '') + (usesPeriod ? periodTool() : '');
  $('#storeSeg')?.addEventListener('click', (e) => { const b = e.target.closest('[data-store]'); if (!b) return; S.store = b.dataset.store === '' ? null : N(b.dataset.store); store.set('store', S.store); S.data = null; render(); });
  $('#periodBtn')?.addEventListener('click', openPeriod);
  $('#main').classList.add('is-loading');
  try {
    await PAGES[S.page](seq);
  } catch (e) {
    console.error(e);
    if (seq === renderSeq) $('#page').innerHTML = `<div class="card"><div class="empty">Не вдалося завантажити дані: ${esc(e.message)}</div></div>`;
  } finally { if (seq === renderSeq) $('#main').classList.remove('is-loading'); }
}

// ---------------------------------------------------------------- графіки
const charts = {};
const FONT = 'Onest, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
const crosshair = { id: 'crosshair', afterDraw(c) { const a = c.tooltip?.getActiveElements?.(); if (!a?.length || c.config.type !== 'line') return; const x = a[0].element.x, { top, bottom } = c.chartArea, g = c.ctx; g.save(); g.beginPath(); g.moveTo(x, top); g.lineTo(x, bottom); g.lineWidth = 1; g.strokeStyle = css('--ink-3'); g.globalAlpha = .45; g.stroke(); g.restore(); } };
function chart(id, type, labels, datasets, fmt, opts = {}) {
  if (!window.Chart) { const el = document.getElementById(id); if (el) el.parentElement.innerHTML = '<div class="empty">Графік недоступний: бібліотеку не завантажено</div>'; return; }
  charts[id]?.destroy();
  const grid = css('--grid'), tx = css('--ink-3');
  charts[id] = new Chart(document.getElementById(id), {
    type, data: { labels, datasets }, plugins: [crosshair],
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: css('--surface'), titleColor: css('--ink-2'), bodyColor: css('--ink'), borderColor: css('--line'), borderWidth: 1, padding: 10, boxWidth: 12, boxHeight: 3,
          titleFont: { family: FONT }, bodyFont: { family: FONT }, callbacks: { label: (c) => ` ${fmt(c.parsed.y)}   ${c.dataset.label}` } },
      },
      scales: {
        x: { stacked: !!opts.stacked, grid: { display: false }, border: { color: grid }, ticks: { color: tx, maxRotation: 0, autoSkipPadding: 14, font: { family: FONT, size: 11 } } },
        y: { stacked: !!opts.stacked, grid: { color: grid }, border: { display: false }, suggestedMax: 1, ticks: { precision: 0, color: tx, font: { family: FONT, size: 11 }, callback: (v) => (opts.axis || compact)(v) }, beginAtZero: true },
      },
    },
  });
}
const lineDs = (label, data, color, n) => ({ label, data, borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: n <= 20 ? 3 : 0, pointHoverRadius: 5, pointBorderColor: css('--surface'), pointBorderWidth: 2, tension: .28 });
const barDs = (label, data, color, extra = {}) => ({ label, data, backgroundColor: color, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 20, categoryPercentage: .72, barPercentage: .9, ...extra });
const legend = (items, box) => `<div class="legend">${items.map(([n, c]) => `<span><i class="${box ? 'box' : ''}" style="background:${c}"></i>${esc(n)}</span>`).join('')}</div>`;
const groupSeg = () => `<div class="seg" data-group>${[['day', 'Дні'], ['week', 'Тижні'], ['month', 'Місяці']].map(([k, t]) => `<button data-g="${k}" class="${S.group === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
function bindGroup(cb) { $$('[data-group]').forEach((el) => el.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (!b) return; S.group = b.dataset.g; cb(); })); }
function sparkSvg(vals) {
  if (vals.length < 2) return '';
  const min = Math.min(0, ...vals), max = Math.max(...vals, 1), w = 200, h = 46;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * w, h - 3 - (v - min) / (max - min || 1) * (h - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const zero = h - 3 - (0 - min) / (max - min || 1) * (h - 6);
  const last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="M0 ${zero.toFixed(1)}H${w}" stroke="rgba(255,255,255,.18)" stroke-dasharray="3 4"/><path d="${d} L${w} ${h} L0 ${h}Z" fill="rgba(233,184,201,.16)"/><path d="${d}" fill="none" stroke="#e9b8c9" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="${last[0]}" cy="${last[1]}" r="3" fill="#e9b8c9"/></svg>`;
}

// ---------------------------------------------------------------- спільні блоки
function delta(cur, prev, { invert = false, points = false } = {}) {
  if (!S.data?.hasPrev || cur == null || prev == null || !Number.isFinite(cur) || !Number.isFinite(prev)) return '';
  let d, label;
  if (points) { d = cur - prev; label = (d >= 0 ? '+' : '−') + Math.abs(d * 100).toFixed(1).replace('.', ',') + ' п.п.'; }
  else { if (!prev) return ''; d = (cur - prev) / Math.abs(prev); label = (d >= 0 ? '+' : '−') + Math.abs(d * 100).toFixed(0) + '%'; }
  const flat = Math.abs(d) < (points ? 0.002 : 0.01);
  const cls = flat ? 'flat' : (invert ? d < 0 : d > 0) ? 'up' : 'down';
  return `<span class="delta ${cls}" title="Порівняно з ${fdate(S.data.pFrom)} – ${fdate(S.data.pTo)}">${label}</span>`;
}
// Підказка, якщо період зачіпає архів старого дашборду
function archiveHint(T) {
  if (!T || !T.archDays) return '';
  return `<div class="hint" style="margin-bottom:14px">Дні до ${fdate(String(S.settings.archive_until || '').replace(/"/g, ''))} — <b>архів старого дашборду</b>: цифри перенесено як були. Статуси, причини відмов, UTM-канали і собівартість товарів за ці дні недоступні.</div>`;
}
const usdf = (v) => (v == null || !Number.isFinite(v) ? '—' : nf2.format(Math.round(v * 100) / 100) + ' $');
const kpi = (l, v, s, dl = '', cls = '') => `<div class="kpi ${cls}"><div class="kpi-l"><span>${l}</span>${dl}</div><div class="kpi-v">${v}</div>${s ? `<div class="kpi-s">${s}</div>` : ''}</div>`;
function targetFlag(v, target, better = 'higher', fmt = pct) {
  if (v == null || target == null || target === '') return '';
  const ok = better === 'higher' ? v >= target : v <= target;
  return `<span class="flag ${ok ? 'good' : 'bad'}">ціль ${better === 'higher' ? '≥' : '≤'} ${fmt(target)}</span>`;
}
function hbars(rows, { two = false } = {}) {
  if (!rows.length) return '<div class="empty">Немає даних за період</div>';
  const max = Math.max(1, ...rows.map((r) => r.a + (r.b || 0)));
  return rows.map((r) => `<div class="hb" data-tip="${esc(r.tip || '')}"><div class="nm" title="${esc(r.name)}">${r.html || esc(r.name)}</div><div class="tr"><div class="fl" style="width:${(r.a / max * 100).toFixed(1)}%"></div>${two && r.b ? `<div class="fl s2" style="width:${(r.b / max * 100).toFixed(1)}%"></div>` : ''}</div><div class="val">${r.val}</div></div>`).join('');
}
function plTable(T) {
  const rows = [['Виручка', T.revenue, 'tot'], ['Собівартість товарів', -T.cogs, 'sub'], ['Доставка та комісії', -T.order_costs, 'sub'], ['Сума за відмови', -T.return_costs, 'sub'], ['Валовий прибуток', T.gross, 'tot'], ['Реклама', -T.ads, 'sub']];
  for (const [c, v] of Object.entries(T.byCat).sort((a, b) => b[1] - a[1])) if (c !== 'Реклама') rows.push([c, -v, 'sub']);
  rows.push(['Чистий прибуток', T.net, 'tot final']);
  const base = Math.max(T.revenue, 1);
  return `<table class="pl">${rows.filter((r) => r[2] !== 'sub' || Math.abs(r[1]) >= 0.5).map(([n, v, c]) => `<tr class="${c}"><td>${esc(n)}</td><td class="bc"><div class="b ${v < 0 ? 'neg' : ''}" style="width:${Math.min(100, Math.abs(v) / base * 100).toFixed(1)}%"></div></td><td class="n ${c.includes('tot') && v < 0 ? 'neg' : ''}">${uah(v)}</td><td class="p">${pct(Math.abs(v) / base, 0)}</td></tr>`).join('')}</table>`;
}
function channelRows(D) {
  const m = {};
  const g = (n) => (m[n] = m[n] || { ch: n, leads: 0, sales: 0, revenue: 0, gross: 0, ads: 0 });
  for (const r of D.channels) { const x = g(channelOf(r.utm_source)); x.leads += N(r.leads); x.sales += N(r.sales); x.revenue += N(r.revenue); x.gross += N(r.gross); }
  for (const [ch, v] of Object.entries(D.T.adsByCh)) g(ch).ads += v;
  return Object.values(m).map((c) => ({ ...c, conv: div(c.sales, c.leads), cpo: c.ads ? div(c.ads, c.sales) : null, after: c.gross - c.ads, romi: div(c.gross - c.ads, c.ads) }))
    .sort((a, b) => b.revenue - a.revenue || b.ads - a.ads);
}
function channelTable(rows) {
  const t = S.settings.targets || {};
  return `<div class="tw"><table class="t"><thead><tr><th>Канал</th><th class="n">Заявки</th><th class="n">Продажі</th><th class="n">Конверсія</th><th class="n">Виручка</th><th class="n">Валовий прибуток</th><th class="n">Реклама</th><th class="n">Ціна продажу</th><th class="n">Прибуток після реклами</th><th class="n">ROMI</th></tr></thead><tbody>${rows.map((c) => `<tr>
    <td><b>${esc(c.ch)}</b></td><td class="n">${int(c.leads)}</td><td class="n">${int(c.sales)}</td><td class="n">${pct(c.conv, 0)}</td><td class="n">${uah(c.revenue)}</td><td class="n">${uah(c.gross)}</td>
    <td class="n">${c.ads ? uah(c.ads) : '<span class="muted">—</span>'}</td><td class="n">${c.cpo == null ? '<span class="muted">—</span>' : `<span class="${t.cpo && c.cpo > t.cpo ? 'neg' : ''}">${uah(c.cpo)}</span>`}</td>
    <td class="n ${c.after < 0 ? 'neg' : ''}">${uah(c.after)}</td><td class="n">${c.romi == null ? '<span class="muted">—</span>' : `<span class="flag ${c.romi >= (t.romi ?? 1) ? 'good' : c.romi >= 0 ? 'warn' : 'bad'}">${pct(c.romi, 0)}</span>`}</td></tr>`).join('') || '<tr><td colspan="10" class="empty">Немає даних</td></tr>'}</tbody></table></div>`;
}
function statusesBlock(D) {
  const total = D.statuses.reduce((s, x) => s + N(x.cnt), 0) || 1;
  return hbars(D.statuses.map((s) => ({ name: s.name, html: `<span class="pill ${s.category}">${esc(s.name)}</span>`, a: N(s.cnt), val: `${int(N(s.cnt))} <span class="muted small">${pct(N(s.cnt) / total, 0)}</span>`, tip: `${s.name}: ${int(N(s.cnt))} заявок на ${uah(N(s.amount))}` })));
}
function reasonsBlock(D, limit = 8) {
  return legend([['Відмови', css('--s1')], ['Повернення', css('--s2')]], true) + '<div style="height:6px"></div>' +
    hbars(D.reasons.slice(0, limit).map((r) => ({ name: r.reason, a: N(r.fail), b: N(r.returns), val: int(N(r.fail) + N(r.returns)), tip: `${r.reason}: відмов ${r.fail}, повернень ${r.returns}` })), { two: true });
}
function paymentsBlock(D) {
  const p = D.payments || {}; const payed = N(p.payed), rest = N(p.rest), tot = payed + rest;
  return `<div class="stat-list">
    <div class="stat-row"><span>Оплачено</span><b>${uah(payed)} <span class="muted small">${pct(div(payed, tot), 0)}</span></b></div>
    <div class="stat-row"><span>Не оплачено по продажах</span><b class="${rest > 0 ? 'neg' : ''}">${uah(rest)} <span class="muted small">${int(N(p.unpaid_count))} шт</span></b></div>
    <div class="stat-row"><span>Очікує оплати зараз <span class="muted small">(накладені в дорозі)</span></span><b>${uah(N(p.pending_sum))} <span class="muted small">${int(N(p.pending_count))} шт</span></b></div>
  </div><div style="height:10px"></div>` +
    hbars((p.by_method || []).map((m) => ({ name: m.method, a: N(m.amount), val: uah(N(m.amount)), tip: `${m.method}: ${int(N(m.cnt))} продажів` })));
}
function mgrName(id) { const m = S.managers.find((x) => x.id === N(id)); return m?.name || (id ? 'Менеджер #' + id : 'Без менеджера'); }
function downloadCsv(name, header, rows) {
  if (!LIVE && window.top !== window) { toast('У демо-перегляді завантаження файлів вимкнене. У робочому дашборді CSV завантажиться.'); return; }
  const e = (v) => (v == null ? '' : /[",;\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const blob = new Blob(['﻿' + [header, ...rows].map((r) => r.map(e).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

// ================================================================ ОГЛЯД
PAGES.overview = async (seq) => {
  const D = await loadPeriod(); if (seq !== renderSeq) return;
  const T = D.T, PT = D.PT, tg = S.settings.targets || {};
  const ser = series(D.days, S.group);
  const daySer = series(D.days, 'day');
  $('#page').innerHTML = `${archiveHint(T)}
  <div class="kpis">
    <div class="kpi hero"><div class="kpi-l"><span>Чистий прибуток</span>${delta(T.net, PT.net)}</div><div class="kpi-v ${T.net < 0 ? 'neg' : ''}">${uah(T.net)}</div><div class="kpi-s">Рентабельність ${pct(T.netMargin)} · після всіх витрат</div>${sparkSvg(daySer.map((x) => x.net))}</div>
    ${kpi('Виручка', uah(T.revenue), `${int(T.sales)} продажів${T.pending ? ` · з них ${int(T.pending)} ще в дорозі` : ''}`, delta(T.revenue, PT.revenue))}
    ${kpi('Валовий прибуток', uah(T.gross), `Маржа ${pct(T.grossMargin)}`, delta(T.gross, PT.gross))}
    ${kpi('Заявки', int(T.leads), `Підтв. ${int(T.confirmed)} (${pct(T.confRate, 0)}) · не підтв. ${int(T.unconfirmed)}`, delta(T.leads, PT.leads))}
    ${kpi('Конверсія в продаж', pct(T.conv), `Серед закритих ${pct(T.convClosed)} ${targetFlag(T.conv, tg.conversion)}`, delta(T.conv, PT.conv, { points: true }))}
    ${kpi('Середній чек', uah(T.avg), `Націнка ${pct(T.margin)}`, delta(T.avg, PT.avg))}
    ${kpi('Реклама', uah(T.ads), `ДРР ${pct(T.drr)} від виручки`, delta(T.ads, PT.ads, { invert: true }))}
    ${kpi('ROAS', T.roas == null ? '—' : T.roas.toFixed(2).replace('.', ',') + 'x', `${targetFlag(T.roas, tg.roas, 'higher', (v) => v + 'x') || 'виручка / реклама'} · ROMI ${pct(T.romi, 0)}`, delta(T.roas, PT.roas))}
    ${kpi('Ціна ліда', usdf(T.cplUsd), `${targetFlag(T.cplUsd, tg.cpl_usd, 'lower', usdf) || 'реклама / заявки'} · CPO ${usdf(T.cpoFactUsd)}`, delta(T.cplUsd, PT.cplUsd, { invert: true }))}
    ${kpi('Оплати на рахунок', uah(T.card), 'повна оплата на рахунок ФОП', delta(T.card, PT.card))}
    ${kpi('Відмови й повернення', int(T.fail + T.returns), `${pct(T.refuseRate)} закритих · повернень ${int(T.returns)}`, delta(T.fail + T.returns, PT.fail + PT.returns, { invert: true }))}
  </div>
  <div class="grid">
    <section class="card c8"><div class="card-h"><div><h2 class="card-t">Гроші в динаміці</h2><div class="card-s">Виручка, валовий і чистий прибуток</div></div>${groupSeg()}</div>
      ${legend([['Виручка', css('--s1')], ['Валовий прибуток', css('--s2')], ['Чистий прибуток', css('--s3')]])}<div class="chart" style="margin-top:8px"><canvas id="cMoney" aria-label="Графік виручки та прибутку"></canvas></div></section>
    <section class="card c4"><div class="card-h"><div><h2 class="card-t">Куди йдуть гроші</h2><div class="card-s">Від виручки до чистого прибутку</div></div></div>${plTable(T)}</section>
    <section class="card c8"><div class="card-h"><div><h2 class="card-t">Заявки та продажі</h2><div class="card-s">Нові заявки і ті, що стали продажем</div></div>${groupSeg()}</div>
      ${legend([['Заявки', css('--s1')], ['Продажі', css('--s2')]], true)}<div class="chart" style="margin-top:8px"><canvas id="cOrders" aria-label="Графік заявок і продажів"></canvas></div></section>
    <section class="card c4"><div class="card-h"><div><h2 class="card-t">Воронка</h2><div class="card-s">Заявки періоду за поточним статусом</div></div></div>
      <div class="funnel">${funnelRow('Заявки', T.leads, T.leads, '')}${funnelRow('Підтверджені', T.confirmed, T.leads, '')}${funnelRow('Не підтверджені', T.unconfirmed, T.leads, 's4')}${funnelRow('Продажі', T.success, T.leads, 's2')}${funnelRow('Відмови/повер.', T.fail + T.returns, T.leads, 's3')}</div>
      <div style="height:14px"></div>${statusesBlock(D)}</section>
    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Рекламні канали</h2><div class="card-s">Канал визначається за UTM-міткою замовлення, витрати — з розділу «Витрати»</div></div><button class="btn sm" data-go="ads">Детальніше</button></div>${channelTable(channelRows(D))}</section>
    <section class="card c7"><div class="card-h"><div><h2 class="card-t">Товари-лідери</h2><div class="card-s">Топ-8 за валовим прибутком</div></div><button class="btn sm" data-go="products">Усі товари</button></div>${productsMini(D.products.slice(0, 8))}</section>
    <section class="card c5"><div class="card-h"><div><h2 class="card-t">Оплати</h2><div class="card-s">По продажах періоду</div></div></div>${paymentsBlock(D)}</section>
    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Причини відмов і повернень</h2><div class="card-s">Заявки періоду, що не стали продажем</div></div></div><div style="max-width:760px">${reasonsBlock(D)}</div></section>
  </div>`;
  const draw = () => {
    const s = series(D.days, S.group);
    chart('cMoney', 'line', s.map((x) => x.label), [lineDs('Виручка', s.map((x) => x.revenue), css('--s1'), s.length), lineDs('Валовий прибуток', s.map((x) => x.gross), css('--s2'), s.length), lineDs('Чистий прибуток', s.map((x) => x.net), css('--s3'), s.length)], uah);
    chart('cOrders', 'bar', s.map((x) => x.label), [barDs('Заявки', s.map((x) => x.leads), css('--s1')), barDs('Продажі', s.map((x) => x.sales), css('--s2'))], int);
    $$('[data-group] button').forEach((b) => b.classList.toggle('on', b.dataset.g === S.group));
  };
  draw(); bindGroup(draw);
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  void ser;
};
function funnelRow(label, v, base, cls) {
  const w = base ? Math.max(6, v / base * 100) : 0;
  return `<div class="fstep"><span class="muted">${label}</span><div><div class="fb ${cls}" style="width:${w.toFixed(1)}%">${int(v)}</div></div><span class="tnum" style="text-align:right">${pct(div(v, base), 0)}</span></div>`;
}
function productsMini(list) {
  if (!list.length) return '<div class="empty">Немає продажів за період</div>';
  const max = Math.max(...list.map((p) => N(p.profit)), 1);
  return `<div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="n">Продано</th><th class="n">Виручка</th><th class="n">Прибуток</th><th></th></tr></thead><tbody>${list.map((p) => `<tr><td class="name" title="${esc(p.name)}">${esc(p.name)}</td><td class="n">${int(N(p.sold))}</td><td class="n">${uah(N(p.revenue))}</td><td class="n">${uah(N(p.profit))}</td><td style="width:90px"><div class="minibar"><i style="width:${(N(p.profit) / max * 100).toFixed(0)}%"></i></div></td></tr>`).join('')}</tbody></table></div>`;
}

// ================================================================ МАГАЗИНИ
PAGES.stores = async (seq) => {
  const list = activeStores();
  if (!list.length) { $('#page').innerHTML = '<div class="card"><div class="empty">Магазини з’являться після першої синхронізації. Назви задаються в Налаштуваннях.</div></div>'; return; }
  const [res, expAll, payAll] = await Promise.all([Promise.all(list.map((x) => fetchDays(S.from, S.to, x.id))), api.list('expenses', { from: S.from, to: S.to }), api.list('payouts', { from: S.from, to: S.to }).catch(() => [])]);
  if (seq !== renderSeq) return;
  // Загальні витрати: записи без магазину + загальні щомісячні правила
  const genDays = buildDays(S.from, S.to, [], [...expAll, ...payoutsAsExpenses(payAll)].filter((e) => e.store_id == null), [...S.rules, ...teamRules()].filter((r) => r.store_id == null && r.kind === 'fixed_monthly'), [], [], { managers_in_pnl: false });
  const G = totals(Object.values(genDays)); const general = G.ads + G.other;
  const rows = list.map((x, i) => ({ st: x, days: res[i].days, T: totals(Object.values(res[i].days)), color: storeColor(x.id) }));
  const split = splitN() > 0; // загальні вже розподілені по картках магазинів
  const rev = rows.reduce((a, r) => a + r.T.revenue, 0);
  const net = rows.reduce((a, r) => a + r.T.net, 0) - (split ? 0 : general);
  const tg = S.settings.targets || {};
  $('#page').innerHTML = `
  <div class="kpis">
    <div class="kpi hero"><div class="kpi-l"><span>Чистий прибуток усіх магазинів</span></div><div class="kpi-v ${net < 0 ? 'neg' : ''}">${uah(net)}</div><div class="kpi-s">${split ? `Сума прибутку магазинів · загальні витрати ${uah(general)} вже розділені порівну` : `Прибуток магазинів ${uah(net + general)} − загальні витрати ${uah(general)}`}</div></div>
    ${kpi('Виручка разом', uah(rev), `${int(rows.reduce((a, r) => a + r.T.sales, 0))} продажів`)}
    ${kpi('Реклама разом', uah(rows.reduce((a, r) => a + r.T.ads, 0) + G.ads), G.ads ? `з них загальна ${uah(G.ads)}` : 'по магазинах')}
    ${kpi('Загальні витрати', uah(general), split ? `порівну: по ${uah(general / rows.length)} на магазин` : 'не діляться між магазинами')}
    ${kpi('Магазинів', int(rows.length), rows.map((r) => esc(r.st.name || '#' + r.st.id)).join(' · '))}
  </div>
  <div class="mgr-grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${rows.map((r) => { const T = r.T; return `
    <section class="card">
      <div class="card-h" style="margin-bottom:6px"><div style="display:flex;gap:10px;align-items:center"><i style="width:12px;height:12px;border-radius:4px;background:var(${r.color});display:inline-block"></i><h2 class="card-t" style="font-size:16px">${esc(r.st.name || 'Сайт #' + r.st.id)}</h2></div><span class="flag good">${pct(div(T.revenue, rev), 0)} виручки</span></div>
      <div class="mgr-pay ${T.net < 0 ? 'neg' : ''}" style="margin-top:4px">${uah(T.net)}</div>
      <div class="muted small" style="margin:-4px 0 8px">чистий прибуток магазину · рентабельність ${pct(T.netMargin, 0)}</div>
      <div class="stat-list">
        <div class="stat-row"><span>Заявки → підтв. → продажі</span><b>${int(T.leads)} → ${int(T.confirmed)} → ${int(T.sales)}</b></div>
        <div class="stat-row"><span>Підтверджено</span><b>${pct(T.confRate, 0)} <span class="muted small">не підтв. ${int(T.unconfirmed)}</span></b></div>
        <div class="stat-row"><span>Конверсія</span><b>${pct(T.conv, 0)} ${targetFlag(T.conv, tg.conversion)}</b></div>
        <div class="stat-row"><span>Виручка</span><b>${uah(T.revenue)}</b></div>
        <div class="stat-row"><span>Середній чек</span><b>${uah(T.avg)}</b></div>
        <div class="stat-row"><span>Валовий прибуток</span><b>${uah(T.gross)} <span class="muted small">${pct(T.grossMargin, 0)}</span></b></div>
        <div class="stat-row"><span>ROMI</span><b>${T.romi == null ? '—' : `<span class="flag ${T.romi >= (tg.romi ?? 1) ? 'good' : T.romi >= 0 ? 'warn' : 'bad'}">${pct(T.romi, 0)}</span>`}</b></div>
        <div class="stat-row"><span>Ціна продажу</span><b>${uah(T.cpo)}</b></div>
        <div class="stat-row"><span>Відмови й повернення</span><b>${int(T.fail + T.returns)} <span class="muted small">${pct(T.refuseRate, 0)}</span></b></div>
      </div>
      <div class="exp-h"><span>Витрати магазину</span><b>${uah(T.cogs + T.order_costs + T.return_costs + T.ads + T.other)}</b></div>
      <div class="stat-list exp-list">
        <div class="stat-row"><span>Собівартість товарів</span><b>${uah(T.cogs)}</b></div>
        <div class="stat-row"><span>Доставка й комісії (з CRM)</span><b>${uah(T.order_costs)}</b></div>
        <div class="stat-row"><span>Сума за відмови</span><b>${uah(T.return_costs)}</b></div>
        <div class="stat-row"><span>Реклама</span><b>${uah(T.ads)} <span class="muted small">ДРР ${pct(T.drr, 0)}</span></b></div>
        ${otherCats(T).map(([c, v]) => `<div class="stat-row"><span>${esc(c)}</span><b>${uah(v)}</b></div>`).join('')}
      </div>
      <button class="btn sm" style="margin-top:12px" data-open="${r.st.id}">Відкрити огляд магазину</button>
    </section>`; }).join('')}
    <section class="card">
      <div class="card-h" style="margin-bottom:6px"><h2 class="card-t" style="font-size:16px">Загальні витрати</h2></div>
      <div class="mgr-pay">${uah(general)}</div>
      <div class="muted small" style="margin:-4px 0 10px">${split ? `Витрати без прив’язки до магазину. Діляться порівну: по ${uah(general / rows.length)} на кожен магазин, уже враховано в картках вище.` : 'Витрати без прив’язки до магазину. Віднімаються лише із загального прибутку.'}</div>
      ${hbars(Object.entries(G.byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ name: c, a: v, val: uah(v) })))}
      <button class="btn sm" style="margin-top:12px" data-go="expenses">Внести витрату</button>
    </section>
  </div>
  <section class="card" style="margin-top:14px"><div class="card-h"><div><h2 class="card-t">Магазини в динаміці</h2><div class="card-s" id="cmpSub"></div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><div class="seg" id="metricSeg">${[['revenue', 'Виручка'], ['net', 'Чистий прибуток'], ['sales', 'Продажі'], ['ads', 'Реклама']].map(([k, t]) => `<button data-m="${k}" class="${(S.cmpMetric || 'revenue') === k ? 'on' : ''}">${t}</button>`).join('')}</div>${groupSeg()}</div></div>
    ${legend(rows.map((r) => [r.st.name || '#' + r.st.id, css(r.color)]))}<div class="chart" style="margin-top:8px"><canvas id="cStores" aria-label="Порівняння магазинів"></canvas></div></section>`;
  const draw = () => {
    const mt = S.cmpMetric || 'revenue';
    const sers = rows.map((r) => series(r.days, S.group));
    const labels = sers[0].map((x) => x.label);
    const fmt = mt === 'sales' ? int : uah;
    chart('cStores', 'line', labels, rows.map((r, i) => lineDs(r.st.name || '#' + r.st.id, sers[i].map((x) => x[mt]), css(r.color), labels.length)), fmt);
    $('#cmpSub').textContent = { revenue: 'Виручка кожного магазину', net: 'Чистий прибуток кожного магазину (без загальних витрат)', sales: 'Кількість продажів', ads: 'Витрати на рекламу' }[mt];
    $$('#metricSeg button').forEach((b) => b.classList.toggle('on', b.dataset.m === mt));
    $$('[data-group] button').forEach((b) => b.classList.toggle('on', b.dataset.g === S.group));
  };
  draw(); bindGroup(draw);
  $('#metricSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; S.cmpMetric = b.dataset.m; draw(); });
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => { S.store = N(b.dataset.open); store.set('store', S.store); S.data = null; go('overview'); }));
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
};

// ================================================================ ПО ДНЯХ
// Порядок і видимість стовпців — окремо для кожного користувача, зберігається в базі (settings)
const layoutKey = () => 'ui_days_cols:' + (S.user?.email || 'demo');
const COL_RENAMES = { 'Доставка відмов': 'Сума за відмови' };
const getLayout = () => { const v = S.settings[layoutKey()]; if (!v || !Array.isArray(v.order)) return { order: [], hidden: [] }; const rn = (n) => COL_RENAMES[n] || n; return { order: v.order.map(rn), hidden: (v.hidden || []).map(rn) }; };
function daysLayout(allCols) {
  const L = getLayout(); const byName = new Map(allCols.map((c) => [c[0], c]));
  const order = [...L.order.filter((n) => byName.has(n) && n !== 'Дата'), ...allCols.map((c) => c[0]).filter((n) => n !== 'Дата' && !L.order.includes(n))];
  return [allCols[0], ...order.filter((n) => !(L.hidden || []).includes(n)).map((n) => byName.get(n))];
}
let layoutSaveT = null;
function saveLayout(L) {
  S.settings[layoutKey()] = L;
  clearTimeout(layoutSaveT);
  layoutSaveT = setTimeout(() => api.setSetting(layoutKey(), L).catch((e) => toast('Не вдалося зберегти стовпці: ' + e.message, true)), 500);
}
function openColsPanel(btn, allCols) {
  if (document.querySelector('.cols-pop')) { document.querySelector('.cols-pop').remove(); return; }
  const names = () => { const L = getLayout(); const rest = allCols.map((c) => c[0]).filter((n) => n !== 'Дата'); return [...L.order.filter((n) => rest.includes(n)), ...rest.filter((n) => !L.order.includes(n))]; };
  const pop = document.createElement('div'); pop.className = 'pop cols-pop';
  const draw = () => {
    const L = getLayout(); const hidden = new Set(L.hidden || []); const list = names();
    pop.innerHTML = `<div style="padding:6px 8px 4px"><div style="font-weight:650">Стовпці таблиці</div><div class="muted small">Перетягніть, щоб змінити порядок. Зніміть галочку, щоб сховати.</div></div>
      <div class="col-row fixed"><span class="grip"></span><input type="checkbox" checked disabled><span class="nm">Дата</span><span class="muted small">завжди перша</span></div>
      ${list.map((n, i) => `<div class="col-row" draggable="true" data-col="${esc(n)}"><span class="grip">${icon('grip')}</span><input type="checkbox" ${hidden.has(n) ? '' : 'checked'} data-ck="${esc(n)}"><span class="nm">${esc(n)}</span><span class="arr"><button data-mv="-1" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Вище">${icon('up')}</button><button data-mv="1" data-i="${i}" ${i === list.length - 1 ? 'disabled' : ''} aria-label="Нижче" class="dn">${icon('up')}</button></span></div>`).join('')}
      <div style="display:flex;justify-content:space-between;padding:8px 6px 4px"><button class="btn sm" id="colReset">Скинути</button><button class="btn sm primary" id="colDone">Готово</button></div>`;
  };
  const apply = (order, hidden) => { saveLayout({ order, hidden }); draw(); rerenderTable(); };
  const rerenderTable = () => render();
  draw();
  document.body.appendChild(pop);
  pop.style.position = 'fixed'; pop.style.width = '300px'; pop.style.zIndex = '60'; pop.style.maxHeight = (innerHeight - 24) + 'px'; pop.style.overflowY = 'auto';
  const place = () => { const b = $('#colsBtn') || btn; const rc = b.getBoundingClientRect(); pop.style.left = Math.max(8, Math.min(rc.right - 300, innerWidth - 308)) + 'px'; pop.style.top = Math.max(8, Math.min(rc.bottom + 6, innerHeight - pop.offsetHeight - 8)) + 'px'; };
  place();
  pop.addEventListener('click', (e) => {
    e.stopPropagation();
    const mv = e.target.closest('[data-mv]');
    if (mv) { const list = names(); const i = N(mv.dataset.i), j = i + N(mv.dataset.mv); [list[i], list[j]] = [list[j], list[i]]; apply(list, getLayout().hidden || []); return; }
    if (e.target.id === 'colReset') { apply([], []); return; }
    if (e.target.id === 'colDone') pop.remove();
  });
  pop.addEventListener('change', (e) => {
    const ck = e.target.closest('[data-ck]'); if (!ck) return;
    const hidden = new Set(getLayout().hidden || []); if (ck.checked) hidden.delete(ck.dataset.ck); else hidden.add(ck.dataset.ck);
    apply(names(), [...hidden]);
  });
  let dragName = null;
  pop.addEventListener('dragstart', (e) => { const r = e.target.closest('[data-col]'); if (!r) return; dragName = r.dataset.col; r.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragName); } catch { /* ok */ } });
  pop.addEventListener('dragover', (e) => { const r = e.target.closest('[data-col]'); if (!r || !dragName) return; e.preventDefault(); $$('.col-row', pop).forEach((x) => x.classList.remove('over-top', 'over-bot')); const rc = r.getBoundingClientRect(); r.classList.add(e.clientY < rc.top + rc.height / 2 ? 'over-top' : 'over-bot'); });
  pop.addEventListener('dragend', () => { dragName = null; $$('.col-row', pop).forEach((x) => x.classList.remove('dragging', 'over-top', 'over-bot')); });
  pop.addEventListener('drop', (e) => {
    const r = e.target.closest('[data-col]'); if (!r || !dragName) return; e.preventDefault();
    const rc = r.getBoundingClientRect(); const after = e.clientY >= rc.top + rc.height / 2;
    const list = names().filter((n) => n !== dragName); let idx = list.indexOf(r.dataset.col); if (idx < 0) return; if (after) idx++;
    list.splice(idx, 0, dragName); dragName = null; apply(list, getLayout().hidden || []);
  });
  pop.addEventListener('keydown', (e) => { if (e.key === 'Escape') pop.remove(); });
  setTimeout(() => document.addEventListener('click', function h(ev) { if (!document.body.contains(pop)) { document.removeEventListener('click', h); return; } if (!pop.contains(ev.target) && ev.target.id !== 'colsBtn') { pop.remove(); document.removeEventListener('click', h); } }), 0);
}

PAGES.days = async (seq) => {
  const D = await loadPeriod(); if (seq !== renderSeq) return;
  const rows = Object.entries(D.days).map(([d, x]) => ({ d, ...totals([x]) })).reverse();
  const T = D.T;
  const allCols = [
    ['Дата', (r) => `<b>${fdate(r.d)}</b> <span class="muted small">${['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][P(r.d).getUTCDay()]}</span>${r.d && r.archDays ? ' <span class="pill work" title="Архів старого дашборду: цифри перенесено як були">архів</span>' : ''}`],
    ['Заявки', (r) => int(r.leads), 1], ['Підтв.', (r) => `<b>${int(r.confirmed)}</b>`, 1], ['Не підтв.', (r) => (r.unconfirmed ? `<span class="warn-t">${int(r.unconfirmed)}</span>` : '0'), 1], ['% підтв.', (r) => pct(r.confRate, 0), 1], ['Продажі', (r) => int(r.sales), 1], ['Відмови', (r) => (r.fail ? `<span class="neg">${int(r.fail)}</span>` : '0'), 1], ['Повер.', (r) => int(r.returns), 1], ['Сума за відмови', (r) => (r.return_costs ? `<span class="neg">${uah(r.return_costs)}</span>` : '<span class="muted">0 ₴</span>'), 1],
    ['Конверсія', (r) => pct(r.conv, 0), 1], ['Виручка', (r) => uah(r.revenue), 1], ['Собівартість', (r) => uah(r.cogs), 1], ['Валовий', (r) => uah(r.gross), 1],
    ['Реклама', (r) => (r.d ? `<button class="cell-edit" data-adday="${r.d}" title="Натисніть, щоб внести рекламу за цей день">${r.ads ? uah(r.ads) : '<span class="muted">+ внести</span>'}${icon('edit')}</button>` : uah(r.ads)), 1],
    ['З/п менеджерів', (r) => (r.mgrPay ? `<span class="neg">${uah(r.mgrPay)}</span>` : '<span class="muted">0 ₴</span>'), 1],
    ['Податки', (r) => uah(taxOf(r)), 1],
    ['Інші витрати', (r) => { const t = otherTip(r); const v = r.other - taxOf(r) - r.mgrPay; return t ? `<span class="has-tip" data-tip="${esc(t)}">${uah(v)}</span>` : uah(v); }, 1],
    ['Чистий прибуток', (r) => `<b class="${r.net < 0 ? 'neg' : ''}">${uah(r.net)}</b>`, 1, 'col-net'],
    ['Оплати на рахунок', (r) => (r.d ? `<button class="cell-edit" data-cardday="${r.d}" title="Натисніть, щоб внести оплати на рахунок">${r.card ? uah(r.card) : '<span class="muted">+ внести</span>'}${icon('edit')}</button>` : uah(r.card)), 1],
    ['ROAS', (r) => (r.roas == null ? '<span class="muted">—</span>' : `<span class="${N(S.settings.targets?.roas) && r.roas < N(S.settings.targets.roas) ? 'neg' : ''}">${r.roas.toFixed(2).replace('.', ',')}x</span>`), 1],
    ['Ціна ліда, $', (r) => (r.cplUsd == null ? '<span class="muted">—</span>' : `<span class="${N(S.settings.targets?.cpl_usd) && r.cplUsd > N(S.settings.targets.cpl_usd) ? 'neg' : ''}">${usdf(r.cplUsd)}</span>`), 1],
    ['CPO план, $', (r) => (r.cpoPlanUsd == null ? '<span class="muted">—</span>' : usdf(r.cpoPlanUsd)), 1],
    ['CPO факт, $', (r) => (r.cpoFactUsd == null ? '<span class="muted">—</span>' : usdf(r.cpoFactUsd)), 1],
    ['Ціна продажу', (r) => uah(r.cpo), 1],
  ];
  const cols = daysLayout(allCols);
  $('#page').innerHTML = `${archiveHint(T)}
  <div class="kpis">
    ${kpi('Чистий прибуток', `<span class="${T.net < 0 ? 'neg' : ''}">${uah(T.net)}</span>`, `В середньому ${uah(T.net / Math.max(1, rows.length))} на день`, delta(T.net, D.PT.net))}
    ${kpi('Виручка', uah(T.revenue), `${uah(T.revenue / Math.max(1, rows.length))} на день`, delta(T.revenue, D.PT.revenue))}
    ${kpi('Продажі', int(T.sales), `${(T.sales / Math.max(1, rows.length)).toFixed(1).replace('.', ',')} на день${T.pending ? ` · ${int(T.pending)} ще в дорозі` : ''}`, delta(T.sales, D.PT.sales))}
    ${kpi('Заявки', int(T.leads), `${(T.leads / Math.max(1, rows.length)).toFixed(1).replace('.', ',')} на день · не підтв. ${int(T.unconfirmed)}`, delta(T.leads, D.PT.leads))}
    ${kpi('Реклама', uah(T.ads), `${uah(T.ads / Math.max(1, rows.length))} на день`, delta(T.ads, D.PT.ads, { invert: true }))}
    ${kpi('Підтверджені', int(T.confirmed), `${pct(T.confRate, 0)} заявок · ціна ${uah(T.cpc)}`, delta(T.confRate, D.PT.confRate, { points: true }))}
    ${kpi('Сума за відмови', `<span class="neg">${uah(T.return_costs)}</span>`, `${int(T.fail + T.returns)} відмов × ${uah(N(S.settings.refusal_cost_default))}`, delta(T.return_costs, D.PT.return_costs, { invert: true }))}
    ${kpi('З/п менеджерів', uah(T.mgrPay), 'вже віднято від прибутку', delta(T.mgrPay, D.PT.mgrPay, { invert: true }))}
    ${kpi('Оплати на рахунок', uah(T.card), 'вносяться в таблиці нижче', delta(T.card, D.PT.card))}
    ${kpi('ROAS', T.roas == null ? '—' : T.roas.toFixed(2).replace('.', ',') + 'x', targetFlag(T.roas, S.settings.targets?.roas, 'higher', (v) => v + 'x') || 'виручка / реклама', delta(T.roas, D.PT.roas))}
    ${kpi('Ціна ліда', usdf(T.cplUsd), targetFlag(T.cplUsd, S.settings.targets?.cpl_usd, 'lower', usdf) || 'реклама / заявки', delta(T.cplUsd, D.PT.cplUsd, { invert: true }))}
    ${kpi('CPO план / факт', `${usdf(T.cpoPlanUsd)} <span class="muted" style="font-size:14px">/ ${usdf(T.cpoFactUsd)}</span>`, 'реклама / підтверджені')}
  </div>
  <section class="card"><div class="card-h"><div><h2 class="card-t">Щоденний звіт</h2><div class="card-s">Реклама й витрати, внесені за період, розподілені по днях</div></div><div style="display:flex;gap:8px"><button class="btn sm" id="colsBtn">${icon('cols')}Стовпці</button><button class="btn sm" id="csv">${icon('dl')}CSV</button></div></div>
    <div class="tw tbl-scroll"><table class="t"><thead><tr>${cols.map((c) => `<th class="${c[2] ? 'n' : ''} ${c[3] || ''}">${c[0]}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td class="${c[2] ? 'n' : ''} ${c[3] || ''}">${c[1](r)}</td>`).join('')}</tr>`).join('')}</tbody>
    <tfoot><tr>${cols.map((c, i) => `<td class="${c[2] ? 'n' : ''} ${c[3] || ''}">${i === 0 ? 'Разом' : c[1]({ d: '', ...T })}</td>`).join('')}</tr></tfoot></table></div></section>`;
  S.daysD = D;
  $('#colsBtn').addEventListener('click', (e) => { e.stopPropagation(); openColsPanel($('#colsBtn'), allCols); });
  $('#csv').addEventListener('click', () => downloadCsv(`dni_${S.from}_${S.to}.csv`, ['Дата', 'Заявки', 'Підтверджені', 'Не підтверджені', 'Продажі', 'Відмови', 'Повернення', 'Виручка', 'Собівартість', 'Доставка/комісії', 'Сума за відмови', 'Валовий', 'Реклама', 'З/п менеджерів', 'Інші витрати', 'Чистий', 'Оплати на рахунок'],
    rows.map((r) => [r.d, r.leads, r.confirmed, r.unconfirmed, r.sales, r.fail, r.returns, r.revenue.toFixed(2), r.cogs.toFixed(2), r.order_costs.toFixed(2), r.return_costs.toFixed(2), r.gross.toFixed(2), r.ads.toFixed(2), r.mgrPay.toFixed(2), (r.other - r.mgrPay).toFixed(2), r.net.toFixed(2), r.card.toFixed(2)])));
};

document.addEventListener('click', (e) => { const b = e.target.closest?.('#page [data-adday]'); if (b && S.daysD) openAdCell(b, b.dataset.adday, S.daysD); });
// Швидке внесення реклами прямо в таблиці «По днях»
const QUICK = 'По днях';
function openAdCell(btn, day, D) {
  document.querySelector('.ad-pop')?.remove();
  const targets = S.store != null ? activeStores().filter((x) => x.id === S.store) : activeStores();
  const list = targets.length ? targets : [{ id: null, name: 'Реклама' }];
  const cur = store.get('adCur', 'USD'), ch = store.get('adCh', (S.settings.ad_channels || ['Meta'])[0]);
  const quickFor = (id) => D.expenses.find((e) => e.category === 'Реклама' && e.comment === QUICK && e.date === day && !e.date_to && (e.store_id ?? null) === id && (e.channel || '') === ch);
  const otherAds = (id) => D.expenses.filter((e) => e.category === 'Реклама' && (e.store_id ?? null) === id && e.date <= day && (e.date_to || e.date) >= day && e !== quickFor(id)).length;
  const pop = document.createElement('div'); pop.className = 'pop ad-pop';
  pop.innerHTML = `<div style="padding:6px 6px 2px"><div style="font-weight:650">Реклама за ${fdate(day)}</div><div class="muted small">Сума за день по кожному магазину</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 6px">
      <label class="f">Канал<select id="apCh">${(S.settings.ad_channels || ['Meta']).map((c) => `<option ${c === ch ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      <label class="f">Валюта<select id="apCur">${['USD', 'UAH', 'EUR'].map((c) => `<option ${c === cur ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    </div>
    <div id="apRows" style="display:flex;flex-direction:column;gap:8px;padding:0 6px 8px"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;padding:4px 6px 6px"><button class="btn sm" id="apCancel">Скасувати</button><button class="btn sm primary" id="apSave">Зберегти</button></div>`;
  const drawRows = () => {
    const chv = $('#apCh', pop).value;
    $('#apRows', pop).innerHTML = list.map((x) => {
      const q = D.expenses.find((e) => e.category === 'Реклама' && e.comment === QUICK && e.date === day && !e.date_to && (e.store_id ?? null) === x.id && (e.channel || '') === chv);
      const others = otherAds(x.id);
      return `<label class="f">${esc(x.name || 'Сайт #' + x.id)}${others ? ` <span class="muted small">(ще є ${others} запис(и) реклами на цей день)</span>` : ''}<input type="text" inputmode="decimal" data-ap="${x.id ?? ''}" data-eid="${q?.id ?? ''}" value="${q ? nf2.format(N(q.amount)).replace(/\s/g, '') : ''}" placeholder="0"></label>`;
    }).join('');
    $('#apRows input', pop)?.focus();
  };
  document.body.appendChild(pop);
  pop.style.position = 'fixed'; pop.style.width = '300px'; pop.style.zIndex = '60';
  drawRows();
  const rc = btn.getBoundingClientRect(), ph = pop.offsetHeight;
  pop.style.left = Math.max(8, Math.min(rc.right - 300, innerWidth - 308)) + 'px';
  pop.style.top = (rc.bottom + 6 + ph > innerHeight ? Math.max(8, rc.top - ph - 6) : rc.bottom + 6) + 'px';
  const onScroll = () => close(); window.addEventListener('scroll', onScroll, { once: true, capture: true });
  $('#apCh', pop).addEventListener('change', drawRows);
  const close = () => pop.remove();
  $('#apCancel', pop).addEventListener('click', close);
  pop.addEventListener('click', (e) => e.stopPropagation());
  pop.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); if (e.key === 'Enter') $('#apSave', pop).click(); });
  $('#apSave', pop).addEventListener('click', async () => {
    const chv = $('#apCh', pop).value, curv = $('#apCur', pop).value;
    store.set('adCh', chv); store.set('adCur', curv);
    try {
      for (const inp of $$('[data-ap]', pop)) {
        const v = parseFloat(inp.value.replace(/\s/g, '').replace(',', '.'));
        const id = inp.dataset.eid ? N(inp.dataset.eid) : null;
        const storeId = inp.dataset.ap === '' ? null : N(inp.dataset.ap);
        if (!Number.isFinite(v) || v <= 0) { if (id) await api.remove('expenses', id); continue; }
        const row = { date: day, date_to: null, category: 'Реклама', channel: chv, amount: v, currency: curv, rate: rateFor(curv), comment: QUICK, store_id: storeId };
        if (id) await api.update('expenses', id, row); else await api.insert('expenses', row);
        if (storeId != null) await fixCpo(day, storeId, v * rateFor(curv));
      }
      close(); S.data = null; toast('Рекламу збережено'); render();
    } catch (e) { toast(e.message, true); }
  });
  setTimeout(() => document.addEventListener('click', function h(ev) { if (!pop.contains(ev.target)) { close(); document.removeEventListener('click', h); } }), 0);
}

// «CPO план»: при першому внесенні реклами за день фіксуємо рекламу і кількість підтверджених замовлень
// цього магазину на цей момент (як у старому дашборді одягу). Далі не змінюється.
async function fixCpo(day, storeId, adsUah) {
  try {
    const ex = (await api.rows('daily_manual', { store_id: storeId, day }))[0];
    if (ex && N(ex.cpo_orders) > 0) return;
    const r = (await api.rpc('stats_daily', { p_from: day, p_to: day, p_fin: fin(), p_store: storeId }))[0];
    const conf = N(r?.confirmed);
    if (!conf || !adsUah) return;
    await api.upsert('daily_manual', { store_id: storeId, day, cpo_ads: Math.round(adsUah * 100) / 100, cpo_orders: conf }, 'store_id,day');
  } catch (e) { console.warn('CPO', e); }
}

// «Оплати на рахунок» прямо в таблиці «По днях»
document.addEventListener('click', (e) => { const b = e.target.closest?.('#page [data-cardday]'); if (b && S.daysD) openCardCell(b, b.dataset.cardday); });
async function openCardCell(btn, day) {
  document.querySelector('.ad-pop')?.remove();
  const list = S.store != null ? activeStores().filter((x) => x.id === S.store) : activeStores();
  if (!list.length) return toast('Спершу потрібні магазини', true);
  let existing = [], auto = [];
  try { [existing, auto] = await Promise.all([api.rows('daily_manual', { day }), api.rpc('card_auto', { p_from: day, p_to: day }).catch(() => [])]); } catch (e) { return toast(e.message, true); }
  const autoOf = (sid) => (auto || []).filter((r) => N(r.sajt) === sid).reduce((a, r) => a + N(r.amount), 0);
  const isLive = day > String(S.settings.archive_until || '').replace(/"/g, '');
  const pop = document.createElement('div'); pop.className = 'pop ad-pop';
  pop.innerHTML = `<div style="padding:6px 6px 2px"><div style="font-weight:650">Оплати на рахунок за ${fdate(day)}</div><div class="muted small">${isLive ? 'Із CRM підтягується автоматично («повна оплата», «ПП150» у коментарі). Тут — лише ручна корекція, ₴ (може бути з мінусом)' : 'Клієнт оплатив на рахунок ФОП, ₴'}</div></div>
    <div style="display:flex;flex-direction:column;gap:8px;padding:8px 6px">${list.map((x) => { const r = existing.find((q) => N(q.store_id) === x.id); return `<label class="f">${storeDot(x.id)} ${esc(x.name || 'Сайт #' + x.id)}${isLive ? ` <span class="muted small">з CRM: ${uah(autoOf(x.id))}</span>` : ''}<input type="text" inputmode="decimal" data-cp="${x.id}" value="${r && N(r.card_payments) ? nf2.format(N(r.card_payments)).replace(/\s/g, '') : ''}" placeholder="0"></label>`; }).join('')}</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;padding:4px 6px 6px"><button class="btn sm" id="cpCancel">Скасувати</button><button class="btn sm primary" id="cpSave">Зберегти</button></div>`;
  document.body.appendChild(pop);
  pop.style.position = 'fixed'; pop.style.width = '300px'; pop.style.zIndex = '60';
  const rc = btn.getBoundingClientRect(), ph = pop.offsetHeight;
  pop.style.left = Math.max(8, Math.min(rc.right - 300, innerWidth - 308)) + 'px';
  pop.style.top = (rc.bottom + 6 + ph > innerHeight ? Math.max(8, rc.top - ph - 6) : rc.bottom + 6) + 'px';
  $('[data-cp]', pop)?.focus();
  const close = () => pop.remove();
  window.addEventListener('scroll', close, { once: true, capture: true });
  $('#cpCancel', pop).addEventListener('click', close);
  pop.addEventListener('click', (e) => e.stopPropagation());
  pop.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); if (e.key === 'Enter') $('#cpSave', pop).click(); });
  $('#cpSave', pop).addEventListener('click', async () => {
    try {
      for (const inp of $$('[data-cp]', pop)) {
        const v = parseFloat(inp.value.replace(/\s/g, '').replace(',', '.'));
        const sid = N(inp.dataset.cp); const had = existing.find((q) => N(q.store_id) === sid);
        const val = Number.isFinite(v) && (isLive || v > 0) ? v : 0;
        if (!had && !val) continue;
        if (had && N(had.card_payments) === val) continue;
        await api.upsert('daily_manual', { store_id: sid, day, card_payments: val }, 'store_id,day');
      }
      close(); S.data = null; toast('Оплати збережено'); render();
    } catch (e) { toast(e.message, true); }
  });
  setTimeout(() => document.addEventListener('click', function h(ev) { if (!pop.contains(ev.target)) { close(); document.removeEventListener('click', h); } }), 0);
}

// ================================================================ ПО МІСЯЦЯХ
PAGES.months = async (seq) => {
  const nowY = new Date().getFullYear();
  const y = S.year || nowY;
  $('#tools').insertAdjacentHTML('beforeend', `<div class="seg" id="yearSeg">${[nowY - 2, nowY - 1, nowY].map((v) => `<button data-y="${v}" class="${v === y ? 'on' : ''}">${v}</button>`).join('')}</div>`);
  $('#yearSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-y]'); if (b) { S.year = +b.dataset.y; render(); } });
  const from = `${y}-01-01`, to = y === nowY ? ymd(new Date()) : `${y}-12-31`;
  const { days } = await fetchDays(from, to);
  if (seq !== renderSeq) return;
  const ms = series(days, 'month').filter((m) => m.leads || m.revenue || m.ads || m.other);
  const YT = totals(Object.values(days));
  $('#page').innerHTML = `
  <div class="kpis">
    <div class="kpi hero"><div class="kpi-l"><span>Чистий прибуток за ${y}</span></div><div class="kpi-v ${YT.net < 0 ? 'neg' : ''}">${uah(YT.net)}</div><div class="kpi-s">Рентабельність ${pct(YT.netMargin)}</div>${sparkSvg(ms.map((m) => m.net))}</div>
    ${kpi('Виручка', uah(YT.revenue), `${int(YT.sales)} продажів`)}
    ${kpi('Валовий прибуток', uah(YT.gross), `Маржа ${pct(YT.grossMargin)}`)}
    ${kpi('Реклама', uah(YT.ads), `ДРР ${pct(YT.drr)}`)}
    ${kpi('ROMI', pct(YT.romi, 0), 'За рік')}
  </div>
  <div class="grid">
    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Чистий прибуток по місяцях</h2><div class="card-s">${y} рік</div></div></div>
      ${legend([['Виручка', css('--s1')], ['Чистий прибуток', css('--s3')]], true)}<div class="chart" style="margin-top:8px"><canvas id="cMonths" aria-label="Прибуток по місяцях"></canvas></div></section>
    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Місяці</h2><div class="card-s">Натисніть на місяць, щоб відкрити його огляд</div></div></div>
      <div class="tw"><table class="t"><thead><tr><th>Місяць</th><th class="n">Заявки</th><th class="n">Підтв.</th><th class="n">% підтв.</th><th class="n">Продажі</th><th class="n">Конверсія</th><th class="n">Виручка</th><th class="n">Середній чек</th><th class="n">Валовий</th><th class="n">Реклама</th><th class="n">ROMI</th><th class="n">Інші витрати</th><th class="n">Чистий прибуток</th><th class="n">Рентаб.</th></tr></thead>
      <tbody>${ms.slice().reverse().map((m) => `<tr style="cursor:pointer" data-month="${m.key}"><td><b>${MONTHS[+m.key.slice(5, 7) - 1]}</b></td><td class="n">${int(m.leads)}</td><td class="n">${int(m.confirmed)}</td><td class="n">${pct(m.confRate, 0)}</td><td class="n">${int(m.sales)}</td><td class="n">${pct(m.conv, 0)}</td><td class="n">${uah(m.revenue)}</td><td class="n">${uah(m.avg)}</td><td class="n">${uah(m.gross)}</td><td class="n">${uah(m.ads)}</td><td class="n">${pct(m.romi, 0)}</td><td class="n">${uah(m.other)}</td><td class="n"><b class="${m.net < 0 ? 'neg' : ''}">${uah(m.net)}</b></td><td class="n">${pct(m.netMargin, 0)}</td></tr>`).join('') || '<tr><td colspan="14" class="empty">Немає даних за рік</td></tr>'}</tbody>
      <tfoot><tr><td>Разом</td><td class="n">${int(YT.leads)}</td><td class="n">${int(YT.confirmed)}</td><td class="n">${pct(YT.confRate, 0)}</td><td class="n">${int(YT.sales)}</td><td class="n">${pct(YT.conv, 0)}</td><td class="n">${uah(YT.revenue)}</td><td class="n">${uah(YT.avg)}</td><td class="n">${uah(YT.gross)}</td><td class="n">${uah(YT.ads)}</td><td class="n">${pct(YT.romi, 0)}</td><td class="n">${uah(YT.other)}</td><td class="n">${uah(YT.net)}</td><td class="n">${pct(YT.netMargin, 0)}</td></tr></tfoot></table></div></section>
  </div>`;
  chart('cMonths', 'bar', ms.map((m) => MON[+m.key.slice(5, 7) - 1]), [barDs('Виручка', ms.map((m) => m.revenue), css('--s1')), barDs('Чистий прибуток', ms.map((m) => m.net), css('--s3'))], uah);
  $('tbody', $('#page'))?.addEventListener('click', (e) => {
    const tr = e.target.closest('[data-month]'); if (!tr) return;
    const k = tr.dataset.month; const last = ymd(new Date(+k.slice(0, 4), +k.slice(5, 7), 0));
    store.set('custom', [k + '-01', last > ymd(new Date()) ? ymd(new Date()) : last]); S.preset = 'custom'; store.set('preset', 'custom');
    [S.from, S.to] = rangeFor('custom'); S.group = 'day'; go('overview');
  });
};

// ================================================================ ТОВАРИ
PAGES.products = async (seq) => {
  const D = await loadPeriod(); if (seq !== renderSeq) return;
  const list = D.products.map((p) => ({ ...p, sold: N(p.sold), refused: N(p.refused), returned: N(p.returned), revenue: N(p.revenue), cost: N(p.cost), profit: N(p.profit) }))
    .map((p) => ({ ...p, buyout: div(p.sold, p.sold + p.refused + p.returned), margin: div(p.profit, p.revenue) }));
  const sold = list.reduce((s, p) => s + p.sold, 0), ref = list.reduce((s, p) => s + p.refused + p.returned, 0);
  const st = S.prodSort || { k: 'profit', dir: -1 };
  $('#page').innerHTML = `
  <div class="kpis">
    ${kpi('Товарів продавалось', int(list.filter((p) => p.sold).length), `з ${int(list.length)} у заявках`)}
    ${kpi('Продано, шт', int(sold), uah(list.reduce((s, p) => s + p.revenue, 0)))}
    ${kpi('Відмови й повернення, шт', int(ref), 'одиниць товару')}
    ${kpi('Викуп', pct(div(sold, sold + ref)), 'продано / (продано + відмови)')}
    ${kpi('Прибуток з товарів', uah(list.reduce((s, p) => s + p.profit, 0)), 'ціна − собівартість')}
    ${kpi('Середня маржа', pct(div(list.reduce((s, p) => s + p.profit, 0), list.reduce((s, p) => s + p.revenue, 0))), 'по товарах')}
  </div>
  <div class="grid">
    <section class="card c8"><div class="card-h"><div><h2 class="card-t">Усі товари</h2><div class="card-s">Натисніть на заголовок, щоб відсортувати</div></div><input type="text" id="pSearch" placeholder="Пошук за назвою або SKU" style="max-width:260px" value="${esc(S.prodQ || '')}"></div><div id="pTable"></div></section>
    <section class="card c4"><div class="card-h"><div><h2 class="card-t">Найчастіше не викуповують</h2><div class="card-s">Відмови + повернення, шт</div></div></div>
      ${hbars(list.filter((p) => p.refused + p.returned > 0).sort((a, b) => (b.refused + b.returned) - (a.refused + a.returned)).slice(0, 10).map((p) => ({ name: p.name, a: p.refused, b: p.returned, val: `${int(p.refused + p.returned)} <span class="muted small">викуп ${pct(p.buyout, 0)}</span>`, tip: `${p.name}: продано ${p.sold}, відмов ${p.refused}, повернень ${p.returned}` })), { two: true })}</section>
  </div>`;
  const cols = [['name', 'Товар'], ['sold', 'Продано', 1], ['refused', 'Відмов', 1], ['returned', 'Повер.', 1], ['buyout', 'Викуп', 1], ['revenue', 'Виручка', 1], ['cost', 'Собівартість', 1], ['profit', 'Прибуток', 1], ['margin', 'Маржа', 1]];
  const draw = () => {
    const q = (S.prodQ || '').toLowerCase();
    const rows = list.filter((p) => !q || (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
      .sort((a, b) => { const x = a[st.k] ?? -Infinity, y = b[st.k] ?? -Infinity; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * st.dir; });
    const f = { sold: int, refused: (v) => (v ? `<span class="neg">${int(v)}</span>` : '0'), returned: int, buyout: (v) => pct(v, 0), revenue: uah, cost: uah, profit: (v) => `<b>${uah(v)}</b>`, margin: (v) => pct(v, 0) };
    $('#pTable').innerHTML = `<div class="tw tbl-scroll"><table class="t"><thead><tr>${cols.map(([k, t, n]) => `<th class="sort ${n ? 'n' : ''} ${st.k === k ? 'sorted' : ''}" data-k="${k}">${t}${st.k === k ? (st.dir < 0 ? ' ↓' : ' ↑') : ''}</th>`).join('')}</tr></thead><tbody>${rows.map((p) => `<tr><td class="name" title="${esc(p.name)}">${esc(p.name)}${p.sku ? `<div class="muted small">${esc(p.sku)}</div>` : ''}</td>${cols.slice(1).map(([k]) => `<td class="n">${f[k](p[k])}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="9" class="empty">Нічого не знайдено</td></tr>'}</tbody></table></div>`;
    $('#pTable thead').addEventListener('click', (e) => { const th = e.target.closest('[data-k]'); if (!th) return; st.dir = st.k === th.dataset.k ? -st.dir : -1; st.k = th.dataset.k; S.prodSort = st; draw(); });
  };
  draw();
  $('#pSearch').addEventListener('input', (e) => { S.prodQ = e.target.value; draw(); });
};

// ================================================================ РЕКЛАМА
PAGES.ads = async (seq) => {
  const D = await loadPeriod(); if (seq !== renderSeq) return;
  const T = D.T, PT = D.PT, tg = S.settings.targets || {};
  const rows = channelRows(D);
  const adsList = D.expenses.filter((e) => e.category === 'Реклама');
  const hasMeta = T.mLeads || T.mImpr || T.mClicks;
  $('#page').innerHTML = `${archiveHint(T)}
  <div class="kpis">
    ${kpi('Витрачено на рекламу', uah(T.ads), `${usdf(T.ads / usdRate())} · ДРР ${pct(T.drr)} від виручки`, delta(T.ads, PT.ads, { invert: true }))}
    ${kpi('ROAS', T.roas == null ? '—' : T.roas.toFixed(2).replace('.', ',') + 'x', targetFlag(T.roas, tg.roas, 'higher', (v) => v + 'x') || 'виручка / реклама', delta(T.roas, PT.roas))}
    ${kpi('Ціна ліда', usdf(T.cplUsd), targetFlag(T.cplUsd, tg.cpl_usd, 'lower', usdf) || 'реклама / усі заявки', delta(T.cplUsd, PT.cplUsd, { invert: true }))}
    ${kpi('CPO план / факт', `${usdf(T.cpoPlanUsd)} / ${usdf(T.cpoFactUsd)}`, 'реклама / підтверджені: план — на момент внесення реклами')}
    ${kpi('ROMI', pct(T.romi, 0), targetFlag(T.romi, tg.romi) || '(валовий − реклама) / реклама', delta(T.romi, PT.romi, { points: true }))}
    ${kpi('Ціна продажу', uah(T.cpo), targetFlag(T.cpo, tg.cpo, 'lower', uah) || 'реклама / продажі', delta(T.cpo, PT.cpo, { invert: true }))}
    ${kpi('Ціна заявки', uah(T.cpl), 'реклама / заявки', delta(T.cpl, PT.cpl, { invert: true }))}
    ${kpi('Прибуток після реклами', uah(T.gross - T.ads), 'валовий прибуток − реклама', delta(T.gross - T.ads, PT.gross - PT.ads))}
    ${kpi('Ціна підтвердженого', uah(T.cpc), `реклама / ${int(T.confirmed)} підтверджених`, delta(T.cpc, PT.cpc, { invert: true }))}
  </div>
  <div class="grid">
    ${hasMeta ? `<section class="card c12"><div class="card-h"><div><h2 class="card-t">Meta: ліди та охоплення</h2><div class="card-s">Дані, внесені вручну (перенесені зі старого дашборду)</div></div></div>
      <div class="kpis" style="margin-bottom:0">${kpi('Ліди', int(T.mLeads), `підтверджено ${int(T.mConf)} · ${pct(div(T.mConf, T.mLeads), 0)}`)}${kpi('Замовлень з лідів', int(T.mOrders), '')}${kpi('Покази', int(T.mImpr), `CTR ${pct(div(T.mClicks, T.mImpr), 2)}`)}${kpi('Кліки', int(T.mClicks), `ціна кліку ${usdf(T.mClicks ? T.ads / usdRate() / T.mClicks : null)}`)}</div></section>` : ''}
    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Канали</h2><div class="card-s">UTM-мітки: facebook/instagram → Meta, google → Google, tiktok → TikTok, sms/viber → Розсилки</div></div></div>${channelTable(rows)}</section>
    <section class="card c7"><div class="card-h"><div><h2 class="card-t">Реклама і валовий прибуток</h2><div class="card-s">Окупається, поки помаранчеві стовпці вищі за сині</div></div>${groupSeg()}</div>
      ${legend([['Реклама', css('--s1')], ['Валовий прибуток', css('--s2')]], true)}<div class="chart" style="margin-top:8px"><canvas id="cAds" aria-label="Реклама і валовий прибуток"></canvas></div></section>
    <section class="card c5"><div class="card-h"><div><h2 class="card-t">Внести рекламу</h2><div class="card-s">Можна за день або одразу за тиждень</div></div></div>
      <form class="form" id="adForm" style="grid-template-columns:1fr 1fr">
        <label class="f">Дата<input type="date" name="date" required value="${ymd(new Date())}"></label>
        <label class="f">По яку дату<input type="date" name="date_to"></label>
        ${storeSelect('store_id', S.store)}
        <label class="f">Канал<select name="channel">${(S.settings.ad_channels || []).map((c) => `<option>${esc(c)}</option>`).join('')}</select></label>
        <label class="f">Сума<div style="display:flex;gap:6px"><input type="text" name="amount" inputmode="decimal" required placeholder="0"><select name="currency" style="width:84px"><option>USD</option><option>UAH</option><option>EUR</option></select></div></label>
        <label class="f wide" style="grid-column:span 2">Коментар<input type="text" name="comment" placeholder="Напр. кампанія «Новий рік»"></label>
        <button class="btn primary" style="grid-column:span 2;justify-content:center">${icon('plus')}Додати</button>
      </form>
      <div style="height:14px"></div>
      <div class="tw tbl-scroll" style="max-height:260px">${expTable(adsList, true)}</div></section>
  </div>`;
  const draw = () => { const s = series(D.days, S.group); chart('cAds', 'bar', s.map((x) => x.label), [barDs('Реклама', s.map((x) => x.ads), css('--s1')), barDs('Валовий прибуток', s.map((x) => x.gross), css('--s2'))], uah); $$('[data-group] button').forEach((b) => b.classList.toggle('on', b.dataset.g === S.group)); };
  draw(); bindGroup(draw);
  $('#adForm').addEventListener('submit', async (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); if (await saveExpense({ ...f, category: 'Реклама' })) { S.data = null; render(); } });
  bindExpTable();
};

// ================================================================ МЕНЕДЖЕРИ
// З/п менеджера (як у старому дашборді одягу):
//   ставка × замовлення, які стали підтвердженими або відмовою (за датою заявки)
//   + % від допродажу по викуплених замовленнях. Допродаж можна виправити вручну за конкретний день.
PAGES.managers = async (seq) => {
  const D = await loadPeriod(); if (seq !== renderSeq) return;
  // Частка прибутку магазину (як «20% від прибутку madona» у старому дашборді): люди з роллю «share» з тим самим ім'ям, що в менеджера
  const shares = (S.people || []).filter((p) => p.role === 'share' && p.active !== false && p.pay_kind === 'percent_profit');
  const shareStores = [...new Set(shares.map((p) => (p.store_id == null ? null : N(p.store_id))))];
  const stNet = Object.fromEntries(await Promise.all(shareStores.map(async (id) => [id, totals(Object.values((await fetchDays(S.from, S.to, id)).days)).net])));
  if (seq !== renderSeq) return;
  const shareOf = (name) => shares.filter((p) => (p.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase())
    .map((p) => { const net = N(stNet[p.store_id == null ? null : N(p.store_id)]); return { p, net, amount: Math.max(0, net) * N(p.value) / 100 }; });
  const rows = D.mstats.map((r) => {
    const m = S.managers.find((x) => x.id === N(r.manager_id)) || {};
    const orderPay = N(m.rate_per_order) * N(r.paid_orders), upsellPay = N(m.upsell_pct) * N(r.upsell);
    const sh = shareOf(mgrName(r.manager_id)); const shareAmt = sh.reduce((a, x) => a + x.amount, 0);
    return { ...r, name: mgrName(r.manager_id), m, orderPay, upsellPay, sh, shareAmt, pay: orderPay + upsellPay, total: orderPay + upsellPay + shareAmt, conv: div(N(r.success), N(r.leads)), refuse: div(N(r.fail) + N(r.returns), N(r.success) + N(r.fail) + N(r.returns)) };
  }).filter((r) => N(r.leads) || N(r.sales) || N(r.paid_orders)).sort((a, b) => b.pay - a.pay);
  const totalPay = rows.reduce((s, r) => s + r.pay, 0);
  const totalShare = rows.reduce((s, r) => s + r.shareAmt, 0);
  const det = (D.mgrDaily || []).filter((r) => N(r.sales) || N(r.upsell) || N(r.upsell_potential)).sort((a, b) => String(b.day).localeCompare(String(a.day)) || mgrName(a.manager_id).localeCompare(mgrName(b.manager_id)));
  $('#page').innerHTML = `${archiveHint(D.T)}
  <div class="kpis">
    ${kpi('Зарплатні витрати за період', uah(totalPay + totalShare), totalShare ? `ставка й допродаж ${uah(totalPay)} + частка прибутку ${uah(totalShare)}` : (S.settings.managers_in_pnl === false ? 'не враховується у прибутку' : 'вже віднято від чистого прибутку'))}
    ${kpi('Замовлень до оплати', int(rows.reduce((s, r) => s + N(r.paid_orders), 0)), 'підтверджені + відмови')}
    ${kpi('Допродаж (продано)', uah(rows.reduce((s, r) => s + N(r.upsell), 0)), `у дорозі та продано: ${uah(rows.reduce((s, r) => s + N(r.upsell_potential), 0))}`)}
    ${kpi('З/п на одне замовлення', uah(div(totalPay, rows.reduce((s, r) => s + N(r.paid_orders), 0))), '')}
  </div>
  <div class="mgr-grid">${rows.map((r) => `
    <section class="card mgr-card">
      <div style="display:flex;gap:12px;align-items:center"><div class="ava">${esc((r.name || '?').slice(0, 1))}</div><div><div style="font-weight:650">${esc(r.name)}</div><div class="muted small">${r.m.rate_per_order ? `${uah2(N(r.m.rate_per_order))} за замовлення` : 'ставку не задано'}${r.m.upsell_pct ? ` · ${pct(N(r.m.upsell_pct), 0)} від допродажу` : ''}</div></div></div>
      <div class="mgr-pay">${uah(r.total)}</div>
      <div class="stat-list">
        <div class="stat-row"><span>Підтв. + відмови</span><b>${int(N(r.paid_orders))} шт</b></div>
        <div class="stat-row"><span>Ставка</span><b>${uah(r.orderPay)}</b></div>
        <div class="stat-row"><span>Допродаж (продано)</span><b>${uah(N(r.upsell))}</b></div>
        <div class="stat-row"><span>Допродаж (усього, з тих що в дорозі)</span><b class="muted">${uah(N(r.upsell_potential))}</b></div>
        <div class="stat-row"><span>${pct(N(r.m.upsell_pct), 0)} від допродажу</span><b>${uah(r.upsellPay)}</b></div>
        ${r.sh.map((x) => `<div class="stat-row" style="border-top:1px solid var(--line)"><span>Чистий прибуток ${esc(x.p.store_id == null ? 'бізнесу' : storeLabel(x.p.store_id))}</span><b>${uah(x.net)}</b></div>
        <div class="stat-row"><span>${nf2.format(N(x.p.value))}% від прибутку</span><b class="pos" style="color:var(--pos, #16a34a)">${uah(x.amount)}</b></div>`).join('')}
        <div class="stat-row" style="border-top:1px solid var(--line)"><span>Заявки</span><b>${int(N(r.leads))}</b></div>
        <div class="stat-row"><span>Підтверджено</span><b>${int(N(r.confirmed))} <span class="muted small">${pct(div(N(r.confirmed), N(r.leads)), 0)}</span></b></div>
        <div class="stat-row"><span>Відмови й повернення</span><b class="${r.refuse > 0.3 ? 'neg' : ''}">${pct(r.refuse, 0)}</b></div>
        <div class="stat-row"><span>Виручка з продажів</span><b>${uah(N(r.revenue))}</b></div>
      </div>
    </section>`).join('') || '<div class="card"><div class="empty">Немає даних про менеджерів за період</div></div>'}</div>
  <section class="card" style="margin-top:14px"><div class="card-h"><div><h2 class="card-t">По днях</h2><div class="card-s">Допродаж рахується автоматично з CRM. Олівцем можна виправити суму за день: ручна правка має пріоритет і не затирається синхронізацією.</div></div></div>
    <div class="tw tbl-scroll" style="max-height:520px"><table class="t"><thead><tr><th>Дата</th><th>Менеджер</th><th>Магазин</th><th class="n">Підтв. + відмови</th><th class="n">Допродаж усього</th><th class="n">Допродаж продано</th><th class="n">З/п</th></tr></thead><tbody>${det.map((r) => {
      const m = S.managers.find((x) => x.id === N(r.manager_id)) || {}; const pay = N(m.rate_per_order) * N(r.sales) + N(m.upsell_pct) * N(r.upsell);
      const d = String(r.day).slice(0, 10);
      return `<tr><td style="white-space:nowrap">${fdate(d)}${r.archived ? ' <span class="pill work">архів</span>' : ''}</td><td><b>${esc(mgrName(r.manager_id))}</b></td><td>${storeTag(r.store_id)}</td><td class="n">${int(N(r.sales))}</td><td class="n muted">${uah(N(r.upsell_potential))}</td>
        <td class="n">${r.archived ? uah(N(r.upsell)) : `<button class="cell-edit" data-up="${r.manager_id}|${r.store_id}|${d}|${N(r.upsell)}|${N(r.upsell_auto)}|${r.adjusted ? 1 : 0}" title="${r.adjusted ? `Виправлено вручну. Автоматично: ${uah(N(r.upsell_auto))}` : 'Виправити вручну'}">${uah(N(r.upsell))}${r.adjusted ? ' ✎' : ''}${icon('edit')}</button>`}</td>
        <td class="n" style="color:var(--amber, inherit);font-weight:600">${uah(pay)}</td></tr>`; }).join('') || '<tr><td colspan="7" class="empty">Немає даних</td></tr>'}</tbody></table></div></section>
  <p class="muted small" style="margin-top:14px">Імена та ставки менеджерів — у Налаштуваннях. Частка від прибутку магазину (наприклад, 20% від прибутку madona) налаштовується у вкладці «Зарплата» (роль «Частка прибутку магазину», ім'я — як у менеджера). Вона не віднімається від прибутку, як і в старому дашборді.</p>`;
  $$('[data-up]').forEach((b) => b.addEventListener('click', async () => {
    const [mid, sid, day, cur, auto, adj] = b.dataset.up.split('|');
    const v = prompt(`Допродаж (продано), ₴ — ${mgrName(mid)}, ${fdate(day)}.\nАвтоматично з CRM: ${uah(N(auto))}.\nЗалиште порожнім, щоб повернути автоматичну суму.`, adj === '1' ? cur : '');
    if (v === null) return;
    try {
      if (v.trim() === '') await api.removeWhere('mgr_adjust', { manager_id: N(mid), store_id: N(sid), day });
      else { const n = parseFloat(v.replace(/\s/g, '').replace(',', '.')); if (!Number.isFinite(n)) return toast('Вкажіть число', true); await api.upsert('mgr_adjust', { manager_id: N(mid), store_id: N(sid), day, upsell_amount: n }, 'manager_id,store_id,day'); }
      S.data = null; toast('Збережено'); render();
    } catch (e) { toast(e.message, true); }
  }));
};

// ================================================================ ВИТРАТИ
function expTable(list, compact = false) {
  if (!list.length) return '<div class="empty">Записів немає</div>';
  const showStore = activeStores().length > 1;
  const showWho = list.some((e) => e.created_by);
  return `<table class="t"><thead><tr><th>Дата</th>${showStore ? '<th>Магазин</th>' : ''}${compact ? '' : '<th>Категорія</th>'}<th>Канал</th><th class="n">Сума</th><th class="n">У гривнях</th>${compact ? '' : '<th>Коментар</th>'}${showWho ? '<th>Вніс</th>' : ''}<th></th></tr></thead><tbody>${list.map((e) => `<tr class="${e._share ? 'shared' : ''}" ${e._share ? 'title="Загальна витрата: у цьому магазині рахується його частка. Повна сума — у режимі «Усі магазини»."' : ''}>
    <td style="white-space:nowrap">${fdate(e.date)}${e.date_to ? ' – ' + fdate(e.date_to) : ''}</td>${showStore ? `<td>${storeTag(e.store_id)}${e._share ? ` <span class="muted small">· частка 1/${e._share}</span>` : ''}</td>` : ''}${compact ? '' : `<td>${esc(e.category)}</td>`}<td>${esc(e.channel || '')}</td>
    <td class="n">${nf2.format(N(e.amount))} ${e.currency === 'UAH' ? '₴' : esc(e.currency)}</td><td class="n">${uah(N(e.amount_uah))}</td>${compact ? '' : `<td class="muted small">${esc(e.comment || '')}</td>`}${showWho ? `<td class="muted small" title="${esc(e.created_by || '')}">${esc((e.created_by || '').split('@')[0])}</td>` : ''}
    <td class="n" style="white-space:nowrap">${compact ? '' : `<button class="icon-btn" data-eedit="${e.id}" title="Редагувати">${icon('edit')}</button>`}<button class="icon-btn" data-edel="${e.id}" title="Видалити">${icon('trash')}</button></td></tr>`).join('')}</tbody></table>`;
}
function bindExpTable(list) {
  $$('[data-edel]').forEach((b) => b.addEventListener('click', async () => {
    if (!(await confirmBox('Видалити витрату?', 'Запис зникне зі звітів.'))) return;
    await api.remove('expenses', N(b.dataset.edel)); S.data = null; toast('Видалено'); render();
  }));
  $$('[data-eedit]').forEach((b) => b.addEventListener('click', () => {
    const e = (list || []).find((x) => x.id === N(b.dataset.eedit)); const f = $('#expForm'); if (!e || !f) return;
    for (const k of ['date', 'date_to', 'category', 'channel', 'amount', 'currency', 'comment', 'store_id']) if (f[k]) f[k].value = e[k] ?? '';
    f.dataset.id = e.id; $('#expSubmit').textContent = 'Зберегти зміни'; $('#expCancel').hidden = false; toggleChan(); f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
}
function rateFor(cur) { return cur === 'USD' ? N(S.settings.usd_rate) || 41.5 : cur === 'EUR' ? N(S.settings.eur_rate) || 45 : 1; }
async function saveExpense(f, id) {
  const amount = parseFloat(String(f.amount || '').replace(/\s/g, '').replace(',', '.'));
  if (!f.date || !Number.isFinite(amount) || !f.category) { toast('Заповніть дату, категорію і суму', true); return false; }
  const row = { date: f.date, date_to: f.date_to && f.date_to > f.date ? f.date_to : null, category: f.category, channel: f.category === 'Реклама' ? (f.channel || 'Інше') : null,
    amount, currency: f.currency || 'UAH', rate: rateFor(f.currency || 'UAH'), comment: f.comment || null,
    store_id: f.store_id === undefined ? (S.store ?? null) : (f.store_id === '' ? null : N(f.store_id)) };
  try {
    if (id) await api.update('expenses', N(id), row); else await api.insert('expenses', row);
    if (!id && row.category === 'Реклама' && !row.date_to && row.store_id != null) await fixCpo(row.date, row.store_id, amount * row.rate);
    toast(id ? 'Зміни збережено' : 'Витрату додано'); return true;
  }
  catch (e) { toast(e.message, true); return false; }
}
function storeSelect(name, selected, allowGeneral = true) {
  if (!activeStores().length) return '';
  const opts = (allowGeneral ? [['', 'Загальна (усі магазини)']] : []).concat(activeStores().map((x) => [String(x.id), x.name || 'Сайт #' + x.id]));
  return `<label class="f">Магазин<select name="${name}">${opts.map(([v, t]) => `<option value="${v}" ${String(selected ?? '') === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
}
function toggleChan() { const f = $('#expForm'); if (f) $('#chanF').hidden = f.category.value !== 'Реклама'; }

PAGES.expenses = async (seq) => {
  const D = await loadPeriod(); if (seq !== renderSeq) return;
  D.methods = D.methods || await api.rpc('payment_methods', {}).catch(() => []); if (seq !== renderSeq) return;
  const T = D.T;
  const cats = (S.settings.expense_categories || ['Реклама', 'Інше']).filter((c) => !/^зарплат/i.test(c));
  const byCat = { ...T.byCat };
  const totalExp = Object.values(byCat).reduce((a, b) => a + b, 0);
  const kindL = { percent_revenue: (v) => pct(N(v) / 100, 2) + ' від виручки', fixed_monthly: (v) => uah2(N(v)) + ' на місяць', per_order: (v) => uah2(N(v)) + ' за продаж', percent_payment: (v, r) => `${pct(N(v) / 100, 2)}${N(r.value2) ? ' + ' + uah2(N(r.value2)) : ''} від оплат «${esc(r.method || '—')}»` };
  $('#page').innerHTML = `
  <div class="grid">
    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Додати витрату</h2><div class="card-s">Суму за тиждень або місяць можна внести одним записом: вкажіть «по яку дату», і вона рівномірно розподілиться по днях. Долари переводяться за курсом із налаштувань (${nf2.format(rateFor('USD'))} ₴).</div></div></div>
      <form class="form" id="expForm">
        <label class="f">Дата<input type="date" name="date" required value="${ymd(new Date())}"></label>
        <label class="f">По яку дату<input type="date" name="date_to"></label>
        ${storeSelect('store_id', S.store)}
        <label class="f">Категорія<select name="category">${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</select></label>
        <label class="f" id="chanF">Канал<select name="channel">${(S.settings.ad_channels || []).map((c) => `<option>${esc(c)}</option>`).join('')}</select></label>
        <label class="f">Сума<input type="text" name="amount" inputmode="decimal" required placeholder="0"></label>
        <label class="f">Валюта<select name="currency"><option>UAH</option><option>USD</option><option>EUR</option></select></label>
        <label class="f wide">Коментар<input type="text" name="comment" placeholder="Необов'язково"></label>
        <div style="display:flex;gap:8px"><button class="btn primary" id="expSubmit">${icon('plus')}Додати</button><button type="button" class="btn" id="expCancel" hidden>Скасувати</button></div>
      </form></section>
    <section class="card c8"><div class="card-h"><div><h2 class="card-t">Внесені витрати</h2><div class="card-s">Записи, що зачіпають період ${fdate(S.from)} – ${fdate(S.to)}</div></div></div><div class="tw tbl-scroll">${expTable(D.expenses)}</div></section>
    <section class="card c4"><div class="card-h"><div><h2 class="card-t">Усі витрати періоду</h2><div class="card-s">Ручні + автоматичні правила + з/п менеджерів (без суми за відмови)</div></div></div>
      ${hbars(Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ name: c, a: v, val: uah(v), tip: `${c}: ${uah2(Math.round(v * 100) / 100)}` })))}
      <div class="hb" style="border-top:1px solid var(--line);margin-top:6px;padding-top:10px;font-weight:700"><div>Разом</div><div></div><div class="val">${uah(totalExp)}</div></div>
      <div class="muted small" style="margin-top:6px">Це ${pct(div(totalExp, T.revenue), 0)} від виручки</div></section>
    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Автоматичні витрати</h2><div class="card-s">Рахуються самі кожного дня: податок від виручки, фіксовані платежі на місяць, витрати на кожен продаж, комісії платіжних систем (накладений платіж, еквайринг)</div></div></div>
      <div class="tw"><table class="t"><thead><tr><th>Назва</th><th>Розмір</th><th>Магазин</th><th>Категорія</th><th>Діє</th><th class="n">За період</th><th>Статус</th><th></th></tr></thead><tbody>${S.rules.map((r) => `<tr>
        <td><b>${esc(r.name)}</b></td><td>${kindL[r.kind](r.value, r)}</td><td>${r.store_id == null ? '<span class="muted">Усі</span>' : storeTag(r.store_id)}</td><td>${esc(r.category)}</td><td class="muted small">${r.date_from ? 'з ' + fdate(r.date_from) : 'завжди'}${r.date_to ? ' по ' + fdate(r.date_to) : ''}</td>
        <td class="n">${D.T.byRule[r.id] != null ? uah(D.T.byRule[r.id]) : '<span class="muted">—</span>'}</td>
        <td><button class="btn sm ${r.active ? '' : 'ghost'}" data-rtoggle="${r.id}">${r.active ? '<span class="flag good">Увімкнено</span>' : '<span class="flag warn">Вимкнено</span>'}</button></td>
        <td class="n" style="white-space:nowrap"><button class="icon-btn" data-redit="${r.id}" title="Редагувати">${icon('edit')}</button><button class="icon-btn" data-rdel="${r.id}" title="Видалити">${icon('trash')}</button></td></tr>`).join('') || '<tr><td colspan="8" class="empty">Правил ще немає. Додайте, наприклад, «Єдиний податок — 5% від виручки».</td></tr>'}</tbody></table></div>
      <form class="form" id="ruleForm" style="margin-top:14px">
        <label class="f">Назва<input type="text" name="name" required placeholder="Єдиний податок"></label>
        <label class="f">Тип<select name="kind"><option value="percent_revenue">% від виручки</option><option value="fixed_monthly">Сума на місяць, ₴</option><option value="per_order">За кожен продаж, ₴</option><option value="percent_payment">Комісія за спосіб оплати, %</option></select></label>
        <label class="f">Значення<input type="text" name="value" inputmode="decimal" required placeholder="5"></label>
        <label class="f" data-pm hidden>Спосіб оплати<select name="method">${(D.methods || []).map((m) => `<option value="${esc(m.method)}">${esc(m.method)} (${int(N(m.cnt))})</option>`).join('')}</select></label>
        <label class="f" data-pm hidden>+ за кожен платіж, ₴<input type="text" name="value2" inputmode="decimal" placeholder="0"></label>
        ${storeSelect('store_id', null).replace('Загальна (усі магазини)', 'Усі магазини')}
        <label class="f">Категорія<select name="category">${cats.filter((c) => c !== 'Реклама').map((c) => `<option>${esc(c)}</option>`).join('')}</select></label>
        <label class="f">Діє з<input type="date" name="date_from"></label>
        <label class="f">Діє до<input type="date" name="date_to"></label>
        <div style="display:flex;gap:8px"><button class="btn primary" id="ruleSubmit">${icon('plus')}Додати правило</button><button type="button" class="btn" id="ruleCancel" hidden>Скасувати</button></div>
      </form></section>
  </div>`;
  const f = $('#expForm');
  f.category.value = S.lastCat || 'Реклама'; toggleChan();
  f.category.addEventListener('change', toggleChan);
  f.addEventListener('submit', async (e) => { e.preventDefault(); const v = Object.fromEntries(new FormData(f)); S.lastCat = v.category; if (await saveExpense(v, f.dataset.id)) { S.data = null; render(); } });
  $('#expCancel').addEventListener('click', () => { S.data = S.data; render(); });
  bindExpTable(D.expenses);
  const rf = $('#ruleForm');
  const togglePm = () => $$('[data-pm]', rf).forEach((el) => (el.hidden = rf.kind.value !== 'percent_payment'));
  rf.kind.addEventListener('change', () => { togglePm(); if (rf.kind.value === 'percent_payment') { const o = [...rf.category.options].find((x) => /банк|еквайр|комісі/i.test(x.value)); if (o) rf.category.value = o.value; } });
  rf.addEventListener('submit', async (e) => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(rf)); const value = parseFloat(String(v.value).replace(',', '.'));
    if (!v.name || !Number.isFinite(value)) return toast('Вкажіть назву і значення', true);
    const row = { name: v.name, kind: v.kind, value, category: v.category, date_from: v.date_from || null, date_to: v.date_to || null, store_id: v.store_id ? N(v.store_id) : null, method: v.kind === 'percent_payment' ? (v.method || null) : null, value2: v.kind === 'percent_payment' ? (parseFloat(String(v.value2 || '0').replace(',', '.')) || 0) : 0 };
    if (v.kind === 'percent_payment' && !v.method) return toast('Оберіть спосіб оплати', true);
    try { if (rf.dataset.id) await api.update('rules', N(rf.dataset.id), row); else await api.insert('rules', { ...row, active: true }); S.rules = await api.list('rules'); S.data = null; toast('Правило збережено'); render(); } catch (err) { toast(err.message, true); }
  });
  $('#ruleCancel').addEventListener('click', () => render());
  $$('[data-rtoggle]').forEach((b) => b.addEventListener('click', async () => { const r = S.rules.find((x) => x.id === N(b.dataset.rtoggle)); await api.update('rules', r.id, { active: !r.active }); S.rules = await api.list('rules'); S.data = null; render(); }));
  $$('[data-rdel]').forEach((b) => b.addEventListener('click', async () => { if (!(await confirmBox('Видалити правило?', 'Ця витрата більше не рахуватиметься у звітах.'))) return; await api.remove('rules', N(b.dataset.rdel)); S.rules = await api.list('rules'); S.data = null; render(); }));
  $$('[data-redit]').forEach((b) => b.addEventListener('click', () => { const r = S.rules.find((x) => x.id === N(b.dataset.redit)); for (const k of ['name', 'kind', 'value', 'category', 'date_from', 'date_to', 'store_id', 'method', 'value2']) if (rf[k]) rf[k].value = r[k] ?? ''; togglePm(); rf.dataset.id = r.id; $('#ruleSubmit').textContent = 'Зберегти правило'; $('#ruleCancel').hidden = false; rf.scrollIntoView({ behavior: 'smooth', block: 'center' }); }));
};
function ruleTotal(r, D) {
  if (!r.active) return 0;
  let v = 0;
  for (const [d, x] of Object.entries(D.days)) {
    if ((r.date_from && d < r.date_from) || (r.date_to && d > r.date_to)) continue;
    v += r.kind === 'percent_revenue' ? x.revenue * N(r.value) / 100 : r.kind === 'fixed_monthly' ? N(r.value) / dim(d) : N(r.value) * x.sales;
  }
  return v;
}

// ================================================================ ЗАРПЛАТА
const PAY_KIND = { percent_profit: '% від чистого прибутку', fixed_monthly: 'Фіксовано на місяць', manual: 'Суми вносяться вручну' };
const ROLE = { owner: 'Власник', share: 'Частка прибутку магазину', team: 'Команда / UGC' };
const monthRange = (m) => { const to = ymd(new Date(+m.slice(0, 4), +m.slice(5, 7), 0)); const today = ymd(new Date()); return [m + '-01', to > today ? today : to, to]; };
// Частка прибутку (role = share): % від чистого прибутку обраного магазину (як 20% від прибутку madona у старому дашборді).
// Це розподіл прибутку, як і в власників: від прибутку не віднімається.
function ownerAmount(p, net, payouts, storeNet = {}) {
  const manual = payouts.filter((x) => N(x.person_id) === p.id).reduce((a, x) => a + N(x.amount_uah), 0);
  const baseNet = p.role === 'share' && p.store_id != null ? N(storeNet[N(p.store_id)]) : net;
  const base = p.pay_kind === 'percent_profit' ? Math.max(0, baseNet) * N(p.value) / 100 : p.pay_kind === 'fixed_monthly' ? N(p.value) : 0;
  return base + manual;
}
function payRule(p) {
  const st = p.role === 'team' && p.pay_kind === 'fixed_monthly' ? ` · ${p.store_id == null ? 'загальна' : esc(storeLabel(p.store_id))}` : '';
  if (p.role === 'share' && p.pay_kind === 'percent_profit') return `${nf2.format(N(p.value))}% від чистого прибутку ${p.store_id == null ? 'бізнесу' : esc(storeLabel(p.store_id))}`;
  return p.pay_kind === 'percent_profit' ? `${nf2.format(N(p.value))}% від чистого прибутку` : p.pay_kind === 'fixed_monthly' ? `${uah2(N(p.value))} на місяць${st}` : 'разові виплати';
}
PAGES.salary = async (seq) => {
  const nowM = ymd(new Date()).slice(0, 7);
  const m = S.salMonth || nowM;
  $('#tools').innerHTML = `<label class="f" style="flex-direction:row;align-items:center;gap:8px">Місяць<input type="month" id="salM" value="${m}" max="${nowM}" style="width:170px"></label>`;
  $('#salM').addEventListener('change', (e) => { S.salMonth = e.target.value || nowM; render(); });
  const [from, to, monthEnd] = monthRange(m);
  const hFrom = (() => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 6, 1); return ymd(d); })();
  const shareStores = [...new Set((S.people || []).filter((p) => p.role === 'share' && p.active !== false && p.store_id != null).map((p) => N(p.store_id)))];
  const [cur, hist, payouts, histPay, ...stHist] = await Promise.all([
    fetchDays(from, to, null), fetchDays(hFrom, to, null), api.list('payouts', { from, to: monthEnd }), api.list('payouts', { from: hFrom, to }),
    ...shareStores.map((id) => fetchDays(hFrom, to, id)),
  ]);
  if (seq !== renderSeq) return;
  // Чистий прибуток магазинів (для часток): за поточний місяць і по місяцях історії
  const stNetMonth = (key) => Object.fromEntries(shareStores.map((id, i) => [id, series(stHist[i].days, 'month').find((x) => x.key === key)?.net || 0]));
  const people = S.people || [];
  const owners = people.filter((p) => (p.role === 'owner' || p.role === 'share') && p.active !== false);
  const team = people.filter((p) => p.role === 'team');
  const T = totals(Object.values(cur.days));
  const net = T.net;
  const ownersRows = owners.map((p) => ({ p, amount: ownerAmount(p, net, payouts, stNetMonth(m)) }));
  const ownersTotal = ownersRows.reduce((a, r) => a + r.amount, 0);
  const teamTotal = T.byCat[TEAM_CAT] || 0;
  const mgrTotal = T.byCat['Зарплата менеджерів'] || 0;
  const left = net - ownersTotal;
  const partial = to < monthEnd;
  const pname = (id) => people.find((p) => p.id === N(id))?.name || '—';
  const hs = series(hist.days, 'month');
  $('#page').innerHTML = `
  <div class="kpis">
    <div class="kpi hero"><div class="kpi-l"><span>Залишається в бізнесі</span></div><div class="kpi-v ${left < 0 ? 'neg' : ''}">${uah(left)}</div><div class="kpi-s">Чистий прибуток ${uah(net)} − виплати власникам ${uah(ownersTotal)}${partial ? ' · місяць ще триває' : ''}</div></div>
    ${kpi('Чистий прибуток бізнесу', `<span class="${net < 0 ? 'neg' : ''}">${uah(net)}</span>`, `${MONTHS[+m.slice(5, 7) - 1]} · усі магазини`)}
    ${kpi('Власникам і частки', uah(ownersTotal), owners.map((p) => esc(p.name)).join(' · ') || 'додайте власників нижче')}
    ${kpi('Команда й UGC', uah(teamTotal), 'вже віднято від прибутку')}
    ${kpi('Менеджери', uah(mgrTotal), 'за продажі, вже віднято')}
  </div>
  <div class="grid">
    <section class="card c5"><div class="card-h"><div><h2 class="card-t">Власники</h2><div class="card-s">Розподіл прибутку (власники і частки від прибутку магазину). Від чистого прибутку не віднімається.</div></div></div>
      ${ownersRows.length ? `<div class="stat-list">${ownersRows.map((r) => `<div class="stat-row" style="align-items:center"><span><b>${esc(r.p.name)}</b><br><span class="muted small">${payRule(r.p)}</span></span><b style="font-size:17px">${uah(r.amount)}</b></div>`).join('')}
        <div class="stat-row" style="font-weight:700;border-top:1px solid var(--line)"><span>Разом власникам</span><b>${uah(ownersTotal)}</b></div></div>` : '<div class="empty">Додайте себе в блоці «Люди» з роллю «Власник»</div>'}
      ${net < 0 ? '<div class="hint warn" style="margin-top:10px">Місяць у мінусі, тому відсоток від прибутку дорівнює 0.</div>' : ''}
      ${partial ? '<div class="muted small" style="margin-top:10px">Відсоток рахується від прибутку на сьогодні й зміниться до кінця місяця.</div>' : ''}</section>
    <section class="card c7"><div class="card-h"><div><h2 class="card-t">Внести виплату</h2><div class="card-s">UGC-креатору за відео чи контент, фрилансеру або бонус власнику. Суму команди буде віднято від прибутку обраного магазину.</div></div></div>
      <form class="form" id="payForm">
        <label class="f">Дата<input type="date" name="date" required value="${to}"></label>
        <label class="f">Кому<select name="person_id" required>${people.filter((p) => p.active !== false).sort((x, y) => (x.role === 'team' ? 0 : 1) - (y.role === 'team' ? 0 : 1)).map((p) => `<option value="${p.id}">${esc(p.name)} (${ROLE[p.role].toLowerCase()})</option>`).join('') || '<option value="">спершу додайте людину</option>'}</select></label>
        ${storeSelect('store_id', null) || ''}
        <label class="f">Сума<input type="text" name="amount" inputmode="decimal" required placeholder="0"></label>
        <label class="f">Валюта<select name="currency"><option>UAH</option><option>USD</option><option>EUR</option></select></label>
        <label class="f">Розподілити до (необов.)<input type="date" name="date_to"></label>
        <label class="f wide">Коментар<input type="text" name="comment" placeholder="Напр. 3 відео Lamborghini"></label>
        <div style="display:flex;gap:8px"><button class="btn primary" id="paySubmit">${icon('plus')}Додати</button><button type="button" class="btn" id="payCancel" hidden>Скасувати</button></div>
      </form></section>
    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Виплати за ${MONTHS[+m.slice(5, 7) - 1].toLowerCase()}</h2><div class="card-s">Разові суми, внесені вручну</div></div></div>
      <div class="tw">${payouts.length ? `<table class="t"><thead><tr><th>Дата</th><th>Кому</th><th>Роль</th><th>Магазин</th><th class="n">Сума</th><th class="n">У гривнях</th><th>Коментар</th><th>Вніс</th><th></th></tr></thead><tbody>${payouts.map((x) => { const p = people.find((q) => q.id === N(x.person_id)); return `<tr>
        <td style="white-space:nowrap">${fdate(x.date)}${x.date_to ? ' – ' + fdate(x.date_to) : ''}</td><td><b>${esc(pname(x.person_id))}</b></td><td class="muted small">${p ? ROLE[p.role] : ''}</td>
        <td>${storeTag(x.store_id)}</td>
        <td class="n">${nf2.format(N(x.amount))} ${x.currency === 'UAH' ? '₴' : esc(x.currency)}</td><td class="n">${uah(N(x.amount_uah))}</td><td class="muted small">${esc(x.comment || '')}</td><td class="muted small">${esc((x.created_by || '').split('@')[0])}</td>
        <td class="n" style="white-space:nowrap"><button class="icon-btn" data-pedit="${x.id}" title="Редагувати">${icon('edit')}</button><button class="icon-btn" data-pdel="${x.id}" title="Видалити">${icon('trash')}</button></td></tr>`; }).join('')}</tbody></table>` : '<div class="empty">Цього місяця виплат ще не вносили</div>'}</div></section>
    <section class="card c7"><div class="card-h"><div><h2 class="card-t">Люди</h2><div class="card-s">Власники й команда. Для власника задайте відсоток від прибутку або фіксовану суму.</div></div></div>
      <div class="tw"><table class="t"><thead><tr><th>Ім’я</th><th>Роль</th><th>Як платимо</th><th></th></tr></thead><tbody>${people.map((p) => `<tr class="${p.active === false ? 'muted' : ''}"><td><b>${esc(p.name)}</b>${p.active === false ? ' <span class="small">(неактивний)</span>' : ''}</td><td>${ROLE[p.role]}</td><td class="small">${payRule(p)}</td>
        <td class="n" style="white-space:nowrap"><button class="icon-btn" data-hedit="${p.id}" title="Редагувати">${icon('edit')}</button><button class="icon-btn" data-hdel="${p.id}" title="Видалити">${icon('trash')}</button></td></tr>`).join('') || '<tr><td colspan="4" class="empty">Ще нікого немає</td></tr>'}</tbody></table></div>
      <form class="form" id="personForm" style="margin-top:14px">
        <label class="f">Ім’я<input type="text" name="name" required placeholder="Віктор"></label>
        <label class="f">Роль<select name="role"><option value="owner">Власник</option><option value="share">Частка прибутку магазину</option><option value="team" selected>Команда / UGC</option></select></label>
        <label class="f">Як платимо<select name="pay_kind"><option value="manual">Разові суми вручну</option><option value="percent_profit">% від чистого прибутку</option><option value="fixed_monthly">Фіксовано на місяць</option></select></label>
        <label class="f">Значення<input type="text" name="value" inputmode="decimal" placeholder="30 (%) або 20000 (₴)"></label>
        ${storeSelect('store_id', null) || ''}
        <label class="f" style="flex-direction:row;align-items:center;gap:8px;padding-bottom:8px"><input type="checkbox" name="active" checked style="width:auto;min-height:0">активний</label>
        <div style="display:flex;gap:8px"><button class="btn primary" id="personSubmit">${icon('plus')}Додати людину</button><button type="button" class="btn" id="personCancel" hidden>Скасувати</button></div>
      </form>
      <div class="muted small" style="margin-top:8px">«Магазин» для команди з фіксованою сумою означає, з якого магазину віднімати її щомісяця. Для «Частки прибутку магазину» — від прибутку якого магазину рахувати відсоток.</div></section>
    <section class="card c5"><div class="card-h"><div><h2 class="card-t">Історія по місяцях</h2><div class="card-s">Прибуток, виплати власникам і що лишилось</div></div></div>
      <div class="tw"><table class="t"><thead><tr><th>Місяць</th><th class="n">Чистий прибуток</th><th class="n">Власникам</th><th class="n">Залишок</th></tr></thead><tbody>${hs.slice().reverse().map((h) => {
        const [mf, mt] = monthRange(h.key); const mp = histPay.filter((x) => x.date >= mf && x.date <= mt);
        const own = owners.reduce((a, p) => a + ownerAmount(p, h.net, mp, stNetMonth(h.key)), 0);
        return `<tr><td><b>${MONTHS[+h.key.slice(5, 7) - 1]}</b> <span class="muted small">${h.key.slice(0, 4)}</span></td><td class="n ${h.net < 0 ? 'neg' : ''}">${uah(h.net)}</td><td class="n">${uah(own)}</td><td class="n"><b class="${h.net - own < 0 ? 'neg' : ''}">${uah(h.net - own)}</b></td></tr>`; }).join('')}</tbody></table></div>
      <div class="muted small" style="margin-top:8px">Для минулих місяців відсоток рахується за поточними налаштуваннями людей.</div></section>
  </div>`;
  // --- виплати
  const pf = $('#payForm');
  pf.addEventListener('submit', async (e) => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(pf));
    const amount = parseFloat(String(v.amount || '').replace(/\s/g, '').replace(',', '.'));
    if (!v.person_id || !v.date || !Number.isFinite(amount)) return toast('Вкажіть кому, дату і суму', true);
    const row = { person_id: N(v.person_id), date: v.date, date_to: v.date_to && v.date_to > v.date ? v.date_to : null, store_id: v.store_id ? N(v.store_id) : null,
      amount, currency: v.currency || 'UAH', rate: rateFor(v.currency || 'UAH'), comment: v.comment || null };
    try { if (pf.dataset.id) await api.update('payouts', N(pf.dataset.id), row); else await api.insert('payouts', row); S.data = null; toast('Виплату збережено'); render(); } catch (err) { toast(err.message, true); }
  });
  $('#payCancel').addEventListener('click', () => render());
  $$('[data-pdel]').forEach((b) => b.addEventListener('click', async () => { if (!(await confirmBox('Видалити виплату?', 'Сума зникне зі звітів.'))) return; await api.remove('payouts', N(b.dataset.pdel)); S.data = null; render(); }));
  $$('[data-pedit]').forEach((b) => b.addEventListener('click', () => {
    const x = payouts.find((q) => q.id === N(b.dataset.pedit)); if (!x) return;
    for (const k of ['date', 'date_to', 'person_id', 'store_id', 'amount', 'currency', 'comment']) if (pf[k]) pf[k].value = x[k] ?? '';
    pf.dataset.id = x.id; $('#paySubmit').textContent = 'Зберегти зміни'; $('#payCancel').hidden = false; pf.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  // --- люди
  const hf = $('#personForm');
  hf.addEventListener('submit', async (e) => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(hf));
    const value = parseFloat(String(v.value || '0').replace(/\s/g, '').replace(',', '.')) || 0;
    if (!v.name) return toast('Вкажіть ім’я', true);
    if (v.pay_kind !== 'manual' && !value) return toast('Вкажіть відсоток або суму', true);
    const row = { name: v.name.trim(), role: v.role, pay_kind: v.pay_kind, value, store_id: v.store_id ? N(v.store_id) : null, active: !!hf.active.checked };
    try { if (hf.dataset.id) await api.update('people', N(hf.dataset.id), row); else await api.insert('people', { ...row, sort: people.length }); S.people = await api.list('people'); S.data = null; toast('Збережено'); render(); } catch (err) { toast(err.message, true); }
  });
  $('#personCancel').addEventListener('click', () => render());
  $$('[data-hdel]').forEach((b) => b.addEventListener('click', async () => {
    if (!(await confirmBox('Видалити людину?', 'Її разові виплати залишаться у звітах без імені. Щоб просто припинити нарахування, краще зніміть галочку «активний».'))) return;
    await api.remove('people', N(b.dataset.hdel)); S.people = await api.list('people'); S.data = null; render();
  }));
  $$('[data-hedit]').forEach((b) => b.addEventListener('click', () => {
    const p = people.find((q) => q.id === N(b.dataset.hedit)); if (!p) return;
    for (const k of ['name', 'role', 'pay_kind', 'value', 'store_id']) if (hf[k]) hf[k].value = p[k] ?? '';
    hf.active.checked = p.active !== false; hf.dataset.id = p.id; $('#personSubmit').textContent = 'Зберегти'; $('#personCancel').hidden = false; hf.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
};

// ================================================================ ОПЛАТИ НА РАХУНОК (звірка з банком)
PAGES.payments = async (seq) => {
  const [list, manualAll] = await Promise.all([api.rpc('card_orders', { p_from: S.from, p_to: S.to, p_store: S.store }), api.rows('daily_manual').catch(() => [])]);
  if (seq !== renderSeq) return;
  const arch = String(S.settings.archive_until || '').replace(/"/g, '');
  const manual = (manualAll || []).map((r) => ({ ...r, day: String(r.day).slice(0, 10) }))
    .filter((r) => N(r.card_payments) !== 0 && r.day >= S.from && r.day <= S.to && (S.store == null ? activeStores().some((x) => x.id === N(r.store_id)) : N(r.store_id) === S.store));
  const rows = (list || []).map((r) => ({ ...r, d: String(r.order_date).slice(0, 10), t: String(r.order_time || '').slice(11, 16), amount: N(r.amount), payment_amount: N(r.payment_amount) }));
  const f = S.payF || 'all', kindF = S.payKind || 'all', q = (S.payQ || '').trim().toLowerCase();
  const shown = rows.filter((r) => (f === 'all' || (f === 'open' ? !r.checked : r.checked)) && (kindF === 'all' || r.kind === kindF)
    && (!q || String(r.id).includes(q) || (r.client_name || '').toLowerCase().includes(q) || (r.comment || '').toLowerCase().includes(q) || String(r.amount).includes(q)));
  const sum = (a) => a.reduce((s, r) => s + r.amount, 0);
  const full = rows.filter((r) => r.kind === 'full'), pp = rows.filter((r) => r.kind === 'pp'), done = rows.filter((r) => r.checked);
  const manSum = manual.filter((r) => r.day > arch).reduce((s, r) => s + N(r.card_payments), 0);
  const archSum = manual.filter((r) => r.day <= arch).reduce((s, r) => s + N(r.card_payments), 0);
  const byDay = new Map(); for (const r of shown) { if (!byDay.has(r.d)) byDay.set(r.d, []); byDay.get(r.d).push(r); }
  const kindTag = (r) => (r.kind === 'full' ? '<span class="pill success">повна оплата</span>' : `<span class="pill work">ПП${r.category === 'fail' ? ' · відмова' : ''}</span>`);
  $('#page').innerHTML = `
  <div class="kpis">
    <div class="kpi hero"><div class="kpi-l"><span>Оплати на рахунок</span></div><div class="kpi-v">${uah(sum(rows) + manSum + archSum)}</div><div class="kpi-s">${int(rows.length)} замовлень із CRM${manSum ? ` · ручні корекції ${uah(manSum)}` : ''}${archSum ? ` · до ${fdate(arch)} — ${uah(archSum)} зі старого дашборду` : ''}</div></div>
    ${kpi('Повні оплати', uah(sum(full)), `${int(full.length)} замовлень`)}
    ${kpi('Передоплати (ПП)', uah(sum(pp)), `${int(pp.length)} замовлень${pp.some((r) => r.category === 'fail') ? ` · з них у відмовах ${uah(sum(pp.filter((r) => r.category === 'fail')))}` : ''}`)}
    ${kpi('Знайдено в банку', `${int(done.length)} <span class="muted" style="font-size:14px">з ${int(rows.length)}</span>`, rows.length - done.length ? `<span class="warn-t">ще не звірено ${uah(sum(rows) - sum(done))}</span>` : 'усе звірено')}
  </div>
  <section class="card">
    <div class="card-h"><div><h2 class="card-t">Оплати для звірки з банком</h2><div class="card-s">Із коментарів у CRM: «повна оплата» → уся сума; «ПП150» → 150 ₴. Позитивні статуси + передоплати у відмовах. Поставте галочку, коли знайшли платіж у банку.</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <div class="seg" id="payF">${[['all', 'Усі'], ['open', 'Не звірені'], ['done', 'Звірені']].map(([k, t]) => `<button data-f="${k}" class="${f === k ? 'on' : ''}">${t}</button>`).join('')}</div>
        <div class="seg" id="payK">${[['all', 'Усі типи'], ['full', 'Повна'], ['pp', 'ПП']].map(([k, t]) => `<button data-k="${k}" class="${kindF === k ? 'on' : ''}">${t}</button>`).join('')}</div>
        <input type="text" id="payQ" placeholder="Пошук: ім'я, №, сума" value="${esc(S.payQ || '')}" style="max-width:200px">
        <button class="btn sm" id="payCsv">${icon('dl')}CSV</button>
      </div></div>
    <div class="tw tbl-scroll" style="max-height:none"><table class="t"><thead><tr><th style="width:34px" title="Знайдено в банку">✓</th><th>Час</th><th>Заявка</th><th>Клієнт</th><th>Магазин</th><th>Менеджер</th><th>Статус</th><th>Тип</th><th class="n">Сума замовлення</th><th class="n">На рахунок</th><th>Коментар</th></tr></thead>
    <tbody>${[...byDay.entries()].map(([d, list]) => `<tr class="grp"><td colspan="9" style="background:var(--surface-2)"><b>${fdate(d)}</b> <span class="muted small">${['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][P(d).getUTCDay()]} · ${int(list.length)} опл.${list.some((r) => !r.checked) ? ` · не звірено ${int(list.filter((r) => !r.checked).length)}` : ' · усе звірено ✓'}</span></td><td class="n" style="background:var(--surface-2)"><b>${uah(sum(list))}</b></td><td style="background:var(--surface-2)"></td></tr>` +
      list.map((r) => `<tr class="${r.checked ? 'muted' : ''}"><td><input type="checkbox" data-chk="${r.id}" ${r.checked ? 'checked' : ''} title="${r.checked ? `звірено ${esc((r.checked_by || '').split('@')[0])} ${fdt(r.checked_at)}` : 'Позначити: платіж знайдено в банку'}" style="width:18px;height:18px;min-height:0"></td>
        <td class="muted small">${esc(r.t)}</td><td>#${esc(r.id)}</td><td><b>${esc(r.client_name || '—')}</b></td><td>${r.sajt == null ? '<span class="muted small">без сайту</span>' : storeTag(r.sajt)}</td><td class="small">${esc(mgrName(r.manager_id))}</td>
        <td class="small">${esc(r.status)}</td><td>${kindTag(r)}</td><td class="n">${uah(r.payment_amount)}</td><td class="n"><b>${uah(r.amount)}</b></td>
        <td class="muted small" style="max-width:320px" title="${esc(r.comment || '')}">${esc(String(r.comment || '').replace(/\s+/g, ' ').slice(0, 90))}</td></tr>`).join('')).join('') || '<tr><td colspan="11" class="empty">За період оплат на рахунок немає</td></tr>'}</tbody>
    <tfoot><tr><td colspan="9">Разом показано: ${int(shown.length)}</td><td class="n">${uah(sum(shown))}</td><td></td></tr></tfoot></table></div>
  </section>
  ${manual.length ? `<section class="card" style="margin-top:14px"><div class="card-h"><div><h2 class="card-t">Внесено вручну</h2><div class="card-s">${archSum ? `До ${fdate(arch)} — суми зі старого дашборду. ` : ''}Після — ручні корекції з клітинки «Оплати на рахунок» у таблиці «По днях».</div></div></div>
    <div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Магазин</th><th class="n">Сума</th><th>Хто</th></tr></thead><tbody>${manual.sort((a, b) => b.day.localeCompare(a.day)).map((r) => `<tr><td>${fdate(r.day)}</td><td>${storeTag(r.store_id)}</td><td class="n">${uah(N(r.card_payments))}</td><td class="muted small">${esc(r.updated_by === 'import' ? 'старий дашборд' : String(r.updated_by || '').split('@')[0])}</td></tr>`).join('')}</tbody></table></div></section>` : ''}`;
  $('#payF').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { S.payF = b.dataset.f; render(); } });
  $('#payK').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { S.payKind = b.dataset.k; render(); } });
  let qt; $('#payQ').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { S.payQ = e.target.value; render().then(() => { const i = $('#payQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 350); });
  $$('[data-chk]').forEach((cb) => cb.addEventListener('change', async () => {
    const id = N(cb.dataset.chk); cb.disabled = true;
    try { if (cb.checked) await api.upsert('card_checks', { order_id: id, checked: true, checked_at: new Date().toISOString() }, 'order_id'); else await api.removeWhere('card_checks', { order_id: id }); render(); }
    catch (err) { toast(err.message, true); cb.checked = !cb.checked; cb.disabled = false; }
  }));
  $('#payCsv').addEventListener('click', () => downloadCsv(`oplaty_${S.from}_${S.to}.csv`, ['Дата', 'Час', 'Заявка', 'Клієнт', 'Магазин', 'Менеджер', 'Статус', 'Тип', 'Сума замовлення', 'На рахунок', 'Звірено', 'Коментар'],
    shown.map((r) => [r.d, r.t, r.id, r.client_name || '', r.sajt == null ? 'без сайту' : storeLabel(r.sajt), mgrName(r.manager_id), r.status, r.kind === 'full' ? 'повна оплата' : 'ПП', r.payment_amount, r.amount, r.checked ? 'так' : '', String(r.comment || '').replace(/\s+/g, ' ')])));
};

// ================================================================ МІЙ ДОХІД (особисто, під PIN)
// Бачить лише власник: доступ перевіряє база (is_owner), PIN — додатковий замок в інтерфейсі.
async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
function vaultLock(msg = '') {
  const setup = !S.vaultPin;
  $('#page').innerHTML = `<div class="card" style="max-width:380px;margin:40px auto;text-align:center">
    <div style="font-size:30px">🔒</div><h2 class="card-t" style="margin:6px 0 4px">${setup ? 'Створіть PIN-код' : 'Введіть PIN-код'}</h2>
    <div class="muted small" style="margin-bottom:14px">${setup ? 'Від 4 до 8 цифр. Його знатимете лише ви.' : 'Особистий розділ власника'}</div>
    <form id="pinF" style="display:flex;flex-direction:column;gap:10px">
      <input type="password" inputmode="numeric" autocomplete="off" id="pin1" placeholder="PIN" maxlength="8" style="text-align:center;font-size:20px;letter-spacing:.3em">
      ${setup ? '<input type="password" inputmode="numeric" autocomplete="off" id="pin2" placeholder="Повторіть PIN" maxlength="8" style="text-align:center;font-size:20px;letter-spacing:.3em">' : ''}
      <div class="neg small" id="pinErr">${esc(msg)}</div>
      <button class="btn primary" style="justify-content:center">${setup ? 'Зберегти PIN' : 'Відкрити'}</button>
    </form></div>`;
  $('#pin1').focus();
  $('#pinF').addEventListener('submit', async (e) => {
    e.preventDefault(); const p1 = $('#pin1').value.trim();
    if (!/^\d{4,8}$/.test(p1)) { $('#pinErr').textContent = 'PIN — від 4 до 8 цифр'; return; }
    try {
      if (setup) {
        if (p1 !== $('#pin2').value.trim()) { $('#pinErr').textContent = 'PIN-коди не збігаються'; return; }
        const salt = [...crypto.getRandomValues(new Uint8Array(12))].map((x) => x.toString(16).padStart(2, '0')).join('');
        const v = { salt, hash: await sha256(salt + ':' + p1) };
        await api.upsert('owner_vault', { key: 'pin', value: v }, 'key'); S.vaultPin = v; S.vaultOk = true; toast('PIN збережено'); render();
      } else {
        if (await sha256(S.vaultPin.salt + ':' + p1) !== S.vaultPin.hash) { $('#pin1').value = ''; $('#pinErr').textContent = 'Невірний PIN'; return; }
        S.vaultOk = true; render();
      }
    } catch (err) { $('#pinErr').textContent = err.message; }
  });
}
PAGES.vault = async (seq) => {
  if (!S.isOwner) { $('#page').innerHTML = '<div class="card"><div class="empty">Цей розділ доступний лише власнику.</div></div>'; return; }
  if (S.vaultPin === undefined) { const r = (await api.rows('owner_vault', { key: 'pin' }).catch(() => []))[0]; S.vaultPin = r ? r.value : null; }
  if (seq !== renderSeq) return;
  if (!S.vaultOk) return vaultLock();
  const nowM = ymd(new Date()).slice(0, 7);
  const m = S.vaultMonth || nowM;
  $('#tools').innerHTML = `<label class="f" style="flex-direction:row;align-items:center;gap:8px">Місяць<input type="month" id="vM" value="${m}" max="${nowM}" style="width:170px"></label><button class="btn sm" id="vLock">🔒 Заблокувати</button>`;
  $('#vM').addEventListener('change', (e) => { S.vaultMonth = e.target.value || nowM; render(); });
  $('#vLock').addEventListener('click', () => { S.vaultOk = false; go('overview'); });
  const [from, to] = monthRange(m);
  const hFrom = (() => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 6, 1); return ymd(d); })();
  const stores = activeStores();
  const shares = (S.people || []).filter((p) => p.role === 'share' && p.active !== false && p.pay_kind === 'percent_profit');
  const [all, entriesAll, ...st] = await Promise.all([fetchDays(hFrom, to, null), api.rows('owner_entries').catch(() => []), ...stores.map((x) => fetchDays(hFrom, to, x.id))]);
  if (seq !== renderSeq) return;
  const usd = usdRate();
  const monthNet = (days, key) => series(days, 'month').find((x) => x.key === key)?.net || 0;
  const calc = (key) => {
    const storeNets = stores.map((x, i) => ({ st: x, net: monthNet(st[i].days, key) }));
    const total = monthNet(all.days, key);
    const general = total - storeNets.reduce((a, r) => a + r.net, 0);
    const sh = shares.map((p) => { const base = p.store_id == null ? total : (storeNets.find((r) => r.st.id === N(p.store_id))?.net || 0); return { p, amount: Math.max(0, base) * N(p.value) / 100 }; });
    const clothes = total - sh.reduce((a, r) => a + r.amount, 0);
    const ent = (entriesAll || []).filter((e) => e.month === key);
    const inc = ent.filter((e) => e.kind === 'income').reduce((a, e) => a + N(e.amount_uah), 0);
    const exp = ent.filter((e) => e.kind === 'expense').reduce((a, e) => a + N(e.amount_uah), 0);
    return { storeNets, total, general, sh, clothes, ent, inc, exp, result: clothes + inc - exp };
  };
  const C = calc(m);
  const months = []; for (let d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1), i = 0; i < 6; i++, d.setMonth(d.getMonth() - 1)) months.push(ymd(d).slice(0, 7));
  const names = [...new Set((entriesAll || []).map((e) => e.name))];
  const mName = MONTHS[+m.slice(5, 7) - 1].toLowerCase();
  const usdS = (v) => `$${nf2.format(Math.round(v / usd * 100) / 100)}`;
  const entRow = (e) => `<tr><td>${e.kind === 'income' ? '<span class="pill success">дохід</span>' : '<span class="pill fail">витрата</span>'}</td><td><b>${esc(e.name)}</b>${e.comment ? `<div class="muted small">${esc(e.comment)}</div>` : ''}</td><td class="n">${nf2.format(N(e.amount))} ${e.currency === 'UAH' ? '₴' : esc(e.currency)}</td><td class="n ${e.kind === 'expense' ? 'neg' : ''}">${e.kind === 'expense' ? '−' : '+'}${uah(N(e.amount_uah))}</td><td class="n"><button class="icon-btn" data-vdel="${e.id}" title="Видалити">${icon('trash')}</button></td></tr>`;
  $('#page').innerHTML = `
  <div class="kpis">
    <div class="kpi hero"><div class="kpi-l"><span>Мій чистий дохід за ${mName}</span></div><div class="kpi-v ${C.result < 0 ? 'neg' : ''}">${uah(C.result)}</div><div class="kpi-s">${usdS(C.result)} за курсом ${nf2.format(usd)} ₴${to < monthRange(m)[2] ? ' · місяць ще триває' : ''}</div></div>
    ${kpi('Прибуток з одягу', uah(C.clothes), `${usdS(C.clothes)}${C.sh.length ? ` · після часток ${C.sh.map((r) => esc(r.p.name)).join(', ')}` : ''}`)}
    ${kpi('Інші доходи', uah(C.inc), C.ent.filter((e) => e.kind === 'income').map((e) => esc(e.name)).join(', ') || 'додайте нижче')}
    ${kpi('Особисті витрати', uah(C.exp), C.exp ? usdS(C.exp) : 'немає')}
  </div>
  <div class="grid">
    <section class="card c5"><div class="card-h"><div><h2 class="card-t">Одяг: чистий прибуток</h2><div class="card-s">З дашборду: після реклами, собівартості, суми за відмови, з/п менеджерів і всіх витрат</div></div></div>
      <div class="stat-list">
        ${C.storeNets.map((r) => `<div class="stat-row"><span>${storeTag(r.st.id)}</span><b class="${r.net < 0 ? 'neg' : ''}">${uah(r.net)}</b></div>`).join('')}
        ${Math.abs(C.general) >= 1 ? `<div class="stat-row"><span>Загальні витрати / без сайту</span><b>${uah(C.general)}</b></div>` : ''}
        <div class="stat-row" style="font-weight:700;border-top:1px solid var(--line)"><span>Разом одяг</span><b>${uah(C.total)}</b></div>
        ${C.sh.map((r) => `<div class="stat-row sub"><span>− ${esc(r.p.name)}: ${nf2.format(N(r.p.value))}% від ${esc(r.p.store_id == null ? 'бізнесу' : storeLabel(r.p.store_id))}</span><b class="neg">−${uah(r.amount)}</b></div>`).join('')}
        <div class="stat-row" style="font-weight:700"><span>Прибуток з одягу</span><b>${uah(C.clothes)} <span class="muted small">${usdS(C.clothes)}</span></b></div>
      </div></section>
    <section class="card c7"><div class="card-h"><div><h2 class="card-t">Інші доходи й витрати за ${mName}</h2><div class="card-s">Напр. «Конструктори» — дохід; особисті витрати, яких немає в дашборді одягу</div></div><button class="btn sm" id="vCopy">Скопіювати з минулого місяця</button></div>
      <div class="tw">${C.ent.length ? `<table class="t"><tbody>${C.ent.map(entRow).join('')}</tbody></table>` : '<div class="empty">Ще нічого не внесено</div>'}</div>
      <form class="form" id="vForm" style="margin-top:12px">
        <label class="f">Тип<select name="kind"><option value="income">Дохід</option><option value="expense">Витрата</option></select></label>
        <label class="f">Назва<input type="text" name="name" required list="vNames" placeholder="Конструктори"><datalist id="vNames">${names.map((n) => `<option value="${esc(n)}">`).join('')}</datalist></label>
        <label class="f">Сума<input type="text" name="amount" inputmode="decimal" required placeholder="0"></label>
        <label class="f">Валюта<select name="currency"><option>UAH</option><option>USD</option><option>EUR</option></select></label>
        <label class="f wide">Коментар<input type="text" name="comment" placeholder="Необов'язково"></label>
        <div style="display:flex;gap:8px"><button class="btn primary">${icon('plus')}Додати</button></div>
      </form>
      <div class="muted small" style="margin-top:8px">Зарплати менеджерів, податки ФОП, SMS, CRM тощо краще вносити у «Витрати» дашборду — тоді вони вже будуть у прибутку магазинів і не порахуються двічі.</div></section>
    <section class="card c12"><div class="card-h"><div><h2 class="card-t">По місяцях</h2></div></div>
      <div class="tw"><table class="t"><thead><tr><th>Місяць</th>${stores.map((x) => `<th class="n">${esc(x.name || '#' + x.id)}</th>`).join('')}<th class="n">Прибуток з одягу</th><th class="n">Інші доходи</th><th class="n">Витрати</th><th class="n">Разом, ₴</th><th class="n">Разом, $</th></tr></thead>
      <tbody>${months.map((k) => { const X = calc(k); return `<tr><td><b>${MONTHS[+k.slice(5, 7) - 1]}</b> <span class="muted small">${k.slice(0, 4)}</span></td>${X.storeNets.map((r) => `<td class="n">${uah(r.net)}</td>`).join('')}<td class="n">${uah(X.clothes)}</td><td class="n">${uah(X.inc)}</td><td class="n">${X.exp ? '−' + uah(X.exp) : '—'}</td><td class="n"><b class="${X.result < 0 ? 'neg' : ''}">${uah(X.result)}</b></td><td class="n">${usdS(X.result)}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="muted small" style="margin-top:8px">Долари — за поточним курсом із налаштувань (${nf2.format(usd)} ₴).</div></section>
  </div>`;
  $('#vForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)); const amount = parseFloat(String(v.amount).replace(/\s/g, '').replace(',', '.'));
    if (!v.name.trim() || !Number.isFinite(amount)) return toast('Вкажіть назву і суму', true);
    try { await api.insert('owner_entries', { month: m, kind: v.kind, name: v.name.trim(), amount, currency: v.currency, rate: rateFor(v.currency), comment: v.comment || null }); toast('Додано'); render(); } catch (err) { toast(err.message, true); }
  });
  $$('[data-vdel]').forEach((b) => b.addEventListener('click', async () => { if (!(await confirmBox('Видалити запис?', ''))) return; try { await api.remove('owner_entries', N(b.dataset.vdel)); render(); } catch (err) { toast(err.message, true); } }));
  $('#vCopy').addEventListener('click', async () => {
    const pm = (() => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 2, 1); return ymd(d).slice(0, 7); })();
    const src = (entriesAll || []).filter((e) => e.month === pm);
    if (!src.length) return toast('У минулому місяці записів немає', true);
    try { for (const e of src) await api.insert('owner_entries', { month: m, kind: e.kind, name: e.name, amount: N(e.amount), currency: e.currency, rate: rateFor(e.currency), comment: e.comment }); toast(`Скопійовано ${src.length}`); render(); } catch (err) { toast(err.message, true); }
  });
};

// ================================================================ ФОП І ПОДАТКИ
PAGES.fop = async (seq) => {
  const nowM = ymd(new Date()).slice(0, 7);
  const m = S.fopMonth || nowM;
  $('#tools').innerHTML = `<label class="f" style="flex-direction:row;align-items:center;gap:8px">Місяць<input type="month" id="fopM" value="${m}" max="${nowM}" style="width:170px"></label>`;
  $('#fopM').addEventListener('change', (e) => { S.fopMonth = e.target.value || nowM; render(); });
  const [from, to, monthEnd] = monthRange(m);
  const yFrom = m.slice(0, 4) + '-01-01';
  const [inc, incY, paidRows, receiptsAll, cardList] = await Promise.all([
    api.rpc('fop_income', { p_from: from, p_to: monthEnd }), api.rpc('fop_income', { p_from: yFrom, p_to: monthEnd }),
    api.list('expenses', { eq: { fop_period: m } }).catch(() => []), api.rows('fop_receipts').catch(() => []),
    api.rpc('card_orders', { p_from: from, p_to: monthEnd }).catch(() => []),
  ]);
  if (seq !== renderSeq) return;
  const fops = (S.fops || []).map((f) => ({ ...f, id: N(f.id) }));
  const receipts = (receiptsAll || []).map((r) => ({ ...r, date: String(r.date).slice(0, 10) })).filter((r) => r.date >= from && r.date <= monthEnd).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  // На який ФОП надходять «Оплати на рахунок» кожного магазину (Налаштування → тут, нижче).
  // Якщо не вибрано — ФОП, у якого цей магазин указаний як основний.
  const cardMap = { ...(S.settings.card_fop_by_store || {}) };
  const activeFops = fops.filter((x) => x.active !== false);
  for (const st of activeStores()) if (cardMap[st.id] == null) { const f = activeFops.find((x) => N(x.store_id) === st.id) || (activeFops.length === 1 ? activeFops[0] : null); if (f) cardMap[st.id] = f.id; }
  // Замовлення без сайту — на той самий ФОП, якщо всі магазини платять на один
  const mappedFops = [...new Set(activeStores().map((st) => cardMap[st.id]).filter((v) => v != null && v !== '').map(N))];
  const fopOfStore = (sid) => { if (sid == null || sid === '' || sid === 'null') return mappedFops.length === 1 ? mappedFops[0] : activeFops.length === 1 ? activeFops[0].id : null; return cardMap[N(sid)] == null || cardMap[N(sid)] === '' ? null : N(cardMap[N(sid)]); };
  const incomeOf = (rows, f) => {
    let card = 0, supplier = 0;
    for (const r of rows || []) {
      if (r.kind === 'card' && fopOfStore(r.sender) === f.id) card += N(r.amount);
      if (r.kind === 'supplier' && N(r.sender) === f.id) supplier += N(r.amount);
    }
    return { card, supplier, total: card + supplier };
  };
  const unassigned = (inc || []).reduce((a, r) => a + (r.kind === 'card' && fopOfStore(r.sender) == null ? N(r.amount) : 0), 0);
  const BANKS = ['ПриватБанк', 'Monobank', 'NovaPay'];
  const byBank = (f) => { const m = {}; for (const r of receipts) if (N(r.fop_id) === f.id) m[r.bank || 'Без банку'] = (m[r.bank || 'Без банку'] || 0) + N(r.amount); return Object.entries(m); };
  const cards = fops.map((f) => {
    const mi = incomeOf(inc, f), yi = incomeOf(incY, f);
    const ytd = N(f.income_before) + yi.total;
    const lim = N(f.year_limit), share = lim ? ytd / lim : null;
    const lvl = share == null ? '' : share >= 0.9 ? 'bad' : share >= 0.8 ? 'warn' : 'good';
    const monthTax = fopMonthly(f);
    const paid = (paidRows || []).find((e) => N(e.fop_id) === f.id) || null;
    const stores = activeStores().filter((st) => fopOfStore(st.id) === f.id);
    return { f, mi, ytd, lim, share, lvl, monthTax, paid, stores };
  });
  const due = cards.filter((c) => c.f.active !== false || c.paid);
  const paidSum = due.reduce((a, c) => a + (c.paid ? N(c.paid.amount_uah) : 0), 0);
  const leftCards = due.filter((c) => !c.paid && c.monthTax);
  const leftSum = leftCards.reduce((a, c) => a + c.monthTax, 0);
  const mName = MONTHS[+m.slice(5, 7) - 1].toLowerCase();
  const oldRules = S.rules.filter((r) => r.active && /податок|єсв|есв|податк|військов/i.test(`${r.name} ${r.category}`));
  const cardTotal = (inc || []).filter((r) => r.kind === 'card').reduce((a, r) => a + N(r.amount), 0);
  const supTotal = (inc || []).filter((r) => r.kind === 'supplier').reduce((a, r) => a + N(r.amount), 0);
  const fopName = (id) => fops.find((f) => f.id === N(id))?.name || '—';
  $('#page').innerHTML = `
  <div class="kpis">
    <div class="kpi hero"><div class="kpi-l"><span>Податки ФОП за ${mName}</span></div><div class="kpi-v">${uah(paidSum)}</div><div class="kpi-s">сплачено · ${due.filter((c) => c.paid).length} з ${due.length} ФОП${leftSum ? ` · лишилось ${uah(leftSum)} — ${leftCards.map((c) => esc(c.f.name)).join(', ')}` : due.length ? ' · усе сплачено' : ''}</div></div>
    ${kpi('Дохід ФОП за місяць', uah(cardTotal + supTotal), unassigned ? `<span class="warn-t">${uah(unassigned)} оплат не прив’язано до ФОП</span>` : 'оплати на рахунок + виплати постачальника')}
    ${kpi('Оплати на рахунок', uah(cardTotal), `${int((cardList || []).length)} замовлень із CRM + ручні`)}
    ${kpi('Виплати від постачальника', uah(supTotal), `${int(receipts.length)} записів`)}
  </div>
  ${fops.length && oldRules.length ? `<div class="hint warn" style="margin-bottom:14px">У Витратах увімкнені правила, схожі на податки: <b>${oldRules.map((r) => esc(r.name)).join(', ')}</b>. Податки ФОП тепер рахуються тут. Вимкніть ці правила, щоб податок не віднімався двічі. <button class="btn sm" data-go="expenses" style="margin-left:6px">До правил</button></div>` : ''}
  <div class="mgr-grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${cards.map((c) => `
    <section class="card ${c.f.active === false ? 'muted' : ''}">
      <div class="card-h" style="margin-bottom:6px"><div><h2 class="card-t" style="font-size:16px">${esc(c.f.name)}</h2><div class="card-s">${c.stores.length ? 'оплати на рахунок: ' + c.stores.map((st) => storeTag(st.id)).join(' ') : 'оплати на рахунок не надходять'}</div></div>${c.f.active === false ? '<span class="flag">неактивний</span>' : ''}</div>
      <div class="stat-list">
        <div class="stat-row"><span>Податки на місяць</span><b>${uah(c.monthTax)}</b></div>
        ${[['Єдиний податок', c.f.single_tax], ['ЄСВ', c.f.esv], ['Військовий збір', c.f.military], ['Інше', c.f.other]].filter(([, v]) => N(v)).map(([t, v]) => `<div class="stat-row sub"><span>${t}</span><b>${uah(N(v))}</b></div>`).join('')}
      </div>
      ${c.monthTax || c.paid ? `<label class="taxpaid ${c.paid ? 'on' : ''}"><input type="checkbox" data-fpay="${c.f.id}" ${c.paid ? 'checked' : ''}><span><b>Податки за ${mName} сплачено</b><br><span class="small">${c.paid ? `${uah(N(c.paid.amount_uah))} · ${fdate(c.paid.date)}${c.paid.created_by ? ' · ' + esc(c.paid.created_by.split('@')[0]) : ''}` : uah(c.monthTax)}</span></span></label>` : ''}
      <div class="stat-list">
        <div class="stat-row"><span>Дохід за місяць</span><b>${uah(c.mi.total)}</b></div>
        <div class="stat-row sub"><span>оплати на рахунок</span><b>${uah(c.mi.card)}</b></div>
        <div class="stat-row sub"><span>виплати від постачальника</span><b>${uah(c.mi.supplier)}</b></div>
        ${byBank(c.f).map(([b, v]) => `<div class="stat-row sub" style="padding-left:18px"><span>${esc(b)}</span><b>${uah(v)}</b></div>`).join('')}
        <div class="stat-row"><span>Дохід з початку року</span><b>${uah(c.ytd)}</b></div>
      </div>
      <div style="margin-top:12px">
        ${c.lim ? `<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px"><span>Річний ліміт ${uah(c.lim)}</span><span class="flag ${c.lvl}">${pct(c.share, 0)}</span></div>
          <div class="limbar"><i class="${c.lvl}" style="width:${Math.min(100, c.share * 100).toFixed(1)}%"></i></div>
          <div class="muted small" style="margin-top:6px">${c.share >= 1 ? '<span class="neg">Ліміт перевищено</span>' : `Залишилось ${uah(c.lim - c.ytd)}`}${c.share >= 0.8 && c.share < 1 ? ' · <span class="warn-t">час планувати</span>' : ''}</div>` : '<div class="muted small">Вкажіть річний ліміт, щоб бачити, скільки лишилось.</div>'}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn sm primary" data-fadd="${c.f.id}">${icon('plus')}Внести виплату</button><button class="btn sm" data-fedit="${c.f.id}">${icon('edit')}Змінити</button><button class="btn sm" data-fdel="${c.f.id}">${icon('trash')}</button></div>
    </section>`).join('')}
    ${fops.length ? '' : '<section class="card"><div class="empty">Додайте свої ФОПи у формі нижче</div></section>'}
  </div>
  <div class="grid" style="margin-top:14px">
    <section class="card c7"><div class="card-h"><div><h2 class="card-t">Виплати від постачальника</h2><div class="card-s">Гроші, які постачальник переказує на ваш ФОП (дропшипінг). Рахуються в дохід ФОП і річний ліміт; на прибуток не впливають.</div></div></div>
      ${fops.length ? `<form class="form" id="rcForm">
        <label class="f">Дата<input type="date" name="date" required value="${to}"></label>
        <label class="f">На ФОП<select name="fop_id">${fops.filter((f) => f.active !== false).map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select></label>
        <label class="f">Банк<select name="bank">${BANKS.map((b) => `<option ${store.get('rcBank', 'ПриватБанк') === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label>
        <label class="f">Сума, ₴<input type="text" name="amount" inputmode="decimal" required placeholder="0"></label>
        <label class="f wide">Коментар<input type="text" name="comment" placeholder="Напр. виплата за серпень"></label>
        <div style="display:flex;gap:8px"><button class="btn primary">${icon('plus')}Додати</button></div>
      </form>` : '<div class="empty">Спершу додайте ФОП</div>'}
      <div class="tw" style="margin-top:12px">${receipts.length ? `<table class="t"><thead><tr><th>Дата</th><th>ФОП</th><th>Банк</th><th class="n">Сума</th><th>Коментар</th><th>Вніс</th><th></th></tr></thead><tbody>${receipts.map((r) => `<tr><td>${fdate(r.date)}</td><td>${esc(fopName(r.fop_id))}</td><td>${esc(r.bank || '—')}</td><td class="n">${uah(N(r.amount))}</td><td class="muted small">${esc(r.comment || '')}</td><td class="muted small">${esc((r.created_by || '').split('@')[0])}</td><td class="n"><button class="icon-btn" data-rcdel="${r.id}" title="Видалити">${icon('trash')}</button></td></tr>`).join('')}</tbody></table>` : `<div class="empty">За ${mName} виплат ще не вносили</div>`}</div></section>
    <section class="card c5"><div class="card-h"><div><h2 class="card-t">Куди надходять оплати на рахунок</h2><div class="card-s">Для кожного магазину — ФОП, на реквізити якого клієнти платять${S.settings.card_fop_from ? ` · зараховуються з ${fdate(String(S.settings.card_fop_from).replace(/"/g, ''))}` : ''}</div></div></div>
      <div class="stat-list">${activeStores().map((st) => `<div class="stat-row" style="align-items:center"><span>${storeTag(st.id)}</span><select data-cmap="${st.id}" style="max-width:200px"><option value="">— не вказано —</option>${fops.map((f) => `<option value="${f.id}" ${fopOfStore(st.id) === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></div>`).join('')}</div>
      <div class="muted small" style="margin-top:10px">Оплати із замовлень без сайту (створених вручну) йдуть на той самий ФОП, якщо всі магазини платять на один.</div></section>
    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Оплати на рахунок за ${mName}</h2><div class="card-s">Беруться з CRM автоматично: у коментарі заявки «повна оплата» → уся сума замовлення; «ПП150», «ПП 200» → 150 / 200 ₴. Рахуються замовлення з позитивним статусом (Підтверджено, На відправку, Відправлено, Продаж), а також передоплати «ПП» у відмовах — їх не повертаєте. Спосіб оплати не важливий.</div></div></div>
      <div class="tw tbl-scroll" style="max-height:420px">${(cardList || []).length ? `<table class="t"><thead><tr><th>Дата</th><th>Заявка</th><th>Магазин</th><th>Статус</th><th class="n">Сума замовлення</th><th class="n">Оплачено на рахунок</th><th>Коментар</th></tr></thead><tbody>${cardList.map((r) => `<tr><td style="white-space:nowrap">${fdate(String(r.order_date).slice(0, 10))}</td><td>#${esc(r.id)}</td><td>${r.sajt == null ? '<span class="muted">без сайту</span>' : storeTag(r.sajt)}</td><td class="small">${esc(r.status)}</td><td class="n">${uah(N(r.payment_amount))}</td><td class="n"><b>${uah(N(r.amount))}</b></td><td class="muted small" style="max-width:360px">${esc(String(r.comment || '').slice(0, 140))}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">За цей місяць оплат на рахунок не знайдено</div>'}</div></section>
    <section class="card c12"><div class="card-h"><div><h2 class="card-t" id="fopFormT">Додати ФОП</h2><div class="card-s">Суми податків на місяць для 2-ї групи. Коли відмітите «сплачено», сума віднімається з прибутку обраного магазину в цей день.</div></div></div>
      <form class="form" id="fopForm">
        <label class="f">Назва<input type="text" name="name" required placeholder="ФОП Прізвище"></label>
        ${storeSelect('store_id', null).replace('>Магазин<', '>Магазин для податків<')}
        <label class="f">Єдиний податок, ₴/міс<input type="text" name="single_tax" inputmode="decimal" placeholder="0"></label>
        <label class="f">ЄСВ, ₴/міс<input type="text" name="esv" inputmode="decimal" placeholder="0"></label>
        <label class="f">Військовий збір, ₴/міс<input type="text" name="military" inputmode="decimal" placeholder="0"></label>
        <label class="f">Інше, ₴/міс<input type="text" name="other" inputmode="decimal" placeholder="0"></label>
        <label class="f">Річний ліміт, ₴<input type="text" name="year_limit" inputmode="decimal" placeholder="напр. 6 000 000"></label>
        <label class="f">Дохід з 1 січня, якого немає в дашборді, ₴<input type="text" name="income_before" inputmode="decimal" placeholder="0"></label>
        <label class="f" style="flex-direction:row;align-items:center;gap:8px;padding-bottom:8px"><input type="checkbox" name="active" checked style="width:auto;min-height:0">активний</label>
        <div style="display:flex;gap:8px"><button class="btn primary" id="fopSubmit">${icon('plus')}Додати ФОП</button><button type="button" class="btn" id="fopCancel" hidden>Скасувати</button></div>
      </form>
      <div class="muted small" style="margin-top:8px">«Магазин для податків» — з прибутку якого магазину віднімати податки цього ФОП. Якщо податки спільні, залиште «Загальна» — тоді вони діляться між магазинами.</div></section>
  </div>`;
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  $$('[data-fpay]').forEach((cb) => cb.addEventListener('change', async () => {
    const c = cards.find((x) => x.f.id === N(cb.dataset.fpay)); if (!c) return;
    cb.disabled = true;
    try {
      if (cb.checked) {
        await api.insert('expenses', { date: ymd(new Date()), date_to: null, category: TAX_CAT, channel: null, amount: c.monthTax, currency: 'UAH', rate: 1,
          comment: `${c.f.name}: податки за ${mName} ${m.slice(0, 4)}`, store_id: c.f.store_id ?? null, fop_id: c.f.id, fop_period: m });
        toast(`Податки ${c.f.name} за ${mName} — сплачено`);
      } else {
        if (!(await confirmBox('Зняти позначку «сплачено»?', 'Витрату на податки буде видалено зі звітів.', 'Зняти'))) { cb.checked = true; cb.disabled = false; return; }
        if (c.paid) await api.remove('expenses', N(c.paid.id));
        toast('Позначку знято');
      }
      S.data = null; render();
    } catch (err) { toast(err.message, true); cb.checked = !cb.checked; cb.disabled = false; }
  }));
  $$('[data-cmap]').forEach((sel) => sel.addEventListener('change', async () => {
    const map = { ...(S.settings.card_fop_by_store || {}) }; map[N(sel.dataset.cmap)] = sel.value === '' ? '' : N(sel.value);
    try { await api.setSetting('card_fop_by_store', map); S.settings.card_fop_by_store = map; toast('Збережено'); render(); } catch (err) { toast(err.message, true); }
  }));
  const numf = (v) => { const x = parseFloat(String(v || '').replace(/\s/g, '').replace(',', '.')); return Number.isFinite(x) ? x : 0; };
  $('#rcForm')?.addEventListener('submit', async (e) => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)); const amount = numf(v.amount);
    if (!v.date || !amount) return toast('Вкажіть дату і суму', true);
    store.set('rcBank', v.bank);
    try { await api.insert('fop_receipts', { fop_id: N(v.fop_id), date: v.date, amount, bank: v.bank || null, comment: v.comment || null }); toast('Виплату додано'); render(); } catch (err) { toast(err.message, true); }
  });
  $$('[data-fadd]').forEach((b) => b.addEventListener('click', () => { const f = $('#rcForm'); if (!f) return; f.fop_id.value = b.dataset.fadd; f.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => f.amount.focus(), 350); }));
  $$('[data-rcdel]').forEach((b) => b.addEventListener('click', async () => {
    if (!(await confirmBox('Видалити виплату?', 'Сума зникне з доходу ФОП.'))) return;
    try { await api.remove('fop_receipts', N(b.dataset.rcdel)); render(); } catch (err) { toast(err.message, true); }
  }));
  const ff = $('#fopForm');
  ff.addEventListener('submit', async (e) => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(ff));
    if (!v.name.trim()) return toast('Вкажіть назву', true);
    const row = { name: v.name.trim(), store_id: v.store_id ? N(v.store_id) : null, single_tax: numf(v.single_tax), esv: numf(v.esv), military: numf(v.military), other: numf(v.other), year_limit: numf(v.year_limit), income_before: numf(v.income_before), active: !!v.active };
    try { if (ff.dataset.id) await api.update('fops', N(ff.dataset.id), row); else await api.insert('fops', { ...row, sort: fops.length }); await loadRefs(); S.data = null; toast(ff.dataset.id ? 'Збережено' : 'ФОП додано'); render(); } catch (err) { toast(err.message, true); }
  });
  $('#fopCancel').addEventListener('click', () => render());
  $$('[data-fedit]').forEach((b) => b.addEventListener('click', () => {
    const f = fops.find((x) => x.id === N(b.dataset.fedit)); if (!f) return;
    for (const k of ['name', 'store_id', 'single_tax', 'esv', 'military', 'other', 'year_limit', 'income_before']) if (ff[k]) ff[k].value = f[k] ?? '';
    ff.active.checked = f.active !== false;
    ff.dataset.id = f.id; $('#fopSubmit').textContent = 'Зберегти'; $('#fopFormT').textContent = 'Змінити ФОП'; $('#fopCancel').hidden = false; ff.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  $$('[data-fdel]').forEach((b) => b.addEventListener('click', async () => {
    if (!(await confirmBox('Видалити ФОП?', 'Його податки зникнуть зі звітів.'))) return;
    try { await api.remove('fops', N(b.dataset.fdel)); await loadRefs(); S.data = null; toast('Видалено'); render(); } catch (err) { toast(err.message, true); }
  }));
};

// ================================================================ НАЛАШТУВАННЯ
PAGES.settings = async (seq) => {
  const [log, meta, dsample] = await Promise.all([api.list('sync_log'), api.rpc('stats_overview_meta', {}), api.rpc('delivery_sample', {}).catch(() => [])]);
  S.statuses = await api.list('statuses'); S.managers = await api.list('managers'); S.stores = await api.list('stores');
  if (seq !== renderSeq) return;
  const st = S.settings, m = Array.isArray(meta) ? meta[0] : meta, tg = st.targets || {};
  const backfill = st.backfill_done === false || st.backfill_done === 'false';
  $('#page').innerHTML = `
  <div class="grid">
    <section class="card c6"><div class="card-h"><div><h2 class="card-t">Синхронізація з SalesDrive</h2><div class="card-s">Автоматично кожні 15 хвилин. Підтягуються нові та змінені замовлення.</div></div></div>
      <div class="stat-list">
        <div class="stat-row"><span>Стан</span><b>${backfill ? '<span class="flag warn">Завантажується історія</span>' : '<span class="flag good">Працює</span>'}</b></div>
        <div class="stat-row"><span>Остання синхронізація</span><b>${fdt(st.last_sync)}</b></div>
        <div class="stat-row"><span>Замовлень у базі</span><b>${int(N(m?.orders))}${m?.first_order ? ` <span class="muted small">з ${fdate(String(m.first_order).slice(0, 10))}</span>` : ''}</b></div>
        <div class="stat-row"><span>Архів старого дашборду</span><b>${N(m?.archive_days) ? `${int(N(m.archive_days))} днів, по ${fdate(String(m.archive_until).slice(0, 10))}` : '—'}</b></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn yellow" id="sNow">${icon('sync')}Оновити зараз</button></div>
      <div class="hint" style="margin-top:14px"><b>Перезавантажити період.</b> Якщо ви змінили старі замовлення в SalesDrive (собівартість, статуси) і хочете оновити їх тут.
        <div class="form" style="margin-top:10px;grid-template-columns:1fr 1fr auto"><label class="f">З<input type="date" id="rFrom" value="${addDays(ymd(new Date()), -30)}"></label><label class="f">По<input type="date" id="rTo" value="${ymd(new Date())}"></label><button class="btn" id="rGo">Перезавантажити</button></div>
        <div class="progress" id="rProg" hidden style="margin-top:10px"><i></i></div><div class="small muted" id="rMsg" style="margin-top:6px"></div></div>
      <div class="tw" style="margin-top:12px"><table class="t"><thead><tr><th>Коли</th><th class="n">Замовлень</th><th>Результат</th></tr></thead><tbody>${log.map((l) => `<tr><td style="white-space:nowrap">${fdt(l.at)}</td><td class="n">${int(N(l.orders))}</td><td class="${l.ok ? '' : 'neg'} small">${esc(l.message || '')}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">Ще не було запусків</td></tr>'}</tbody></table></div></section>

    <section class="card c6"><div class="card-h"><div><h2 class="card-t">Основне</h2></div></div>
      <div class="form" style="grid-template-columns:1fr 1fr">
        <label class="f" style="grid-column:span 2">Назва в меню<input type="text" id="sName" value="${esc(st.store_name || '')}" placeholder="Одяг"></label>
        <label class="f">Курс долара, ₴<input type="text" id="sUsd" inputmode="decimal" value="${esc(st.usd_rate ?? '')}"></label>
        <label class="f">Курс євро, ₴<input type="text" id="sEur" inputmode="decimal" value="${esc(st.eur_rate ?? '')}"></label>
        <label class="f" style="grid-column:span 2">Сума за одну відмову, ₴<input type="text" id="sRefCost" inputmode="decimal" value="${esc(st.refusal_cost_default ?? '')}" placeholder="105"></label>
      </div>
      <div style="margin-top:14px;font-size:12px;color:var(--ink-2);font-weight:500">Сума за відмови</div>
      <label style="display:flex;gap:10px;margin:8px 0;align-items:flex-start"><input type="radio" name="refm" value="fixed" ${st.refusal_mode !== 'crm' ? 'checked' : ''}><span><b>Фіксована сума × кількість відмов.</b> <span class="muted small">Як у старому дашборді (105 ₴ за відмову).</span></span></label>
      <label style="display:flex;gap:10px;margin:8px 0;align-items:flex-start"><input type="radio" name="refm" value="crm" ${st.refusal_mode === 'crm' ? 'checked' : ''}><span><b>Вартість доставки з CRM.</b> <span class="muted small">Де її немає — сума вище.</span></span></label>
      <label style="display:flex;gap:10px;margin:12px 0 4px;align-items:center"><input type="checkbox" id="sOrdCost" ${st.order_costs_in_pnl === true ? 'checked' : ''}><span>Віднімати доставку й комісії із замовлень CRM <span class="muted small">(у старому дашборді не віднімались)</span></span></label>
      <div style="margin-top:14px;font-size:12px;color:var(--ink-2);font-weight:500">Коли рахувати гроші від продажу</div>
      <label style="display:flex;gap:10px;margin:8px 0;align-items:flex-start"><input type="radio" name="fin" value="order" ${fin() === 'order' ? 'checked' : ''}><span><b>За датою заявки</b> (як у старому дашборді). <span class="muted small">Замовлення від 30.09, викуплене 03.10, потрапить у вересень. Реклама і продажі порівнюються найточніше.</span></span></label>
      <label style="display:flex;gap:10px;margin:8px 0;align-items:flex-start"><input type="radio" name="fin" value="payment" ${fin() === 'payment' ? 'checked' : ''}><span><b>За датою продажу.</b> <span class="muted small">Гроші потрапляють у день, коли замовлення стало продажем у SalesDrive.</span></span></label>
      <div style="margin-top:14px;font-size:12px;color:var(--ink-2);font-weight:500">Коли замовлення вважати продажем</div>
      <label style="display:flex;gap:10px;margin:8px 0;align-items:flex-start"><input type="radio" name="rmode" value="confirmed" ${st.revenue_mode !== 'sale' ? 'checked' : ''}><span><b>Одразу після підтвердження.</b> <span class="muted small">Як у старому дашборді: підтверджене замовлення одразу йде у виручку й прибуток свого дня. Якщо потім буде відмова, воно перейде у відмови.</span></span></label>
      <label style="display:flex;gap:10px;margin:8px 0;align-items:flex-start"><input type="radio" name="rmode" value="sale" ${st.revenue_mode === 'sale' ? 'checked' : ''}><span><b>Лише після викупу</b> (статус «Продаж»). <span class="muted small">Обережніше: гроші з'являються, коли клієнт забрав посилку.</span></span></label>
      <div style="margin-top:14px;font-size:12px;color:var(--ink-2);font-weight:500">Загальні витрати (без магазину)</div>
      <label style="display:flex;gap:10px;margin:8px 0;align-items:flex-start"><input type="radio" name="gsplit" value="equal" ${st.general_split !== 'none' ? 'checked' : ''}><span><b>Ділити порівну між магазинами.</b> <span class="muted small">Амортизація 200 ₴ → по 100 ₴ у звіт кожного магазину. Сума прибутків магазинів = прибуток бізнесу.</span></span></label>
      <label style="display:flex;gap:10px;margin:8px 0;align-items:flex-start"><input type="radio" name="gsplit" value="none" ${st.general_split === 'none' ? 'checked' : ''}><span><b>Не ділити.</b> <span class="muted small">Віднімаються лише із загального прибутку в режимі «Усі магазини».</span></span></label>
      <label style="display:flex;gap:10px;margin:12px 0 4px;align-items:center"><input type="checkbox" id="sMgr" ${st.managers_in_pnl !== false ? 'checked' : ''}><span>Віднімати зарплату менеджерів від прибутку</span></label>
      <div style="margin-top:14px;font-size:12px;color:var(--ink-2);font-weight:500">Цілі (підсвічуються зеленим або червоним)</div>
      <div class="form" style="grid-template-columns:1fr 1fr;margin-top:6px">
        <label class="f">ROAS не менше, x<input type="text" id="tRoas" inputmode="decimal" value="${tg.roas ?? ''}"></label>
        <label class="f">Ціна ліда до, $<input type="text" id="tCpl" inputmode="decimal" value="${tg.cpl_usd ?? ''}"></label>
        <label class="f">ROMI не менше, %<input type="text" id="tRomi" inputmode="decimal" value="${tg.romi != null ? Math.round(tg.romi * 100) : ''}"></label>
        <label class="f">Ціна продажу до, ₴<input type="text" id="tCpo" inputmode="decimal" value="${tg.cpo ?? ''}"></label>
        <label class="f">Конверсія від, %<input type="text" id="tConv" inputmode="decimal" value="${tg.conversion != null ? Math.round(tg.conversion * 100) : ''}"></label>
      </div>
      <label class="f" style="margin-top:12px">Категорії витрат (через кому)<input type="text" id="sCats" value="${esc((st.expense_categories || []).join(', '))}"></label>
      <label class="f" style="margin-top:10px">Рекламні канали (через кому)<input type="text" id="sChans" value="${esc((st.ad_channels || []).join(', '))}"></label>
      <div style="margin-top:14px"><button class="btn primary" id="sSave">Зберегти</button></div></section>

    <section class="card c7"><div class="card-h"><div><h2 class="card-t">Статуси SalesDrive</h2><div class="card-s">Що означає кожен статус. Від цього залежать продажі, конверсія і прибуток. «Підтверджене» — статуси, які рахуються як підтверджені замовлення.</div></div></div>
      <div class="tw"><table class="t"><thead><tr><th>Статус</th><th>Як рахувати</th><th>Підтверджене</th></tr></thead><tbody>${S.statuses.map((s) => `<tr><td>${esc(s.name)} ${s.manual ? '<span class="muted small">змінено вручну</span>' : ''}</td><td><select data-st="${s.id}" style="max-width:220px">${Object.entries(CAT).map(([k, v]) => `<option value="${k}" ${k === s.category ? 'selected' : ''}>${v}</option>`).join('')}</select></td><td><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-conf="${s.id}" ${s.confirmed ? 'checked' : ''}>так</label></td></tr>`).join('') || '<tr><td colspan="3" class="empty">Статуси з’являться після першої синхронізації</td></tr>'}</tbody></table></div></section>

    <section class="card c5"><div class="card-h"><div><h2 class="card-t">Менеджери</h2><div class="card-s">З’являються автоматично із замовлень. Ставка — за кожне замовлення, що стало підтвердженим або відмовою; % — від допродажу по викуплених.</div></div></div>
      <div class="tw"><table class="t"><thead><tr><th>ID</th><th>Ім’я</th><th>₴ за замовл.</th><th>% допрод.</th></tr></thead><tbody>${S.managers.map((mg) => `<tr data-mg="${mg.id}"><td class="muted">${mg.id}</td><td><input type="text" data-f="name" value="${esc(mg.name || '')}" placeholder="Ім’я"></td><td><input type="text" data-f="rate_per_order" inputmode="decimal" value="${N(mg.rate_per_order) || ''}" style="width:80px"></td><td><input type="text" data-f="upsell_pct" inputmode="decimal" value="${N(mg.upsell_pct) ? Math.round(N(mg.upsell_pct) * 100) : ''}" style="width:70px"></td></tr>`).join('') || '<tr><td colspan="4" class="empty">Поки немає</td></tr>'}</tbody></table></div>
      ${S.managers.length ? '<div style="margin-top:12px"><button class="btn primary" id="mgSave">Зберегти менеджерів</button></div>' : ''}</section>

    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Вартість повернення посилок</h2><div class="card-s">Останні відмови з ТТН і яку вартість доставки вдалося взяти з SalesDrive. Якщо скрізь «не знайдено», надішліть скрін цього блоку.</div></div></div>
      <div class="tw">${(dsample || []).length ? `<table class="t"><thead><tr><th>Замовлення</th><th>Магазин</th><th>Статус</th><th>ТТН</th><th class="n">Вартість</th><th>Поля доставки з CRM</th></tr></thead><tbody>${dsample.map((d) => `<tr><td>#${d.id} <span class="muted small">${fdate(String(d.order_date).slice(0, 10))}</span></td><td>${d.sajt == null ? '—' : storeTag(d.sajt)}</td><td>${esc(d.status)}</td><td class="small">${esc(d.ttn || '—')}</td>
        <td class="n">${N(d.delivery_cost) ? `<b>${uah2(N(d.delivery_cost))}</b>` : '<span class="flag warn">не знайдено</span>'}</td>
        <td class="muted small" style="max-width:460px;word-break:break-all">${esc(Object.entries(d.delivery_json || {}).filter(([k, v]) => v !== null && v !== '' && typeof v !== 'object').map(([k, v]) => k + ': ' + v).join(', ')).slice(0, 400)}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">Даних ще немає. Оновіть функцію синхронізації й перезавантажте період (див. інструкцію).</div>'}</div></section>

    <section class="card c12"><div class="card-h"><div><h2 class="card-t">Магазини</h2><div class="card-s">Кожен сайт із SalesDrive (поле «Сайт» у заявці) — окремий магазин. Нові сайти з’являються тут самі після синхронізації. Дайте їм назви; сайти, які не потрібно рахувати, вимкніть.</div></div></div>
      <div class="tw"><table class="t"><thead><tr><th>Сайт у SalesDrive</th><th>Назва магазину</th><th>Колір</th><th class="n">Замовлень</th><th>Рахувати у звітах</th></tr></thead><tbody>${S.stores.map((x) => { const site = (m?.sites || []).find((z) => N(z.id) === x.id); return `<tr data-shop="${x.id}"><td class="muted">#${x.id}</td><td><input type="text" data-f="name" value="${esc(x.name || '')}" placeholder="Назва" style="max-width:320px"></td><td><input type="color" data-f="color" value="${esc(storeColors()[x.id] || '#8a8f98')}" style="width:52px;min-height:32px;padding:2px"></td><td class="n">${int(N(site?.orders))}</td><td><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-f="active" ${x.active !== false ? 'checked' : ''}>так</label></td></tr>`; }).join('') || '<tr><td colspan="4" class="empty">Магазини з’являться після першої синхронізації</td></tr>'}</tbody></table></div>
      ${(m?.sites || []).some((z) => z.id == null) ? `<div class="hint" style="margin-top:10px">Замовлень без сайту: ${int(N((m.sites.find((z) => z.id == null) || {}).orders))}. Вони враховуються лише в режимі «Усі магазини».</div>` : ''}
      ${S.stores.length ? '<div style="margin-top:12px"><button class="btn primary" id="shopSave">Зберегти магазини</button></div>' : ''}</section>
  </div>`;

  $('#sNow').addEventListener('click', () => runSync({}));
  $('#rGo').addEventListener('click', async () => {
    const from = $('#rFrom').value, to = $('#rTo').value; if (!from || !to || from > to) return toast('Вкажіть період', true);
    $('#rProg').hidden = false; let page = 1, n = 0, guard = 0;
    try {
      for (;;) {
        $('#rMsg').textContent = `Сторінка ${page}…`; $('#rProg i').style.width = Math.min(95, 10 + guard * 12) + '%';
        const r = await api.sync({ mode: 'range', dateFrom: from, dateTo: to, page });
        n += N(r.orders);
        if (!r.more || !r.nextPage || ++guard > 40) break;
        page = r.nextPage;
      }
      $('#rProg i').style.width = '100%'; $('#rMsg').textContent = `Готово: оновлено ${int(n)} замовлень`; S.data = null; await loadRefs();
    } catch (e) { $('#rMsg').textContent = 'Помилка: ' + e.message; }
  });
  $('#sSave').addEventListener('click', async () => {
    const split = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
    const numv = (id) => { const v = parseFloat(String($(id).value).replace(',', '.')); return Number.isFinite(v) ? v : null; };
    const cats = split($('#sCats').value); if (!cats.includes('Реклама')) cats.unshift('Реклама');
    const upd = {
      store_name: $('#sName').value.trim() || 'Одяг', refusal_cost_default: numv('#sRefCost') ?? 0, usd_rate: numv('#sUsd') || 45, eur_rate: numv('#sEur') || 50,
      refusal_mode: $('input[name=refm]:checked')?.value || 'fixed', order_costs_in_pnl: $('#sOrdCost').checked,
      finance_date: $('input[name=fin]:checked')?.value || 'order', revenue_mode: $('input[name=rmode]:checked')?.value || 'confirmed', general_split: $('input[name=gsplit]:checked')?.value || 'equal', managers_in_pnl: $('#sMgr').checked,
      targets: { roas: numv('#tRoas'), cpl_usd: numv('#tCpl'), romi: numv('#tRomi') != null ? numv('#tRomi') / 100 : null, cpo: numv('#tCpo'), conversion: numv('#tConv') != null ? numv('#tConv') / 100 : null },
      expense_categories: cats, ad_channels: split($('#sChans').value),
    };
    try { for (const [k, v] of Object.entries(upd)) await api.setSetting(k, v); Object.assign(S.settings, upd); S.data = null; $('.logo-t').textContent = rememberBrand(upd.store_name); toast('Налаштування збережено'); }
    catch (e) { toast(e.message, true); }
  });
  $$('[data-conf]').forEach((cb) => cb.addEventListener('change', async () => {
    try { await api.update('statuses', N(cb.dataset.conf), { confirmed: cb.checked, manual: true }); S.data = null; toast('Збережено. Звіти перераховано.'); } catch (e) { toast(e.message, true); }
  }));
  $$('[data-st]').forEach((sel) => sel.addEventListener('change', async () => {
    try { await api.update('statuses', N(sel.dataset.st), { category: sel.value, manual: true }); S.data = null; toast('Збережено. Звіти перераховано.'); } catch (e) { toast(e.message, true); }
  }));
  $('#shopSave')?.addEventListener('click', async () => {
    try {
      const colors = { ...storeColors() };
      for (const tr of $$('[data-shop]')) { await api.update('stores', N(tr.dataset.shop), { name: $('[data-f="name"]', tr).value.trim() || null, active: $('[data-f="active"]', tr).checked }); colors[N(tr.dataset.shop)] = $('[data-f="color"]', tr).value; }
      await api.setSetting('store_colors', colors); S.settings.store_colors = colors; applyStoreColors();
      S.stores = await api.list('stores'); S.data = null; toast('Магазини збережено');
    } catch (e) { toast(e.message, true); }
  });
  $('#mgSave')?.addEventListener('click', async () => {
    try {
      for (const tr of $$('[data-mg]')) {
        const v = (f) => $(`[data-f="${f}"]`, tr).value.trim(); const n = (f) => parseFloat(v(f).replace(',', '.')) || 0;
        await api.update('managers', N(tr.dataset.mg), { name: v('name') || null, rate_per_order: n('rate_per_order'), upsell_pct: n('upsell_pct') / 100 });
      }
      S.managers = await api.list('managers'); S.data = null; toast('Менеджерів збережено');
    } catch (e) { toast(e.message, true); }
  });
};

// ---------------------------------------------------------------- синхронізація
async function runSync(body) {
  const btn = $('#syncBtn'); btn.disabled = true; $('#syncPill .dot').classList.add('spin'); $('#syncPill span').textContent = 'Оновлюю…';
  try {
    const r = await api.sync(body);
    toast(r.success === false ? 'Помилка: ' + r.error : (r.message || 'Готово'), r.success === false);
    await loadRefs(); S.data = null; render();
  } catch (e) { toast('Помилка синхронізації: ' + e.message, true); }
  finally { btn.disabled = false; $('#syncPill .dot')?.classList.remove('spin'); updateSyncPill(); }
}

// ---------------------------------------------------------------- реальний час
let liveTimer = null, livePending = false;
function onRemoteChange(table) {
  clearTimeout(liveTimer);
  liveTimer = setTimeout(async () => {
    try { await loadRefs(); } catch { return; }
    S.data = null; updateSyncPill();
    const el = document.activeElement;
    const typing = el && el.closest && el.closest('#page form, #page [data-mg], #page [data-shop]') && ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
    if (typing) { livePending = true; showLiveBar(); return; }
    render(); toast(table === 'sync_log' ? 'Підтягнулися нові замовлення' : 'Дані оновлено: зміни від іншого користувача');
  }, 900);
}
function showLiveBar() {
  if ($('#liveBar')) return;
  const b = document.createElement('div'); b.id = 'liveBar'; b.className = 'hint'; b.style.cssText = 'margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px';
  b.innerHTML = '<span>Хтось інший змінив дані. Оновіть сторінку, коли закінчите вводити.</span><button class="btn sm primary">Оновити</button>';
  b.querySelector('button').addEventListener('click', () => { livePending = false; b.remove(); render(); });
  $('#page').before(b);
}

// ---------------------------------------------------------------- підказки
document.addEventListener('pointermove', (e) => {
  const tip = $('#tip'); const el = e.target.closest?.('[data-tip]');
  if (!el || !el.dataset.tip) { tip.style.display = 'none'; return; }
  tip.textContent = el.dataset.tip; tip.style.display = 'block';
  tip.style.left = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8) + 'px'; tip.style.top = (e.clientY + 16) + 'px';
});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render());
new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ---------------------------------------------------------------- вхід і старт
function loginView(err = '') {
  $('#app').innerHTML = `<div class="login"><form id="loginF" autocomplete="on">${LOGO}<h1>${esc(store.get('brand', '') || 'Аналітика продажів')}</h1><div class="muted small">Увійдіть, щоб переглянути аналітику</div>
    <label class="f">Email<input type="email" name="email" id="lEmail" required autocomplete="username"></label>
    <label class="f">Пароль<input type="password" name="password" id="lPass" required autocomplete="current-password"></label>
    <div class="err" id="lErr">${esc(err)}</div><button class="btn primary" style="justify-content:center">Увійти</button></form></div>`;
  $('#loginF').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    try { S.user = await api.signIn(f.email.value.trim(), f.password.value); boot(); } catch (err2) { $('#lErr').textContent = err2.message; }
  });
}
async function boot() {
  if (!window.__TEST_API__ && CONFIG.SUPABASE_URL && !window.supabase) { $('#app').innerHTML = '<div class="login"><form><h1>Немає з’єднання</h1><div class="muted">Не вдалося завантажити бібліотеку Supabase. Перевірте інтернет і оновіть сторінку.</div></form></div>'; return; }
  S.user = S.user || (await api.session());
  if (!S.user) return loginView();
  try { await loadRefs(); } catch (e) { return loginView('Немає доступу до бази: ' + e.message); }
  S.isOwner = !!(await api.rpc('is_owner', {}).catch(() => false));
  const h = location.hash.slice(1); if (TITLES[h]) S.page = h;
  shell(); render();
  if (api.subscribe) api.subscribe(onRemoteChange);
  setInterval(async () => { try { S.settings = await api.settings(); updateSyncPill(); } catch { /* ok */ } }, 5 * 60e3);
}
boot();
})();
