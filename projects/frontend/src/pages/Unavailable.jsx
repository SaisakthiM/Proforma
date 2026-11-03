import { Link } from 'react-router-dom'
import { ArrowRight, CircleAlert, Clock, RefreshCw, ServerCrash } from 'lucide-react'

const COMPONENTS = [
  { name: 'Catalogue registry', state: 'operational' },
  { name: 'Order settlement', state: 'operational' },
  { name: 'Seller studio', state: 'degraded' },
  { name: 'Media delivery', state: 'operational' }
]

export default function Unavailable() {
  return (
    <div className="fallback-page fallback-page--503">
      <div className="service-banner">
        <span className="service-pulse" />
        <span>Service notice · 503</span>
      </div>

      <div className="fallback-grid">
        <div className="fallback-copy">
          <span className="eyebrow">Temporarily unavailable</span>
          <span className="fallback-code" aria-hidden="true">
            503
          </span>
          <h1>The depot is briefly closed.</h1>
          <p>
            Proforma could not complete that request because a service is restarting or under
            maintenance. Your basket and account are safe — nothing was charged.
          </p>
          <div className="fallback-actions">
            <button
              type="button"
              className="btn btn--forest"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} /> Retry the request
            </button>
            <Link className="btn btn--ghost" to="/">
              Return home <ArrowRight size={15} />
            </Link>
          </div>
          <p className="fallback-hint">
            <Clock size={14} /> Most interruptions clear within a minute. If it persists, write to
            care@proforma.dev.
          </p>
        </div>

        <aside className="fallback-card">
          <span className="fallback-card-seal fallback-card-seal--warn">
            <ServerCrash size={22} />
          </span>
          <span className="eyebrow eyebrow--muted">Service status</span>
          <h2>What is affected.</h2>
          <ul className="service-list">
            {COMPONENTS.map((component) => (
              <li key={component.name}>
                <span>{component.name}</span>
                <span className={`service-state service-state--${component.state}`}>
                  {component.state}
                </span>
              </li>
            ))}
          </ul>
          <div className="service-note">
            <CircleAlert size={15} />
            <p>
              This is a demonstration environment. The status panel is illustrative and does not
              report a live production system.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}