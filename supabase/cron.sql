-- =====================================================================
-- Автосинхронізація кожні 15 хвилин (уже налаштовано в проєкті Odyag Analytics).
-- Потрібні розширення pg_cron і pg_net. Секрет автозапуску береться з таблиці private_config,
-- тож вручну нічого вставляти не треба.
-- =====================================================================
select cron.unschedule('odyag-sync') where exists (select 1 from cron.job where jobname = 'odyag-sync');
select cron.schedule('odyag-sync', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://qsaifketkgkkgqsroskp.supabase.co/functions/v1/odyag-sync',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.private_config where key = 'cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000);
$$);

-- Перевірити:   select jobname, schedule, active from cron.job;
-- Запуски:      select * from sync_log order by id desc limit 20;
