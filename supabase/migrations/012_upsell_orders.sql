-- =====================================================================
-- 012: допродаж менеджера по замовленнях — для розбору у «Виплатах»
--   (викуплено / в дорозі / відмова, з клієнтом і товаром допродажу)
-- =====================================================================
create or replace function mgr_upsell_orders(p_mgr int, p_from date, p_to date)
returns table(id bigint, day date, client_name text, upsell numeric, status_name text, category text, confirmed boolean, items text)
language sql stable as $$
  select o.id, o.order_time::date, o.client_name, o.upsell_amount, s.name, coalesce(s.category, 'work'), coalesce(s.confirmed, false),
         (select string_agg(i.name || coalesce(' (' || i.descr || ')', ''), '; ' order by i.pos) from order_items i where i.order_id = o.id and i.pre_sale)
  from orders o
  left join statuses s on s.id = o.status_id
  where o.manager_id = p_mgr
    and o.order_time >= p_from and o.order_time < p_to + 1
    and coalesce(o.upsell_amount, 0) > 0
    and coalesce(s.category, 'work') <> 'ignore'
    and in_scope(o.sajt, null)
  order by o.order_time
$$;
