import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck
} from 'lucide-react'
import ProductVisual from '../components/ProductVisual'
import ProductCard from '../components/ProductCard'
import Stars from '../components/Stars'
import EmptyState, { ErrorNotice } from '../components/EmptyState'
import { api } from '../lib/api'
import { categoryByValue } from '../lib/constants'
import { dateLabel, inr, timeAgo } from '../lib/format'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'
import { useToast } from '../store/toast'

function ReviewForm({ product, user, onPublished }) {
  const navigate = useNavigate()
  const push = useToast((state) => state.push)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="review-signin">
        <span className="eyebrow eyebrow--muted">Write a review</span>
        <p>Only signed-in buyers can publish a review. It keeps the register honest.</p>
        <Link className="btn btn--sm btn--forest" to={`/login?next=/product/${product.id}`}>
          Sign in to review <ArrowUpRight size={14} />
        </Link>
      </div>
    )
  }

  async function submit(event) {
    event.preventDefault()
    if (body.trim().length < 8) {
      setError('Write at least a sentence about how it performed.')
      return
    }
    setStatus('saving')
    setError('')
    try {
      const summary = await api.addReview(product.id, { rating, title, body })
      onPublished(summary)
      setTitle('')
      setBody('')
      setRating(5)
      push('Review published', 'success')
    } catch (exception) {
      setError(exception.message)
    } finally {
      setStatus('idle')
    }
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <div className="review-form-head">
        <span className="eyebrow eyebrow--muted">Write a review</span>
        <div className="review-stars-input">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              key={value}
              className={value <= rating ? 'is-filled' : ''}
              onClick={() => setRating(value)}
              aria-label={`${value} stars`}
            >
              <Star size={18} fill={value <= rating ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Headline</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Certified lot, clean germination"
            maxLength={140}
          />
        </label>
        <label className="field field--full">
          <span>How did it perform?</span>
          <textarea
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Yield, germination, build quality, delivery…"
            maxLength={1500}
          />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn--forest" disabled={status === 'saving'}>
        {status === 'saving' ? 'Publishing…' : 'Publish review'}
      </button>
    </form>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuth((state) => state.user)
  const add = useCart((state) => state.add)
  const push = useToast((state) => state.push)
  const viewed = useRef(false)

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    let cancelled = false
    viewed.current = false
    setStatus('loading')
    setProduct(null)
    setQuantity(1)
    setTab('overview')

    api
      .product(id)
      .then((data) => {
        if (cancelled) return
        setProduct(data)
        setStatus('ready')
        if (!viewed.current) {
          viewed.current = true
          api.recordEvent(data.id, 'VIEW').catch(() => {})
        }
        api.reviews(id).then(setReviews).catch(() => {})
        api.recommendationsForProduct(id).then(setRecommendations).catch(() => {})
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
  }, [id])

  if (status === 'loading') {
    return (
      <div className="product-page">
        <div className="product-layout product-layout--loading">
          <div className="skeleton skeleton-product" />
          <div className="skeleton-product-info">
            <div className="skeleton skeleton-line skeleton-line--short" />
            <div className="skeleton skeleton-line skeleton-line--title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line skeleton-line--short" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    if (error?.status === 404) {
      return (
        <div className="section">
          <EmptyState
            eyebrow="404 · Lot not found"
            title="This listing has left the register."
            copy="The seller may have withdrawn the lot, or the link is out of date."
            actionLabel="Browse the catalog"
            actionTo="/search"
          />
        </div>
      )
    }
    return (
      <div className="section">
        <ErrorNotice
          message={error?.message}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  if (!product) return null

  const category = categoryByValue[product.category] || {}
  const soldOut = product.stock <= 0
  const fitCrops = (user?.crops || []).filter((crop) =>
    (product.tags || []).some((tag) => tag.toLowerCase().includes(crop.toLowerCase()))
  )

  function addToCart() {
    if (soldOut) return
    add(product, quantity)
    push(`${product.name} added to cart`, 'success')
    api.recordEvent(product.id, 'CART').catch(() => {})
  }

  function buyNow() {
    if (soldOut) return
    add(product, quantity)
    api.recordEvent(product.id, 'CART').catch(() => {})
    navigate('/checkout')
  }

  return (
    <div className="product-page">
      <nav className="breadcrumbs">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={`/search?category=${product.category}`}>{category.label}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-layout">
        <div className="product-gallery">
          <ProductVisual product={product} variant="detail" />
          <div className="gallery-strip">
            <div>
              <span className="eyebrow eyebrow--muted">Lot</span>
              <strong>PF-2026-{String(product.id).padStart(3, '0')}</strong>
            </div>
            <div>
              <span className="eyebrow eyebrow--muted">Seller</span>
              <strong>{product.sellerBusiness || product.sellerName}</strong>
            </div>
            <div>
              <span className="eyebrow eyebrow--muted">Dispatch</span>
              <strong>{product.location || 'Verified district'}</strong>
            </div>
          </div>
        </div>

        <div className="product-info">
          <div className="product-meta-row">
            <span className="eyebrow">
              {category.code} · {product.subcategory || category.short}
            </span>
            <span className={`stock-pill${soldOut ? ' stock-pill--out' : ''}`}>
              {soldOut ? 'Sold out' : `In stock · ${product.stock} ${product.unit}`}
            </span>
          </div>

          <h1>{product.name}</h1>

          <div className="product-rating-row">
            <Stars rating={product.rating} showValue />
            <button type="button" onClick={() => setTab('reviews')}>
              {product.reviewCount} verified reviews
            </button>
            <span className="dot" />
            <span>Sold by {product.sellerName}</span>
          </div>

          <div className="price-panel">
            <div className="price-panel-main">
              <span className="price-largest">{inr(product.price)}</span>
              <span className="price-unit">per {product.unit}</span>
              {product.discountPercent > 0 && (
                <>
                  <span className="price-was">{inr(product.mrp)}</span>
                  <span className="discount-badge">−{product.discountPercent}%</span>
                </>
              )}
            </div>
            <p>Inclusive of all taxes · Demo payment — no bank account connected.</p>
          </div>

          <p className="product-lede">{product.description}</p>

          <div className="product-facts">
            <div>
              <span>Category</span>
              <strong>{category.label}</strong>
            </div>
            <div>
              <span>Pack / unit</span>
              <strong>{product.unit}</strong>
            </div>
            <div>
              <span>Dispatch from</span>
              <strong>{product.location || 'India'}</strong>
            </div>
            <div>
              <span>Seller joined</span>
              <strong>{product.sellerJoined ? dateLabel(product.sellerJoined) : 'Verified'}</strong>
            </div>
          </div>

          <div className="buy-box">
            <div className="quantity-row">
              <span className="filter-title">Quantity</span>
              <div className="quantity-stepper">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(product.stock || 1, value + 1))}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="quantity-total">{inr(Number(product.price) * quantity)}</span>
            </div>
            <div className="buy-actions">
              <button type="button" className="btn btn--forest" onClick={addToCart} disabled={soldOut}>
                <ShoppingBag size={17} /> Add to cart
              </button>
              <button type="button" className="btn btn--gold" onClick={buyNow} disabled={soldOut}>
                Buy now <ArrowUpRight size={16} />
              </button>
            </div>
            <p className="buy-note">
              <ShieldCheck size={14} /> Secure demo checkout · 7-day return window on sealed lots
            </p>
          </div>

          <div className="product-assurances">
            <div>
              <BadgeCheck size={18} />
              <span>
                <strong>Verified seller</strong>
                <small>Documents reviewed before listing</small>
              </span>
            </div>
            <div>
              <Truck size={18} />
              <span>
                <strong>District delivery</strong>
                <small>Usually 3–6 working days</small>
              </span>
            </div>
            <div>
              <Store size={18} />
              <span>
                <strong>Direct from {product.sellerBusiness || product.sellerName}</strong>
                <small>{product.sellerLocation || product.location}</small>
              </span>
            </div>
          </div>

          {fitCrops.length > 0 && (
            <div className="profile-fit">
              <span className="eyebrow eyebrow--gold">Matches your farm profile</span>
              <p>
                This lot is relevant to your {fitCrops.join(', ')} profile in{' '}
                {user?.climate || 'your climate zone'}.
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="product-tabs">
        <div className="tab-bar" role="tablist">
          {['overview', 'details', 'reviews'].map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              className={tab === value ? 'is-active' : ''}
              onClick={() => setTab(value)}
            >
              {value === 'overview' ? 'Overview' : value === 'details' ? 'Lot details' : `Reviews (${product.reviewCount})`}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="tab-panel overview-panel">
            <div>
              <h2>What this lot is for</h2>
              <p>{product.description}</p>
              <p>
                Listed by {product.sellerBusiness || product.sellerName} in{' '}
                {product.sellerLocation || product.location}. Stored and dispatched under the
                seller's declared batch standard, with the lot number printed on the packing
                slip.
              </p>
              <div className="tag-row">
                {(product.tags || []).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <aside className="overview-aside">
              <span className="eyebrow eyebrow--muted">Best for</span>
              <ul className="check-list">
                <li><Check size={15} /> {category.short} requirements</li>
                <li><Check size={15} /> {user?.climate || 'Your climate zone'}</li>
                <li><Check size={15} /> Batch traceability</li>
                <li><Check size={15} /> Verified seller dispatch</li>
              </ul>
              <span className="eyebrow eyebrow--muted">Buyer signal</span>
              <p className="aside-stat">
                <strong>{product.viewCount}</strong> growers viewed this lot ·{' '}
                <strong>{product.rating}</strong> avg rating
              </p>
            </aside>
          </div>
        )}

        {tab === 'details' && (
          <div className="tab-panel">
            <div className="detail-table">
              <div><span>Lot number</span><strong>PF-2026-{String(product.id).padStart(3, '0')}</strong></div>
              <div><span>Department</span><strong>{category.label} ({category.code})</strong></div>
              <div><span>Sub-category</span><strong>{product.subcategory || '—'}</strong></div>
              <div><span>Unit</span><strong>{product.unit}</strong></div>
              <div><span>Available stock</span><strong>{product.stock}</strong></div>
              <div><span>Seller</span><strong>{product.sellerBusiness || product.sellerName}</strong></div>
              <div><span>Seller location</span><strong>{product.sellerLocation || product.location}</strong></div>
              <div><span>Listed on</span><strong>{dateLabel(product.createdAt)}</strong></div>
              <div><span>Dispatch window</span><strong>2–4 working days</strong></div>
              <div><span>Returns</span><strong>7 days, sealed packs</strong></div>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="tab-panel reviews-panel">
            <div className="reviews-summary">
              <span className="review-score">{reviews?.average ?? product.rating}</span>
              <Stars rating={reviews?.average ?? product.rating} size={18} />
              <span className="review-score-copy">
                {reviews?.count ?? product.reviewCount} verified reviews
              </span>
              <div className="review-bars">
                {(reviews?.distribution || []).map((bucket) => {
                  const total = reviews?.count || 1
                  return (
                    <div className="review-bar" key={bucket.stars}>
                      <span>{bucket.stars}★</span>
                      <div className="review-bar-track">
                        <span style={{ width: `${(bucket.count / total) * 100}%` }} />
                      </div>
                      <span>{bucket.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="reviews-main">
              <ReviewForm
                product={product}
                user={user}
                onPublished={(summary) => {
                  setReviews(summary)
                  setProduct((current) => ({
                    ...current,
                    rating: summary.average,
                    reviewCount: summary.count
                  }))
                }}
              />

              <div className="review-list">
                {reviews?.reviews?.length ? (
                  reviews.reviews.map((review) => (
                    <article className="review-item" key={review.id}>
                      <div className="review-item-head">
                        <div>
                          <strong>{review.author}</strong>
                          <span>{timeAgo(review.createdAt)} · Verified buyer</span>
                        </div>
                        <Stars rating={review.rating} size={13} />
                      </div>
                      {review.title && <h4>{review.title}</h4>}
                      <p>{review.body}</p>
                    </article>
                  ))
                ) : (
                  <p className="muted">No reviews yet. Be the first to report back from the field.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {recommendations.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Because you viewed this lot</span>
              <h2>Growers also considered.</h2>
            </div>
            <div className="section-head-side">
              <p>Ranked from co-view patterns, lot similarity and your farm profile.</p>
              <Link className="text-link" to={`/search?category=${product.category}`}>
                More in {category.short} <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
          <div className="product-rail">
            {recommendations.map((item) => (
              <ProductCard key={item.id} product={item} compact />
            ))}
          </div>
        </section>
      )}

      <Link className="back-link" to="/search">
        <ArrowLeft size={15} /> Back to the registry
      </Link>
    </div>
  )
}