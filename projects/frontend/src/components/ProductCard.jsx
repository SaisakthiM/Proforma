import { Link } from 'react-router-dom'
import { ArrowUpRight, Plus } from 'lucide-react'
import ProductVisual from './ProductVisual'
import Stars from './Stars'
import { api } from '../lib/api'
import { inr } from '../lib/format'
import { categoryByValue } from '../lib/constants'
import { useCart } from '../store/cart'
import { useToast } from '../store/toast'

export default function ProductCard({ product, compact = false }) {
  const add = useCart((state) => state.add)
  const push = useToast((state) => state.push)
  const category = categoryByValue[product.category] || {}
  const soldOut = product.stock <= 0

  function handleAdd(event) {
    event.preventDefault()
    event.stopPropagation()
    if (soldOut) return
    add(product, 1)
    push(`${product.name} added to cart`, 'success')
    api.recordEvent(product.id, 'CART').catch(() => {})
  }

  return (
    <article className={`product-card${compact ? ' product-card--compact' : ''}`}>
      <Link to={`/product/${product.id}`} className="product-card-media">
        <ProductVisual product={product} />
        {product.discountPercent > 0 && (
          <span className="product-card-discount">−{product.discountPercent}%</span>
        )}
        {soldOut && <span className="product-card-sold">Sold out</span>}
      </Link>
      <div className="product-card-body">
        <span className="eyebrow eyebrow--muted">
          {category.code || 'PF'} · {product.subcategory || category.short}
        </span>
        <h3 className="product-card-title">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="product-card-rating">
          <Stars rating={product.rating} count={product.reviewCount} size={13} />
        </div>
        <div className="product-card-price">
          <span className="price">{inr(product.price)}</span>
          {product.mrp && Number(product.mrp) > Number(product.price) && (
            <span className="price-was">{inr(product.mrp)}</span>
          )}
          <span className="price-unit">/ {product.unit}</span>
        </div>
        <div className="product-card-meta">
          <span>{product.location || 'Verified seller'}</span>
          <span className="dot" />
          <span>{product.sellerBusiness || product.sellerName}</span>
        </div>
        <div className="product-card-actions">
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={handleAdd}
            disabled={soldOut}
          >
            <Plus size={14} />
            {soldOut ? 'Unavailable' : 'Add to cart'}
          </button>
          <Link to={`/product/${product.id}`} className="icon-link" aria-label={`View ${product.name}`}>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  )
}