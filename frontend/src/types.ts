export type TransactionDirection = 'IN' | 'OUT'

/** Financial amounts use JSON decimal strings, never floating point. */
export interface Transaction {
  id: number
  walletAddress: string
  asset: string
  amount: string
  direction: TransactionDirection
  createdAt: string
}

export interface TransactionSummary {
  asset: string
  totalIn: string
  totalOut: string
  transactionCount: number
}

export interface TransactionPage {
  items: Transaction[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface LedgerData {
  page: TransactionPage
  summary: TransactionSummary[]
}

export interface LedgerQuery {
  walletAddress: string
  asset: string
  startDate: string
  endDate: string
  page: number
  size: number
}
