import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  Leaf,
  MapPin,
  Sprout,
  Store,
  Truck
} from 'lucide-react'
import BrandLockup from '../components/BrandMark'
import { api } from '../lib/api'
import { DEMO_ACCOUNTS } from '../lib/constants'
import { useAuth } from '../store/auth'
import { useToast } from '../store/toast'

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setSession = useAuth((state) => state.setSession)
  const push = useToast((state) => state.push)

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const next = params.get('next')
  const intent = params.get('role')

  function destinationFor(user) {
    if (next) return next
    if (intent === 'SELLER' && user.role === 'SELLER') return '/seller'
    if (user.role === 'SELLER') return '/seller'
    return '/'
  }

  async function signIn(event) {
    if (event) event.preventDefault()
    setStatus('saving')
    setError(null)
    try {
      const session = await api.login({
        email: form.email.trim(),
        password: form.password
      })
      setSession(session)
      push(`Welcome back, ${session.user.name.split(' ')[0]}`, 'success')
      navigate(destinationFor(session.user), { replace: true })
    } catch (exception) {
      setError(exception)
      setStatus('idle')
    }
  }

  function useDemo(account) {
    setForm({ email: account.email, password: account.password })
    setError(null)
    setStatus('saving')
    api
      .login({ email: account.email, password: account.password })
      .then((session) => {
        setSession(session)
        push(`Signed in as ${session.user.name}`, 'success')
        navigate(destinationFor(session.user), { replace: true })
      })
      .catch((exception) => {
        setError(exception)
        setStatus('idle')
      })
  }

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <BrandLockup inverse size={46} />
        <div className="auth-aside-copy">
          <span className="eyebrow eyebrow--gold">The grower's register</span>
          <h2>Fit the input to the ground, not the other way round.</h2>
          <p>
            Sign in to keep your farm profile, recommendations, basket and order history in one
            place — reviewed for your crops, climate and district.
          </p>
        </div>
        <div className="auth-proof">
          <div>
            <BadgeCheck size={17} />
            <span>
              <strong>Verified sellers</strong>
              <small>Documents reviewed before listing</small>
            </span>
          </div>
          <div>
            <Sprout size={17} />
            <span>
              <strong>Profile-led recommendations</strong>
              <small>Crop, soil and climate matched</small>
            </span>
          </div>
          <div>
            <Truck size={17} />
            <span>
              <strong>District delivery</strong>
              <small>Dispatch windows shown up front</small>
            </span>
          </div>
        </div>
        <div className="auth-stat-strip">
          <div>
            <strong>500+</strong>
            <span>farms registered</span>
          </div>
          <div>
            <strong>36</strong>
            <span>districts served</span>
          </div>
          <div>
            <strong>4.8</strong>
            <span>avg lot rating</span>
          </div>
        </div>
      </aside>

      <section className="auth-main">
        <div className="auth-form-wrap">
          <span className="eyebrow">Sign in · Proforma account</span>
          <h1>Open your registry.</h1>
          <p className="auth-lede">
            New here? <Link to={`/register${intent === 'SELLER' ? '?role=SELLER' : ''}`}>Create an account</Link>{' '}
            and answer three short questions about your farm.
          </p>

          <form className="auth-form" onSubmit={signIn} noValidate>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@farm.in"
                autoComplete="email"
                required
              />
            </label>

            <label className="field">
              <span>
                Password
                <span className="field-aside">Minimum 8 characters</span>
              </span>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <p className="form-error" role="alert">
                {error.message}
              </p>
            )}

            <button type="submit" className="btn btn--forest btn--full" disabled={status === 'saving'}>
              {status === 'saving' ? 'Opening registry…' : 'Sign in'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="demo-access">
            <span className="eyebrow eyebrow--muted">Demo access</span>
            <div className="demo-access-grid">
              <button type="button" onClick={() => useDemo(DEMO_ACCOUNTS.buyer)}>
                <Leaf size={16} />
                <span>
                  <strong>Buyer demo</strong>
                  <small>{DEMO_ACCOUNTS.buyer.email}</small>
                </span>
              </button>
              <button type="button" onClick={() => useDemo(DEMO_ACCOUNTS.seller)}>
                <Store size={16} />
                <span>
                  <strong>Seller demo</strong>
                  <small>{DEMO_ACCOUNTS.seller.email}</small>
                </span>
              </button>
            </div>
            <p>
              <KeyRound size={13} /> Both demo accounts use the password{' '}
              <code>{DEMO_ACCOUNTS.buyer.password}</code>
            </p>
          </div>

          <div className="auth-footer-note">
            <MapPin size={14} />
            Signing in from a new district? Update your delivery address at checkout.
          </div>
        </div>
      </section>
    </div>
  )
}