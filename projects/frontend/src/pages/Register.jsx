import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Leaf,
  MapPin,
  Sprout,
  Store,
  UserRound
} from 'lucide-react'
import BrandLockup from '../components/BrandMark'
import { api } from '../lib/api'
import {
  CLIMATES,
  CROP_OPTIONS,
  FARMER_TYPES,
  IRRIGATION,
  STATES
} from '../lib/constants'
import { useAuth } from '../store/auth'
import { useToast } from '../store/toast'

const STEPS = ['Account', 'Farm profile', 'Confirm']

const EMPTY = {
  name: '',
  email: '',
  password: '',
  confirm: '',
  phone: '',
  farmerType: '',
  crops: [],
  state: '',
  district: '',
  climate: '',
  farmSize: '',
  irrigation: '',
  businessName: '',
  productFocus: '',
  sellerAbout: ''
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setSession = useAuth((state) => state.setSession)
  const push = useToast((state) => state.push)

  const [role, setRole] = useState(params.get('role') === 'SELLER' ? 'SELLER' : 'BUYER')
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const passwordChecks = useMemo(
    () => [
      { label: '8+ characters', pass: form.password.length >= 8 },
      { label: 'A number', pass: /\d/.test(form.password) },
      { label: 'A letter', pass: /[a-zA-Z]/.test(form.password) }
    ],
    [form.password]
  )

  const stepReady = useMemo(() => {
    if (step === 0) {
      return (
        form.name.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
        form.password.length >= 8 &&
        form.password === form.confirm &&
        (role === 'BUYER' || form.businessName.trim().length >= 2)
      )
    }
    if (step === 1) {
      return (
        form.farmerType &&
        form.crops.length > 0 &&
        form.state &&
        form.district.trim().length >= 2 &&
        form.climate
      )
    }
    return true
  }, [step, form, role])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  function next() {
    if (!stepReady) {
      const message =
        step === 0
          ? 'Complete your name, email, password and business name (sellers) to continue.'
          : 'Choose a farmer type, at least one crop, your state, district and climate to continue.'
      setError({ message })
      return
    }
    setStep((value) => Math.min(STEPS.length - 1, value + 1))
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function back() {
    setStep((value) => Math.max(0, value - 1))
    setError(null)
  }

  async function submit(event) {
    event.preventDefault()
    setStatus('saving')
    setError(null)
    try {
      const session = await api.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        phone: form.phone.trim() || null,
        farmerType: form.farmerType || null,
        crops: form.crops,
        state: form.state || null,
        district: form.district.trim() || null,
        climate: form.climate || null,
        farmSize: form.farmSize.trim() || null,
        irrigation: form.irrigation || null,
        businessName: role === 'SELLER' ? form.businessName.trim() : null,
        productFocus: role === 'SELLER' ? form.productFocus.trim() || null : null,
        sellerAbout: role === 'SELLER' ? form.sellerAbout.trim() || null : null
      })
      setSession(session)
      push(
        role === 'SELLER'
          ? 'Seller account created. Your studio is open.'
          : 'Account created. Recommendations are ready.',
        'success'
      )
      navigate(role === 'SELLER' ? '/seller' : '/', { replace: true })
    } catch (exception) {
      setError(exception)
      setStatus('idle')
      setStep(0)
    }
  }

  return (
    <div className="register-page">
      <aside className="register-aside">
        <BrandLockup inverse size={44} />
        <div>
          <span className="eyebrow eyebrow--gold">Join the registry</span>
          <h2>Three questions. Better inputs from day one.</h2>
          <p>
            Tell us what you grow and where you grow it. Recommendations, dispatch windows and
            agronomy notes are matched to that profile — not to a generic catalogue.
          </p>
        </div>
        <ul className="register-aside-list">
          <li>
            <UserRound size={16} /> One account for buyer and seller use
          </li>
          <li>
            <Sprout size={16} /> Crop and climate-aware recommendations
          </li>
          <li>
            <MapPin size={16} /> District-level delivery and seller matching
          </li>
          <li>
            <Store size={16} /> Sellers unlock the listing studio and analytics
          </li>
        </ul>
        <div className="register-aside-note">
          <strong>Managing a farm or FPO?</strong>
          <span>Register as a seller to list lots with stock, images and analytics.</span>
        </div>
      </aside>

      <section className="register-main">
        <div className="register-form-wrap">
          <div className="register-head">
            <span className="eyebrow">Create account</span>
            <h1>{role === 'SELLER' ? 'Open a seller registry.' : 'Register your farm.'}</h1>
            <p>
              Already registered? <Link to="/login">Sign in to your account</Link>.
            </p>
          </div>

          <nav className="register-steps" aria-label="Registration steps">
            {STEPS.map((label, index) => (
              <div
                key={label}
                className={`register-step${index === step ? ' is-active' : ''}${
                  index < step ? ' is-done' : ''
                }`}
              >
                <span className="register-step-index">
                  {index < step ? <Check size={13} /> : String(index + 1).padStart(2, '0')}
                </span>
                <span>{label}</span>
              </div>
            ))}
          </nav>

          <form onSubmit={step === STEPS.length - 1 ? submit : (event) => event.preventDefault()}>
            {step === 0 && (
              <div className="register-step-panel">
                <div className="role-picker">
                  <button
                    type="button"
                    className={`role-card${role === 'BUYER' ? ' is-active' : ''}`}
                    onClick={() => setRole('BUYER')}
                  >
                    <Leaf size={20} />
                    <strong>Buyer</strong>
                    <span>Shop verified seeds, machinery, tools and soils.</span>
                    {role === 'BUYER' && <CheckCircle2 size={16} className="role-tick" />}
                  </button>
                  <button
                    type="button"
                    className={`role-card${role === 'SELLER' ? ' is-active' : ''}`}
                    onClick={() => setRole('SELLER')}
                  >
                    <Store size={20} />
                    <strong>Seller</strong>
                    <span>List and sell with a full studio and analytics.</span>
                    {role === 'SELLER' && <CheckCircle2 size={16} className="role-tick" />}
                  </button>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>Full name</span>
                    <input
                      value={form.name}
                      onChange={(event) => update('name', event.target.value)}
                      placeholder="Ravi Kumar"
                      autoComplete="name"
                      maxLength={120}
                    />
                  </label>
                  <label className="field">
                    <span>Phone</span>
                    <input
                      value={form.phone}
                      onChange={(event) => update('phone', event.target.value)}
                      placeholder="98765 43210"
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={16}
                    />
                  </label>
                  <label className="field field--full">
                    <span>Email address</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => update('email', event.target.value)}
                      placeholder="you@farm.in"
                      autoComplete="email"
                      maxLength={180}
                    />
                  </label>
                  <label className="field">
                    <span>Password</span>
                    <div className="password-field">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(event) => update('password', event.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        maxLength={72}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>
                  <label className="field">
                    <span>Confirm password</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={(event) => update('confirm', event.target.value)}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      maxLength={72}
                    />
                  </label>
                  {form.password.length > 0 && (
                    <div className="password-checks field--full">
                      {passwordChecks.map((check) => (
                        <span key={check.label} className={check.pass ? 'is-pass' : ''}>
                          <Check size={12} /> {check.label}
                        </span>
                      ))}
                      {form.confirm.length > 0 && (
                        <span className={form.password === form.confirm ? 'is-pass' : 'is-fail'}>
                          <Check size={12} /> Passwords match
                        </span>
                      )}
                    </div>
                  )}
                  {role === 'SELLER' && (
                    <label className="field field--full">
                      <span>Business or farm name</span>
                      <input
                        value={form.businessName}
                        onChange={(event) => update('businessName', event.target.value)}
                        placeholder="Kaveri Agro Seeds"
                        autoComplete="organization"
                        maxLength={160}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="register-step-panel">
                <div className="step-intro">
                  <span className="eyebrow eyebrow--muted">Personalisation</span>
                  <h2>What does your ground ask for?</h2>
                  <p>This shapes recommendations immediately after registration.</p>
                </div>

                <div className="choice-group">
                  <span className="filter-title">Farmer type</span>
                  <div className="choice-chips">
                    {FARMER_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`choice-chip${form.farmerType === type ? ' is-active' : ''}`}
                        onClick={() => update('farmerType', type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="choice-group">
                  <span className="filter-title">
                    Crops grown <small>Choose all that apply</small>
                  </span>
                  <div className="choice-chips">
                    {CROP_OPTIONS.map((crop) => (
                      <button
                        key={crop}
                        type="button"
                        className={`choice-chip${form.crops.includes(crop) ? ' is-active' : ''}`}
                        onClick={() => update('crops', toggle(form.crops, crop))}
                      >
                        {form.crops.includes(crop) && <Check size={12} />} {crop}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>State</span>
                    <select value={form.state} onChange={(event) => update('state', event.target.value)}>
                      <option value="">Choose a state</option>
                      {STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>District / taluk</span>
                    <input
                      value={form.district}
                      onChange={(event) => update('district', event.target.value)}
                      placeholder="Thanjavur"
                      maxLength={80}
                    />
                  </label>
                  <label className="field">
                    <span>Climate zone</span>
                    <select
                      value={form.climate}
                      onChange={(event) => update('climate', event.target.value)}
                    >
                      <option value="">Choose a climate</option>
                      {CLIMATES.map((climate) => (
                        <option key={climate} value={climate}>
                          {climate}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Irrigation</span>
                    <select
                      value={form.irrigation}
                      onChange={(event) => update('irrigation', event.target.value)}
                    >
                      <option value="">Choose a source</option>
                      {IRRIGATION.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Holding size</span>
                    <input
                      value={form.farmSize}
                      onChange={(event) => update('farmSize', event.target.value)}
                      placeholder="e.g. 4 acres"
                      maxLength={40}
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="register-step-panel">
                <div className="step-intro">
                  <span className="eyebrow eyebrow--muted">Final check</span>
                  <h2>{role === 'SELLER' ? 'Tell buyers who you are.' : 'Confirm your farm profile.'}</h2>
                  <p>You can refine this later. It only shapes what you see and sell.</p>
                </div>

                {role === 'SELLER' && (
                  <div className="form-grid">
                    <label className="field field--full">
                      <span>What will you list?</span>
                      <input
                        value={form.productFocus}
                        onChange={(event) => update('productFocus', event.target.value)}
                        placeholder="Certified paddy and millet seed"
                        maxLength={160}
                      />
                    </label>
                    <label className="field field--full">
                      <span>About the business</span>
                      <textarea
                        rows={4}
                        value={form.sellerAbout}
                        onChange={(event) => update('sellerAbout', event.target.value)}
                        placeholder="Where you source, how you test lots, and the districts you serve."
                        maxLength={3000}
                      />
                    </label>
                  </div>
                )}

                <div className="register-review">
                  <div>
                    <span>Account</span>
                    <strong>{role === 'SELLER' ? 'Seller' : 'Buyer'}</strong>
                    <small>{form.name}</small>
                    <small>{form.email}</small>
                  </div>
                  <div>
                    <span>Farm</span>
                    <strong>{form.farmerType || '—'}</strong>
                    <small>{form.crops.join(', ') || '—'}</small>
                    <small>
                      {form.district}, {form.state}
                    </small>
                  </div>
                  <div>
                    <span>Conditions</span>
                    <strong>{form.climate || '—'}</strong>
                    <small>{form.irrigation || 'Irrigation not set'}</small>
                    <small>{form.farmSize || 'Holding size not set'}</small>
                  </div>
                  {role === 'SELLER' && (
                    <div>
                      <span>Business</span>
                      <strong>{form.businessName || '—'}</strong>
                      <small>{form.productFocus || 'Focus not set'}</small>
                    </div>
                  )}
                </div>

                <p className="register-consent">
                  By creating an account you agree to Proforma's demo terms. This is a
                  demonstration marketplace — no payment details are stored and no real
                  transactions occur.
                </p>
              </div>
            )}

            {error && (
              <p className="form-error" role="alert">
                {error.message}
              </p>
            )}

            <div className="register-actions">
              {step > 0 ? (
                <button type="button" className="btn btn--ghost" onClick={back}>
                  <ArrowLeft size={15} /> Back
                </button>
              ) : (
                <Link className="btn btn--ghost" to="/login">
                  I already have an account
                </Link>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" className="btn btn--forest" onClick={next}>
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" className="btn btn--gold" disabled={status === 'saving'}>
                  {status === 'saving'
                    ? 'Creating account…'
                    : role === 'SELLER'
                      ? 'Create seller account'
                      : 'Create my account'}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}