import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  LogOut,
  MapPin,
  Package,
  Sprout,
  Store,
  UserRound
} from 'lucide-react'
import EmptyState, { ErrorNotice } from '../components/EmptyState'
import { api } from '../lib/api'
import { dateLabel, inr, orderStatusTone } from '../lib/format'
import { useAuth } from '../store/auth'

export default function Account() {
  const navigate = useNavigate()
  const user = useAuth((state) => state.user)
  const logout = useAuth((state) => state.logout)
  const [orders, setOrders] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .myOrders()
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

  function signOut() {
    logout()
    navigate('/')
  }

  const initials = (user?.name || 'PF')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const profileComplete = Boolean(
    user?.farmerType && user?.crops?.length && user?.state && user?.climate
  )

  return (
    <div className="account-page">
      <div className="account-head">
        <div className="account-identity">
          <span className="account-avatar">{initials}</span>
          <div>
            <span className="eyebrow">
              {user?.role === 'SELLER' ? 'Seller account' : 'Buyer account'} · Proforma registry
            </span>
            <h1>{user?.name}</h1>
            <p>
              {user?.email} · Member since {dateLabel(user?.createdAt)}
            </p>
          </div>
        </div>
        <div className="account-head-actions">
          {user?.role === 'SELLER' && (
            <Link className="btn btn--forest" to="/seller">
              <Store size={16} /> Seller studio
            </Link>
          )}
          <button type="button" className="btn btn--ghost" onClick={signOut}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      <div className="account-grid">
        <aside className="account-side">
          <div className="account-card">
            <span className="eyebrow eyebrow--muted">Farm profile</span>
            {profileComplete ? (
              <>
                <strong>{user.farmerType}</strong>
                <span className="account-profile-line">
                  <Sprout size={14} /> {user.crops.join(', ')}
                </span>
                <span className="account-profile-line">
                  <MapPin size={14} /> {user.district}, {user.state}
                </span>
                <span className="account-profile-line">
                  <CalendarDays size={14} /> {user.climate} · {user.irrigation || 'Irrigation not set'}
                </span>
                {user.farmSize && (
                  <span className="account-profile-line">
                    <BadgeCheck size={14} /> Holding: {user.farmSize}
                  </span>
                )}
              </>
            ) : (
              <p className="muted">
                Add your crops, district and climate to unlock profile-based recommendations.
              </p>
            )}
          </div>

          {user?.role === 'SELLER' && (
            <div className="account-card">
              <span className="eyebrow eyebrow--muted">Business</span>
              <strong>{user.businessName || 'Seller account'}</strong>
              <p>{user.productFocus || 'No product focus set yet.'}</p>
              {user.sellerAbout && <p className="account-about">{user.sellerAbout}</p>}
              <Link className="text-link" to="/seller/products/new">
                List a new product <ArrowUpRight size={14} />
              </Link>
            </div>
          )}

          <div className="account-card account-card--quiet">
            <span className="eyebrow eyebrow--muted">Demo note</span>
            <p>
              Payments in this environment are simulated. No card, UPI or bank credentials are
              held by Proforma and no money moves.
            </p>
          </div>
        </aside>

        <section className="account-orders">
          <div className="account-orders-head">
            <div>
              <span className="eyebrow">Order register</span>
              <h2>Your consignments.</h2>
            </div>
            {orders?.length > 0 && (
              <span className="account-order-count">
                {orders.length} order{orders.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {status === 'loading' && (
            <div className="account-order-skeletons">
              {[0, 1, 2].map((index) => (
                <div className="skeleton skeleton-order" key={index} />
              ))}
            </div>
          )}

          {status === 'error' && (
            <ErrorNotice message={error?.message} onRetry={() => window.location.reload()} />
          )}

          {status === 'ready' && orders.length === 0 && (
            <EmptyState
              eyebrow="No orders yet"
              title="Your register is still clean."
              copy="Place a demo order and it will appear here with its payment reference and fulfilment status."
              actionLabel="Browse the registry"
              actionTo="/search"
            />
          )}

          {status === 'ready' && orders.length > 0 && (
            <div className="order-list">
              {orders.map((order) => (
                <article className="account-order" key={order.id}>
                  <div className="account-order-top">
                    <div>
                      <span className="account-order-id">Order #{String(order.id).padStart(5, '0')}</span>
                      <strong>{inr(order.total)}</strong>
                    </div>
                    <span className={`status-pill status-pill--${orderStatusTone(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="account-order-meta">
                    <span>Placed {dateLabel(order.createdAt)}</span>
                    <span className="dot" />
                    <span>
                      {order.paymentMethod === 'card'
                        ? 'Card'
                        : order.paymentMethod === 'upi'
                          ? 'UPI'
                          : 'Net banking'}{' '}
                      · {order.paymentLabel || 'demo'}
                    </span>
                    <span className="dot" />
                    <span>
                      {order.shipCity}, {order.shipState}
                    </span>
                  </div>
                  <div className="account-order-items">
                    {order.items.map((item) => (
                      <div className="account-order-item" key={`${order.id}-${item.productId}-${item.name}`}>
                        <Package size={15} />
                        <Link to={`/product/${item.productId}`}>{item.name}</Link>
                        <span>
                          {item.quantity} × {inr(item.unitPrice)}
                        </span>
                        <strong>{inr(Number(item.unitPrice) * item.quantity)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="account-order-foot">
                    <span>
                      <UserRound size={13} /> {order.shipName} · Ref {order.paymentRef || `PF-${order.id}`}
                    </span>
                    <Link className="text-link" to={`/order/${order.id}/success`}>
                      View receipt <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}