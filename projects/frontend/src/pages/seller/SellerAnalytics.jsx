import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, MousePointerClick, ShoppingBag, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { ErrorNotice } from '../../components/EmptyState'
import { api } from '../../lib/api'
import { compact, inr, monthLabel } from '../../lib/format'

const PIE_COLORS = ['#1F3D2B', '#B08A3E', '#7A7B52', '#8A6A3A', '#5C6B57']

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <span>{monthLabel(label)}</span>
      <strong>{inr(payload[0].value)}</strong>
    </div>
  )
}

function BarTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <span>{label}</span>
      <strong>{currency ? inr(payload[0].value) : compact(payload[0].value)}</strong>
    </div>
  )
}

export default function SellerAnalytics() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .sellerAnalytics()
      .then((analytics) => {
        if (cancelled) return
        setData(analytics)
        setStatus('ready')
      })
      .catch((exception) => {
        if (cancelled) return
        setError(exception)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="studio-page">
        <div className="studio-head">
          <div className="skeleton skeleton-line skeleton-line--short" />
          <div className="skeleton skeleton-line skeleton-line--title" />
        </div>
        <div className="skeleton skeleton-chart" />
        <div className="skeleton skeleton-chart" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="studio-page">
        <ErrorNotice message={error?.message} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  const funnelMax = Math.max(...data.funnel.map((step) => step.value), 1)
  const topProducts = [...data.topProducts].reverse()

  return (
    <div className="studio-page">
      <div className="studio-head">
        <div>
          <span className="eyebrow">Seller studio · Analytics</span>
          <h1>Where the season moved.</h1>
          <p>
            Signals come from product views, cart events and paid orders in this demo register.
            Cancelled orders are excluded from revenue.
          </p>
        </div>
        <Link className="btn btn--sm btn--ghost" to="/seller">
          Back to overview <ArrowRight size={14} />
        </Link>
      </div>

      <div className="analytics-kpis">
        <div className="analytics-kpi">
          <Eye size={17} />
          <span>Product views</span>
          <strong>{compact(data.views)}</strong>
        </div>
        <div className="analytics-kpi">
          <MousePointerClick size={17} />
          <span>Added to cart</span>
          <strong>{compact(data.carts)}</strong>
        </div>
        <div className="analytics-kpi">
          <ShoppingBag size={17} />
          <span>Paid orders</span>
          <strong>{compact(data.orders)}</strong>
        </div>
        <div className="analytics-kpi analytics-kpi--accent">
          <TrendingUp size={17} />
          <span>View to order</span>
          <strong>{data.conversion}%</strong>
        </div>
      </div>

      <div className="studio-grid studio-grid--analytics">
        <section className="studio-card studio-card--wide">
          <div className="studio-card-head">
            <div>
              <span className="eyebrow eyebrow--muted">Revenue</span>
              <h2>Monthly settlement.</h2>
            </div>
            <span className="studio-chip">Last 6 months</span>
          </div>
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.revenueByMonth} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1F3D2B" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#1F3D2B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#D9D2BE" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={monthLabel}
                  tick={{ fill: '#6B6A5E', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={{ stroke: '#C9C1AC' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => compact(value)}
                  tick={{ fill: '#6B6A5E', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#B08A3E', strokeDasharray: '3 4' }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#1F3D2B"
                  strokeWidth={2}
                  fill="url(#analyticsRevenue)"
                  activeDot={{ r: 4, fill: '#B08A3E', stroke: '#1F3D2B' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="studio-card">
          <div className="studio-card-head">
            <div>
              <span className="eyebrow eyebrow--muted">Mix</span>
              <h2>Revenue by department.</h2>
            </div>
          </div>
          {data.categoryShare.length === 0 ? (
            <p className="muted">No settled revenue yet.</p>
          ) : (
            <>
              <div className="chart-frame chart-frame--pie">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={data.categoryShare}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={62}
                      outerRadius={94}
                      paddingAngle={2}
                      stroke="#F4F1E8"
                      strokeWidth={2}
                    >
                      {data.categoryShare.map((entry, index) => (
                        <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${value}%`}
                      contentStyle={{
                        background: '#FBF8EF',
                        border: '1px solid #1F3D2B',
                        borderRadius: 0,
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: 12
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="pie-legend">
                {data.categoryShare.map((entry, index) => (
                  <li key={entry.label}>
                    <span
                      className="pie-swatch"
                      style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span>{entry.label}</span>
                    <strong>{entry.value}%</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <div className="studio-grid studio-grid--analytics">
        <section className="studio-card">
          <div className="studio-card-head">
            <div>
              <span className="eyebrow eyebrow--muted">Best lots</span>
              <h2>Revenue by product.</h2>
            </div>
          </div>
          {topProducts.length === 0 ? (
            <p className="muted">No product revenue to rank yet.</p>
          ) : (
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height={Math.max(220, topProducts.length * 46)}>
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke="#D9D2BE" strokeDasharray="3 5" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => compact(value)}
                    tick={{ fill: '#6B6A5E', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fill: '#2E332B', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<BarTooltip currency />} cursor={{ fill: 'rgba(176,138,62,0.08)' }} />
                  <Bar dataKey="revenue" fill="#B08A3E" barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="studio-card">
          <div className="studio-card-head">
            <div>
              <span className="eyebrow eyebrow--muted">Demand</span>
              <h2>Buyer regions.</h2>
            </div>
          </div>
          {data.buyerRegions.length === 0 ? (
            <p className="muted">No regional data yet.</p>
          ) : (
            <div className="region-bars">
              {data.buyerRegions.map((region) => (
                <div className="region-bar" key={region.label}>
                  <div className="region-bar-head">
                    <span>{region.label}</span>
                    <strong>{region.value}%</strong>
                  </div>
                  <div className="region-bar-track">
                    <span style={{ width: `${Math.min(100, region.value)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="studio-card">
        <div className="studio-card-head">
          <div>
            <span className="eyebrow eyebrow--muted">Funnel</span>
            <h2>From view to paid order.</h2>
          </div>
          <span className="studio-chip">{data.conversion}% view → order</span>
        </div>
        <div className="funnel">
          {data.funnel.map((step, index) => (
            <div className="funnel-step" key={step.label}>
              <div className="funnel-step-head">
                <span>{String(index + 1).padStart(2, '0')} · {step.label}</span>
                <strong>{compact(step.value)}</strong>
              </div>
              <div className="funnel-track">
                <span style={{ width: `${Math.max(4, (step.value / funnelMax) * 100)}%` }} />
              </div>
              {index < data.funnel.length - 1 && (
                <small>
                  {data.funnel[index + 1].value > 0
                    ? `${Math.round((data.funnel[index + 1].value / Math.max(1, step.value)) * 100)}% continue`
                    : 'No orders recorded yet'}
                </small>
              )}
            </div>
          ))}
        </div>
        <p className="funnel-note">
          Views include repeat visits. Cart events fire when a buyer adds a lot; orders count
          distinct paid checkouts. Treat the ratios as directional, not audited.
        </p>
      </section>
    </div>
  )
}