-- =====================================================================
-- 005. Вкладка «Оплати на рахунок»: список для звірки з банком
--  * orders.client_name — ім'я клієнта з SalesDrive (щоб знайти платіж у виписці)
--  * card_checks — позначка «знайдено в банку» по кожному замовленню
-- =====================================================================
alter table orders add column if not exists client_name text;

create table if not exists card_checks (
  order_id   bigint primary key,
  checked    boolean not null default true,
  note       text,
  checked_by text default (auth.jwt() ->> 'email'),
  checked_at timestamptz not null default now()
);
alter table card_checks enable row level security;
drop policy if exists "signed_in_all" on card_checks;
create policy "signed_in_all" on card_checks for all to authenticated using (true) with check (true);
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'card_checks') then
    alter publication supabase_realtime add table public.card_checks;
  end if;
end $$;

drop function if exists card_orders(date, date, int);
create or replace function card_orders(p_from date, p_to date, p_store int default null)
returns table (id bigint, order_time timestamp, order_date date, sajt int, status text, category text, manager_id int, client_name text,
               payment_amount numeric, amount numeric, kind text, comment text, payment_method text,
               checked boolean, check_note text, checked_by text, checked_at timestamptz)
language sql stable as $$
  select o.id, o.order_time, o.order_date, o.sajt, s.name, s.category, o.manager_id, o.client_name,
         o.payment_amount, card_amount(o.comment, o.payment_amount, s.confirmed, s.category),
         case when o.comment ~* 'повн[[:alpha:]]*[[:space:]]*оплат' and s.confirmed then 'full' else 'pp' end,
         o.comment, o.payment_method, coalesce(c.checked, false), c.note, c.checked_by, c.checked_at
  from orders o join statuses s on s.id = o.status_id left join card_checks c on c.order_id = o.id
  where in_scope(o.sajt, p_store) and o.order_date between p_from and p_to and o.order_date > archive_until()
    and card_amount(o.comment, o.payment_amount, s.confirmed, s.category) > 0
  order by o.order_time desc, o.id desc
$$;
