-- =====================================================================
-- 008: графік змін менеджерів
--   shift_plan   — ручні відмітки на майбутні дні (хто працює), мають пріоритет над планом 2/2
--   stats_shifts — хто скільки замовлень мав по днях (усього і в робочі години)
--   Налаштування: shift_rotation (id менеджерів, що працюють 2/2), shift_hours, manager_colors
-- =====================================================================
create table if not exists shift_plan (
  day        date primary key,
  manager_id int,                 -- null = нікого (вихідний)
  created_by text,
  created_at timestamptz not null default now()
);
alter table shift_plan enable row level security;
drop policy if exists "signed_in_all" on shift_plan;
create policy "signed_in_all" on shift_plan for all to authenticated using (true) with check (true);

insert into settings(key, value) values
  ('shift_rotation', '[4,5]'::jsonb),
  ('shift_hours', '{"wd":["09:00","19:30"],"sun":["10:00","19:30"]}'::jsonb),
  ('manager_colors', '{"4":"#7F77DD","5":"#D4537E","3":"#1D9E75","1":"#888780"}'::jsonb)
on conflict (key) do nothing;

-- По днях: замовлення кожного менеджера (усього і в робочі години) + час першого/останнього.
-- Архівні дні (до archive_until) — з archive_manager_daily, без годин.
create or replace function stats_shifts(p_from date, p_to date)
returns table(day date, manager_id int, orders int, in_hours int, first_t time, last_t time, archived boolean)
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
