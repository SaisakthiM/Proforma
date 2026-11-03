import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  Store,
  UserRound,
  X
} from 'lucide-react'
import BrandLockup from './BrandMark'
import { CATEGORIES } from '../lib/constants'
import { cartCount, useCart } from '../store/cart'
import { useAuth } from '../store/auth'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuth((state) => state.user)
  const logout = useAuth((state) => state.logout)
  const count = useCart(cartCount)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
    setAccountOpen(false)
  }, [location.pathname, location.search])

  function submitSearch(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (category) params.set('category', category)
    navigate(`/search?${params.toString()}`)
  }

  function signOut() {
    logout()
    navigate('/')
  }

  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="utility-inner">
          <span className="utility-tag">LET'S BREAK THE STEREOTYPE, LET'S FARMLINE</span>
          <div className="utility-links">
            <span>Ships across India</span>
            <Link to="/about">Our standards</Link>
            <Link to="/account">Track order</Link>
            <span className="utility-demo">Demo marketplace</span>
          </div>
        </div>
      </div>

      <div className="masthead">
        <div className="masthead-inner">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <BrandLockup />

          <form className="search-bar" onSubmit={submitSearch} role="search">
            <label className="search-select">
              <span className="sr-only">Department</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">All departments</option>
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.short}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search seeds, machinery, tools, soils…"
              aria-label="Search the catalog"
            />
            <button type="submit" className="search-submit" aria-label="Search">
              <Search size={18} />
            </button>
          </form>

          <div className="header-actions">
            <div className="account-menu">
              <button
                type="button"
                className="account-trigger"
                onClick={() => setAccountOpen((open) => !open)}
              >
                <UserRound size={18} />
                <span>
                  <small>{user ? `Hello, ${user.name.split(' ')[0]}` : 'Account'}</small>
                  <strong>{user ? 'Your registry' : 'Sign in'}</strong>
                </span>
                <ChevronDown size={13} />
              </button>
              {accountOpen && (
                <div className="account-dropdown">
                  {user ? (
                    <>
                      <div className="account-summary">
                        <span className="eyebrow eyebrow--muted">{user.role} account</span>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                      <Link to="/account">
                        <UserRound size={15} /> Account &amp; orders
                      </Link>
                      {user.role === 'SELLER' && (
                        <Link to="/seller">
                          <Store size={15} /> Seller studio
                        </Link>
                      )}
                      <button type="button" onClick={signOut}>
                        <LogOut size={15} /> Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="btn btn--forest btn--full">
                        Sign in
                      </Link>
                      <Link to="/register" className="dropdown-link">
                        New to Proforma? Create an account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link to="/cart" className="cart-trigger">
              <span className="cart-icon">
                <ShoppingBag size={19} />
                {count > 0 && <b className="cart-count">{count}</b>}
              </span>
              <span className="cart-label">
                <small>Basket</small>
                <strong>{count > 0 ? `${count} item${count > 1 ? 's' : ''}` : 'Empty'}</strong>
              </span>
            </Link>
          </div>
        </div>
      </div>

      <nav className={`category-nav${mobileOpen ? ' is-open' : ''}`}>
        <div className="nav-inner">
          <Link to="/search" className="nav-all">
            Shop all
          </Link>
          {CATEGORIES.map((item) => (
            <Link
              key={item.value}
              to={`/search?category=${item.value}`}
              className="nav-category"
            >
              <span className="nav-code">{item.code}</span>
              {item.short}
            </Link>
          ))}
          <Link to="/#offers" className="nav-offer">
            Today's offers
          </Link>
          <Link to="/about">About</Link>
          <Link to={user?.role === 'SELLER' ? '/seller' : '/register?role=SELLER'} className="nav-sell">
            {user?.role === 'SELLER' ? 'Seller studio' : 'Sell on Proforma'}
          </Link>
          <span className="nav-note">Verified sellers only</span>
        </div>
      </nav>
    </header>
  )
}