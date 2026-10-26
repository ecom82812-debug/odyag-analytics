-- =====================================================================
-- 017: бонуси, доплати й штрафи менеджерів — зберігаються одразу в день внесення
--   payout_id = null — чекає на виплату (можна видалити);
--   після збереження виплати запис прив'язується до неї (payout_id).
-- =====================================================================
create table if not exists mgr_adjustments (
  id          bigserial primary key,
  manager_id  int not null,
  day         date not null default current_date,
  label       text,
  amount      numeric(14,2) not null,          -- бонус > 0, штраф < 0
  payout_id   bigint references mgr_payouts(id) on delete set null,
  created_by  text,
  created_at  timestamptz not null default now()
);
create index if not exists mgr_adjustments_mgr on mgr_adjustments(manager_id, payout_id);
alter table mgr_adjustments enable row level security;
drop policy if exists "signed_in_all" on mgr_adjustments;
create policy "signed_in_all" on mgr_adjustments for all to authenticated using (true) with check (true);
