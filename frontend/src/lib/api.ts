import type { LedgerData, LedgerQuery, TransactionPage, TransactionSummary } from '../types'

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      signal,
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new Error('无法连接后端服务，请确认 Spring Boot 已在 8080 端口启动。')
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const message = body && typeof body === 'object' && 'message' in body
      && typeof body.message === 'string' ? body.message : null
    throw new Error(message ?? ('接口请求失败（HTTP ' + response.status + '）。'))
  }
  return (await response.json()) as T
}

/** Summary is not paginated; both requests use the same filters. */
export async function fetchLedger(
  query: LedgerQuery,
  signal: AbortSignal,
): Promise<LedgerData> {
  const filterParams = new URLSearchParams({ walletAddress: query.walletAddress })
  if (query.asset) filterParams.set('asset', query.asset)
  if (query.startDate) filterParams.set('startDate', query.startDate)
  if (query.endDate) filterParams.set('endDate', query.endDate)
  const pageParams = new URLSearchParams(filterParams)
  pageParams.set('page', String(query.page))
  pageParams.set('size', String(query.size))

  const [page, summary] = await Promise.all([
    getJson<TransactionPage>('/api/transactions/page?' + pageParams, signal),
    getJson<TransactionSummary[]>('/api/transactions/summary?' + filterParams, signal),
  ])

  return { page, summary }
}
