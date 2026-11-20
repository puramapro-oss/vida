import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { compileFunction } from 'node:vm'
import ts from 'typescript'

// Execute the actual route handlers against a session-bound client. Unexpected
// imports or database operations fail the test instead of reaching any service.
function endpoint(name, db) {
  const filename = new URL('../src/app/api/' + name + '/route.ts', import.meta.url)
  const source = ts.transpile(readFileSync(filename, 'utf8'), { module: ts.ModuleKind.CommonJS })
  const handlers = {}
  const imports = {
    'next/server': { NextResponse: Response },
    '@/lib/supabase-server': { createServerSupabaseClient: async () => db },
  }
  compileFunction(source, ['exports', 'require'])(handlers, id => {
    assert.ok(Object.hasOwn(imports, id), 'unexpected dependency ' + id)
    return imports[id]
  })
  return handlers
}

const session = id => ({ auth: { getUser: async () => ({ data: { user: id ? { id } : null } }) } })
const asRequest = body => new Request('http://localhost/api/referral', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
})

for (const name of ['wallet', 'referral']) {
  for (const method of ['GET', 'POST']) {
    test(name + ' ' + method + ' requires a verified account before doing any work', async () => {
      const route = endpoint(name, session(null))
      assert.equal((await route[method](asRequest({}))).status, 401)
    })
  }
}

test('cash withdrawals remain unavailable and never touch the ledger', async () => {
  assert.equal((await endpoint('wallet', session('alice')).POST()).status, 503)
})

function reads(id, fixtures) {
  const db = session(id)
  db.from = table => {
    const fixture = fixtures[table]
    assert.ok(fixture, 'unexpected table ' + table)
    let filtered = false
    const query = {
      select: () => query, order: () => query, limit: () => query, maybeSingle: () => query,
      eq(column, account) {
        assert.equal(column, fixture.ownerColumn)
        assert.equal(account, id)
        filtered = true
        return query
      },
      then(resolve) {
        assert.ok(filtered, 'missing account restriction for ' + table)
        resolve({ data: fixture.data, error: fixture.error ?? null })
      },
    }
    return query
  }
  return db
}

test('wallet scopes all three queries and reports an unavailable register', async () => {
  const rows = {
    wallets: { ownerColumn: 'user_id', data: { balance: 3, total_earned: 4 } },
    withdrawals: { ownerColumn: 'user_id', data: [] },
    wallet_transactions: { ownerColumn: 'user_id', data: [{ id: 'own-tx' }] },
  }
  const route = endpoint('wallet', reads('alice', rows))
  assert.deepEqual(await (await route.GET()).json(), { balance: 3, total_earned: 4, transactions: [{ id: 'own-tx' }], withdrawals: [] })
  rows.wallet_transactions.error = { code: 'PGRST205' }
  assert.equal((await route.GET()).status, 503)
})

test('referral history uses the verified referrer and converts cents once', async () => {
  const db = reads('alice', {
    profiles: { ownerColumn: 'id', data: { referral_code: 'A' } },
    referrals: { ownerColumn: 'referrer_id', data: [{ id: 'r' }] },
    referral_earnings: { ownerColumn: 'referrer_id', data: [{ amount_cents: 105 }, { amount_cents: 25 }] },
  })
  const result = await (await endpoint('referral', db).GET()).json()
  assert.equal(result.referral_code, 'A')
  assert.equal(result.total_commissions, 1.30)
  assert.equal(result.commissions[0].amount, 1.05)
})

test('registration forwards only the sponsor code to the authenticated function', async () => {
  const db = session('alice')
  const results = { created: 200, already_registered: 409, invalid_code: 404, self: 400, missing_profile: 503 }
  const route = endpoint('referral', db)
  assert.equal((await route.POST(asRequest({ referrer_code: 'S', referred_id: 'bob' }))).status, 403)
  assert.equal((await route.POST(asRequest({ referrer_code: ' ' }))).status, 400)
  for (const [data, status] of Object.entries(results)) {
    db.rpc = async (name, args) => {
      assert.equal(name, 'register_my_referral')
      assert.deepEqual(args, { sponsor_code: 'S' })
      return { data, error: null }
    }
    assert.equal((await route.POST(asRequest({ referrer_code: ' S ', referred_id: 'alice' }))).status, status)
  }
})
