-- =====================================================================
-- 009: виплати менеджерам (двічі на місяць)
--   Кожна виплата пам'ятає свої періоди: замовлення (ставка) і допродаж (лише «Продаж»),
--   тож наступна виплата продовжує з наступного дня і нічого не рахується двічі.
--   Бонуси/штрафи записуються окремою витратою в день виплати (expense_id), щоб впливати на прибуток.
-- =====================================================================
create table if not exists mgr_payouts (
  id           bigserial primary key,
  manager_id   int not null,
  paid_at      date not null default current_date,
  orders_from  date not null,
  orders_to    date not null,
  orders_cnt   int not null default 0,
  rate         numeric(12,2) not null default 0,
  orders_pay   numeric(14,2) not null default 0,
  upsell_from  date,
  upsell_to    date,
  upsell_sum   numeric(14,2) not null default 0,
  upsell_pct   numeric(8,4) not null default 0,
  upsell_pay   numeric(14,2) not null default 0,
  adjustments  jsonb not null default '[]'::jsonb,   -- [{label, amount}] бонуси (+) і штрафи (−)
  adj_total    numeric(14,2) not null default 0,
  total        numeric(14,2) not null default 0,
  expense_id   bigint,
  comment      text,
  created_by   text,
  created_at   timestamptz not null default now()
);
create index if not exists mgr_payouts_mgr on mgr_payouts(manager_id, orders_to desc);
alter table mgr_payouts enable row level security;
drop policy if exists "signed_in_all" on mgr_payouts;
create policy "signed_in_all" on mgr_payouts for all to authenticated using (true) with check (true);

update settings set value = value || '["Бонуси і штрафи менеджерів"]'::jsonb
where key = 'expense_categories' and not (value ? 'Бонуси і штрафи менеджерів');
