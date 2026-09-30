-- =====================================================================
-- 010: історія ставок менеджерів і курсу долара
--   Нова ставка / відсоток / курс діє з дати зміни; минулі дні рахуються за тим, що діяло тоді.
-- =====================================================================
create table if not exists manager_rates (
  manager_id     int  not null,
  valid_from     date not null,
  rate_per_order numeric(10,2) not null default 0,
  upsell_pct     numeric(6,4)  not null default 0,   -- 0.25 = 25%
  created_by     text,
  created_at     timestamptz not null default now(),
  primary key (manager_id, valid_from)
);
alter table manager_rates enable row level security;
drop policy if exists "signed_in_all" on manager_rates;
create policy "signed_in_all" on manager_rates for all to authenticated using (true) with check (true);

-- Поточні ставки діють «з самого початку»
insert into manager_rates (manager_id, valid_from, rate_per_order, upsell_pct, created_by)
select id, date '2000-01-01', rate_per_order, upsell_pct, 'initial' from managers
on conflict (manager_id, valid_from) do nothing;

-- Історія курсу долара: поточний курс — з самого початку
insert into settings(key, value)
select 'usd_rate_history', jsonb_build_array(jsonb_build_object('from', '2000-01-01', 'rate', coalesce((select (value #>> '{}')::numeric from settings where key = 'usd_rate'), 45)))
on conflict (key) do nothing;
