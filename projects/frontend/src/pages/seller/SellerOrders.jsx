import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, MapPin, Package, Truck, UserRound } from 'lucide-react'
import EmptyState, { ErrorNotice } from '../../components/EmptyState'
import { api } from '../../lib/api'
import { ORDER_STATUSES } from '../../lib/constants'
import { dateLabel, inr, orderStatusTone } from '../../lib/format'
import { useToast } from '../../store/toast'

const FILTERS = ['ALL', ...ORDER_STATUSES]

export default function SellerOrders() {
  const push = useToast((state) => state.push)
  const [orders, setOrders] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .sellerOrders()
      .then((data) => {
        if (cancelled) return
        setOrders(data)
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

  const visible = useMemo(() => {
    if (!orders) return []
    return filter === 'ALL' ? orders : orders.filter((order) => order.status === filter)
  }, [orders, filter])

  async function changeStatus(order, next) {
    if (next === order.status) return
    setUpdating(order.id)
    try {
      await api.updateOrderStatus(order.id, next)
      setOrders((current) =>
        current.map((entry) => (entry.id === order.id ? { ...entry, status: next } : entry))
      )
      push(`Order #${String(order.id).padStart(5, '0')} marked ${next.toLowerCase()}`, 'success')
    } catch (exception) {
      push(exception.message, 'danger')
    } finally {
      setUpdating(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="studio-page">
        <div className="studio-head">
          <div className="skeleton skeleton-line skeleton-line--short" />
          <div className="skeleton skeleton-line skeleton-line--title" />
        </div>
        <div className="studio-order-skeletons">
          {[0, 1, 2].map((index) => (
            <div className="skeleton skeleton-order" key={index} />
          ))}
        </div>
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

  return (
    <div className="studio-page">
      <div className="studio-head">
        <div>
          <span className="eyebrow">Seller studio · Orders</span>
          <h1>Consignments to fulfil.</h1>
          <p>
            These are orders containing your lots. Move each consignment through packing,
            dispatch and delivery as it leaves the depot.
          </p>
        </div>
      </div>

      <div className="studio-toolbar studio-toolbar--orders">
        <div className="studio-segmented">
          {FILTERS.map((value) => {
            const count =
              value === 'ALL'
                ? orders.length
                : orders.filter((order) => order.status === value).length
            return (
              <button
                key={value}
                type="button"
                className={filter === value ? 'is-active' : ''}
                onClick={() => setFilter(value)}
              >
                {value === 'ALL' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}
                <small>{count}</small>
              </button>
            )
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          eyebrow="No orders yet"
          title="The order ledger is empty."
          copy="When a buyer settles a demo payment for one of your lots, it appears here with the dispatch details."
          actionLabel="Review your listings"
          actionTo="/seller/products"
        />
      ) : visible.length === 0 ? (
        <EmptyState
          eyebrow="Nothing in this state"
          title={`No ${filter.toLowerCase()} orders.`}
          copy="Switch the filter to see the rest of the register."
        />
      ) : (
        <div className="seller-order-list">
          {visible.map((order) => (
            <article className="seller-order-card" key={order.id}>
              <div className="seller-order-head">
                <div>
                  <span className="account-order-id">
                    Order #{String(order.id).padStart(5, '0')}
                  </span>
                  <h3>{inr(order.total)}</h3>
                  <span className="seller-order-date">{dateLabel(order.createdAt)}</span>
                </div>
                <div className="seller-order-head-side">
                  <span className={`status-pill status-pill--${orderStatusTone(order.status)}`}>
                    {order.status}
                  </span>
                  <label className="status-select">
                    <span className="sr-only">Update order status</span>
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={(event) => changeStatus(order, event.target.value)}
                    >
                      {ORDER_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          Mark {value.toLowerCase()}
                        </option>
                      ))}
                    </select>
                    {updating === order.id ? (
                      <Loader2 size={14} className="spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                  </label>
                </div>
              </div>

              <div className="seller-order-meta">
                <span>
                  <UserRound size={13} /> {order.buyerName}
                </span>
                <span>
                  <MapPin size={13} /> {order.city}, {order.state}
                </span>
                <span>
                  <Truck size={13} /> Dispatch in 2–4 working days
                </span>
              </div>

              <div className="seller-order-items">
                {order.items.map((item) => (
                  <div className="seller-order-item" key={`${order.id}-${item.productId}-${item.name}`}>
                    <span className="seller-order-item-icon">
                      <Package size={15} />
                    </span>
                    <div>
                      <Link to={`/product/${item.productId}`}>{item.name}</Link>
                      <span>
                        {item.quantity} × {inr(item.unitPrice)}
                      </span>
                    </div>
                    <strong>{inr(Number(item.unitPrice) * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}