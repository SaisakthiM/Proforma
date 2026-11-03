import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Headphones,
  Layers,
  MapPin,
  Sprout,
  Tractor,
  Truck,
  Wrench
} from 'lucide-react'
import ProductCard from '../components/ProductCard'
import ProductVisual from '../components/ProductVisual'
import { ErrorNotice } from '../components/EmptyState'
import { api } from '../lib/api'
import { CATEGORIES } from '../lib/constants'
import { inr } from '../lib/format'
import { useAuth } from '../store/auth'

const CATEGORY_ICONS = {
  SEEDS: Sprout,
  MACHINERY: Tractor,
  TOOLS: Wrench,
  SOILS: Layers
}

const TRUST = [
  { icon: BadgeCheck, title: 'Verified sellers', copy: 'Every seller is reviewed before a single listing goes live.' },
  { icon: Sprout, title: 'Lot-tested inputs', copy: 'Germination, purity and batch details are declared up front.' },
  { icon: Truck, title: 'District delivery', copy: 'Dispatch windows and pickup points shown before checkout.' },
  { icon: Headphones, title: 'Agronomy support', copy: 'Guidance matched to your crop, soil and climate zone.' }
]

function SectionHead({ eyebrow, title, copy, action, actionTo }) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="section-head-side">
        {copy && <p>{copy}</p>}
        {action && actionTo && (
          <Link className="text-link" to={actionTo}>
            {action} <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  )
}

function SkeletonCards({ count = 4 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton skeleton-media" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line skeleton-line--short" />
          <div className="skeleton skeleton-line skeleton-line--tiny" />
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const location = useLocation()
  const user = useAuth((state) => state.user)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [data, setData] = useState({
    categories: CATEGORIES.map((category) => ({ ...category, count: 0 })),
    featured: [],
    offers: [],
    recommendations: [],
    rails: []
  })

  async function load() {
    setStatus('loading')
    setError('')
    try {
      const [categories, featured, offers, recommendations, ...rails] = await Promise.all([
        api.categories(),
        api.featured(8),
        api.offers(),
        api.recommendationsForMe(),
        ...CATEGORIES.map((category) =>
          api.products({ category: category.value, size: 4, sort: 'popular' })
        )
      ])
      setData({
        categories,
        featured,
        offers,
        recommendations,
        rails: rails.map((page, index) => ({
          category: CATEGORIES[index],
          products: page.content
        }))
      })
      setStatus('ready')
    } catch (exception) {
      setError(exception.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (status === 'ready' && location.hash === '#offers') {
      const element = document.getElementById('offers')
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [status, location.hash])

  useEffect(() => {
    api.recommendationsForMe().then((recommendations) => {
      setData((current) => ({ ...current, recommendations }))
    }).catch(() => {})
  }, [user?.id])

  const result = data
  const heroOffer = result.offers[0]
  const greeting = user?.name ? user.name.split(' ')[0] : null

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span className="hero-rule" />
            The farm supply registry · Edition 01
          </span>
          <h1>
            Good inputs.
            <br />
            <em>Better harvests.</em>
          </h1>
          <p className="hero-lede">
            Verified seed, machinery, tools and soil nutrition — curated for your ground,
            your climate and the crop in front of you.
          </p>
          <div className="hero-actions">
            <Link className="btn btn--forest" to="/search">
              Shop the registry <ArrowRight size={17} />
            </Link>
            <Link className="btn btn--ghost" to="/about">
              How we verify <ArrowUpRight size={16} />
            </Link>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>Verified listings</dt>
              <dd>{result.categories.reduce((total, item) => total + (item.count || 0), 0) || '40'}+</dd>
            </div>
            <div>
              <dt>Departments</dt>
              <dd>04</dd>
            </div>
            <div>
              <dt>Seller standard</dt>
              <dd>100%</dd>
            </div>
            <div>
              <dt>Est.</dt>
              <dd>2026</dd>
            </div>
          </dl>
        </div>

        <div className="hero-visual">
          <img src="/media/hero-harvest.png" alt="Paper, wheat and brass tools arranged in a Proforma still life" />
          <span className="hero-edition">Edition 01 / Kharif 2026</span>
          {heroOffer && heroOffer.product && (
            <Link className="hero-offer" to={`/product/${heroOffer.product.id}`}>
              <span className="eyebrow eyebrow--gold">Featured offer</span>
              <strong>{heroOffer.product.name}</strong>
              <span className="hero-offer-price">
                {inr(heroOffer.product.price)}
                {heroOffer.discountPercent > 0 && <b>−{heroOffer.discountPercent}%</b>}
              </span>
              <span className="hero-offer-link">
                View the lot <ArrowUpRight size={14} />
              </span>
            </Link>
          )}
          <span className="hero-side-note">PROFORMA · UNIT OF IDEA 2 IMPACT</span>
          <span className="hero-corner hero-corner--tl" />
          <span className="hero-corner hero-corner--br" />
        </div>
      </section>

      <section className="trust-strip" aria-label="Proforma standards">
        {TRUST.map((item) => {
          const Icon = item.icon
          return (
            <div className="trust-item" key={item.title}>
              <Icon size={20} strokeWidth={1.5} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.copy}</span>
              </div>
            </div>
          )
        })}
      </section>

      {status === 'error' && (
        <div className="section">
          <ErrorNotice message={error} onRetry={load} />
        </div>
      )}

      <section className="section section--categories" id="categories">
        <SectionHead
          eyebrow="Registry index"
          title="Four departments. One standard."
          copy="Each department is a curated register of inputs, indexed and checked before it reaches your field."
          action="Browse the full catalog"
          actionTo="/search"
        />
        {status === 'loading' ? (
          <div className="category-grid">
            {CATEGORIES.map((category) => (
              <div className="skeleton skeleton-category" key={category.value} />
            ))}
          </div>
        ) : (
          <div className="category-grid">
            {result.categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.value] || Sprout
              const meta = CATEGORIES.find((item) => item.value === category.value) || category
              return (
                <Link
                  key={category.value}
                  to={`/search?category=${category.value}`}
                  className="category-tile"
                >
                  <span className="category-code">{category.code}</span>
                  <Icon className="category-icon" size={46} strokeWidth={1.1} />
                  <h3>{category.label}</h3>
                  <p>{meta.copy}</p>
                  <div className="category-foot">
                    <span>{category.count} verified listings</span>
                    <ArrowUpRight size={17} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {status === 'ready' && result.offers.length > 0 && (
        <section className="section section--offers" id="offers">
          <SectionHead
            eyebrow="Today's offers"
            title="Lots worth acting on now."
            copy="Seasonal pricing from verified sellers, with the discount and the batch declared together."
            action="See all listings"
            actionTo="/search?sort=popular"
          />
          <div className="offer-grid">
            {result.offers.map((offer) => (
              <Link
                key={offer.code}
                className="offer-card"
                to={offer.product ? `/product/${offer.product.id}` : '/search'}
              >
                <div className="offer-top">
                  <span className="offer-code">{offer.code}</span>
                  <span className="offer-discount">
                    {offer.discountPercent > 0 ? `−${offer.discountPercent}%` : 'Curated'}
                  </span>
                </div>
                <h3>{offer.title}</h3>
                <p>{offer.subtitle}</p>
                {offer.product && (
                  <div className="offer-product">
                    <ProductVisual product={offer.product} variant="thumb" />
                    <div>
                      <strong>{offer.product.name}</strong>
                      <span>
                        {inr(offer.product.price)} / {offer.product.unit}
                      </span>
                    </div>
                  </div>
                )}
                <span className="text-link">
                  Claim this lot <ArrowUpRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {status === 'loading' && (
        <section className="section">
          <SectionHead eyebrow="Curated by category" title="The catalog, opened." />
          <SkeletonCards count={4} />
        </section>
      )}

      {status === 'ready' &&
        result.rails.map(({ category, products }) =>
          products.length ? (
            <section className={`section rail-band rail-band--${category.slug}`} key={category.value}>
              <SectionHead
                eyebrow={`${category.code} · ${category.label}`}
                title={
                  category.value === 'SEEDS'
                    ? 'Start with the right seed.'
                    : category.value === 'MACHINERY'
                      ? 'Machinery that earns its keep.'
                      : category.value === 'TOOLS'
                        ? 'Tools that survive the season.'
                        : 'Feed the soil first.'
                }
                copy={category.copy}
                action={`All ${category.short.toLowerCase()}`}
                actionTo={`/search?category=${category.value}`}
              />
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ) : null
        )}

      {status === 'ready' && result.recommendations.length > 0 && (
        <section className="section section--recommendations">
          <SectionHead
            eyebrow={greeting ? `Selected for ${greeting}` : 'Field intelligence'}
            title={greeting ? 'Matched to your ground.' : 'What growers are buying.'}
            copy={
              user
                ? `Based on your ${(user.crops || []).slice(0, 3).join(', ') || 'crop profile'}, ${
                    user.climate || 'climate zone'
                  } and district-level buying patterns.`
                : 'A live read on the lots moving across the registry this week.'
            }
            action={user ? 'Refine your profile' : 'Create a farm profile'}
            actionTo={user ? '/account' : '/register'}
          />
          <div className="product-rail">
            {result.recommendations.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </section>
      )}

      <section className="editorial">
        <div className="editorial-media">
          <img src="/media/field-story.png" alt="A farmer holding grain over dark soil" />
          <span className="editorial-caption">Field notes · Palakkad, Kerala</span>
        </div>
        <div className="editorial-copy">
          <span className="eyebrow">Why Proforma exists</span>
          <h2>The recommendation is the product.</h2>
          <p>
            A good input in the wrong field is a wasted season. Proforma starts with your
            farm profile — crops, climate, irrigation and district — then ranks the
            registry against your ground, not against a banner ad.
          </p>
          <ol className="editorial-steps">
            <li>
              <span>01</span>
              <div>
                <strong>Tell us your ground</strong>
                <p>Crops, climate, soil and water. Three minutes, once.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>We match the register</strong>
                <p>Signals from your profile, reviews and district buying patterns.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Buy with the batch in view</strong>
                <p>Seller, lot, price and delivery window on every listing.</p>
              </div>
            </li>
          </ol>
          <Link className="btn btn--forest" to={user ? '/account' : '/register'}>
            {user ? 'Review your farm profile' : 'Build your farm profile'} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="seller-band">
        <div className="seller-band-inner">
          <div>
            <span className="eyebrow eyebrow--gold">For sellers &amp; farm businesses</span>
            <h2>Your harvest deserves a storefront.</h2>
            <p>
              List verified inputs, publish your location and price, and see exactly which
              districts are buying. No listing fee in the demo.
            </p>
          </div>
          <div className="seller-band-actions">
            <Link className="btn btn--gold" to={user?.role === 'SELLER' ? '/seller' : '/register?role=SELLER'}>
              {user?.role === 'SELLER' ? 'Open seller studio' : 'Become a seller'} <ArrowRight size={16} />
            </Link>
            <Link className="btn btn--onDark" to="/about">
              Read the standard
            </Link>
            <div className="seller-band-points">
              <span><MapPin size={14} /> 4 verified sellers</span>
              <span><BadgeCheck size={14} /> Listing review included</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}