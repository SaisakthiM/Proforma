import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Loader2,
  Package,
  Save,
  TriangleAlert,
  Upload,
  X
} from 'lucide-react'
import ProductVisual from '../../components/ProductVisual'
import { ErrorNotice } from '../../components/EmptyState'
import { api } from '../../lib/api'
import { CATEGORIES } from '../../lib/constants'
import { useToast } from '../../store/toast'

const BLANK = {
  name: '',
  category: 'SEEDS',
  subcategory: '',
  description: '',
  price: '',
  mrp: '',
  unit: '',
  stock: '0',
  imageUrl: '',
  location: '',
  tags: '',
  featured: false,
  active: true
}

export default function SellerProductEditor() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const push = useToast((state) => state.push)
  const fileRef = useRef(null)

  const [form, setForm] = useState(BLANK)
  const [status, setStatus] = useState(editing ? 'loading' : 'ready')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!editing) return
    let cancelled = false
    api
      .sellerProduct(id)
      .then((product) => {
        if (cancelled) return
        setForm({
          name: product.name || '',
          category: product.category || 'SEEDS',
          subcategory: product.subcategory || '',
          description: product.description || '',
          price: String(product.price ?? ''),
          mrp: product.mrp ? String(product.mrp) : '',
          unit: product.unit || '',
          stock: String(product.stock ?? 0),
          imageUrl: product.imageUrl || '',
          location: product.location || '',
          tags: (product.tags || []).join(', '),
          featured: Boolean(product.featured),
          active: product.active !== false
        })
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
  }, [editing, id])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 6 * 1024 * 1024) {
      setError({ message: 'Images must be 6 MB or smaller.' })
      return
    }
    setUploading(true)
    setError(null)
    try {
      const result = await api.uploadImage(file)
      update('imageUrl', result.url)
      push('Image uploaded', 'success')
    } catch (exception) {
      setError(exception)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function submit(event) {
    event.preventDefault()
    const price = Number(form.price)
    const mrp = form.mrp ? Number(form.mrp) : null
    const issues = []
    if (form.name.trim().length < 3) issues.push('Give the lot a clear name of at least 3 characters.')
    if (form.description.trim().length < 20) issues.push('Write at least a sentence of description.')
    if (!form.unit.trim()) issues.push('Declare the pack or unit — e.g. 4 kg bag.')
    if (!Number.isFinite(price) || price < 1) issues.push('Enter a selling price of at least ₹1.')
    if (mrp !== null && (!Number.isFinite(mrp) || mrp < price)) {
      issues.push('MRP cannot be lower than the selling price.')
    }
    if (issues.length > 0) {
      setError({ message: issues[0] })
      return
    }

    setSaving(true)
    setError(null)
    const payload = {
      name: form.name.trim(),
      category: form.category,
      subcategory: form.subcategory.trim() || null,
      description: form.description.trim(),
      price,
      mrp,
      unit: form.unit.trim(),
      stock: Math.max(0, Number(form.stock) || 0),
      imageUrl: form.imageUrl.trim() || null,
      location: form.location.trim() || null,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      featured: form.featured,
      active: form.active
    }

    try {
      if (editing) {
        await api.updateProduct(id, payload)
        push('Listing updated', 'success')
      } else {
        await api.createProduct(payload)
        push('Listing published', 'success')
      }
      navigate('/seller/products')
    } catch (exception) {
      setError(exception)
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="studio-page">
        <div className="studio-head">
          <div className="skeleton skeleton-line skeleton-line--short" />
          <div className="skeleton skeleton-line skeleton-line--title" />
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

  const previewProduct = {
    name: form.name || 'New lot',
    category: form.category,
    subcategory: form.subcategory || 'Verified lot',
    imageUrl: form.imageUrl
  }

  return (
    <div className="studio-page">
      <div className="studio-head">
        <div>
          <Link className="back-link" to="/seller/products">
            <ArrowLeft size={14} /> All listings
          </Link>
          <span className="eyebrow">Seller studio · {editing ? 'Edit listing' : 'New listing'}</span>
          <h1>{editing ? 'Refine the lot.' : 'Declare a new lot.'}</h1>
          <p>
            Every field here is shown to buyers. Be specific about pack size, stock and dispatch
            origin — vagueness costs conversions.
          </p>
        </div>
      </div>

      <form className="editor-layout" onSubmit={submit} noValidate>
        <div className="editor-main">
          <section className="studio-card">
            <div className="studio-card-head">
              <div>
                <span className="eyebrow eyebrow--muted">Identity</span>
                <h2>What is the lot called?</h2>
              </div>
            </div>
            <div className="form-grid">
              <label className="field field--full">
                <span>Lot name</span>
                <input
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="ADT-45 Certified Paddy Seed"
                  maxLength={180}
                />
              </label>
              <label className="field">
                <span>Department</span>
                <select
                  value={form.category}
                  onChange={(event) => update('category', event.target.value)}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.code} · {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Sub-category</span>
                <input
                  value={form.subcategory}
                  onChange={(event) => update('subcategory', event.target.value)}
                  placeholder="Cereal seed"
                  maxLength={100}
                />
              </label>
              <label className="field field--full">
                <span>Description</span>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  placeholder="Variety, germination, purity, suitability, storage and dispatch notes."
                  maxLength={4000}
                />
              </label>
              <label className="field field--full">
                <span>Tags <span className="field-aside">Comma separated · used for matching</span></span>
                <input
                  value={form.tags}
                  onChange={(event) => update('tags', event.target.value)}
                  placeholder="Paddy, Tropical wet, Certified, 120 days"
                />
              </label>
            </div>
          </section>

          <section className="studio-card">
            <div className="studio-card-head">
              <div>
                <span className="eyebrow eyebrow--muted">Pricing & stock</span>
                <h2>How is it sold?</h2>
              </div>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Selling price (₹)</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => update('price', event.target.value)}
                  placeholder="1450"
                />
              </label>
              <label className="field">
                <span>MRP (₹) <span className="field-aside">Optional</span></span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.mrp}
                  onChange={(event) => update('mrp', event.target.value)}
                  placeholder="1650"
                />
              </label>
              <label className="field">
                <span>Unit / pack</span>
                <input
                  value={form.unit}
                  onChange={(event) => update('unit', event.target.value)}
                  placeholder="4 kg bag"
                  maxLength={40}
                />
              </label>
              <label className="field">
                <span>Stock available</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) => update('stock', event.target.value)}
                  placeholder="120"
                />
              </label>
              <label className="field field--full">
                <span>Dispatch from</span>
                <input
                  value={form.location}
                  onChange={(event) => update('location', event.target.value)}
                  placeholder="Thanjavur, Tamil Nadu"
                  maxLength={160}
                />
              </label>
            </div>
          </section>

          <section className="studio-card">
            <div className="studio-card-head">
              <div>
                <span className="eyebrow eyebrow--muted">Media</span>
                <h2>Show the lot honestly.</h2>
              </div>
            </div>
            <div className="editor-media">
              <div className="editor-media-preview">
                <ProductVisual product={previewProduct} variant="detail" />
              </div>
              <div className="editor-media-controls">
                <p>
                  Upload a JPG, PNG, WEBP or AVIF under 6 MB, or paste an https image link. If no
                  image is added, Proforma uses the department's engraved lot plate.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFile}
                  id="product-image"
                  hidden
                />
                <div className="editor-media-actions">
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                    {uploading ? 'Uploading…' : 'Upload image'}
                  </button>
                  {form.imageUrl && (
                    <button
                      type="button"
                      className="btn btn--sm btn--ghost"
                      onClick={() => update('imageUrl', '')}
                    >
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>
                <label className="field">
                  <span>Image URL</span>
                  <input
                    value={form.imageUrl}
                    onChange={(event) => update('imageUrl', event.target.value)}
                    placeholder="https://… or /media/…"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="studio-card">
            <div className="studio-card-head">
              <div>
                <span className="eyebrow eyebrow--muted">Visibility</span>
                <h2>How should it appear?</h2>
              </div>
            </div>
            <div className="toggle-rows">
              <label className="toggle-row">
                <span>
                  <strong>Live on the storefront</strong>
                  <small>Paused listings remain in the studio but are hidden from buyers.</small>
                </span>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => update('active', event.target.checked)}
                />
              </label>
              <label className="toggle-row">
                <span>
                  <strong>Feature in department rails</strong>
                  <small>Featured lots are eligible for the home page and category highlights.</small>
                </span>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => update('featured', event.target.checked)}
                />
              </label>
            </div>
          </section>

          {error && <ErrorNotice message={error.message} />}

          <div className="editor-actions">
            <Link className="btn btn--ghost" to="/seller/products">
              Cancel
            </Link>
            <button type="submit" className="btn btn--gold" disabled={saving || uploading}>
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish listing'}
            </button>
          </div>
        </div>

        <aside className="editor-aside">
          <div className="studio-card">
            <span className="eyebrow eyebrow--muted">Buyer checklist</span>
            <ul className="check-list">
              <li><Check size={14} /> Variety or model named precisely</li>
              <li><Check size={14} /> Pack size and stock declared</li>
              <li><Check size={14} /> Germination / composition where relevant</li>
              <li><Check size={14} /> Dispatch district filled in</li>
              <li><Check size={14} /> Honest, recent image</li>
            </ul>
          </div>
          <div className="studio-card studio-card--warn">
            <TriangleAlert size={17} />
            <div>
              <strong>Listing integrity</strong>
              <p>
                Misdeclared lots can be paused after audit. Returns on sealed lots run for seven
                days from delivery.
              </p>
            </div>
          </div>
          <div className="studio-card">
            <Package size={17} />
            <div>
              <strong>Need a reminder?</strong>
              <p>
                Drafts are not saved automatically. Keep a copy of long descriptions before you
                navigate away.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}