// ===================== ДЕМО-ДАНІ =====================
// Працює, коли в CONFIG не вказано Supabase. Імітує ту саму базу й SQL-функції.
function createDemoApi() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const w = (pairs) => { let x = rnd() * pairs.reduce((s, p) => s + p[1], 0); for (const [v, k] of pairs) if ((x -= k) < 0) return v; return pairs[0][0]; };
  const pad = (n) => String(n).padStart(2, '0');
  const ymdL = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const PRODUCTS = [
    ['Конструктор «Пожежна станція» 820 дет.', 1890], ['Конструктор «Космічний шатл» 1100 дет.', 2650], ['Конструктор «Замок лицаря» 950 дет.', 2190],
    ['Конструктор «Гоночне авто» 420 дет.', 890], ['Конструктор «Динозавр T-Rex» 380 дет.', 790], ['Конструктор «Поліцейська дільниця» 700 дет.', 1590],
    ['Конструктор «Ферма» 310 дет.', 690], ['Конструктор «Робот-трансформер» 560 дет.', 1190], ['Магнітний конструктор 64 дет.', 1290],
    ['Магнітний конструктор 120 дет.', 2190], ["Дерев'яний конструктор «Місто» 150 дет.", 990], ['Конструктор для малюків 48 дет.', 490],
    ['Технічний конструктор «Екскаватор» 1300 дет.', 3490], ['Технічний конструктор «Кран» 1800 дет.', 4290], ['Конструктор «Піратський корабель» 1250 дет.', 2890],
    ["Конструктор «Кав'ярня» 520 дет.", 1090], ['Набір мініфігурок 12 шт.', 390], ['Електронний конструктор «Юний інженер»', 1690],
    ['Конструктор «Вантажівка-сміттєвоз» 610 дет.', 1390], ['Конструктор «Аеропорт» 1450 дет.', 3190],
  ];
  const REASONS = ['Не відповідає на дзвінки', 'Передумав', 'Дорога доставка', 'Знайшов дешевше', 'Не забрав з пошти', 'Товар не сподобався'];
  const statuses = [
    { id: 1, name: 'Новий', type: 1, category: 'work', confirmed: false, manual: false, sort: 0 },
    { id: 2, name: 'Підтверджено', type: 1, category: 'work', confirmed: true, manual: false, sort: 1 },
    { id: 3, name: 'Відправлено', type: 1, category: 'work', confirmed: true, manual: false, sort: 2 },
    { id: 4, name: 'Продаж', type: 2, category: 'success', confirmed: true, manual: false, sort: 3 },
    { id: 5, name: 'Відмова', type: 3, category: 'fail', confirmed: false, manual: false, sort: 4 },
    { id: 6, name: 'Повернення', type: 3, category: 'return', confirmed: false, manual: false, sort: 5 },
    { id: 7, name: 'Дубль / видалено', type: 4, category: 'ignore', confirmed: false, manual: false, sort: 6 },
  ];
  const managers = [
    { id: 3, name: 'Олена', rate_per_order: 18, upsell_pct: 0.2, active: true },
    { id: 4, name: 'Максим', rate_per_order: 18, upsell_pct: 0.2, active: true },
    { id: 5, name: 'Ірина', rate_per_order: 16, upsell_pct: 0.25, active: true },
  ];
  const stores = [
    { id: 21, name: 'BrickLand', active: true, sort: 0 },
    { id: 22, name: 'Кубик', active: true, sort: 1 },
  ];
  const orders = [], items = [];
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const start = new Date(today); start.setDate(start.getDate() - 420);
  let id = 50000;
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const age = Math.round((today - d) / 86400e3);
    const m = d.getMonth();
    const season = 1 + 0.3 * Math.cos((m - 11) / 12 * 2 * Math.PI) + (m === 11 ? 0.45 : 0) + (m === 8 ? 0.15 : 0);
    const growth = 0.75 + 0.35 * (1 - age / 420);
    const n = Math.round((10 + rnd() * 9) * season * growth * ([0, 6].includes(d.getDay()) ? 1.2 : 1));
    for (let k = 0; k < n; k++) {
      id++;
      const sajt = rnd() < 0.62 ? 21 : 22;
      const src = sajt === 21 ? w([['facebook', 26], ['instagram', 18], ['google', 30], ['sms', 6], [null, 20]]) : w([['facebook', 22], ['instagram', 20], ['tiktok', 40], [null, 18]]);
      const cnt = w([[1, 68], [2, 23], [3, 9]]);
      const its = [];
      for (let j = 0; j < cnt; j++) {
        const pi = Math.floor(rnd() * PRODUCTS.length);
        const [name, price] = PRODUCTS[pi];
        its.push({ pi, name, price, qty: rnd() < 0.08 ? 2 : 1, cost: Math.round(price * (0.54 + rnd() * 0.12)), pre: j > 0 && rnd() < 0.5 });
      }
      const amount = its.reduce((s, i) => s + i.price * i.qty, 0);
      const cost = its.reduce((s, i) => s + i.cost * i.qty, 0);
      const cod = rnd() < 0.6;
      let st;
      if (age > 14) st = w([[4, 70], [5, 15], [6, 10], [7, 5]]);
      else if (age > 5) st = w([[4, 42], [3, 32], [5, 12], [6, 4], [7, 4], [2, 6]]);
      else st = w([[1, 22], [2, 30], [3, 30], [4, 6], [5, 8], [7, 4]]);
      const ship = amount >= 1500 ? 70 + Math.round(rnd() * 45) : 0;
      const comm = cod ? Math.round(amount * 0.02 + 20) : Math.round(amount * 0.013);
      const pd = new Date(d); pd.setDate(pd.getDate() + 2 + Math.floor(rnd() * 4));
      const sale = st === 4;
      const payed = sale ? (rnd() < 0.97 ? amount : 0) : (!cod && st === 3 ? amount : 0);
      const upsell = its.filter((i) => i.pre).reduce((s, i) => s + i.price * i.qty, 0);
      orders.push({
        id, order_date: ymdL(d), order_time: `${ymdL(d)} ${pad(8 + Math.floor(rnd() * 14))}:${pad(Math.floor(rnd() * 60))}:00`,
        payment_date: sale ? (pd > today ? ymdL(today) : ymdL(pd)) : null, status_id: st,
        payment_amount: amount, cost_price: cost, shipping_costs: st === 6 ? ship + 110 : (sale ? ship : 0), commission: sale ? comm : 0, expenses_amount: 0,
        payed_amount: payed, rest_pay: (sale || st === 3) ? amount - payed : 0, upsell_amount: upsell,
        rejection_reason: st === 5 || st === 6 ? pick(REASONS) : null, utm_source: src,
        ttn: st >= 3 && st !== 7 ? '2045' + id : null, delivery_cost: (st === 5 || st === 6) && rnd() < 0.85 ? 120 + Math.round(rnd() * 90) : 0,
        sajt, manager_id: sajt === 21 ? w([[3, 60], [4, 40]]) : w([[4, 30], [5, 70]]), payment_method: cod ? 'Накладений платіж' : pick(['Оплата на картку', 'LiqPay', 'Monobank']),
      });
      its.forEach((i, pos) => items.push({ order_id: id, pos, product_id: i.pi + 1, name: i.name, sku: 'KB-' + (100 + i.pi), amount: i.qty, price: i.price, cost_price: i.cost }));
    }
  }
  const byId = new Map(orders.map((o) => [o.id, o]));
  const cat = (o) => statuses.find((s) => s.id === o.status_id)?.category || 'work';
  const conf = (o) => !!statuses.find((s) => s.id === o.status_id)?.confirmed;

  // Витрати: реклама щотижня (Meta в $), SMS щомісяця, блогери
  const expenses = []; let eid = 1;
  const settings = {
    finance_date: 'order', usd_rate: 41.5, eur_rate: 45, store_name: 'Магазин конструкторів',
    expense_categories: ['Реклама', 'Податки', 'SMS-розсилки', 'Оренда / склад', 'Пакування', 'Сервіси (CRM, сайт)', 'Банк / еквайринг', 'Інше'],
    ad_channels: ['Meta', 'Google', 'TikTok', 'Блогери', 'Розсилки', 'Інше'],
    targets: { romi: 1.0, cpo: 300, conversion: 0.6 }, managers_in_pnl: true,
    backfill_done: true, last_sync: new Date(Date.now() - 6 * 60e3).toISOString(), last_run: new Date(Date.now() - 6 * 60e3).toISOString(),
  };
  const addExp = (date, date_to, category, channel, amount, currency, comment, store_id = null) => {
    const rate = currency === 'USD' ? 41.5 : 1;
    expenses.push({ id: eid++, date, date_to, category, channel, amount, currency, rate, amount_uah: Math.round(amount * rate * 100) / 100, comment, store_id, created_at: date });
  };
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 7)) {
    const e = new Date(d); e.setDate(e.getDate() + 6);
    const to = e > today ? ymdL(today) : ymdL(e);
    addExp(ymdL(d), to, 'Реклама', 'Meta', Math.round(140 + rnd() * 60), 'USD', 'Facebook + Instagram', 21);
    addExp(ymdL(d), to, 'Реклама', 'Google', Math.round(6000 + rnd() * 3000), 'UAH', 'Google Ads', 21);
    addExp(ymdL(d), to, 'Реклама', 'Meta', Math.round(80 + rnd() * 40), 'USD', 'Facebook + Instagram', 22);
    addExp(ymdL(d), to, 'Реклама', 'TikTok', Math.round(90 + rnd() * 60), 'USD', 'TikTok Ads', 22);
  }
  for (let mm = new Date(start.getFullYear(), start.getMonth(), 1); mm <= today; mm.setMonth(mm.getMonth() + 1)) {
    const last = new Date(mm.getFullYear(), mm.getMonth() + 1, 0);
    addExp(ymdL(mm), ymdL(last), 'SMS-розсилки', null, Math.round(1600 + rnd() * 900), 'UAH', 'Розсилка по базі');
    addExp(ymdL(new Date(mm.getFullYear(), mm.getMonth(), 12)), null, 'Реклама', 'Блогери', Math.round(4000 + rnd() * 5000), 'UAH', 'Інтеграція у блогера', 21);
    addExp(ymdL(mm), ymdL(last), 'Оренда / склад', null, 6000, 'UAH', 'Склад', null);
  }
  const rules = [
    { id: 1, name: 'Єдиний податок 5%', kind: 'percent_revenue', value: 5, category: 'Податки', date_from: null, date_to: null, store_id: null, active: true },
    { id: 2, name: 'ЄСВ за ФОП', kind: 'fixed_monthly', value: 1902.34, category: 'Податки', date_from: null, date_to: null, store_id: null, active: true },
    { id: 3, name: 'SalesDrive + сайт', kind: 'fixed_monthly', value: 2400, category: 'Сервіси (CRM, сайт)', date_from: null, date_to: null, store_id: null, active: true },
    { id: 4, name: 'Пакування (коробка, скотч)', kind: 'per_order', value: 14, category: 'Пакування', date_from: null, date_to: null, store_id: null, active: true },
  ];
  let rid = 5;
  const syncLog = [
    { id: 3, at: new Date(Date.now() - 6 * 60e3).toISOString(), mode: 'cron', orders: 12, pages: 1, ok: true, message: 'Оновлено замовлень: 12' },
    { id: 2, at: new Date(Date.now() - 21 * 60e3).toISOString(), mode: 'cron', orders: 9, pages: 1, ok: true, message: 'Оновлено замовлень: 9' },
    { id: 1, at: new Date(Date.now() - 36 * 60e3).toISOString(), mode: 'cron', orders: 15, pages: 1, ok: true, message: 'Оновлено замовлень: 15' },
  ];

  const inScope = (o, st) => (st != null ? o.sajt === st : (o.sajt == null || stores.find((x) => x.id === o.sajt)?.active !== false));
  const scoped = (st) => orders.filter((o) => inScope(o, st));
  const fin = (o, f) => (f === 'payment' ? (o.payment_date || o.order_date) : o.order_date);
  const inR = (d, a, b) => d >= a && d <= b;
  const group = (list, keyFn, init, add) => { const m = new Map(); for (const x of list) { const k = keyFn(x); if (!m.has(k)) m.set(k, init(k)); add(m.get(k), x); } return [...m.values()]; };
  const R = {
    stats_daily({ p_from, p_to, p_fin, p_store }) {
      const orders = scoped(p_store);
      const days = new Map();
      const g = (d) => { if (!days.has(d)) days.set(d, { day: d, leads: 0, confirmed: 0, unconfirmed: 0, success: 0, fail: 0, returns: 0, work: 0, sales: 0, revenue: 0, cogs: 0, order_costs: 0, return_costs: 0, payed: 0, upsell: 0, pend_sales: 0, pend_revenue: 0, pend_cogs: 0, pend_costs: 0, refusal_ship: 0, refusal_ship_unknown: 0 }); return days.get(d); };
      for (const o of orders) {
        const c = cat(o); if (c === 'ignore') continue;
        if (inR(o.order_date, p_from, p_to)) { const x = g(o.order_date); x.leads++; x[c === 'return' ? 'returns' : c]++; if (conf(o)) x.confirmed++; else if (c === 'work') x.unconfirmed++; if ((c === 'fail' || c === 'return') && (o.st === undefined)) { if (o.delivery_cost > 0) x.refusal_ship += o.delivery_cost; else if (o.ttn) x.refusal_ship_unknown++; }
          if (c === 'work' && conf(o)) { x.pend_sales++; x.pend_revenue += o.payment_amount; x.pend_cogs += o.cost_price; x.pend_costs += o.shipping_costs + o.commission; } }
        const fd = fin(o, p_fin);
        if (inR(fd, p_from, p_to)) {
          if (c === 'success') { const x = g(fd); x.sales++; x.revenue += o.payment_amount; x.cogs += o.cost_price; x.order_costs += o.shipping_costs + o.commission + o.expenses_amount; x.payed += o.payed_amount; x.upsell += o.upsell_amount; }
          if (c === 'return') g(fd).return_costs += o.shipping_costs + o.commission + o.expenses_amount;
        }
      }
      return [...days.values()].sort((a, b) => a.day.localeCompare(b.day));
    },
    stats_channels({ p_from, p_to, p_fin, p_store }) {
      const orders = scoped(p_store);
      const m = new Map(); const g = (u) => { u = u || ''; if (!m.has(u)) m.set(u, { utm_source: u, leads: 0, sales: 0, revenue: 0, gross: 0 }); return m.get(u); };
      for (const o of orders) {
        const c = cat(o); if (c === 'ignore') continue;
        if (inR(o.order_date, p_from, p_to)) g(o.utm_source).leads++;
        if (c === 'success' && inR(fin(o, p_fin), p_from, p_to)) { const x = g(o.utm_source); x.sales++; x.revenue += o.payment_amount; x.gross += o.payment_amount - o.cost_price - o.shipping_costs - o.commission - o.expenses_amount; }
      }
      return [...m.values()];
    },
    stats_products({ p_from, p_to, p_fin, p_store }) {
      const m = new Map();
      for (const i of items) {
        const o = byId.get(i.order_id); if (!inScope(o, p_store)) continue; const c = cat(o);
        if (!['success', 'fail', 'return'].includes(c)) continue;
        if (!inR(c === 'success' ? fin(o, p_fin) : o.order_date, p_from, p_to)) continue;
        if (!m.has(i.product_id)) m.set(i.product_id, { product_id: i.product_id, name: i.name, sku: i.sku, sold: 0, refused: 0, returned: 0, revenue: 0, cost: 0, profit: 0 });
        const x = m.get(i.product_id);
        if (c === 'success') { x.sold += i.amount; x.revenue += i.price * i.amount; x.cost += i.cost_price * i.amount; x.profit += (i.price - i.cost_price) * i.amount; }
        else if (c === 'fail') x.refused += i.amount; else x.returned += i.amount;
      }
      return [...m.values()].sort((a, b) => b.profit - a.profit);
    },
    stats_statuses({ p_from, p_to, p_store }) {
      const list = scoped(p_store).filter((o) => inR(o.order_date, p_from, p_to) && cat(o) !== 'ignore');
      return group(list, (o) => o.status_id, (k) => { const s = statuses.find((x) => x.id === k); return { status_id: k, name: s?.name || 'Статус #' + k, category: s?.category || 'work', cnt: 0, amount: 0, sort: s?.sort || 0 }; }, (x, o) => { x.cnt++; x.amount += o.payment_amount; })
        .sort((a, b) => a.sort - b.sort);
    },
    stats_reasons({ p_from, p_to, p_store }) {
      const list = scoped(p_store).filter((o) => inR(o.order_date, p_from, p_to) && ['fail', 'return'].includes(cat(o)));
      return group(list, (o) => o.rejection_reason || '—', (k) => ({ reason: k, fail: 0, returns: 0 }), (x, o) => { if (cat(o) === 'fail') x.fail++; else x.returns++; })
        .sort((a, b) => (b.fail + b.returns) - (a.fail + a.returns));
    },
    stats_payments({ p_from, p_to, p_fin, p_store }) {
      const orders = scoped(p_store);
      const s = orders.filter((o) => cat(o) === 'success' && inR(fin(o, p_fin), p_from, p_to));
      const back = new Date(p_to + 'T00:00:00Z'); back.setUTCDate(back.getUTCDate() - 90); const b = back.toISOString().slice(0, 10);
      const pend = orders.filter((o) => ['work', 'success'].includes(cat(o)) && o.rest_pay > 0.009 && o.order_date >= b);
      return {
        payed: s.reduce((a, o) => a + o.payed_amount, 0), rest: s.reduce((a, o) => a + o.rest_pay, 0), unpaid_count: s.filter((o) => o.rest_pay > 0.009).length,
        pending_sum: pend.reduce((a, o) => a + o.rest_pay, 0), pending_count: pend.length,
        by_method: group(s, (o) => o.payment_method || '—', (k) => ({ method: k, cnt: 0, amount: 0 }), (x, o) => { x.cnt++; x.amount += o.payment_amount; }).sort((a, b) => b.amount - a.amount),
      };
    },
    stats_managers({ p_from, p_to, p_fin, p_store }) {
      const orders = scoped(p_store);
      const m = new Map(); const g = (id) => { if (!m.has(id)) m.set(id, { manager_id: id, leads: 0, confirmed: 0, success: 0, fail: 0, returns: 0, sales: 0, revenue: 0, gross: 0, upsell: 0 }); return m.get(id); };
      for (const o of orders) {
        const c = cat(o); if (c === 'ignore') continue;
        if (inR(o.order_date, p_from, p_to)) { const x = g(o.manager_id); x.leads++; if (conf(o)) x.confirmed++; if (c === 'success') x.success++; if (c === 'fail') x.fail++; if (c === 'return') x.returns++; }
        if (c === 'success' && inR(fin(o, p_fin), p_from, p_to)) { const x = g(o.manager_id); x.sales++; x.revenue += o.payment_amount; x.gross += o.payment_amount - o.cost_price - o.shipping_costs - o.commission - o.expenses_amount; x.upsell += o.upsell_amount; }
      }
      return [...m.values()];
    },
    stats_manager_daily({ p_from, p_to, p_fin, p_store }) {
      const list = scoped(p_store).filter((o) => cat(o) === 'success' && inR(fin(o, p_fin), p_from, p_to));
      return group(list, (o) => fin(o, p_fin) + '|' + o.manager_id, (k) => ({ day: k.split('|')[0], manager_id: Number(k.split('|')[1]), sales: 0, upsell: 0 }), (x, o) => { x.sales++; x.upsell += o.upsell_amount; });
    },
    stats_payment_daily({ p_from, p_to, p_store }) {
      const list = scoped(p_store).filter((o) => inR(o.order_date, p_from, p_to) && cat(o) !== 'ignore' && o.payed_amount > 0);
      return group(list, (o) => o.order_date + '|' + o.payment_method, (k) => ({ day: k.split('|')[0], method: k.split('|')[1], cnt: 0, amount: 0 }), (x, o) => { x.cnt++; x.amount += o.payed_amount; });
    },
    payment_methods() { return group(orders, (o) => o.payment_method || '—', (k) => ({ method: k, cnt: 0 }), (x) => { x.cnt++; }).sort((a, b) => b.cnt - a.cnt); },
    stats_fee_daily({ p_from, p_to, p_store }) {
      const list = scoped(p_store).filter((o) => o.payment_method === 'Оплата на картку' && o.payed_amount > 0 && inR(o.order_date, p_from, p_to));
      return group(list, (o) => o.order_date, (k) => ({ day: k, fee: 0, cnt: 0 }), (x, o) => { x.cnt++; x.fee += Math.round(o.payed_amount * 2) / 100; });
    },
    wfp_list({ p_from, p_to }) {
      return orders.filter((o) => o.payment_method === 'Оплата на картку' && o.payed_amount > 0 && inR(o.order_date, p_from, p_to)).slice(-300).reverse().map((o, i) => ({
        id: 'w' + o.id, order_reference: '13894761_' + (1239000000 + o.id), tx_type: 'PURCHASE', status: 'Approved', tx_time: o.order_time.replace(' ', 'T') + '+03:00',
        amount: o.payed_amount, fee: Math.round(o.payed_amount * 2) / 100, payment_system: ['applePay', 'card', 'googlePay'][i % 3], order_id: i % 25 === 7 ? null : o.id, matched_by: 'external_id', sajt: o.sajt, order_date: o.order_date }));
    },
    delivery_sample() {
      return orders.filter((o) => ['fail', 'return'].includes(cat(o)) && o.ttn).slice(-5).reverse().map((o) => ({ id: o.id, order_date: o.order_date, status: statuses.find((x) => x.id === o.status_id)?.name, ttn: o.ttn, sajt: o.sajt, delivery_cost: o.delivery_cost, delivery_json: { trackingNumber: o.ttn, provider: 'novaposhta', cost: o.delivery_cost, statusCode: 102 } }));
    },
    fop_senders() {
      const m = new Map(); for (const o of orders) { if (!o.ttn) continue; const k = o.sajt === 21 ? (o.id % 3 ? '2' : '4') : '3'; const x = m.get(k) || { sender: k, cnt: 0, sample_id: 0, sajt: o.sajt }; x.cnt++; x.sample_id = o.id; m.set(k, x); }
      return [...m.values()].sort((a, b) => b.cnt - a.cnt);
    },
    fop_income({ p_from, p_to }) {
      const m = new Map(); let wfp = 0, wc = 0;
      for (const o of orders) {
        if (cat(o) !== 'success' || !inR(o.payment_date || o.order_date, p_from, p_to)) continue;
        const k = o.sajt === 21 ? (o.id % 3 ? '2' : '4') : '3';
        const pre = o.payment_method === 'Оплата на картку' ? o.payed_amount : 0; wfp += pre; if (pre) wc++;
        const x = m.get(k) || { sender: k, kind: 'cod', amount: 0, cnt: 0 }; x.amount += Math.max(o.payment_amount - pre, 0); x.cnt++; m.set(k, x);
      }
      return [...m.values(), { sender: null, kind: 'wfp', amount: wfp, cnt: wc }];
    },
    stats_overview_meta() {
      return { orders: orders.length, first_order: orders[0]?.order_date, last_order: orders[orders.length - 1]?.order_time,
        sites: stores.map((st) => ({ id: st.id, orders: orders.filter((o) => o.sajt === st.id).length })) };
    },
  };
  const people = [
    { id: 1, name: 'Віктор', role: 'owner', pay_kind: 'percent_profit', value: 30, store_id: null, active: true, sort: 0 },
    { id: 2, name: 'Владислав', role: 'owner', pay_kind: 'percent_profit', value: 30, store_id: null, active: true, sort: 1 },
    { id: 3, name: 'Олена (UGC)', role: 'team', pay_kind: 'manual', value: 0, store_id: null, active: true, sort: 2 },
    { id: 4, name: 'Дизайнер', role: 'team', pay_kind: 'fixed_monthly', value: 5000, store_id: null, active: true, sort: 3 },
  ];
  const payouts = [];
  for (let mm = new Date(start.getFullYear(), start.getMonth(), 1); mm <= today; mm.setMonth(mm.getMonth() + 1)) {
    const d1 = new Date(mm.getFullYear(), mm.getMonth(), 8), d2 = new Date(mm.getFullYear(), mm.getMonth(), 20);
    if (d1 <= today) payouts.push({ id: eid++, person_id: 3, date: ymdL(d1), date_to: null, store_id: 21, amount: 4500, currency: 'UAH', rate: 1, amount_uah: 4500, comment: '3 відео для реклами', created_by: 'viktor@shop.ua' });
    if (d2 <= today) payouts.push({ id: eid++, person_id: 3, date: ymdL(d2), date_to: null, store_id: 22, amount: 60, currency: 'USD', rate: 41.5, amount_uah: 2490, comment: 'Розпаковка', created_by: 'vlad@shop.ua' });
  }
  const fops = [
    { id: 1, name: 'ФОП Семенюк', sender_id: '2', store_id: 21, single_tax: 1730, esv: 1902, military: 865, other: 0, year_limit: 6900000, income_before: 3900000, active: true, sort: 0 },
    { id: 2, name: 'ФОП Коваль', sender_id: '4', store_id: 21, single_tax: 1730, esv: 1902, military: 865, other: 0, year_limit: 6900000, income_before: 1200000, active: true, sort: 1 },
  ];
  settings.wfp_fop = 1;
  const tables = { statuses, stores, managers, expenses, rules, people, payouts, sync_log: syncLog, fops };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  return {
    mode: 'demo',
    async session() { return { email: 'demo@shop.ua' }; },
    async signIn() { return { email: 'demo@shop.ua' }; },
    async signOut() {},
    async settings() { return clone(settings); },
    async setSetting(k, v) { settings[k] = v; },
    async rpc(name, params) { return clone(R[name](params)); },
    async list(table, opts = {}) {
      let rows = tables[table];
      for (const [k, v] of Object.entries(opts.eq || {})) rows = rows.filter((r) => r[k] === v);
      if ((table === 'expenses' || table === 'payouts') && opts.from) rows = rows.filter((e) => e.date <= opts.to && (e.date_to || e.date) >= opts.from);
      if (table === 'payouts') rows = [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
      if (table === 'people' || table === 'fops') rows = [...rows].sort((a, b) => a.sort - b.sort || a.id - b.id);
      if (table === 'expenses') rows = [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
      if (table === 'statuses' || table === 'stores') rows = [...rows].sort((a, b) => a.sort - b.sort);
      return clone(rows);
    },
    async insert(table, row) {
      const t = tables[table];
      const r = { ...row, id: table === 'rules' ? rid++ : eid++ };
      if (table === 'expenses' || table === 'payouts') r.amount_uah = Math.round(r.amount * (r.rate || 1) * 100) / 100;
      t.push(r); return r;
    },
    async update(table, idv, patch) {
      const r = tables[table].find((x) => x.id === idv);
      Object.assign(r, patch);
      if (table === 'expenses' || table === 'payouts') r.amount_uah = Math.round(r.amount * (r.rate || 1) * 100) / 100;
      return r;
    },
    async remove(table, idv) { const t = tables[table]; t.splice(t.findIndex((x) => x.id === idv), 1); },
    async sync() {
      await new Promise((r) => setTimeout(r, 900));
      const e = { id: syncLog.length + 1, at: new Date().toISOString(), mode: 'manual', orders: 0, pages: 1, ok: true, message: 'Демо: нових замовлень немає' };
      syncLog.unshift(e); settings.last_sync = e.at; settings.last_run = e.at;
      return { success: true, message: e.message };
    },
  };
}
