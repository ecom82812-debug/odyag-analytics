-- =====================================================================
-- 011: щомісячна виплата з часткою від чистого прибутку магазину (Вікторія)
-- =====================================================================
alter table mgr_payouts add column if not exists period_kind  text not null default 'half';  -- half = двічі на місяць, month = раз на місяць
alter table mgr_payouts add column if not exists share_amount numeric(14,2) not null default 0;
alter table mgr_payouts add column if not exists share_net    numeric(14,2);
alter table mgr_payouts add column if not exists share_pct    numeric(8,4);
alter table mgr_payouts add column if not exists share_store  int;
