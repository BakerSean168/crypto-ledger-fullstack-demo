import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchLedger } from '../src/lib/api.ts'
import type { LedgerQuery } from '../src/types.ts'

const baseQuery: LedgerQuery = {
  walletAddress: '0xabc',
  asset: '',
  startDate: '',
  endDate: '',
  page: 0,
  size: 2,
}

test('forwards date and asset filters, but pagination only to the page endpoint', async () => {
  const called: string[] = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input) => {
    const path = String(input)
    called.push(path)
    if (path.includes('/summary?')) {
      return Response.json([{ asset: 'ETH', totalIn: '1.25', totalOut: '0', transactionCount: 1 }])
    }
    return Response.json({
      items: [{ id: 1, walletAddress: '0xabc', asset: 'ETH', amount: '1.25', direction: 'IN', createdAt: '2026-11-01T10:00:00Z' }],
      page: 1, size: 2, totalElements: 3, totalPages: 2,
    })
  }

  try {
    const result = await fetchLedger({
      ...baseQuery,
      asset: 'ETH',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      page: 1,
    }, new AbortController().signal)
    assert.equal(result.page.items.length, 1)
    assert.equal(result.summary.length, 1)
    assert.deepEqual(called.sort(), [
      '/api/transactions/page?walletAddress=0xabc&asset=ETH&startDate=2026-11-01&endDate=2026-11-05&page=1&size=2',
      '/api/transactions/summary?walletAddress=0xabc&asset=ETH&startDate=2026-11-01&endDate=2026-11-05',
    ].sort())
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('omits absent optional filters', async () => {
  const called: string[] = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input) => {
    called.push(String(input))
    return Response.json([])
  }
  try {
    await fetchLedger(baseQuery, new AbortController().signal)
    assert.equal(called.length, 2)
    assert.ok(called.every((path) => !path.includes('asset=') && !path.includes('startDate=') && !path.includes('endDate=')))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('surfaces server validation messages', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => Response.json(
    { error: 'INVALID_ARGUMENT', message: 'startDate 不能晚于 endDate' },
    { status: 400 },
  )
  try {
    await assert.rejects(
      fetchLedger(baseQuery, new AbortController().signal),
      /startDate 不能晚于 endDate/,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
