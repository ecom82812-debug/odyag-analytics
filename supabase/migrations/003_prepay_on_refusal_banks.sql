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
