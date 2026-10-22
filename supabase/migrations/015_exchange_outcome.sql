-- Обмін закривається ботом у CRM статусом «Обмін завершено» (13, неуспішний, «не враховувати»).
-- Результат (отримав / не забрав) зберігається в exch_cases.status = received / refused.
-- Для статистики такий обмін рахується як раніше: отримав = «Продаж» (5), не забрав = «Відмова» (6).
-- Застосовано 2026-10-22 як міграція odyag_015_exchange_outcome; на даних вересня–жовтня результати функцій ідентичні.

-- «Ефективний» статус замовлення для статистики
create or replace function public.exch_status(p_order bigint, p_status integer) returns integer
language sql stable security definer set search_path = public as $f$
  select coalesce((select case c.status when 'received' then 5 when 'refused' then 6 end
                   from exch_cases c where c.new_order_id = p_order and c.status in ('received', 'refused') limit 1), p_status)
$f$;

-- Не забрав обмін: доплати немає, нова річ повернулась постачальнику → дохід і собівартість 0
create or replace function public.exch_orders()
returns table(order_id bigint, revenue numeric, cogs numeric, card numeric)
language sql stable security definer set search_path to 'public' as $f$
  with c as (
    select c.new_order_id oid, c.pay, c.status,
           coalesce((select sum(coalesce((r->>'cost')::numeric, 0) * coalesce((r->>'qty')::numeric, 1))
                     from jsonb_array_elements(coalesce(c.returned, '[]'::jsonb)) r), 0) ret_cost
    from exch_cases c
    where c.new_order_id is not null and c.kind <> 'refund'
  )
  select o.id,
         case when c.oid is not null then
           case when c.status = 'refused' then 0
           else case c.pay->>'mode'
             when 'cod'  then coalesce((c.pay->>'amount')::numeric, 0)
             when 'paid' then coalesce((c.pay->>'amount')::numeric, 0)
             when 'back' then -coalesce((c.pay->>'amount')::numeric, 0)
             else 0 end end
         -- обмін, внесений вручну: наложка = сума − ПП («повна оплата» → 0)
         else o.payment_amount - prepay_amount(o.comment, o.payment_amount) end,
         case when c.status = 'refused' then 0 else o.cost_price - coalesce(c.ret_cost, 0) end,
         case when c.pay->>'mode' = 'paid' then coalesce((c.pay->>'amount')::numeric, 0) else 0 end
  from orders o left join c on c.oid = o.id
  where c.oid is not null or o.comment ~* '^\s*обм[іi]н\s+до\s*№'
$f$;

-- Усі функції статистики беруть статус через exch_status
do $$
declare r record;
begin
  for r in select p.oid from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
           where ns.nspname = 'public' and p.prokind = 'f' and p.proname not in ('exch_list', 'exch_status')
             and pg_get_functiondef(p.oid) ~ 's\.id\s*=\s*o\.status_id'
  loop
    execute regexp_replace(pg_get_functiondef(r.oid), 's\.id\s*=\s*o\.status_id', 's.id = exch_status(o.id, o.status_id)', 'g');
  end loop;
end $$;

-- «Обмін завершено» — не враховувати; закріплюємо, щоб синхронізація статусів не переписала категорію
update public.statuses set category = 'ignore', confirmed = false, manual = true where id = 13;
