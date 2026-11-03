import { Star } from 'lucide-react'

export default function Stars({ rating = 0, count, size = 14, showValue = false }) {
  const percent = Math.max(0, Math.min(100, (Number(rating) / 5) * 100))
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      <span className="stars-track" style={{ '--star-size': `${size}px` }}>
        <span className="stars-row stars-row--empty">
          {[0, 1, 2, 3, 4].map((index) => (
            <Star key={index} size={size} strokeWidth={1.4} />
          ))}
        </span>
        <span className="stars-row stars-row--filled" style={{ width: `${percent}%` }}>
          {[0, 1, 2, 3, 4].map((index) => (
            <Star key={index} size={size} strokeWidth={1.4} fill="currentColor" />
          ))}
        </span>
      </span>
      {showValue && <span className="stars-value">{Number(rating).toFixed(1)}</span>}
      {count !== undefined && <span className="stars-count">({count})</span>}
    </span>
  )
}