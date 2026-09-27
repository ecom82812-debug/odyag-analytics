-- =====================================================================
-- Аналітика магазину одягу — схема бази Supabase
-- Основа — проєкт «конструктори», адаптовано під одяг (без WayForPay; архів старої бази;
-- оплати на рахунок, CPO план/факт, штраф за відмови, з/п менеджерів як в одязі).
-- Файл ідемпотентний: можна виконувати повторно після кожного оновлення.
-- =====================================================================

-- ---------- Замовлення з SalesDrive (кожне окремо) ----------
create table if not exists orders (
  id               bigint primary key,            -- номер заявки в SalesDrive
  order_time       timestamp,                     -- коли створена (київський час)
  order_date       date generated always as (order_time::date) stored,
  payment_date     date,                          -- дата продажу (paymentDate)
  update_at        timestamp,
  status_id        int,
  payment_amount   numeric(14,2) not null default 0,  -- сума замовлення
  cost_price       numeric(14,2) not null default 0,  -- собівартість (закупка)
  shipping_costs   numeric(14,2) not null default 0,  -- витрати на доставку
  commission       numeric(14,2) not null default 0,  -- комісії (накладений платіж, еквайринг)
  expenses_amount  numeric(14,2) not null default 0,  -- інші витрати в замовленні
  payed_amount     numeric(14,2) not null default 0,  -- оплачено
  rest_pay         numeric(14,2) not null default 0,  -- залишок до оплати
  discount_amount  numeric(14,2) not null default 0,
  upsell_amount    numeric(14,2) not null default 0,  -- сума допродажів (товари з preSale)
  rejection_reason text,
  utm_source       text,
  utm_campaign     text,
  sajt             int,
  manager_id       int,
  payment_method   text,
  synced_at        timestamptz not null default now()
);
alter table orders add column if not exists external_id text;             -- зовнішній номер заявки (номер замовлення Tilda)
create index if not exists orders_external_id_idx on orders (external_id);
alter table orders add column if not exists ttn text;                     -- номер ТТН
alter table orders add column if not exists delivery_cost numeric(14,2) not null default 0;  -- вартість доставки з трекінгу
alter table orders add column if not exists delivery_json jsonb;           -- дані доставки як є (для перевірки)
create index if not exists orders_order_date_idx   on orders (order_date);
create index if not exists orders_payment_date_idx on orders (payment_date);
create index if not exists orders_status_idx       on orders (status_id);

create table if not exists order_items (
  order_id   bigint not null references orders(id) on delete cascade,
  pos        int    not null,
  product_id bigint,
  name       text,
  sku        text,
  amount     numeric(12,3) not null default 1,
  price      numeric(14,2) not null default 0,
  cost_price numeric(14,2) not null default 0,
  pre_sale   boolean not null default false,
  primary key (order_id, pos)
);
create index if not exists order_items_product_idx on order_items (product_id);

-- ---------- Статуси SalesDrive і що вони означають ----------
-- category: work (в роботі) | success (продаж) | fail (відмова) | return (повернення) | ignore (не рахувати)
create table if not exists statuses (
  id        int primary key,
  name      text not null,
  type      int,
  category  text not null default 'work' check (category in ('work','success','fail','return','ignore')),
  confirmed boolean not null default false,  -- рахується як «підтверджене» замовлення
  manual    boolean not null default false,  -- true = змінено вручну, синхронізація не перезапише
  sort      int not null default 0
);
alter table statuses add column if not exists confirmed boolean not null default false;

-- ---------- Магазини (сайти в SalesDrive) ----------
-- id = номер сайту (поле «Сайт»/sajt у заявці). З'являються автоматично під час синхронізації,
-- назву задаєте в Налаштуваннях. active = false — сайт не рахується у звітах.
create table if not exists stores (
  id     int primary key,
  name   text,
  active boolean not null default true,
  sort   int not null default 0
);

-- ---------- Менеджери (id з SalesDrive, ім'я вносите в Налаштуваннях) ----------
create table if not exists managers (
  id             int primary key,          -- userId у SalesDrive
  name           text,
  rate_per_order numeric(10,2) not null default 0,  -- грн за кожен продаж
  upsell_pct     numeric(6,4)  not null default 0,  -- частка від допродажів (0.25 = 25%)
  active         boolean not null default true
);

-- ---------- Витрати, які ви вносите вручну ----------
create table if not exists expenses (
  id         bigserial primary key,
  date       date not null,                -- дата (або початок періоду)
  date_to    date,                         -- кінець періоду: сума розподіляється по днях
  category   text not null,                -- 'Реклама', 'Податки', 'SMS-розсилки', ...
  channel    text,                         -- для реклами: Meta, Google, TikTok, ...
  amount     numeric(14,2) not null,       -- сума у валюті
  currency   text not null default 'UAH' check (currency in ('UAH','USD','EUR')),
  rate       numeric(10,4) not null default 1,  -- курс на момент внесення
  amount_uah numeric(14,2) generated always as (round(amount * rate, 2)) stored,
  comment    text,
  store_id   int,                          -- магазин; порожньо = загальна витрата
  created_by text default (auth.jwt() ->> 'email'),  -- хто вніс (email входу)
  created_at timestamptz not null default now()
);
alter table expenses add column if not exists store_id int;
alter table expenses add column if not exists created_by text default (auth.jwt() ->> 'email');
create index if not exists expenses_date_idx on expenses (date);

-- ---------- Автоматичні витрати (правила) ----------
-- kind: percent_revenue (% від виручки) | fixed_monthly (грн на місяць) | per_order (грн за продаж)
create table if not exists rules (
  id        bigserial primary key,
  name      text not null,
  kind      text not null check (kind in ('percent_revenue','fixed_monthly','per_order')),
  value     numeric(14,4) not null,
  category  text not null default 'Інше',
  date_from date,
  date_to   date,
  store_id  int,                           -- магазин; порожньо = для всіх
  active    boolean not null default true
);
alter table rules add column if not exists store_id int;
-- Комісія платіжної системи: % від оплаченої суми замовлень з обраним способом оплати + фікс. сума за платіж
alter table rules add column if not exists method text;
alter table rules add column if not exists value2 numeric(14,4) not null default 0;
alter table rules drop constraint if exists rules_kind_check;
alter table rules add constraint rules_kind_check check (kind in ('percent_revenue','fixed_monthly','per_order','percent_payment'));
alter table rules add column if not exists created_by text default (auth.jwt() ->> 'email');

-- ---------- Зарплата: люди і виплати ----------
-- role: owner (власник — виплати НЕ віднімаються від прибутку, це розподіл прибутку)
--       team  (UGC-креатор, фрилансер тощо — виплати віднімаються від прибутку магазину)
-- pay_kind: percent_profit (% від чистого прибутку всього бізнесу за місяць) | fixed_monthly | manual
create table if not exists people (
  id        bigserial primary key,
  name      text not null,
  role      text not null default 'team' check (role in ('owner','team','share')),
  pay_kind  text not null default 'manual' check (pay_kind in ('percent_profit','fixed_monthly','manual')),
  value     numeric(14,4) not null default 0,
  store_id  int,                              -- для команди: з якого магазину віднімати фіксовану суму
  active    boolean not null default true,
  sort      int not null default 0,
  created_by text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);

-- Разові виплати (UGC за відео, контент, бонуси)
create table if not exists payouts (
  id         bigserial primary key,
  person_id  bigint references people(id) on delete set null,
  date       date not null,
  date_to    date,                          -- якщо вказано, сума розподіляється по днях
  store_id   int,                           -- магазин; порожньо = загальна
  amount     numeric(14,2) not null,
  currency   text not null default 'UAH' check (currency in ('UAH','USD','EUR')),
  rate       numeric(10,4) not null default 1,
  amount_uah numeric(14,2) generated always as (round(amount * rate, 2)) stored,
  comment    text,
  created_by text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);
create index if not exists payouts_date_idx on payouts (date);

-- ---------- Налаштування і службові дані ----------
create table if not exists settings (
  key   text primary key,
  value jsonb
);

create table if not exists sync_log (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  mode    text,
  orders  int,
  pages   int,
  ok      boolean,
  message text
);

-- ---------- Початкові налаштування ----------
insert into settings(key, value) values
  ('finance_date',       '"order"'),
  ('usd_rate',           '45'),
  ('eur_rate',           '50'),
  ('expense_categories', '["Реклама","Податки","SMS-розсилки","Оренда / склад","Пакування","Сервіси (CRM, сайт)","Банк / еквайринг","Інше"]'),
  ('ad_channels',        '["Meta","TikTok","Google","Інше"]'),
  ('targets',            '{"roas": 3, "cpl_usd": 4}'),
  ('store_name',         '"Одяг"'),
  ('revenue_mode',       '"confirmed"'),
  ('refusal_cost_default','105'),
  ('refusal_mode',       '"fixed"'),
  ('order_costs_in_pnl', 'false'),
  ('managers_in_pnl',    'true'),
  ('archive_until',      '"2026-08-31"'),
  ('backfill_done',      'false'),
  ('backfill_page',      '1')
on conflict (key) do nothing;

-- Оплата податків ФОП: галочка «сплачено» створює витрату з прив'язкою до ФОП і місяця
alter table expenses add column if not exists fop_id bigint;
alter table expenses add column if not exists fop_period text;   -- 'РРРР-ММ'
create unique index if not exists expenses_fop_period_uq on expenses (fop_id, fop_period) where fop_id is not null;

-- ФОПи: податки 2-ї групи (віднімаються, коли в дашборді відмічено «сплачено») і контроль річного ліміту
-- sender_id — номер відправника в накладних SalesDrive (delivery_json.senderId)
create table if not exists fops (
  id            bigserial primary key,
  name          text not null,
  sender_id     text,
  store_id      int,
  single_tax    numeric(14,2) not null default 0,  -- єдиний податок на місяць
  esv           numeric(14,2) not null default 0,  -- ЄСВ на місяць
  military      numeric(14,2) not null default 0,  -- військовий збір на місяць
  other         numeric(14,2) not null default 0,  -- інші щомісячні платежі
  year_limit    numeric(14,2) not null default 0,  -- річний ліміт доходу
  income_before numeric(14,2) not null default 0,  -- дохід з 1 січня до початку обліку в дашборді
  active        boolean not null default true,
  sort          int not null default 0,
  created_by    text default (auth.jwt() ->> 'email'),
  created_at    timestamptz not null default now()
);

alter table people drop constraint if exists people_role_check;
alter table people add constraint people_role_check check (role in ('owner','team','share'));

-- =====================================================================
-- ОДЯГ: додаткові таблиці
-- =====================================================================

-- Службові секрети (лише для сервера: RLS увімкнено, політик немає, тому з дашборду недоступно)
create table if not exists private_config (
  key   text primary key,
  value text not null
);
insert into private_config(key, value) values ('cron_secret', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- Ручні дані по днях і магазинах (переносяться зі старої бази, далі вносяться в таблиці «По днях»)
--   card_payments — «Оплати на рахунок»: клієнт одразу оплатив повністю на рахунок ФОП
--   cpo_ads / cpo_orders — реклама (₴) і підтверджені замовлення на момент першого внесення реклами за день:
--                          «CPO план» = cpo_ads / cpo_orders (фіксується один раз, як у старому дашборді)
create table if not exists daily_manual (
  store_id       int  not null,
  day            date not null,
  card_payments  numeric(14,2) not null default 0,
  cpo_ads        numeric(14,2),
  cpo_orders     int,
  lead_price_usd numeric(10,2),
  extra_income   numeric(14,2) not null default 0,
  notes          text,
  updated_by     text default (auth.jwt() ->> 'email'),
  updated_at     timestamptz not null default now(),
  primary key (store_id, day)
);

-- Показники Meta (як у старому дашборді)
create table if not exists meta_ads (
  store_id          int  not null,
  day               date not null,
  campaign          text,
  leads_total       int not null default 0,
  leads_confirmed   int not null default 0,
  orders_from_leads int not null default 0,
  impressions       int not null default 0,
  clicks            int not null default 0,
  primary key (store_id, day)
);

-- Ручна правка допродажу менеджера за день (замінює автоматичну суму; синхронізація її не затирає)
create table if not exists mgr_adjust (
  manager_id    int  not null,
  store_id      int  not null,
  day           date not null,
  upsell_amount numeric(14,2) not null,
  updated_by    text default (auth.jwt() ->> 'email'),
  updated_at    timestamptz not null default now(),
  primary key (manager_id, store_id, day)
);

-- Архів старого дашборду (дні до archive_until включно). Цифри перенесені як були, не перераховуються.
create table if not exists archive_daily (
  store_id  int  not null,
  day       date not null,
  leads     int not null default 0,       -- усі заявки (total_orders)
  confirmed int not null default 0,       -- підтверджені, включно з продажами
  success   int not null default 0,       -- продано
  fail      int not null default 0,       -- відмови
  revenue   numeric(14,2) not null default 0,
  cogs      numeric(14,2) not null default 0,
  primary key (store_id, day)
);
create table if not exists archive_manager_daily (
  manager_id       int  not null,
  store_id         int  not null,
  day              date not null,
  orders           int not null default 0,        -- підтверджені + відмови (за них платиться ставка)
  upsell           numeric(14,2) not null default 0,  -- допродаж по викуплених
  upsell_potential numeric(14,2) not null default 0,  -- допродаж по всіх підтверджених
  primary key (manager_id, store_id, day)
);
create table if not exists archive_products (
  store_id     int  not null,
  day          date not null,
  product_id   bigint not null,
  sku          text,
  name         text,
  sold         int not null default 0,
  refused      int not null default 0,
  revenue      numeric(14,2) not null default 0,
  primary key (store_id, day, product_id)
);

-- =====================================================================
-- Доступ: читати й змінювати дані можуть лише ті, хто увійшов у дашборд.
-- Функція синхронізації працює з service_role і обходить ці правила.
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['orders','order_items','statuses','stores','managers','expenses','rules','settings','sync_log','people','payouts','fops',
                           'daily_manual','meta_ads','mgr_adjust','archive_daily','archive_manager_daily','archive_products'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "signed_in_all" on %I', t);
    execute format('create policy "signed_in_all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
  alter table private_config enable row level security;
end $$;

-- Реальний час
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['expenses','rules','stores','statuses','managers','settings','sync_log','people','payouts','fops','daily_manual','mgr_adjust','meta_ads'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- =====================================================================
-- Аналітичні функції (викликаються з дашборду через supabase.rpc)
-- p_fin: 'order' — гроші за датою створення заявки, 'payment' — за датою продажу
-- Дні до archive_until беруться з архіву старого дашборду, після — із замовлень CRM.
-- =====================================================================
drop function if exists stats_managers(date, date, text, int);
drop function if exists stats_manager_daily(date, date, text, int);
drop function if exists stats_products(date, date, text, int);
drop function if exists fop_income(date, date);

create or replace function archive_until() returns date
language sql stable as $$
  select coalesce((select (value #>> '{}')::date from settings where key = 'archive_until'), date '1900-01-01')
$$;

-- Чи потрапляє замовлення в обраний магазин. p_store порожній = усі активні магазини (+ замовлення без сайту)
create or replace function in_scope(p_sajt int, p_store int) returns boolean
language sql stable as $$
  select case
    when p_store is not null then p_sajt = p_store
    when p_sajt is null then true
    else coalesce((select st.active from stores st where st.id = p_sajt), true)
  end
$$;
-- Для архіву й ручних даних (там магазин завжди вказаний)
create or replace function in_store(p_sid int, p_store int) returns boolean
language sql stable as $$
  select case when p_store is not null then p_sid = p_store
              else coalesce((select st.active from stores st where st.id = p_sid), true) end
$$;

-- Додаткові витрати замовлення (доставка, комісії) БЕЗ собівартості (expensesAmount у SalesDrive уже містить собівартість)
create or replace function order_extra(o orders) returns numeric
language sql immutable as $$
  select case when o.expenses_amount > 0 then greatest(o.expenses_amount - o.cost_price, 0)
              else o.shipping_costs + o.commission end
$$;

create or replace function fin_date(o orders, p_fin text) returns date
language sql immutable as $$
  select case when p_fin = 'payment' then coalesce(o.payment_date, o.order_date) else o.order_date end
$$;

-- По днях: воронка (за датою заявки) + гроші (за фінансовою датою) + архів
create or replace function stats_daily(p_from date, p_to date, p_fin text default 'order', p_store int default null)
returns table (
  day date, leads int, confirmed int, unconfirmed int, success int, fail int, returns int, work int,
  sales int, revenue numeric, cogs numeric, order_costs numeric, return_costs numeric,
  payed numeric, upsell numeric,
  pend_sales int, pend_revenue numeric, pend_cogs numeric, pend_costs numeric,
  refusal_ship numeric, refusal_ship_unknown int, archived boolean
)
language sql stable as $$
  with f as (
    select o.order_date d,
           count(*)::int leads,
           count(*) filter (where s.confirmed)::int confirmed,
           count(*) filter (where coalesce(s.category,'work') = 'work' and not coalesce(s.confirmed, false))::int unconfirmed,
           count(*) filter (where s.category = 'success')::int success,
           count(*) filter (where s.category = 'fail')::int fail,
           count(*) filter (where s.category = 'return')::int returns,
           count(*) filter (where coalesce(s.category,'work') = 'work')::int work,
           count(*) filter (where s.category = 'work' and s.confirmed)::int pend_sales,
           coalesce(sum(o.payment_amount) filter (where s.category = 'work' and s.confirmed), 0) pend_revenue,
           coalesce(sum(o.cost_price) filter (where s.category = 'work' and s.confirmed), 0) pend_cogs,
           coalesce(sum(order_extra(o)) filter (where s.category = 'work' and s.confirmed), 0) pend_costs,
           coalesce(sum(o.delivery_cost) filter (where s.category in ('fail','return') and o.delivery_cost > 0), 0) refusal_ship,
           count(*) filter (where s.category in ('fail','return') and coalesce(o.delivery_cost,0) = 0 and coalesce(o.ttn,'') <> '')::int refusal_ship_unknown
    from orders o left join statuses s on s.id = o.status_id
    where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until()
      and coalesce(s.category,'work') <> 'ignore'
    group by 1
  ), m as (
    select fin_date(o, p_fin) d,
           count(*) filter (where s.category = 'success')::int sales,
           coalesce(sum(o.payment_amount) filter (where s.category = 'success'), 0) revenue,
           coalesce(sum(o.cost_price) filter (where s.category = 'success'), 0) cogs,
           coalesce(sum(order_extra(o)) filter (where s.category = 'success'), 0) order_costs,
           coalesce(sum(order_extra(o)) filter (where s.category = 'return'), 0) return_costs,
           coalesce(sum(o.payed_amount) filter (where s.category = 'success'), 0) payed,
           coalesce(sum(o.upsell_amount) filter (where s.category = 'success'), 0) upsell
    from orders o join statuses s on s.id = o.status_id
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


-- Канали за UTM-міткою
create or replace function stats_channels(p_from date, p_to date, p_fin text default 'order', p_store int default null)
returns table (utm_source text, leads int, sales int, revenue numeric, gross numeric)
language sql stable as $$
  with l as (
    select coalesce(o.utm_source,'') u, count(*)::int leads
    from orders o left join statuses s on s.id = o.status_id
    where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until() and coalesce(s.category,'work') <> 'ignore'
    group by 1
  ), m as (
    select coalesce(o.utm_source,'') u, count(*)::int sales, sum(o.payment_amount) revenue,
           sum(o.payment_amount - o.cost_price - order_extra(o)) gross
    from orders o join statuses s on s.id = o.status_id
    where in_scope(o.sajt, p_store) and fin_date(o, p_fin) between p_from and p_to and o.order_date > archive_until() and s.category = 'success'
    group by 1
  )
  select coalesce(l.u, m.u), coalesce(l.leads,0), coalesce(m.sales,0), coalesce(m.revenue,0), coalesce(m.gross,0)
  from l full join m on m.u = l.u
$$;

-- Товари: продано, відмовлено, виручка, прибуток (+ архів старого дашборду, там без собівартості)
create or replace function stats_products(p_from date, p_to date, p_fin text default 'order', p_store int default null)
returns table (product_id bigint, name text, sku text, sold numeric, refused numeric, returned numeric,
               revenue numeric, cost numeric, profit numeric, archived_revenue numeric)
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

create or replace function stats_statuses(p_from date, p_to date, p_store int default null)
returns table (status_id int, name text, category text, cnt int, amount numeric)
language sql stable as $$
  select o.status_id, coalesce(s.name, 'Статус #' || o.status_id), coalesce(s.category,'work'), count(*)::int, sum(o.payment_amount)
  from orders o left join statuses s on s.id = o.status_id
  where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until() and coalesce(s.category,'work') <> 'ignore'
  group by o.status_id, s.name, s.category, s.sort
  order by coalesce(s.sort, 0), count(*) desc
$$;

create or replace function stats_reasons(p_from date, p_to date, p_store int default null)
returns table (reason text, fail int, returns int)
language sql stable as $$
  select coalesce(nullif(o.rejection_reason,''), '—'),
         count(*) filter (where s.category = 'fail')::int,
         count(*) filter (where s.category = 'return')::int
  from orders o join statuses s on s.id = o.status_id
  where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until() and s.category in ('fail','return')
  group by 1 order by count(*) desc
$$;


-- Менеджери (одяг): ставка платиться за кожне замовлення менеджера, яке стало підтвердженим або відмовою
-- (за датою заявки); % — від допродажу по викуплених замовленнях. Ручна правка допродажу (mgr_adjust) має пріоритет.
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
    group by 1, 2, 3
  )
  select l.d, l.mid, l.sid, l.paid, coalesce(a.upsell_amount, l.up), l.pot, l.up, a.upsell_amount is not null, false
  from live l left join mgr_adjust a on a.manager_id = l.mid and a.store_id = l.sid and a.day = l.d
  union all
  select a.day, a.manager_id, a.store_id, a.orders, a.upsell, a.upsell_potential, a.upsell, false, true
  from archive_manager_daily a
  where in_store(a.store_id, p_store) and a.day between p_from and p_to and a.day <= archive_until()
$$;

-- Менеджери: підсумки за період
create or replace function stats_managers(p_from date, p_to date, p_fin text default 'order', p_store int default null)
returns table (manager_id int, leads int, confirmed int, success int, fail int, returns int, sales int, revenue numeric, gross numeric,
               upsell numeric, paid_orders int, upsell_potential numeric)
language sql stable as $$
  with l as (
    select o.manager_id m, count(*)::int leads,
           count(*) filter (where s.confirmed)::int confirmed,
           count(*) filter (where s.category='success')::int success,
           count(*) filter (where s.category='fail')::int fail,
           count(*) filter (where s.category='return')::int returns
    from orders o left join statuses s on s.id=o.status_id
    where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until() and coalesce(s.category,'work') <> 'ignore'
    group by 1
  ), m as (
    select o.manager_id m, count(*)::int sales, sum(o.payment_amount) revenue,
           sum(o.payment_amount - o.cost_price - order_extra(o)) gross
    from orders o join statuses s on s.id=o.status_id
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

create or replace function stats_payment_daily(p_from date, p_to date, p_store int default null)
returns table (day date, method text, cnt int, amount numeric)
language sql stable as $$
  select o.order_date, coalesce(nullif(o.payment_method,''),'—'), count(*)::int, sum(o.payed_amount)
  from orders o left join statuses s on s.id = o.status_id
  where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to
    and coalesce(s.category,'work') <> 'ignore' and o.payed_amount > 0
  group by 1, 2
$$;

create or replace function payment_methods()
returns table (method text, cnt int)
language sql stable as $$
  select coalesce(nullif(payment_method,''),'—'), count(*)::int from orders group by 1 order by 2 desc
$$;

create or replace function delivery_sample()
returns table (id bigint, order_date date, status text, ttn text, delivery_cost numeric, delivery_json jsonb, sajt int)
language sql stable as $$
  select o.id, o.order_date, s.name, o.ttn, o.delivery_cost, o.delivery_json, o.sajt
  from orders o join statuses s on s.id = o.status_id
  where s.category in ('fail','return') and o.delivery_json is not null
  order by o.order_time desc limit 5
$$;

create or replace function stats_overview_meta()
returns json language sql stable as $$
  select json_build_object(
    'orders', (select count(*) from orders),
    'first_order', (select min(order_date) from orders),
    'last_order',  (select max(order_time) from orders),
    'archive_until', archive_until(),
    'archive_days', (select count(distinct day) from archive_daily),
    'sites', coalesce((select json_agg(x order by x.orders desc) from (
               select o.sajt id, count(*) orders, min(o.order_date) first_order, max(o.order_date) last_order
               from orders o group by o.sajt) x), '[]'::json)
  )
$$;

-- ---------- ФОП: відправники з накладних і дохід для контролю ліміту ----------
create or replace function fop_senders()
returns table (sender text, cnt int, sample_id bigint, sajt int)
language sql stable as $$
  select delivery_json->>'senderId', count(*)::int, max(id), mode() within group (order by sajt)
  from orders where delivery_json ? 'senderId' and delivery_json->>'senderId' is not null
  group by 1 order by 2 desc
$$;

-- =====================================================================
-- 002. Оплати на рахунок ФОП автоматично з CRM + ФОП для дропшипінгу
--  * orders.comment — коментар заявки з SalesDrive
--  * prepay_amount() — скільки клієнт заплатив на рахунок ФОП:
--      «повна оплата» в коментарі → уся сума замовлення; «ПП150», «пп 200» → 150 / 200 ₴.
--      Рахується лише для замовлень із позитивним статусом (підтверджені й продаж).
--  * Ручні «Оплати на рахунок» з 01.09 — лише доповнення до автоматичних (корекція).
--  * ФОП: дохід = оплати на рахунок (за магазином) + виплати від постачальника (вносяться вручну).
-- Файл ідемпотентний; ці ж зміни внесено в schema.sql.
-- =====================================================================
alter table orders add column if not exists comment text;

create or replace function prepay_amount(p_comment text, p_amount numeric) returns numeric
language sql immutable as $$
  select case
    when p_comment ~* 'повн[[:alpha:]]*[[:space:]]*оплат' then coalesce(p_amount, 0)
    when p_comment ~* 'пп[[:space:]]*[0-9]{2,5}' then (substring(p_comment from '(?i)пп[[:space:]]*([0-9]{2,5})'))::numeric
    else 0 end
$$;

-- Оплати на рахунок із CRM по днях і магазинах (за датою заявки)
create or replace function card_auto(p_from date, p_to date, p_store int default null)
returns table (day date, sajt int, amount numeric, cnt int)
language sql stable as $$
  select o.order_date, o.sajt, sum(prepay_amount(o.comment, o.payment_amount)), count(*)::int
  from orders o join statuses s on s.id = o.status_id
  where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until()
    and s.confirmed and prepay_amount(o.comment, o.payment_amount) > 0
  group by 1, 2
$$;

-- Ручні дані по днях: оплати на рахунок (CRM + ручні), CPO план, Meta
create or replace function stats_manual(p_from date, p_to date, p_store int default null)
returns table (day date, card_payments numeric, cpo_ads numeric, cpo_orders int, extra_income numeric,
               leads_total int, leads_confirmed int, orders_from_leads int, impressions int, clicks int)
language sql stable as $$
  with a as (
    select d.day, sum(d.card_payments) card, sum(d.cpo_ads) filter (where d.cpo_orders > 0) cads, sum(d.cpo_orders) filter (where d.cpo_orders > 0)::int cord, sum(d.extra_income) extra
    from daily_manual d where in_store(d.store_id, p_store) and d.day between p_from and p_to group by 1
  ), c as (
    select x.day, sum(x.amount) card from card_auto(p_from, p_to, p_store) x group by 1
  ), b as (
    select m.day, sum(m.leads_total)::int lt, sum(m.leads_confirmed)::int lc, sum(m.orders_from_leads)::int ol, sum(m.impressions)::int im, sum(m.clicks)::int cl
    from meta_ads m where in_store(m.store_id, p_store) and m.day between p_from and p_to group by 1
  ), days as (select day from a union select day from b union select day from c)
  select days.day, coalesce(a.card,0) + coalesce(c.card,0), a.cads, a.cord, coalesce(a.extra,0),
         coalesce(b.lt,0), coalesce(b.lc,0), coalesce(b.ol,0), coalesce(b.im,0), coalesce(b.cl,0)
  from days left join a on a.day = days.day left join b on b.day = days.day left join c on c.day = days.day
  order by 1
$$;

-- Список оплат на рахунок із CRM (для перевірки)
create or replace function card_orders(p_from date, p_to date, p_store int default null)
returns table (id bigint, order_date date, sajt int, status text, payment_amount numeric, amount numeric, comment text, payment_method text)
language sql stable as $$
  select o.id, o.order_date, o.sajt, s.name, o.payment_amount, prepay_amount(o.comment, o.payment_amount), o.comment, o.payment_method
  from orders o join statuses s on s.id = o.status_id
  where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until()
    and s.confirmed and prepay_amount(o.comment, o.payment_amount) > 0
  order by o.order_date desc, o.id desc
$$;

-- Виплати від постачальника на ФОП (дропшипінг: постачальник щомісяця переказує гроші на ваш ФОП)
create table if not exists fop_receipts (
  id         bigserial primary key,
  fop_id     bigint not null,
  date       date not null,
  amount     numeric(14,2) not null,
  kind       text not null default 'supplier',
  comment    text,
  created_by text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);
alter table fop_receipts enable row level security;
drop policy if exists "signed_in_all" on fop_receipts;
create policy "signed_in_all" on fop_receipts for all to authenticated using (true) with check (true);
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fop_receipts') then
    alter publication supabase_realtime add table public.fop_receipts;
  end if;
end $$;

-- Дохід ФОП за період:
--   kind 'card'     — оплати на рахунок (CRM + ручні) по магазинах: sender = id магазину;
--   kind 'supplier' — виплати від постачальника: sender = id ФОП.
drop function if exists fop_income(date, date);
create or replace function fop_income(p_from date, p_to date)
returns table (sender text, kind text, amount numeric, cnt int)
language sql stable as $$
  with c as (
    select x.sajt sid, x.amount, x.cnt from card_auto(p_from, p_to, null) x
    union all
    select d.store_id, d.card_payments, 1 from daily_manual d where d.day between p_from and p_to and d.card_payments <> 0
  )
  select sid::text, 'card', sum(amount), sum(cnt)::int from c group by 1
  union all
  select fop_id::text, 'supplier', sum(amount), count(*)::int from fop_receipts where date between p_from and p_to group by 1
$$;

create or replace function stats_payments(p_from date, p_to date, p_fin text default 'order', p_store int default null)
returns json
language sql stable as $$
  select json_build_object(
    'payed',        coalesce((select sum(o.payed_amount) from orders o join statuses s on s.id=o.status_id
                              where in_scope(o.sajt, p_store) and s.category='success' and fin_date(o,p_fin) between p_from and p_to), 0),
    'rest',         coalesce((select sum(o.rest_pay) from orders o join statuses s on s.id=o.status_id
                              where in_scope(o.sajt, p_store) and s.category='success' and fin_date(o,p_fin) between p_from and p_to), 0),
    'unpaid_count', coalesce((select count(*) from orders o join statuses s on s.id=o.status_id
                              where in_scope(o.sajt, p_store) and s.category='success' and o.rest_pay > 0.009 and fin_date(o,p_fin) between p_from and p_to), 0),
    'pending_sum',  coalesce((select sum(o.rest_pay) from orders o join statuses s on s.id=o.status_id
                              where in_scope(o.sajt, p_store) and s.category in ('work','success') and o.rest_pay > 0.009 and o.order_date >= p_to - 90), 0),
    'pending_count',coalesce((select count(*) from orders o join statuses s on s.id=o.status_id
                              where in_scope(o.sajt, p_store) and s.category in ('work','success') and o.rest_pay > 0.009 and o.order_date >= p_to - 90), 0),
    'card_payments',coalesce((select sum(x.card_payments) from stats_manual(p_from, p_to, p_store) x), 0),
    'by_method',    coalesce((select json_agg(x order by x.amount desc) from (
                       select coalesce(nullif(o.payment_method,''),'—') method, count(*) cnt, sum(o.payment_amount) amount
                       from orders o join statuses s on s.id=o.status_id
                       where in_scope(o.sajt, p_store) and s.category='success' and fin_date(o,p_fin) between p_from and p_to
                       group by 1) x), '[]'::json)
  )
$$;
-- =====================================================================
-- 003. Передоплата при відмові лишається у вас → рахується в оплати на рахунок;
--      виплати від постачальника з банком (ПриватБанк / Monobank / NovaPay).
-- =====================================================================
alter table fop_receipts add column if not exists bank text;

-- Скільки клієнт заплатив на рахунок ФОП за замовленням:
--   позитивний статус (підтверджено, на відправку, відправлено, продаж): «повна оплата» → уся сума, «ПП150» → 150;
--   відмова: лише передоплата «ПП…» (її не повертаєте); «повна оплата» при відмові не рахується.
create or replace function card_amount(p_comment text, p_amount numeric, p_confirmed boolean, p_category text) returns numeric
language sql immutable as $$
  select case
    when p_confirmed then prepay_amount(p_comment, p_amount)
    when p_category = 'fail' and p_comment ~* 'пп[[:space:]]*[0-9]{2,5}' and p_comment !~* 'повн[[:alpha:]]*[[:space:]]*оплат'
      then (substring(p_comment from '(?i)пп[[:space:]]*([0-9]{2,5})'))::numeric
    else 0 end
$$;

create or replace function card_auto(p_from date, p_to date, p_store int default null)
returns table (day date, sajt int, amount numeric, cnt int)
language sql stable as $$
  select o.order_date, o.sajt, sum(card_amount(o.comment, o.payment_amount, s.confirmed, s.category)), count(*)::int
  from orders o join statuses s on s.id = o.status_id
  where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until()
    and card_amount(o.comment, o.payment_amount, s.confirmed, s.category) > 0
  group by 1, 2
$$;

create or replace function card_orders(p_from date, p_to date, p_store int default null)
returns table (id bigint, order_date date, sajt int, status text, payment_amount numeric, amount numeric, comment text, payment_method text)
language sql stable as $$
  select o.id, o.order_date, o.sajt, s.name, o.payment_amount, card_amount(o.comment, o.payment_amount, s.confirmed, s.category), o.comment, o.payment_method
  from orders o join statuses s on s.id = o.status_id
  where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until()
    and card_amount(o.comment, o.payment_amount, s.confirmed, s.category) > 0
  order by o.order_date desc, o.id desc
$$;
