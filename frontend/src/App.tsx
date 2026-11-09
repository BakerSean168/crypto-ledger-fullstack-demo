import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { fetchLedger } from './lib/api'
import { formatDecimal } from './lib/format'
import type { LedgerData, TransactionDirection } from './types'
import './App.css'

type LoadStatus = 'loading' | 'ready' | 'error'

function Icon({
  name,
  size = 18,
}: {
  name: 'search' | 'refresh' | 'arrow-right' | 'arrow-up' | 'arrow-down' | 'database'
  size?: number
}) {
  const paths: Record<typeof name, ReactNode> = {
    search: (
      <>
        <circle cx="10.6" cy="10.6" r="6.6" />
        <path d="m16 16 5 5" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14-5L4 8" />
        <path d="M4 4v4h4" />
        <path d="M4 13a8 8 0 0 0 14 5l2-2" />
        <path d="M16 16h4v4" />
      </>
    ),
    'arrow-right': <path d="M4 12h16m-7-7 7 7-7 7" />,
    'arrow-up': <path d="M5 17 17 5M7 5h10v10" />,
    'arrow-down': <path d="M5 5 17 17M17 7v10H7" />,
    database: (
      <>
        <ellipse cx="12" cy="5.5" rx="8" ry="3" />
        <path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13" />
        <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const demoWallets = ['0xabc', '0xdef']

function formatUtc(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

function AssetBadge({ asset }: { asset: string }) {
  return (
    <span className={'asset-badge ' + (asset === 'ETH' ? 'asset-eth' : asset === 'USDT' ? 'asset-usdt' : '')}>
      <span className="asset-symbol" aria-hidden="true">
        {asset === 'ETH' ? 'Ξ' : asset === 'USDT' ? '₮' : asset.slice(0, 1)}
      </span>
      {asset}
    </span>
  )
}

function DirectionBadge({ direction }: { direction: TransactionDirection }) {
  return (
    <span className={'direction-badge ' + (direction === 'IN' ? 'inflow' : 'outflow')}>
      <Icon name={direction === 'IN' ? 'arrow-down' : 'arrow-up'} size={14} />
      {direction === 'IN' ? '转入' : '转出'}
    </span>
  )
}

function App() {
  const [walletInput, setWalletInput] = useState('0xabc')
  const [walletAddress, setWalletAddress] = useState('0xabc')
  const [asset, setAsset] = useState('')
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateError, setDateError] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(2)
  const [refreshKey, setRefreshKey] = useState(0)
  const [formError, setFormError] = useState('')
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState('')
  const [ledger, setLedger] = useState<LedgerData>({
    page: { items: [], page: 0, size: 2, totalElements: 0, totalPages: 0 },
    summary: [],
  })

  useEffect(() => {
    const controller = new AbortController()

    fetchLedger({ walletAddress, asset, startDate, endDate, page, size }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setLedger(result)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(error instanceof Error ? error.message : '请求失败，请稍后重试。')
        setStatus('error')
      })

    return () => controller.abort()
  }, [walletAddress, asset, startDate, endDate, page, size, refreshKey])

  const recordCount = useMemo(
    () => ledger.summary.reduce((total, item) => total + item.transactionCount, 0),
    [ledger.summary],
  )

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextWallet = walletInput.trim()
    if (!nextWallet) {
      setFormError('请输入钱包地址。')
      return
    }
    if (startInput && endInput && startInput > endInput) {
      setDateError('开始日期不能晚于结束日期。')
      return
    }
    setDateError('')
    setFormError('')
    setStartDate(startInput)
    setEndDate(endInput)
    setPage(0)
    setStatus('loading')
    setWalletAddress(nextWallet)
    setRefreshKey((value) => value + 1)
  }

  function selectWallet(nextWallet: string) {
    setWalletInput(nextWallet)
    setWalletAddress(nextWallet)
    setAsset('')
    setStartInput('')
    setEndInput('')
    setStartDate('')
    setEndDate('')
    setDateError('')
    setPage(0)
    setFormError('')
    setStatus('loading')
    setRefreshKey((value) => value + 1)
  }

  const busy = status === 'loading'
  const hasRows = status === 'ready' && ledger.page.items.length > 0

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <span className="mark-square first" />
              <span className="mark-square second" />
              <span className="mark-square third" />
              <span className="mark-square fourth" />
            </span>
            <div className="brand-name">
              Ledger<span>View</span>
              <small>CRYPTO OPERATIONS</small>
            </div>
          </div>
          <div className="header-right">
            <span className="header-nav">交易总览</span>
            <span className="header-divider" />
            <span className="environment-tag"><span className="status-dot" />本地开发环境</span>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-content">
            <div className="hero-eyebrow"><span className="eyebrow-line" /> DIGITAL ASSET LEDGER / 001</div>
            <h1 id="hero-title">交易记录，<br /><span>一目了然。</span></h1>
            <p>从交易明细到资产流向，用清晰的数据掌握每一笔资产变化。</p>
            <div className="hero-note">
              <span className="hero-note-icon"><Icon name="database" size={15} /></span>
              演示数据来自本地 PostgreSQL，非真实链上资产
            </div>
          </div>
          <div className="hero-illustration" aria-hidden="true">
            <div className="hero-illustration-grid" />
            <div className="floating-tile tile-back">
              <span className="tiny-label">DATA SOURCE</span>
              <strong>PostgreSQL</strong>
              <span className="tiny-accent" />
            </div>
            <div className="floating-tile tile-front">
              <div className="tile-topline"><span>ASSET FLOW</span><Icon name="arrow-up" size={15} /></div>
              <div className="tile-line wide" />
              <div className="tile-line" />
              <div className="tile-bar-chart">
                <i /><i /><i /><i /><i /><i /><i />
              </div>
            </div>
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
          </div>
        </section>

        <div className="workspace-head">
          <div>
            <div className="section-kicker">WORKSPACE</div>
            <h2>交易控制台</h2>
            <p>连接本地 API，筛选交易记录并查看资金流向汇总。</p>
          </div>
          <div className={'connection-state ' + (status === 'error' ? 'offline' : '')} role="status">
            <span className="connection-dot" />
            {status === 'ready' ? 'API 已连接' : status === 'loading' ? '正在查询' : '连接异常'}
          </div>
        </div>

        <section className="search-panel" aria-labelledby="search-title">
          <div className="panel-topline">
            <div>
              <h3 id="search-title">查询条件</h3>
              <p>按钱包地址、资产和 UTC 日期范围筛选交易</p>
            </div>
            <span className="panel-index">01 / QUERY</span>
          </div>
          <form onSubmit={handleSearch} className="query-form">
            <label className="field wallet-field">
              <span>钱包地址</span>
              <div className={'input-wrap ' + (formError ? 'invalid' : '')}>
                <Icon name="search" size={19} />
                <input
                  value={walletInput}
                  onChange={(event) => {
                    setWalletInput(event.target.value)
                    if (formError) setFormError('')
                  }}
                  placeholder="输入钱包地址，例如 0xabc"
                  autoComplete="off"
                  aria-invalid={!!formError}
                  aria-describedby={formError ? 'wallet-error' : undefined}
                />
              </div>
              {formError && <small className="field-error" id="wallet-error">{formError}</small>}
            </label>
            <label className="field asset-field">
              <span>资产类型</span>
              <select
                value={asset}
                onChange={(event) => {
                  setAsset(event.target.value)
                  setPage(0)
                  setStatus('loading')
                }}
                aria-label="资产类型"
              >
                <option value="">全部资产</option>
                <option value="ETH">ETH · Ethereum</option>
                <option value="USDT">USDT · Tether</option>
              </select>
            </label>
            <label className="field date-field">
              <span>开始日期（UTC）</span>
              <input
                type="date"
                value={startInput}
                max={endInput || undefined}
                onChange={(event) => {
                  setStartInput(event.target.value)
                  setDateError('')
                }}
              />
            </label>
            <label className="field date-field">
              <span>结束日期（UTC）</span>
              <input
                type="date"
                value={endInput}
                min={startInput || undefined}
                onChange={(event) => {
                  setEndInput(event.target.value)
                  setDateError('')
                }}
              />
            </label>
            <button className="submit-button" type="submit" disabled={busy}>
              <Icon name="search" size={17} />
              {busy ? '查询中…' : '查询记录'}
              {!busy && <Icon name="arrow-right" size={17} />}
            </button>
          </form>
          {dateError && <div role="alert" className="date-error">{dateError}</div>}
          <div className="date-hint">日期留空代表不限时间；修改日期后点击“查询记录”生效。</div>
          <div className="suggestions">
            <span>试试示例钱包</span>
            {demoWallets.map((sample) => (
              <button
                key={sample}
                className={walletAddress === sample ? 'sample active' : 'sample'}
                type="button"
                onClick={() => selectWallet(sample)}
              >
                {sample}
              </button>
            ))}
            <button
              className="refresh-button"
              type="button"
              onClick={() => {
                setStatus('loading')
                setRefreshKey((value) => value + 1)
              }}
              disabled={busy}
              aria-label="重新加载"
              title="重新加载"
            >
              <Icon name="refresh" size={16} />
              刷新
            </button>
          </div>
        </section>

        {status === 'error' && (
          <div className="error-panel" role="alert">
            <div>
              <strong>查询失败</strong>
              <p>{loadError}</p>
            </div>
            <button type="button" onClick={() => {
              setStatus('loading')
              setRefreshKey((value) => value + 1)
            }}>重试</button>
          </div>
        )}

        <section className="overview" aria-labelledby="overview-title" aria-busy={busy}>
          <div className="section-title">
            <div>
              <div className="section-kicker">ASSET OVERVIEW</div>
              <h3 id="overview-title">资金流向汇总</h3>
            </div>
            <div className="overview-meta">
              <span>{busy ? '—' : status === 'ready' ? ledger.summary.length : '—'} 种资产</span>
              <span className="meta-separator" />
              <span>{busy ? '—' : status === 'ready' ? recordCount : '—'} 笔交易</span>
            </div>
          </div>
          {busy ? (
            <div className="summary-grid" aria-label="正在加载资产汇总">
              <div className="summary-card placeholder-card" />
              <div className="summary-card placeholder-card" />
            </div>
          ) : status === 'ready' && ledger.summary.length > 0 ? (
            <div className="summary-grid">
              {ledger.summary.map((item) => (
                <article className="summary-card" key={item.asset}>
                  <div className="summary-card-head">
                    <AssetBadge asset={item.asset} />
                    <span className="summary-count">{item.transactionCount} 笔交易</span>
                  </div>
                  <div className="summary-values">
                    <div className="summary-value">
                      <span className="amount-label"><span className="small-indicator inbound" />总转入</span>
                      <strong>{formatDecimal(item.totalIn)} <small>{item.asset}</small></strong>
                    </div>
                    <div className="summary-value">
                      <span className="amount-label"><span className="small-indicator outbound" />总转出</span>
                      <strong>{formatDecimal(item.totalOut)} <small>{item.asset}</small></strong>
                    </div>
                  </div>
                  <div className="summary-card-footer">交易记录按资产独立汇总</div>
                </article>
              ))}
            </div>
          ) : (
            status === 'ready' && <div className="empty-summary">该钱包没有符合筛选条件的资产记录。</div>
          )}
        </section>

        <section className="table-section" aria-labelledby="table-title">
          <div className="section-title table-section-head">
            <div>
              <div className="section-kicker">TRANSACTION HISTORY</div>
              <h3 id="table-title">交易明细 <span className="table-count">{status === 'ready' ? ledger.page.totalElements : '—'}</span></h3>
              <p>按交易时间倒序 · UTC · 汇总不受分页影响</p>
            </div>
            <div className="table-wallet">当前钱包 <code>{walletAddress}</code></div>
          </div>
          <div className="table-card" aria-busy={busy}>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">交易 ID</th>
                    <th scope="col">资产</th>
                    <th scope="col">钱包地址</th>
                    <th scope="col">方向</th>
                    <th scope="col">交易时间</th>
                    <th scope="col" className="amount-column">交易金额</th>
                  </tr>
                </thead>
                <tbody>
                  {hasRows && ledger.page.items.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="id-cell">#{String(transaction.id).padStart(4, '0')}</td>
                      <td><AssetBadge asset={transaction.asset} /></td>
                      <td className="wallet-cell">{transaction.walletAddress}</td>
                      <td><DirectionBadge direction={transaction.direction} /></td>
                      <td className="time-cell">{formatUtc(transaction.createdAt)}</td>
                      <td className={'amount-column amount-cell ' + (transaction.direction === 'IN' ? 'positive' : 'negative')}>
                        {transaction.direction === 'IN' ? '+' : '−'}{formatDecimal(transaction.amount)}
                        <span className="amount-asset">{transaction.asset}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {busy && <div className="table-state" role="status">正在从 PostgreSQL 加载交易数据…</div>}
            {status === 'ready' && !hasRows && (
              <div className="table-state empty-state">
                <span className="empty-icon"><Icon name="search" size={24} /></span>
                <strong>没有找到交易记录</strong>
                <p>请尝试示例钱包 0xabc 或切换资产类型。</p>
              </div>
            )}
            {status === 'error' && <div className="table-state">请检查后端服务并重试查询。</div>}
            <div className="table-footer">
              <span>LOCAL DATABASE · POSTGRESQL</span>
              <span>演示模式 · 不涉及真实资金</span>
            </div>
            {status === 'ready' && (
              <nav className="pagination" aria-label="交易分页">
                <span>共 {ledger.page.totalElements} 条 · 第 {page + 1} / {Math.max(1, ledger.page.totalPages)} 页</span>
                <div className="pagination-controls">
                  <label>
                    每页
                    <select value={size} onChange={(event) => {
                      setSize(Number(event.target.value))
                      setPage(0)
                      setStatus('loading')
                    }}>
                      <option value={2}>2 条</option>
                      <option value={5}>5 条</option>
                      <option value={10}>10 条</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => {
                      setPage((value) => value - 1)
                      setStatus('loading')
                    }}
                  >上一页</button>
                  <button
                    type="button"
                    disabled={page + 1 >= ledger.page.totalPages}
                    onClick={() => {
                      setPage((value) => value + 1)
                      setStatus('loading')
                    }}
                  >下一页</button>
                </div>
              </nav>
            )}
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span>LedgerView <span className="footer-muted">/ Portfolio Demo</span></span>
        <span>React + TypeScript <i /> Spring Boot + MyBatis <i /> PostgreSQL</span>
      </footer>
    </div>
  )
}

export default App
