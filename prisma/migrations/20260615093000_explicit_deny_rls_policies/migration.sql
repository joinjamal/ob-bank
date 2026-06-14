DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'accounts',
    'families',
    'historical_ledgers',
    'parents',
    'transactions',
    'recurring_allowances',
    'parent_sessions',
    'parent_password_resets',
    'parent_email_verifications',
    'family_access_links',
    'kid_pin_attempts'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS deny_client_access ON public.%I', table_name);
    EXECUTE format(
      'CREATE POLICY deny_client_access ON public.%I FOR ALL USING (false) WITH CHECK (false)',
      table_name
    );
  END LOOP;
END $$;
