import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Eye,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  Star
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import EmptyState, { ErrorNotice } from '../../components/EmptyState'
import { api } from '../../lib/api'
import { compact, dateLabel, inr, monthLabel, orderStatusTone } from '../../lib/format'
import { useAuth } from '../../store/auth'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <span>{monthLabel(label)}</span>
      <strong>{inr(payload[0].value)}</strong>
    </div>
  )
}

export default function SellerOverview() {
  const user = useAuth((state) => state.user)
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .sellerOverview()
      .then((overview) => {
        if (cancelled) return
        setData(overview)
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
        <div className="kpi-grid">
          {[0, 1, 2, 3].map((index) => (
            <div className="skeleton skeleton-kpi" key={index} />
          ))}
        </div>
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

  const kpis = [
    { icon: IndianRupee, label: 'Revenue · 6 months', value: inr(data.revenue), note: 'Excludes cancelled orders' },
    { icon: ShoppingBag, label: 'Paid orders', value: compact(data.orders), note: 'Buyers who completed demo payment' },
    { icon: Package, label: 'Live listings', value: compact(data.products), note: 'Across all departments' },
    { icon: Eye, label: 'Product views', value: compact(data.views), note: 'Tracked from the storefront' },
    { icon: BarChart3, label: 'View to order', value: `${data.conversion}%`, note: 'Paid orders per product view' },
    { icon: Star, label: 'Average rating', value: Number(data.avgRating || 0).toFixed(1), note: 'Across reviewed lots' }
  ]

  return (
    <div className="studio-page">
      <div className="studio-head">
        <div>
          <span className="eyebrow">Seller studio · Overview</span>
          <h1>Good morning, {user?.name?.split(' ')[0]}.</h1>
          <p>
            Here is how {(user?.businessName || 'your business')} performed across the last six
            months of the register.
          </p>
        </div>
        <Link className="btn btn--gold" to="/seller/products/new">
          <Plus size={16} /> New listing
        </Link>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <article className="kpi-card" key={kpi.label}>
              <span className="kpi-icon">
                <Icon size={17} />
              </span>
              <span className="kpi-label">{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small>{kpi.note}</small>
            </article>
          )
        })}
      </div>

      <div className="studio-grid studio-grid--charts">
        <section className="studio-card studio-card--wide">
          <div className="studio-card-head">
            <div>
              <span className="eyebrow eyebrow--muted">Revenue trend</span>
              <h2>Six-month settlement.</h2>
            </div>
            <span className="studio-chip">INR · gross</span>
          </div>
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.revenueByMonth} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B08A3E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#B08A3E" stopOpacity={0.02} />
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
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#B08A3E', strokeDasharray: '3 4' }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#1F3D2B"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  activeDot={{ r: 4, fill: '#B08A3E', stroke: '#1F3D2B' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="studio-card">
          <div className="studio-card-head">
            <div>
              <span className="eyebrow eyebrow--muted">Recent orders</span>
              <h2>Last settlements.</h2>
            </div>
            <Link className="text-link" to="/seller/orders">
              All orders <ArrowRight size={14} />
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="muted">No paid orders yet. Seed data usually covers this — check the register.</p>
          ) : (
            <div className="studio-order-list">
              {data.recentOrders.map((order) => (
                <div className="studio-order" key={order.id}>
                  <div>
                    <strong>#{String(order.id).padStart(5, '0')}</strong>
                    <span>
                      {order.buyerName} · {order.city}, {order.state}
                    </span>
                    <small>{dateLabel(order.createdAt)}</small>
                  </div>
                  <div className="studio-order-side">
                    <strong>{inr(order.total)}</strong>
                    <span className={`status-pill status-pill--${orderStatusTone(order.status)}`}>
                      {order.status}
                    </span>
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
            <span className="eyebrow eyebrow--muted">Best sellers</span>
            <h2>Top lots by revenue.</h2>
          </div>
          <Link className="text-link" to="/seller/products">
            Manage listings <ArrowRight size={14} />
          </Link>
        </div>
        {data.topProducts.length === 0 ? (
          <EmptyState
            eyebrow="No sales yet"
            title="Your first lot is waiting."
            copy="Publish a listing and buyers matched to your category will see it in recommendations."
            actionLabel="Create a listing"
            actionTo="/seller/products/new"
          />
        ) : (
          <div className="studio-table-wrap">
            <table className="studio-table">
              <thead>
                <tr>
                  <th>Lot</th>
                  <th>Department</th>
                  <th>Units</th>
                  <th>Views</th>
                  <th>Revenue</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                    </td>
                    <td>{product.category}</td>
                    <td>{compact(product.units)}</td>
                    <td>{compact(product.views)}</td>
                    <td>
                      <strong>{inr(product.revenue)}</strong>
                    </td>
                    <td>
                      <Link className="icon-link" to={`/seller/products/${product.id}/edit`}>
                        <ArrowUpRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}