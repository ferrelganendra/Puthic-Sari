-- Schedule hourly cleanup of abandoned checkout_orders
--
-- ⚠️ BEFORE applying this migration, run the one-time setup command
--    below in the Supabase SQL editor to store vault secrets.
--
-- One-time setup (run in Supabase SQL editor BEFORE this migration):
--   select vault.create_secret(
--     '<your_supabase_service_role_key>',
--     'cron_service_role_key',
--     'Service role key for expire-pending-orders cron'
--   );
--   select vault.create_secret(
--     'https://dlduhrsrulsebyrnjdlf.supabase.co',
--     'cron_supabase_url',
--     'Supabase URL for expire-pending-orders cron'
--   );
--
-- To verify secrets exist:
--   select * from vault.decrypted_secrets where name like 'cron_%';
--
-- The cron job retrieves both secrets at execution time from Vault,
-- so no secrets appear in this migration file or in version control.
--
-- The Edge Function:
--   1. Finds checkout_orders where status='pending_payment'
--      AND payment_status='pending'
--      AND created_at < now() - interval '24 hours'
--   2. Calls Midtrans Get Status API for each
--   3. If paid → processes as paid (creates Biteship shipment)
--      If failed/not found → status='cancelled', payment_status='expired_local'
--   4. Logs counts in the HTTP response

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove existing schedule if re-running
select cron.unschedule('expire-pending-orders');

-- Schedule every hour at minute 0 (UTC)
select cron.schedule(
  'expire-pending-orders',
  '0 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'cron_supabase_url')
           || '/functions/v1/expire-pending-orders',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_service_role_key'),
      'Content-Type',
      'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify schedule
select jobid, schedule, command, active
from cron.job
where jobname = 'expire-pending-orders';
