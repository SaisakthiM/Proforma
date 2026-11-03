import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, Minus, Plus, Trash2, Truck } from 'lucide-react'
import ProductVisual from '../components/ProductVisual'
import ProductCard from '../components/ProductCard'
import EmptyState from '../components/EmptyState'
import { api } from '../lib/api'
import { inr } from '../lib/format'
import { useAuth } from '../store/auth'
import { cartSubtotal, useCart } from '../store/cart'
import { useToast } from '../store/toast'

const FREE_SHIPPING = 999

export default function Cart() {
  const items = useCart((state) => state.items)
  const setQuantity = useCart((state) => state.setQuantity)
  const remove = useCart((state) => state.remove)
  const subtotal = useCart(cartSubtotal)
  const user = useAuth((state) => state.user)
  const push = useToast((state) => state.push)
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    api.recommendationsForMe().then(setRecommendations).catch(() => {})
  }, [user?.id])

  const shipping = items.length === 0 || subtotal >= FREE_SHIPPING ? 0 : 79
  const total = subtotal + shipping
  const remaining = Math.max(0, FREE_SHIPPING - subtotal)

  if (items.length === 0) {
    return (
      <div className="section">
        <EmptyState
          eyebrow="Basket · Empty"
          title="Your basket is still in the shed."
          copy="Add verified seed, machinery, tools or soil inputs and they will be held here."
          actionLabel="Browse the registry"
          actionTo="/search"
        />
      </div>
    )
  }

  function removeItem(item) {
    remove(item.product.id)
    push(`${item.product.name} removed`, 'default')
  }

  return (
    <div className="cart-page">
      <div className="page-intro page-intro--compact">
        <span className="eyebrow">Basket · Proforma registry</span>
        <h1>Review your inputs.</h1>
        <p>
          Quantities are checked against live stock at checkout. Prices are seller-declared
          and inclusive of tax.
        </p>
      </div>

      <div className="cart-layout">
        <section className="cart-lines">
          <div className="cart-lines-head">
            <span>{items.length} line{items.length > 1 ? 's' : ''}</span>
            <Link to="/search">Add another lot</Link>
          </div>
          {items.map((item) => (
            <article className="cart-line" key={item.product.id}>
              <Link to={`/product/${item.product.id}`} className="cart-line-media">
                <ProductVisual product={item.product} variant="thumb" />
              </Link>
              <div className="cart-line-body">
                <span className="eyebrow eyebrow--muted">
                  {item.product.categoryLabel || item.product.category} · {item.product.subcategory}
                </span>
                <h3>
                  <Link to={`/product/${item.product.id}`}>{item.product.name}</Link>
                </h3>
                <p>
                  {item.product.sellerBusiness || item.product.sellerName} ·{' '}
                  {item.product.location}
                </p>
                <div className="cart-line-controls">
                  <div className="quantity-stepper">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.product.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button type="button" className="cart-remove" onClick={() => removeItem(item)}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
              <div className="cart-line-price">
                <strong>{inr(Number(item.product.price) * item.quantity)}</strong>
                <span>{inr(item.product.price)} / {item.product.unit}</span>
              </div>
            </article>
          ))}
        </section>

        <aside className="cart-summary">
          <span className="eyebrow">Order summary</span>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{inr(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <strong>{shipping === 0 ? 'Free' : inr(shipping)}</strong>
          </div>
          <div className="summary-note">
            <Truck size={15} />
            {remaining > 0 ? (
              <span>
                Add {inr(remaining)} more for free district delivery.
                <span className="shipping-track">
                  <span style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING) * 100)}%` }} />
                </span>
              </span>
            ) : (
              <span>Free district delivery applied.</span>
            )}
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{inr(total)}</strong>
          </div>
          <Link className="btn btn--forest btn--full" to="/checkout">
            Proceed to checkout <ArrowRight size={16} />
          </Link>
          <p className="summary-secure">
            <Lock size={13} /> Demo checkout. No card or bank details are stored.
          </p>
          {!user && (
            <p className="summary-signin">
              You will be asked to <Link to="/login?next=/checkout">sign in</Link> before paying.
            </p>
          )}
          <Link className="text-link summary-continue" to="/search">
            Continue shopping
          </Link>
        </aside>
      </div>

      {recommendations.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Before you check out</span>
              <h2>Frequently paired with your basket.</h2>
            </div>
            <div className="section-head-side">
              <p>Ranked from co-view patterns and your farm profile.</p>
              <Link className="text-link" to="/search">
                Browse all <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="product-rail">
            {recommendations.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}