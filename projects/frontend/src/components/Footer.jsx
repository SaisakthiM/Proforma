import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail } from 'lucide-react'
import BrandLockup from './BrandMark'
import { CATEGORIES } from '../lib/constants'
import { useToast } from '../store/toast'

export default function Footer() {
  const [email, setEmail] = useState('')
  const push = useToast((state) => state.push)

  function subscribe(event) {
    event.preventDefault()
    if (!email.includes('@')) {
      push('Enter a valid email to join the field letter', 'danger')
      return
    }
    push('You are on the list. Field notes arrive monthly.', 'success')
    setEmail('')
  }

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <BrandLockup inverse size={48} />
          <p>
            A verified farm-supply registry connecting growers with the seed, machinery,
            tools and soil inputs that actually fit their ground.
          </p>
          <div className="footer-mark">
            <img src="/brand/proforma-logo.png" alt="Proforma brand mark" />
            <div>
              <span className="eyebrow eyebrow--gold">The mark</span>
              <strong>Grown from a single idea.</strong>
              <span>Unit of Idea 2 Impact · Est. 2026</span>
            </div>
          </div>
        </div>

        <div className="footer-column">
          <span className="footer-heading">Shop the registry</span>
          {CATEGORIES.map((item) => (
            <Link key={item.value} to={`/search?category=${item.value}`}>
              {item.code} {item.short}
            </Link>
          ))}
          <Link to="/search">All listings</Link>
        </div>

        <div className="footer-column">
          <span className="footer-heading">Proforma</span>
          <Link to="/about">About us</Link>
          <Link to="/about#standards">Seller standards</Link>
          <Link to="/register?role=SELLER">Sell with us</Link>
          <Link to="/account">Orders &amp; account</Link>
          <Link to="/503">Service status</Link>
        </div>

        <div className="footer-column footer-column--wide">
          <span className="footer-heading">Field letter</span>
          <p className="footer-copy">
            One considered email a month: sowing windows, input checks, and new lots
            from verified sellers.
          </p>
          <form className="footer-subscribe" onSubmit={subscribe}>
            <Mail size={16} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@farm.in"
              aria-label="Email address"
            />
            <button type="submit">
              Join <ArrowUpRight size={14} />
            </button>
          </form>
          <div className="footer-contact">
            <span>Support · 9am–7pm IST</span>
            <a href="mailto:care@proforma.dev">care@proforma.dev</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Proforma. Unit of Idea 2 Impact.</span>
        <span>Payments are simulated in this demo. No bank account is connected.</span>
        <div>
          <Link to="/about">Privacy</Link>
          <Link to="/about">Terms</Link>
          <span>Made for the field.</span>
        </div>
      </div>
    </footer>
  )
}