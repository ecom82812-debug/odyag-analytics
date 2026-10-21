-- 014: вкладка «Обміни» — список обмінів бота @odyag_obmin_bot (таблиця exch_cases) лише для власника.
-- exch_cases закрита RLS (пише лише бот), тому читаємо через SECURITY DEFINER з перевіркою is_owner().
-- Відкриті обміни показуємо завжди, решту — за датою створення в періоді.

create or replace function exch_list(p_from date, p_to date)
returns setof json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', c.id, 'created_at', c.created_at, 'updated_at', c.updated_at, 'status', c.status, 'kind', c.kind,
    'manager', c.manager_name, 'client', c.orig->>'name', 'phone', c.orig->>'phone',
    'orig_order_id', c.orig_order_id, 'orig_ttn', c.orig_ttn, 'returned', c.returned, 'new_items', c.new_items,
    'pay', c.pay, 'refund', c.refund, 'return_ttn', c.return_ttn, 'new_address', c.new_address, 'note', c.note,
    'new_order_id', c.new_order_id, 'new_ttn', c.new_ttn, 'crm_state', c.crm_state, 'crm_error', c.crm_error,
    'history', c.history, 'store_id', oo.sajt,
    'crm_status', s.name, 'crm_category', s.category, 'delivery_cost', nw.delivery_cost,
    'revenue', x.revenue, 'cogs', x.cogs)
  from exch_cases c
  left join orders oo on oo.id = c.orig_order_id
  left join orders nw on nw.id = c.new_order_id
  left join statuses s on s.id = nw.status_id
  left join exch_orders() x on x.order_id = c.new_order_id
  where is_owner()
    and ((c.created_at at time zone 'Europe/Kyiv')::date between p_from and p_to
         or c.status in ('new', 'supplier', 'approved', 'created'))
  order by c.created_at desc
$$;
revoke all on function exch_list(date, date) from public, anon;
grant execute on function exch_list(date, date) to authenticated;

-- «Оплати на рахунок → за способом оплати»: замовлення обміну не враховуємо (це не новий продаж)
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
                         and not exists (select 1 from exch_orders() x where x.order_id = o.id)
                       group by 1) x), '[]'::json)
  )
$$;
