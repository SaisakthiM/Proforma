import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import EmptyState, { ErrorNotice } from '../components/EmptyState'
import Stars from '../components/Stars'
import { api } from '../lib/api'
import { CATEGORIES, SORT_OPTIONS, categoryByValue } from '../lib/constants'
import { inr } from '../lib/format'

const PAGE_SIZE = 12

function Filters({ params, categories, update, clear }) {
  const category = params.get('category') || ''
  const minRating = params.get('minRating') || ''
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '')

  useEffect(() => {
    setMinPrice(params.get('minPrice') || '')
    setMaxPrice(params.get('maxPrice') || '')
  }, [params.toString()])

  function applyRange(event) {
    event.preventDefault()
    update({ minPrice, maxPrice })
  }

  return (
    <aside className="filters">
      <div className="filters-head">
        <span>
          <SlidersHorizontal size={15} /> Refine
        </span>
        <button type="button" onClick={clear}>
          Reset
        </button>
      </div>

      <div className="filter-group">
        <span className="filter-title">Department</span>
        <button
          type="button"
          className={`filter-option${!category ? ' is-active' : ''}`}
          onClick={() => update({ category: '' })}
        >
          <span>All listings</span>
          <span>{categories.reduce((total, item) => total + (item.count || 0), 0)}</span>
        </button>
        {CATEGORIES.map((item) => {
          const fromApi = categories.find((categoryItem) => categoryItem.value === item.value)
          return (
            <button
              key={item.value}
              type="button"
              className={`filter-option${category === item.value ? ' is-active' : ''}`}
              onClick={() => update({ category: item.value })}
            >
              <span>
                <small>{item.code}</small> {item.short}
              </span>
              <span>{fromApi?.count ?? '—'}</span>
            </button>
          )
        })}
      </div>

      <div className="filter-group">
        <span className="filter-title">Price range (₹)</span>
        <form className="price-range" onSubmit={applyRange}>
          <label>
            <span>Min</span>
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="0"
            />
          </label>
          <span className="price-range-dash">—</span>
          <label>
            <span>Max</span>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Any"
            />
          </label>
          <button type="submit" className="btn btn--sm btn--ghost">
            Apply
          </button>
        </form>
      </div>

      <div className="filter-group">
        <span className="filter-title">Customer rating</span>
        {['', '4', '3'].map((value) => (
          <button
            key={value || 'any'}
            type="button"
            className={`filter-option filter-option--rating${minRating === value ? ' is-active' : ''}`}
            onClick={() => update({ minRating: value })}
          >
            {value ? (
              <>
                <Stars rating={Number(value)} size={12} />
                <span>{value} &amp; above</span>
              </>
            ) : (
              <span>Any rating</span>
            )}
          </button>
        ))}
      </div>

      <div className="filter-note">
        <span className="eyebrow eyebrow--muted">Buyer note</span>
        <p>Every listing is held to the same seller and batch standard.</p>
      </div>
    </aside>
  )
}

function Chip({ label, onRemove }) {
  return (
    <button type="button" className="filter-chip" onClick={onRemove}>
      {label} <X size={12} />
    </button>
  )
}

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  const query = params.get('q') || ''
  const category = params.get('category') || ''
  const sort = params.get('sort') || 'relevance'
  const page = Number(params.get('page') || 0)
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const minRating = params.get('minRating') || ''

  function update(patch, resetPage = true) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key)
      else next.set(key, value)
    })
    if (resetPage) next.delete('page')
    setParams(next)
  }

  function clear() {
    setParams(new URLSearchParams())
  }

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError('')
    api
      .products({ q: query, category, sort, page, size: PAGE_SIZE, minPrice, maxPrice, minRating })
      .then((data) => {
        if (!cancelled) {
          setResult(data)
          setStatus('ready')
        }
      })
      .catch((exception) => {
        if (!cancelled) {
          setError(exception.message)
          setStatus('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [params.toString(), refresh])

  const categoryMeta = categoryByValue[category]
  const heading = query
    ? `Results for “${query}”`
    : categoryMeta
      ? categoryMeta.label
      : 'The full registry'
  const subtitle = query
    ? 'Searching every verified lot across the four departments.'
    : categoryMeta
      ? categoryMeta.copy
      : 'All verified seed, machinery, tools and soil inputs in one index.'

  const activeChips = []
  if (query) activeChips.push({ key: 'q', label: `Search: ${query}` })
  if (categoryMeta) activeChips.push({ key: 'category', label: categoryMeta.short })
  if (minPrice) activeChips.push({ key: 'minPrice', label: `From ${inr(minPrice)}` })
  if (maxPrice) activeChips.push({ key: 'maxPrice', label: `Up to ${inr(maxPrice)}` })
  if (minRating) activeChips.push({ key: 'minRating', label: `${minRating}★ & up` })

  return (
    <div className="catalog-page">
      <div className="page-intro">
        <span className="eyebrow">Registry index · Proforma</span>
        <h1>{heading}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="catalog-layout">
        <Filters params={params} categories={categories} update={update} clear={clear} />

        <section className="results">
          <div className="results-toolbar">
            <div>
              <strong>{result ? result.totalElements : '—'}</strong>
              <span> listings</span>
              {activeChips.length > 0 && (
                <div className="filter-chips">
                  {activeChips.map((chip) => (
                    <Chip
                      key={chip.key}
                      label={chip.label}
                      onRemove={() => update({ [chip.key]: '' })}
                    />
                  ))}
                </div>
              )}
            </div>
            <label className="sort-select">
              <span>Sort</span>
              <select value={sort} onChange={(event) => update({ sort: event.target.value })}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {status === 'error' && (
            <ErrorNotice
              message={error}
              onRetry={() => setRefresh((value) => value + 1)}
            />
          )}

          {status === 'loading' && (
            <div className="product-grid product-grid--catalog">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="skeleton-card" key={index}>
                  <div className="skeleton skeleton-media" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line skeleton-line--short" />
                </div>
              ))}
            </div>
          )}

          {status === 'ready' && result && result.content.length === 0 && (
            <EmptyState
              eyebrow="No lots match"
              title="This part of the registry is empty."
              copy="Try a wider search, remove a filter, or browse the four departments from the index."
              actionLabel="Clear filters"
              actionTo="/search"
            />
          )}

          {status === 'ready' && result && result.content.length > 0 && (
            <>
              <div className="product-grid product-grid--catalog">
                {result.content.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {result.totalPages > 1 && (
                <nav className="pagination" aria-label="Catalog pages">
                  <button
                    type="button"
                    className="pagination-arrow"
                    disabled={page === 0}
                    onClick={() => update({ page: String(Math.max(0, page - 1)) }, false)}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <div className="pagination-pages">
                    {Array.from({ length: result.totalPages }).map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        className={index === page ? 'is-active' : ''}
                        onClick={() => update({ page: index === 0 ? '' : String(index) }, false)}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="pagination-arrow"
                    disabled={page >= result.totalPages - 1}
                    onClick={() => update({ page: String(page + 1) }, false)}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      <div className="catalog-footer-note">
        <span className="eyebrow eyebrow--muted">Looking for a specific lot?</span>
        <p>
          Search by crop, district or batch. Need help choosing?{' '}
          <Link to="/about">Read how the register is built.</Link>
        </p>
      </div>
    </div>
  )
}