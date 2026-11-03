import { Link } from 'react-router-dom'

export function BrandMark({ size = 44 }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Proforma mark"
    >
      <circle cx="24" cy="24" r="21.4" fill="none" stroke="var(--gold)" strokeWidth="1" />
      <path
        d="M24 38V20.5"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="square"
      />
      <path
        d="M24 21h4.6c4.1 0 6.8-2.4 6.8-6.3 0-3.9-2.7-6.3-6.8-6.3H24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.4"
        strokeLinejoin="miter"
      />
      <path
        d="M24 17.2c-4.9-1.1-7.1-4.2-6.6-8.9 4.9.6 7.5 3.4 6.6 8.9Z"
        fill="var(--gold)"
      />
      <path d="M15.5 38h17" stroke="var(--gold)" strokeWidth="1" />
    </svg>
  )
}

export default function BrandLockup({ to = '/', size = 42, tagline = true, inverse = false }) {
  return (
    <Link className={`brand-lockup${inverse ? ' brand-lockup--inverse' : ''}`} to={to}>
      <BrandMark size={size} />
      <span className="brand-lockup-text">
        <strong>PROFORMA</strong>
        {tagline && <small>LET'S BREAK THE STEREOTYPE, LET'S FARMLINE</small>}
      </span>
    </Link>
  )
}