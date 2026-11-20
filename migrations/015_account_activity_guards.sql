BEGIN;

-- Cash withdrawals require a provider and an atomic ledger in phase 2.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON vida_sante.withdrawals FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS withdrawals_self ON vida_sante.withdrawals;
CREATE POLICY withdrawals_self ON vida_sante.withdrawals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Keep profile lookup private. The caller may register only their own account.
CREATE OR REPLACE FUNCTION vida_sante.register_my_referral(sponsor_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  member_id uuid := auth.uid();
  sponsor_id uuid;
BEGIN
  PERFORM 1 FROM vida_sante.profiles WHERE id = member_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'missing_profile'; END IF;

  SELECT id INTO sponsor_id FROM vida_sante.profiles WHERE referral_code = sponsor_code;
  IF sponsor_id IS NULL THEN RETURN 'invalid_code'; END IF;
  IF sponsor_id = member_id THEN RETURN 'self'; END IF;
  IF EXISTS (SELECT 1 FROM vida_sante.referrals WHERE referred_id = member_id) THEN
    RETURN 'already_registered';
  END IF;

  INSERT INTO vida_sante.referrals (referrer_id, referred_id, code, status)
    VALUES (sponsor_id, member_id, sponsor_code, 'pending');
  RETURN 'created';
END;
$$;

REVOKE ALL ON FUNCTION vida_sante.register_my_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION vida_sante.register_my_referral(text) TO authenticated;

COMMIT;
