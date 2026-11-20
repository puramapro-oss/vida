"""Run the account guards against a new local PostgreSQL cluster with synthetic users."""
import argparse
import concurrent.futures
import os
from pathlib import Path
import secrets
import socket
import subprocess
import tempfile
import threading

repo = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pg-bin', type=Path, required=True)
bin_dir = parser.parse_args().pg_bin.resolve()


def run(args, **kwargs):
    result = subprocess.run(args, capture_output=True, text=True, **kwargs)
    if result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    return result.stdout.strip()


with tempfile.TemporaryDirectory(prefix='vida-account-tests-') as private:
    directory = Path(private)
    cluster = directory / 'pgdata'
    password = secrets.token_hex(24)
    secret_file = directory / 'password'
    secret_file.write_text(password + '\n')
    secret_file.chmod(0o600)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]

    env = {k: v for k, v in os.environ.items() if not k.startswith('PG')}
    env.update(PGHOST='127.0.0.1', PGPORT=str(port), PGUSER='vida_audit', PGPASSWORD=password, PGCONNECT_TIMEOUT='4')
    run([bin_dir / 'initdb', '-D', cluster, '-U', 'vida_audit', '-A', 'scram-sha-256', '--pwfile', secret_file])
    run([bin_dir / 'pg_ctl', '-D', cluster, '-l', directory / 'postgres.log', '-o',
         f"-h 127.0.0.1 -p {port} -c unix_socket_directories=''", '-w', 'start'])
    try:
        def sql(query):
            return run([bin_dir / 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-d', 'postgres'], env=env, input=query)

        assert Path(sql('SHOW data_directory')) == cluster
        sql("""
            CREATE ROLE anon;
            CREATE ROLE authenticated;
            CREATE ROLE service_role BYPASSRLS;
            CREATE SCHEMA auth;
            GRANT USAGE ON SCHEMA auth TO authenticated, anon;
            CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
            CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
              $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
        """)
        sql((repo / 'schema.sql').read_text())
        sql("""
            DROP POLICY withdrawals_self ON vida_sante.withdrawals;
            CREATE POLICY withdrawals_self ON vida_sante.withdrawals FOR ALL USING (auth.uid() = user_id);
        """)
        ids = [f'00000000-0000-4000-8000-{n:012d}' for n in range(1, 6)]
        for n, identity in enumerate(ids):
            sql(f"INSERT INTO auth.users(id,email) VALUES ('{identity}', 'synthetic{n}@example.invalid');"
                f"UPDATE vida_sante.profiles SET referral_code='CODE{n}' WHERE id='{identity}';")
        for identity in ids[:2]:
            sql("INSERT INTO vida_sante.withdrawals(user_id,amount_cents,iban,full_name)"
                f" VALUES ('{identity}', 500, 'TEST', 'fixture')")
        migration = (repo / 'migrations/015_account_activity_guards.sql').read_text()
        sql(migration)
        sql(migration)

        def as_account(identity, query):
            return sql(f"SET ROLE authenticated; SET request.jwt.claim.sub = '{identity}'; " + query)

        def register(identity, code):
            return as_account(identity, f"SELECT vida_sante.register_my_referral('{code}')")

        for role in ['anon', 'authenticated']:
            for permission in ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']:
                assert sql(f"SELECT has_table_privilege('{role}', 'vida_sante.withdrawals', '{permission}')") == 'f'
        assert sql("SELECT has_function_privilege('anon','vida_sante.register_my_referral(text)','EXECUTE')") == 'f'
        for identity in ids[:2]:
            assert as_account(identity, 'SELECT user_id FROM vida_sante.withdrawals') == identity
        assert sql('SELECT count(*) FROM vida_sante.withdrawals') == '2'
        assert register(ids[2], 'UNKNOWN') == 'invalid_code'
        assert register(ids[2], 'CODE2') == 'self'
        assert register(ids[2], 'CODE0') == 'created'
        assert register(ids[2], 'CODE0') == 'already_registered'
        assert register(ids[2], 'CODE1') == 'already_registered'
        assert register('00000000-0000-4000-8000-999999999999', 'CODE0') == 'missing_profile'
        assert sql(f"SELECT referrer_id, code, status FROM vida_sante.referrals WHERE referred_id='{ids[2]}'") == ids[0]+'|CODE0|pending'

        barrier = threading.Barrier(2)

        def concurrent_registration(code):
            barrier.wait()
            return register(ids[3], code)

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = sorted(pool.map(concurrent_registration, ['CODE0', 'CODE1']))
        assert outcomes == ['already_registered', 'created']
        assert sql(f"SELECT count(*) FROM vida_sante.referrals WHERE referred_id='{ids[3]}'") == '1'
        assert sql('SELECT count(*) FROM vida_sante.referral_earnings') == '0'
        print('PASS PostgreSQL', sql('SHOW server_version'), 'full schema, migration replay, read-only withdrawals, '
              'account isolation, referral registration, validation and concurrent requests')
    finally:
        run([bin_dir / 'pg_ctl', '-D', cluster, '-m', 'fast', '-w', 'stop'])
