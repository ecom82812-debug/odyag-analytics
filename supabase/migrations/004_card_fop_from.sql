-- =====================================================================
-- 004. Оплати на рахунок зараховуються на ФОП лише з дати card_fop_from
--      (перше надходження від клієнтів на рахунок ФОП Рябий — 11.08.2026).
--      Раніше клієнти платили на інший ФОП; його дохід вноситься вручну.
-- =====================================================================
create or replace function fop_income(p_from date, p_to date)
returns table (sender text, kind text, amount numeric, cnt int)
language sql stable as $$
  with lim as (select greatest(p_from, coalesce((select (value #>> '{}')::date from settings where key = 'card_fop_from'), p_from)) f),
  c as (
    select x.sajt sid, x.amount, x.cnt from lim, card_auto(lim.f, p_to, null) x
    union all
    select d.store_id, d.card_payments, 1 from daily_manual d, lim where d.day between lim.f and p_to and d.card_payments <> 0
  )
  select sid::text, 'card', sum(amount), sum(cnt)::int from c group by 1
  union all
  select fop_id::text, 'supplier', sum(amount), count(*)::int from fop_receipts where date between p_from and p_to group by 1
$$;
insert into settings(key, value) values ('card_fop_from', '"2026-08-11"') on conflict (key) do nothing;
