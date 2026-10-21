-- 013: замовлення обміну (бот обмінів створює їх у SalesDrive) — не новий продаж.
-- Розпізнаються за exch_cases.new_order_id, а створені вручну — за коментарем «ОБМІН до №…».
--   • не рахуються як ліди / підтверджені / продажі (і в менеджерах, каналах, змінах, товарах);
--   • відмова від посилки обміну рахується як звичайна відмова (сума за відмови);
--   • виручка = реально отримана доплата (наложкою або на реквізити; повернута клієнту різниця — мінусом);
--   • собівартість = нові товари − повернуті (постачальник зараховує повернуті в таблиці «Обмін д280»);
--   • «Оплати на рахунок»: лише доплата на реквізити, а не «ПП …» / «повна оплата» з коментаря.

create or replace function exch_orders()
returns table (order_id bigint, revenue numeric, cogs numeric, card numeric)
language sql stable security definer set search_path = public as $$
  with c as (
    select c.new_order_id oid, c.pay,
           coalesce((select sum(coalesce((r->>'cost')::numeric, 0) * coalesce((r->>'qty')::numeric, 1))
                     from jsonb_array_elements(coalesce(c.returned, '[]'::jsonb)) r), 0) ret_cost
    from exch_cases c
    where c.new_order_id is not null and c.kind <> 'refund'
  )
  select o.id,
         case when c.oid is not null then
           case c.pay->>'mode'
             when 'cod'  then coalesce((c.pay->>'amount')::numeric, 0)
             when 'paid' then coalesce((c.pay->>'amount')::numeric, 0)
             when 'back' then -coalesce((c.pay->>'amount')::numeric, 0)
             else 0 end
         -- обмін, внесений вручну: наложка = сума − ПП («повна оплата» → 0)
         else o.payment_amount - prepay_amount(o.comment, o.payment_amount) end,
         o.cost_price - coalesce(c.ret_cost, 0),
         case when c.pay->>'mode' = 'paid' then coalesce((c.pay->>'amount')::numeric, 0) else 0 end
  from orders o left join c on c.oid = o.id
  where c.oid is not null or o.comment ~* '^\s*обм[іi]н\s+до\s*№'
$$;
revoke all on function exch_orders() from public, anon;
grant execute on function exch_orders() to authenticated, service_role;

create or replace function stats_daily(p_from date, p_to date, p_fin text default 'order', p_store int default null)
returns table (day date, leads integer, confirmed integer, unconfirmed integer, success integer, fail integer, returns integer, work integer,
  sales integer, revenue numeric, cogs numeric, order_costs numeric, return_costs numeric, payed numeric, upsell numeric,
  pend_sales integer, pend_revenue numeric, pend_cogs numeric, pend_costs numeric, refusal_ship numeric, refusal_ship_unknown integer, archived boolean)
language sql stable as $$
  with x as (select * from exch_orders()),
  f as (
    select o.order_date d,
           count(*) filter (where x.order_id is null)::int leads,
           count(*) filter (where s.confirmed and x.order_id is null)::int confirmed,
           count(*) filter (where coalesce(s.category,'work') = 'work' and not coalesce(s.confirmed, false) and x.order_id is null)::int unconfirmed,
           count(*) filter (where s.category = 'success' and x.order_id is null)::int success,
           count(*) filter (where s.category = 'fail')::int fail,
           count(*) filter (where s.category = 'return')::int returns,
           count(*) filter (where coalesce(s.category,'work') = 'work' and x.order_id is null)::int work,
           count(*) filter (where s.category = 'work' and s.confirmed and x.order_id is null)::int pend_sales,
           coalesce(sum(coalesce(x.revenue, o.payment_amount)) filter (where s.category = 'work' and s.confirmed), 0) pend_revenue,
           coalesce(sum(coalesce(x.cogs, o.cost_price)) filter (where s.category = 'work' and s.confirmed), 0) pend_cogs,
           coalesce(sum(order_extra(o)) filter (where s.category = 'work' and s.confirmed), 0) pend_costs,
           coalesce(sum(o.delivery_cost) filter (where s.category in ('fail','return') and o.delivery_cost > 0), 0) refusal_ship,
           count(*) filter (where s.category in ('fail','return') and coalesce(o.delivery_cost,0) = 0 and coalesce(o.ttn,'') <> '')::int refusal_ship_unknown
    from orders o left join statuses s on s.id = o.status_id left join x on x.order_id = o.id
    where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until()
      and coalesce(s.category,'work') <> 'ignore'
    group by 1
  ), m as (
    select fin_date(o, p_fin) d,
           count(*) filter (where s.category = 'success' and x.order_id is null)::int sales,
           coalesce(sum(coalesce(x.revenue, o.payment_amount)) filter (where s.category = 'success'), 0) revenue,
           coalesce(sum(coalesce(x.cogs, o.cost_price)) filter (where s.category = 'success'), 0) cogs,
           coalesce(sum(order_extra(o)) filter (where s.category = 'success'), 0) order_costs,
           coalesce(sum(order_extra(o)) filter (where s.category = 'return'), 0) return_costs,
           coalesce(sum(o.payed_amount) filter (where s.category = 'success'), 0) payed,
           coalesce(sum(o.upsell_amount) filter (where s.category = 'success'), 0) upsell
    from orders o join statuses s on s.id = o.status_id left join x on x.order_id = o.id
    where in_scope(o.sajt, p_store) and fin_date(o, p_fin) between p_from and p_to and o.order_date > archive_until()
      and s.category in ('success','return')
    group by 1
  ), live as (
    select coalesce(f.d, m.d) d,
           coalesce(f.leads,0) leads, coalesce(f.confirmed,0) confirmed, coalesce(f.unconfirmed,0) unconfirmed, coalesce(f.success,0) success,
           coalesce(f.fail,0) fail, coalesce(f.returns,0) returns, coalesce(f.work,0) work,
           coalesce(m.sales,0) sales, coalesce(m.revenue,0) revenue, coalesce(m.cogs,0) cogs, coalesce(m.order_costs,0) order_costs, coalesce(m.return_costs,0) return_costs,
           coalesce(m.payed,0) payed, coalesce(m.upsell,0) upsell,
           coalesce(f.pend_sales,0) pend_sales, coalesce(f.pend_revenue,0) pend_revenue, coalesce(f.pend_cogs,0) pend_cogs, coalesce(f.pend_costs,0) pend_costs,
           coalesce(f.refusal_ship,0) refusal_ship, coalesce(f.refusal_ship_unknown,0) refusal_ship_unknown, false archived
    from f full join m on m.d = f.d
  ), arch as (
    -- Архів: виручка старого дашборду вже містить підтверджені (в дорозі) + продані — кладемо її як «продажі»
    select a.day d, sum(a.leads)::int leads, sum(a.confirmed)::int confirmed,
           greatest(sum(a.leads) - sum(a.confirmed) - sum(a.fail), 0)::int unconfirmed,
           sum(a.success)::int success, sum(a.fail)::int fail, 0 returns,
           greatest(sum(a.leads) - sum(a.success) - sum(a.fail), 0)::int work,
           sum(a.confirmed)::int sales, sum(a.revenue) revenue, sum(a.cogs) cogs, 0::numeric order_costs, 0::numeric return_costs,
           0::numeric payed, 0::numeric upsell, 0 pend_sales, 0::numeric pend_revenue, 0::numeric pend_cogs, 0::numeric pend_costs,
           0::numeric refusal_ship, 0 refusal_ship_unknown, true archived
    from archive_daily a
    where in_store(a.store_id, p_store) and a.day between p_from and p_to and a.day <= archive_until()
    group by 1
  )
  select * from live union all select * from arch order by 1
$$;

create or replace function stats_channels(p_from date, p_to date, p_fin text default 'order', p_store int default null)
returns table (utm_source text, leads int, sales int, revenue numeric, gross numeric)
language sql stable as $$
  with x as (select * from exch_orders()),
  l as (
    select coalesce(o.utm_source,'') u, count(*)::int leads
    from orders o left join statuses s on s.id = o.status_id
    where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until() and coalesce(s.category,'work') <> 'ignore'
      and not exists (select 1 from x where x.order_id = o.id)
    group by 1
  ), m as (
    select coalesce(o.utm_source,'') u, count(*) filter (where x.order_id is null)::int sales,
           sum(coalesce(x.revenue, o.payment_amount)) revenue,
           sum(coalesce(x.revenue, o.payment_amount) - coalesce(x.cogs, o.cost_price) - order_extra(o)) gross
    from orders o join statuses s on s.id = o.status_id left join x on x.order_id = o.id
    where in_scope(o.sajt, p_store) and fin_date(o, p_fin) between p_from and p_to and o.order_date > archive_until() and s.category = 'success'
    group by 1
  )
  select coalesce(l.u, m.u), coalesce(l.leads,0), coalesce(m.sales,0), coalesce(m.revenue,0), coalesce(m.gross,0)
  from l full join m on m.u = l.u
$$;

create or replace function stats_manager_daily(p_from date, p_to date, p_fin text default 'order', p_store int default null)
returns table (day date, manager_id int, store_id int, sales int, upsell numeric, upsell_potential numeric, upsell_auto numeric, adjusted boolean, archived boolean)
language sql stable as $$
  with live as (
    select o.order_date d, o.manager_id mid, o.sajt sid,
           count(*) filter (where s.confirmed or s.category = 'fail')::int paid,
           coalesce(sum(o.upsell_amount) filter (where s.category = 'success'), 0) up,
           coalesce(sum(o.upsell_amount) filter (where s.confirmed), 0) pot
    from orders o join statuses s on s.id = o.status_id
    where in_scope(o.sajt, p_store) and o.manager_id is not null and o.order_date between p_from and p_to and o.order_date > archive_until()
      and (s.confirmed or s.category = 'fail')
      and not exists (select 1 from exch_orders() x where x.order_id = o.id)   -- за обмін ставка менеджеру не нараховується
    group by 1, 2, 3
  )
  select l.d, l.mid, l.sid, l.paid, coalesce(a.upsell_amount, l.up), l.pot, l.up, a.upsell_amount is not null, false
  from live l left join mgr_adjust a on a.manager_id = l.mid and a.store_id = l.sid and a.day = l.d
  union all
  select a.day, a.manager_id, a.store_id, a.orders, a.upsell, a.upsell_potential, a.upsell, false, true
  from archive_manager_daily a
  where in_store(a.store_id, p_store) and a.day between p_from and p_to and a.day <= archive_until()
$$;

create or replace function stats_managers(p_from date, p_to date, p_fin text default 'order', p_store int default null)
returns table (manager_id int, leads int, confirmed int, success int, fail int, returns int, sales int, revenue numeric, gross numeric,
  upsell numeric, paid_orders int, upsell_potential numeric)
language sql stable as $$
  with x as (select * from exch_orders()),
  l as (
    select o.manager_id m, count(*) filter (where x.order_id is null)::int leads,
           count(*) filter (where s.confirmed and x.order_id is null)::int confirmed,
           count(*) filter (where s.category='success' and x.order_id is null)::int success,
           count(*) filter (where s.category='fail')::int fail,
           count(*) filter (where s.category='return')::int returns
    from orders o left join statuses s on s.id=o.status_id left join x on x.order_id = o.id
    where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until() and coalesce(s.category,'work') <> 'ignore'
    group by 1
  ), m as (
    select o.manager_id m, count(*) filter (where x.order_id is null)::int sales,
           sum(coalesce(x.revenue, o.payment_amount)) revenue,
           sum(coalesce(x.revenue, o.payment_amount) - coalesce(x.cogs, o.cost_price) - order_extra(o)) gross
    from orders o join statuses s on s.id=o.status_id left join x on x.order_id = o.id
    where in_scope(o.sajt, p_store) and s.category='success' and fin_date(o,p_fin) between p_from and p_to and o.order_date > archive_until()
    group by 1
  ), p as (
    select x.manager_id m, sum(x.sales)::int paid, sum(x.upsell) up, sum(x.upsell_potential) pot
    from stats_manager_daily(p_from, p_to, p_fin, p_store) x group by 1
  ), ids as (select m from l union select m from m union select m from p)
  select ids.m, coalesce(l.leads,0), coalesce(l.confirmed,0), coalesce(l.success,0), coalesce(l.fail,0), coalesce(l.returns,0),
         coalesce(m.sales,0), coalesce(m.revenue,0), coalesce(m.gross,0), coalesce(p.up,0), coalesce(p.paid,0), coalesce(p.pot,0)
  from ids left join l on l.m = ids.m left join m on m.m = ids.m left join p on p.m = ids.m
$$;

create or replace function stats_statuses(p_from date, p_to date, p_store int default null)
returns table (status_id int, name text, category text, cnt int, amount numeric)
language sql stable as $$
  select o.status_id, coalesce(s.name, 'Статус #' || o.status_id), coalesce(s.category,'work'), count(*)::int, sum(o.payment_amount)
  from orders o left join statuses s on s.id = o.status_id
  where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until() and coalesce(s.category,'work') <> 'ignore'
    and not exists (select 1 from exch_orders() x where x.order_id = o.id)
  group by o.status_id, s.name, s.category, s.sort
  order by coalesce(s.sort, 0), count(*) desc
$$;

create or replace function stats_products(p_from date, p_to date, p_fin text default 'order', p_store int default null)
returns table (product_id bigint, name text, sku text, sold numeric, refused numeric, returned numeric, revenue numeric, cost numeric, profit numeric, archived_revenue numeric)
language sql stable as $$
  with live as (
    select coalesce(i.product_id, 0) pid, case when i.product_id is null then i.name end nk,
           max(i.name) name, max(i.sku) sku,
           coalesce(sum(i.amount) filter (where s.category = 'success'), 0) sold,
           coalesce(sum(i.amount) filter (where s.category = 'fail'), 0) refused,
           coalesce(sum(i.amount) filter (where s.category = 'return'), 0) returned,
           coalesce(sum(i.price * i.amount) filter (where s.category = 'success'), 0) revenue,
           coalesce(sum(i.cost_price * i.amount) filter (where s.category = 'success'), 0) cost,
           0::numeric arev
    from order_items i
    join orders o on o.id = i.order_id
    join statuses s on s.id = o.status_id
    where in_scope(o.sajt, p_store) and s.category in ('success','fail','return') and o.order_date > archive_until()
      and (case when s.category = 'success' then fin_date(o, p_fin) else o.order_date end) between p_from and p_to
      and not exists (select 1 from exch_orders() x where x.order_id = o.id)
    group by 1, 2
  ), arch as (
    select a.product_id pid, null::text nk, max(a.name) name, max(a.sku) sku,
           sum(a.sold)::numeric sold, sum(a.refused)::numeric refused, 0::numeric returned,
           sum(a.revenue) revenue, 0::numeric cost, sum(a.revenue) arev
    from archive_products a
    where in_store(a.store_id, p_store) and a.day between p_from and p_to and a.day <= archive_until()
    group by 1
  ), u as (select * from live union all select * from arch)
  select pid, max(name), max(sku), sum(sold), sum(refused), sum(returned), sum(revenue), sum(cost),
         sum(revenue) - sum(cost) - sum(arev), sum(arev)
  from u group by pid, nk
  order by 9 desc, 4 desc
$$;

create or replace function stats_shifts(p_from date, p_to date)
returns table (day date, manager_id int, orders int, in_hours int, first_t time, last_t time, archived boolean)
language sql stable as $$
  with h as (
    select coalesce((select value from settings where key = 'shift_hours'), '{"wd":["09:00","19:30"],"sun":["10:00","19:30"]}'::jsonb) v
  ), live as (
    select o.order_time::date d, o.manager_id m, o.order_time::time t,
           extract(isodow from o.order_time) = 7 as sun
    from orders o
    left join statuses s on s.id = o.status_id
    where o.order_time >= p_from and o.order_time < p_to + 1
      and o.order_time::date > archive_until()
      and o.manager_id is not null
      and coalesce(s.category, 'work') <> 'ignore'
      and in_scope(o.sajt, null)
      and not exists (select 1 from exch_orders() x where x.order_id = o.id)
  )
  select l.d, l.m, count(*)::int,
         count(*) filter (where l.t >= ((select v from h) -> (case when l.sun then 'sun' else 'wd' end) ->> 0)::time
                            and l.t <  ((select v from h) -> (case when l.sun then 'sun' else 'wd' end) ->> 1)::time)::int,
         min(l.t), max(l.t), false
  from live l group by l.d, l.m
  union all
  select a.day, a.manager_id, sum(a.orders)::int, sum(a.orders)::int, null::time, null::time, true
  from archive_manager_daily a
  where a.day between p_from and p_to and a.day <= archive_until() and in_store(a.store_id, null)
  group by a.day, a.manager_id
$$;

create or replace function card_auto(p_from date, p_to date, p_store int default null)
returns table (day date, sajt int, amount numeric, cnt int)
language sql stable as $$
  with a as (
    select o.order_date d, o.sajt sid,
           case when x.order_id is not null then x.card
                else card_amount(o.comment, o.payment_amount, s.confirmed, s.category) end amt
    from orders o join statuses s on s.id = o.status_id left join exch_orders() x on x.order_id = o.id
    where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until()
  )
  select d, sid, sum(amt), count(*)::int from a where amt > 0 group by 1, 2
$$;

create or replace function card_orders(p_from date, p_to date, p_store int default null)
returns table (id bigint, order_time timestamp, order_date date, sajt int, status text, category text, manager_id int, client_name text,
  payment_amount numeric, amount numeric, kind text, comment text, payment_method text, checked boolean, check_note text, checked_by text, checked_at timestamptz)
language sql stable as $$
  select * from (
    select o.id, o.order_time, o.order_date, o.sajt, s.name, s.category, o.manager_id, o.client_name,
           o.payment_amount,
           case when x.order_id is not null then x.card else card_amount(o.comment, o.payment_amount, s.confirmed, s.category) end amt,
           case when x.order_id is null and o.comment ~* 'повн[[:alpha:]]*[[:space:]]*оплат' and s.confirmed then 'full' else 'pp' end,
           o.comment, o.payment_method, coalesce(c.checked, false), c.note, c.checked_by, c.checked_at
    from orders o join statuses s on s.id = o.status_id left join card_checks c on c.order_id = o.id
         left join exch_orders() x on x.order_id = o.id
    where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until()
  ) q
  where q.amt > 0
  order by q.order_time desc, q.id desc
$$;
