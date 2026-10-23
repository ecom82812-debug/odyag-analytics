-- Вкладка «Обміни»: відправлені обміни (у дорозі) показуються завжди, як і інші незакриті
CREATE OR REPLACE FUNCTION public.exch_list(p_from date, p_to date)
 RETURNS SETOF json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
         or c.status in ('new', 'supplier', 'approved', 'created', 'shipped'))
  order by c.created_at desc
$function$;
