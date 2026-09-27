-- =====================================================================
-- 006. Особиста вкладка власника «Мій дохід» (під PIN-кодом)
--  * Дані бачить і змінює лише власник (email у private_config.owner_email) — це перевіряє сама база (RLS),
--    тож інші користувачі дашборду (напр. керівник) не прочитають їх навіть напряму через API.
--  * PIN — додатковий замок в інтерфейсі; у базі зберігається лише його хеш.
-- =====================================================================
insert into private_config(key, value) values ('owner_email', 'hatsauck22@gmail.com') on conflict (key) do nothing;

create or replace function is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(lower(auth.jwt() ->> 'email') = lower((select value from private_config where key = 'owner_email')), false)
$$;
grant execute on function is_owner() to authenticated;

create table if not exists owner_vault (
  key   text primary key,          -- 'pin' → { salt, hash }
  value jsonb not null
);
create table if not exists owner_entries (
  id         bigserial primary key,
  month      text not null,                 -- 'РРРР-ММ'
  kind       text not null default 'income' check (kind in ('income','expense')),
  name       text not null,                 -- напр. «Конструктори», «Бухгалтерія»
  amount     numeric(14,2) not null,
  currency   text not null default 'UAH' check (currency in ('UAH','USD','EUR')),
  rate       numeric(10,4) not null default 1,
  amount_uah numeric(14,2) generated always as (round(amount * rate, 2)) stored,
  comment    text,
  created_at timestamptz not null default now()
);
create index if not exists owner_entries_month_idx on owner_entries (month);

do $$
declare t text;
begin
  foreach t in array array['owner_vault','owner_entries'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "owner_only" on %I', t);
    execute format('create policy "owner_only" on %I for all to authenticated using (is_owner()) with check (is_owner())', t);
  end loop;
end $$;
