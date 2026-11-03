import { Link } from 'react-router-dom'
import { ArrowRight, RefreshCw } from 'lucide-react'

export default function EmptyState({ eyebrow = 'Nothing here yet', title, copy, actionLabel, actionTo, children }) {
  return (
    <div className="empty-state">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
      {actionLabel && actionTo && (
        <Link className="btn btn--forest" to={actionTo}>
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      )}
      {children}
    </div>
  )
}

export function ErrorNotice({ title = 'The depot could not be reached', message, onRetry }) {
  return (
    <div className="error-notice">
      <span className="eyebrow eyebrow--danger">Service notice</span>
      <h3>{title}</h3>
      <p>{message || 'Something interrupted the request. Try again in a moment.'}</p>
      {onRetry && (
        <button type="button" className="btn btn--sm btn--ghost" onClick={onRetry}>
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  )
}