import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  MapPin,
  Package,
  ReceiptText,
  ShieldCheck,
  Truck
} from 'lucide-react'
import EmptyState, { ErrorNotice } from '../components/EmptyState'
import { api } from '../lib/api'
import { dateLabel, inr } from '../lib/format'
import { useToast } from '../store/toast'

const STEPS = [
  { label: 'Payment captured', copy: 'Demo settlement recorded', icon: ShieldCheck },
  { label: 'Packing', copy: 'Seller prepares the lot', icon: Package },
  { label: 'Dispatch', copy: 'Handed to district carrier', icon: Truck },
  { label: 'Delivered', copy: 'Signed at your farm gate', icon: MapPin }
]

export default function OrderSuccess() {
  const { id } = useParams()
  const location = useLocation()
  const push = useToast((state) => state.push)
  const [order, setOrder] = useState(location.state?.order || null)
  const [status, setStatus] = useState(location.state?.order ? 'ready' : 'loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (order) return
    let cancelled = false
    api
      .myOrders()
      .then((orders) => {
        if (cancelled) return
        const found = orders.find((entry) => String(entry.id) === String(id))
        if (!found) {
          setStatus('missing')
          return
        }
        setOrder(found)
        setStatus('ready')
      })
      .catch((exception) => {
        if (!cancelled) {
          setError(exception)
          setStatus('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, order])

  function copyRef() {
    if (!order) return
    const value = order.paymentRef || `PF-${order.id}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).then(
        () => push('Payment reference copied', 'success'),
        () => push('Could not copy the reference', 'danger')
      )
    } else {
      push(value, 'default')
    }
  }

  if (status === 'loading') {
    return (
      <div className="section">
        <div className="order-success-card">
          <div className="skeleton skeleton-line skeleton-line--short" />
          <div className="skeleton skeleton-line skeleton-line--title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-block" />
        </div>
      </div>
    )
  }

  if (status === 'missing') {
    return (
      <div className="section">
        <EmptyState
          eyebrow="Order not found"
          title="That consignment is not in your register."
          copy="Check your account for recent orders, or start a fresh basket."
          actionLabel="View your orders"
          actionTo="/account"
        />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="section">
        <ErrorNotice message={error?.message} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  const linesTotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  )
  const shipping = Number(order.total) - linesTotal

  return (
    <div className="order-success-page">
      <div className="order-success-hero">
        <span className="order-seal">
          <Check size={30} strokeWidth={2.2} />
        </span>
        <span className="eyebrow eyebrow--gold">Demo payment accepted</span>
        <h1>The lot is booked.</h1>
        <p>
          Order <strong>#{String(order.id).padStart(5, '0')}</strong> is confirmed for{' '}
          {order.shipName}. The seller has been notified and your consignment is moving through
          the register.
        </p>
        <div className="order-ref-row">
          <span>
            <ReceiptText size={15} /> {order.paymentRef || `PF-${order.id}`}
          </span>
          <button type="button" onClick={copyRef}>
            <Copy size={14} /> Copy
          </button>
        </div>
        <div className="order-hero-actions">
          <Link className="btn btn--forest" to="/account">
            Track this order <ArrowRight size={16} />
          </Link>
          <Link className="btn btn--ghost" to="/search">
            Continue shopping
          </Link>
        </div>
      </div>

      <div className="order-success-grid">
        <section className="order-detail-card">
          <div className="checkout-card-head">
            <span className="step-index">01</span>
            <div>
              <h2>Consignment</h2>
              <p>
                {order.items.length} line{order.items.length > 1 ? 's' : ''} · placed{' '}
                {dateLabel(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="order-lines">
            {order.items.map((item) => (
              <div className="order-line" key={`${item.productId}-${item.name}`}>
                <div className="order-line-marker">
                  <Package size={16} />
                </div>
                <div>
                  <Link to={`/product/${item.productId}`}>{item.name}</Link>
                  <span>
                    {item.category} · {item.quantity} × {inr(item.unitPrice)} · {item.unit}
                  </span>
                </div>
                <strong>{inr(Number(item.unitPrice) * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="order-totals">
            <div className="summary-row">
              <span>Goods</span>
              <strong>{inr(linesTotal)}</strong>
            </div>
            <div className="summary-row">
              <span>District delivery</span>
              <strong>{shipping <= 0 ? 'Free' : inr(shipping)}</strong>
            </div>
            <div className="summary-total">
              <span>Paid in demo mode</span>
              <strong>{inr(order.total)}</strong>
            </div>
          </div>
        </section>

        <aside className="order-side">
          <div className="order-side-card">
            <span className="eyebrow">Delivery</span>
            <strong>{order.shipName}</strong>
            <p>
              {order.shipCity}, {order.shipState}
            </p>
            <span className="order-side-badge">
              <Truck size={14} /> 3–6 working days
            </span>
          </div>

          <div className="order-side-card">
            <span className="eyebrow">Settlement</span>
            <strong className="order-pay-method">
              {order.paymentMethod === 'card'
                ? 'Card (demo)'
                : order.paymentMethod === 'upi'
                  ? 'UPI (demo)'
                  : 'Net banking (demo)'}
            </strong>
            <p>{order.paymentLabel || 'Simulated payment'}</p>
            <span className="order-side-badge order-side-badge--gold">
              <BadgeCheck size={14} /> {order.status}
            </span>
            <p className="order-disclaimer">
              No bank account is connected. This receipt records a demo transaction only.
            </p>
          </div>
        </aside>
      </div>

      <section className="order-timeline">
        <span className="eyebrow">Fulfilment path</span>
        <div className="timeline-steps">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const state = index === 0 ? 'done' : index === 1 ? 'current' : 'queued'
            return (
              <div className={`timeline-step timeline-step--${state}`} key={step.label}>
                <span className="timeline-dot">
                  <Icon size={16} />
                </span>
                <strong>{step.label}</strong>
                <small>{step.copy}</small>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}