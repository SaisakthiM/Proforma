import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  ShoppingBag,
  Store,
  X
} from 'lucide-react'
import BrandLockup from '../../components/BrandMark'
import { useAuth } from '../../store/auth'

const NAV = [
  { to: '/seller', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/seller/products', label: 'Listings', icon: Package },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/seller/analytics', label: 'Analytics', icon: BarChart3 }
]

export default function SellerLayout() {
  const navigate = useNavigate()
  const user = useAuth((state) => state.user)
  const logout = useAuth((state) => state.logout)
  const [open, setOpen] = useState(false)

  function signOut() {
    logout()
    navigate('/')
  }

  return (
    <div className={`seller-shell${open ? ' is-open' : ''}`}>
      <aside className="seller-sidebar">
        <div className="seller-brand">
          <BrandLockup inverse size={38} />
          <span className="eyebrow eyebrow--gold">Seller studio</span>
        </div>

        <nav className="seller-nav">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'is-active' : '')}
                onClick={() => setOpen(false)}
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <Link className="seller-new" to="/seller/products/new" onClick={() => setOpen(false)}>
          <Plus size={16} /> New listing
        </Link>

        <div className="seller-shop">
          <span className="eyebrow eyebrow--gold">Storefront</span>
          <h4>{user?.businessName || user?.name}</h4>
          <p>{user?.district}, {user?.state}</p>
          <Link to="/" className="text-link text-link--light">
            View marketplace <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="seller-sidebar-foot">
          <div className="seller-identity">
            <span>{user?.name?.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
          </div>
          <button type="button" onClick={signOut}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <div className="seller-main">
        <header className="seller-topbar">
          <button
            type="button"
            className="seller-menu"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle studio menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="seller-topbar-title">
            <span className="eyebrow">Verified seller</span>
            <strong>
              <Store size={15} /> {user?.businessName || 'Proforma studio'}
            </strong>
          </div>
          <Link className="btn btn--sm btn--ghost" to="/seller/products/new">
            <Plus size={14} /> List a product
          </Link>
        </header>

        <main className="seller-content">
          <Outlet />
        </main>

        <footer className="seller-footer">
          <span>© 2026 Proforma seller studio · Demo environment</span>
          <span>Payments simulated · no bank account connected</span>
        </footer>
      </div>
    </div>
  )
}