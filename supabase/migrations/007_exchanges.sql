-- =====================================================================
-- 007. Обміни й повернення
--  * orders.client_phone, order_items.descr (колір/розмір) — для пошуку замовлення за телефоном і шаблону постачальнику
--  * exchanges — заявки на обмін / повернення від менеджерів (через форму за секретним посиланням)
--  * Повернення коштів і доставка обмінів → витрати магазину (коли ви ставите відповідний статус)
-- =====================================================================
alter table orders add column if not exists client_phone text;          -- лише цифри, напр. 380675073043
create index if not exists orders_client_phone_idx on orders (right(client_phone, 9));
alter table order_items add column if not exists descr text;           -- «Колір чорний, Розмір L»
alter table orders add column if not exists items_text text;

create table if not exists exchanges (
  id              bigserial primary key,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  manager         text,
  phone           text,                      -- лише цифри
  order_id        bigint,                    -- заявка в CRM
  client_name     text,
  store_id        int,
  order_ttn       text,                      -- ТТН початкового замовлення
  items           text,                      -- що повертають (модель, колір, розмір)
  cost_price      numeric(14,2),             -- закупка товару, що повертають (для шаблону постачальнику)
  kind            text not null default 'exchange' check (kind in ('exchange','refund')),
  new_item        text,                      -- на що міняємо
  reason          text,                      -- причина (не підійшов розмір тощо)
  card            text,                      -- карта для повернення коштів
  refund_amount   numeric(14,2) not null default 0,   -- скільки повернути за товар
  ret_ttn         text,                      -- ТТН повернення від клієнта
  delivery_paid   boolean not null default false,
  delivery_refund numeric(14,2) not null default 0,   -- скільки повернути клієнту за доставку
  comment         text,
  status          text not null default 'new' check (status in ('new','sent','accepted','shipped','refunded','closed','cancelled')),
  new_ttn         text,                      -- ТТН відправлення обміну
  np_status       text, np_code text, np_new_status text, np_checked_at timestamptz,
  tg_chat         text, tg_msg_id bigint,
  expense_ids     bigint[] not null default '{}',
  history         jsonb not null default '[]'
);
create index if not exists exchanges_phone_idx on exchanges (right(phone, 9));
create index if not exists exchanges_status_idx on exchanges (status);
alter table exchanges enable row level security;
drop policy if exists "signed_in_all" on exchanges;
create policy "signed_in_all" on exchanges for all to authenticated using (true) with check (true);
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'exchanges') then
    alter publication supabase_realtime add table public.exchanges;
  end if;
end $$;

-- секрет для посилання на форму менеджерів
insert into private_config(key, value) values ('obmin_token', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- категорії витрат для обмінів
update settings set value = value || (select coalesce(jsonb_agg(c), '[]'::jsonb) from unnest(array['Повернення коштів','Доставка обмінів']) c where not (value ? c))
where key = 'expense_categories';
