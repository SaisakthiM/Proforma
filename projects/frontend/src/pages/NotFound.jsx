import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Compass, Search } from 'lucide-react'
import { CATEGORIES } from '../lib/constants'

export default function NotFound() {
  const location = useLocation()

  return (
    <div className="fallback-page fallback-page--404">
      <div className="fallback-grid">
        <div className="fallback-copy">
          <span className="eyebrow">404 · Page not in the register</span>
          <span className="fallback-code" aria-hidden="true">
            404
          </span>
          <h1>This row was never written.</h1>
          <p>
            The page at <code>{location.pathname}</code> is not part of the Proforma registry.
            It may have been retired when a lot was withdrawn, or the address was typed by hand.
          </p>
          <div className="fallback-actions">
            <Link className="btn btn--forest" to="/">
              <ArrowLeft size={16} /> Back to the home page
            </Link>
            <Link className="btn btn--ghost" to="/search">
              <Search size={16} /> Search the registry
            </Link>
          </div>
          <div className="fallback-links">
            <span className="eyebrow eyebrow--muted">Try a department</span>
            <div>
              {CATEGORIES.map((category) => (
                <Link key={category.value} to={`/search?category=${category.value}`}>
                  {category.code} {category.short} <ArrowRight size={13} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <aside className="fallback-card">
          <span className="fallback-card-seal">
            <Compass size={22} />
          </span>
          <span className="eyebrow eyebrow--muted">Registry note</span>
          <h2>Every listing has a home.</h2>
          <p>
            If a link from a field letter brought you here, the lot has likely sold out or been
            folded into a newer batch. The current catalogue is always one search away.
          </p>
          <dl className="fallback-facts">
            <div>
              <dt>Status</dt>
              <dd>Page not found</dd>
            </div>
            <div>
              <dt>Registry</dt>
              <dd>Live · all departments</dd>
            </div>
            <div>
              <dt>Support</dt>
              <dd>care@proforma.dev</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}