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
