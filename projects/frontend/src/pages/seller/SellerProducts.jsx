import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Plus, Search, Star, TriangleAlert } from 'lucide-react'
import ProductVisual from '../../components/ProductVisual'
import EmptyState, { ErrorNotice } from '../../components/EmptyState'
import { api } from '../../lib/api'
import { CATEGORIES, categoryByValue } from '../../lib/constants'
import { compact, inr } from '../../lib/format'

export default function SellerProducts() {
  const [products, setProducts] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [view, setView] = useState('all')

  useEffect(() => {
    let cancelled = false
    api
      .sellerProducts()
      .then((data) => {
        if (cancelled) return
        setProducts(data)
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

  const filtered = useMemo(() => {
    if (!products) return []
    const needle = query.trim().toLowerCase()
    return products.filter((product) => {
      if (category && product.category !== category) return false
      if (view === 'active' && !product.active) return false
      if (view === 'inactive' && product.active) return false
      if (view === 'low' && product.stock > 10) return false
      if (!needle) return true
      return (
        product.name.toLowerCase().includes(needle) ||
        (product.subcategory || '').toLowerCase().includes(needle)
      )
    })
  }, [products, query, category, view])

  if (status === 'loading') {
    return (
      <div className="studio-page">
        <div className="studio-head">
          <div className="skeleton skeleton-line skeleton-line--short" />
          <div className="skeleton skeleton-line skeleton-line--title" />
        </div>
        <div className="studio-table-skeleton">
          {[0, 1, 2, 3, 4].map((index) => (
            <div className="skeleton skeleton-row" key={index} />
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

  const activeCount = products.filter((product) => product.active).length
  const lowStock = products.filter((product) => product.stock <= 10).length

  return (
    <div className="studio-page">
      <div className="studio-head">
        <div>
          <span className="eyebrow">Seller studio · Listings</span>
          <h1>Your lots.</h1>
          <p>
            {products.length} listing{products.length === 1 ? '' : 's'} · {activeCount} live ·{' '}
            {lowStock} low on stock.
          </p>
        </div>
        <Link className="btn btn--gold" to="/seller/products/new">
          <Plus size={16} /> New listing
        </Link>
      </div>

      <div className="studio-toolbar">
        <label className="studio-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your lots"
          />
        </label>
        <div className="studio-filter-chips">
          <button
            type="button"
            className={`choice-chip${!category ? ' is-active' : ''}`}
            onClick={() => setCategory('')}
          >
            All departments
          </button>
          {CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`choice-chip${category === item.value ? ' is-active' : ''}`}
              onClick={() => setCategory(item.value)}
            >
              {item.code} {item.short}
            </button>
          ))}
        </div>
        <div className="studio-segmented">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Live' },
            { value: 'inactive', label: 'Paused' },
            { value: 'low', label: 'Low stock' }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={view === option.value ? 'is-active' : ''}
              onClick={() => setView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          eyebrow="No listings yet"
          title="Publish your first lot."
          copy="List seed, machinery, tools or soil with stock, images and a dispatch location."
          actionLabel="Create a listing"
          actionTo="/seller/products/new"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          eyebrow="No matches"
          title="Nothing in this cut."
          copy="Clear the search or filters to see the rest of your register."
        />
      ) : (
        <div className="studio-product-list">
          {filtered.map((product) => {
            const categoryInfo = categoryByValue[product.category] || {}
            return (
              <article className="studio-product" key={product.id}>
                <div className="studio-product-media">
                  <ProductVisual product={product} variant="thumb" />
                </div>
                <div className="studio-product-body">
                  <span className="eyebrow eyebrow--muted">
                    {categoryInfo.code} · {product.subcategory || categoryInfo.short}
                  </span>
                  <h3>
                    <Link to={`/product/${product.id}`}>{product.name}</Link>
                  </h3>
                  <div className="studio-product-meta">
                    <span>{inr(product.price)} / {product.unit}</span>
                    <span className="dot" />
                    <span>{compact(product.stock)} in stock</span>
                    <span className="dot" />
                    <span className="studio-rating">
                      <Star size={12} /> {Number(product.rating).toFixed(1)} ({product.reviewCount})
                    </span>
                  </div>
                  <div className="studio-product-badges">
                    <span className={`status-pill status-pill--${product.active ? 'success' : 'neutral'}`}>
                      {product.active ? 'Live' : 'Paused'}
                    </span>
                    {product.featured && <span className="status-pill status-pill--gold">Featured</span>}
                    {product.stock <= 10 && (
                      <span className="status-pill status-pill--danger">
                        <TriangleAlert size={11} /> Low stock
                      </span>
                    )}
                  </div>
                </div>
                <div className="studio-product-side">
                  <div>
                    <span className="eyebrow eyebrow--muted">Views</span>
                    <strong>{compact(product.viewCount)}</strong>
                  </div>
                  <div>
                    <span className="eyebrow eyebrow--muted">Discount</span>
                    <strong>{product.discountPercent > 0 ? `${product.discountPercent}%` : '—'}</strong>
                  </div>
                  <Link className="btn btn--sm btn--ghost" to={`/seller/products/${product.id}/edit`}>
                    Edit <ArrowUpRight size={14} />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}