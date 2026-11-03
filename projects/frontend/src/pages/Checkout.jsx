import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  Truck
} from 'lucide-react'
import ProductVisual from '../components/ProductVisual'
import EmptyState, { ErrorNotice } from '../components/EmptyState'
import { api } from '../lib/api'
import { STATES } from '../lib/constants'
import { inr } from '../lib/format'
import { useAuth } from '../store/auth'
import { cartSubtotal, useCart } from '../store/cart'
import { useToast } from '../store/toast'

const FREE_SHIPPING = 999
const SHIPPING_FEE = 79

const BANKS = [
  'HDFC Bank',
  'State Bank of India',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Canara Bank',
  'Union Bank of India'
]

const PAYMENT_TABS = [
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'netbanking', label: 'Net banking', icon: Banknote }
]

function digitsOnly(value) {
  return value.replace(/\D/g, '')
}

function formatCardNumber(value) {
  return digitsOnly(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value) {
  const digits = digitsOnly(value).slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function cardBrand(number) {
  const digits = digitsOnly(number)
  if (/^4/.test(digits)) return 'VISA'
  if (/^5[1-5]/.test(digits)) return 'MASTERCARD'
  if (/^3[47]/.test(digits)) return 'AMEX'
  if (/^6/.test(digits)) return 'RUPAY'
  return 'CARD'
}

export default function Checkout() {
  const navigate = useNavigate()
  const user = useAuth((state) => state.user)
  const items = useCart((state) => state.items)
  const clear = useCart((state) => state.clear)
  const subtotal = useCart(cartSubtotal)
  const push = useToast((state) => state.push)

  const [method, setMethod] = useState('card')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState(null)

  const [shipping, setShipping] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: user?.district || '',
    state: user?.state || '',
    pincode: ''
  })

  const [card, setCard] = useState({ number: '', name: user?.name || '', expiry: '', cvc: '' })
  const [upi, setUpi] = useState('')
  const [bank, setBank] = useState('')

  const shippingFee = items.length === 0 || subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE
  const total = subtotal + shippingFee
  const brand = useMemo(() => cardBrand(card.number), [card.number])

  if (items.length === 0 && !placing && !error) {
    return (
      <div className="section">
        <EmptyState
          eyebrow="Checkout · Empty basket"
          title="There is nothing to settle yet."
          copy="Add inputs from the registry and return here to complete a demo order."
          actionLabel="Browse the registry"
          actionTo="/search"
        />
      </div>
    )
  }

  function updateShipping(field, value) {
    setShipping((current) => ({ ...current, [field]: value }))
  }

  function updateCard(field, value) {
    if (field === 'number') setCard((current) => ({ ...current, number: formatCardNumber(value) }))
    else if (field === 'expiry') setCard((current) => ({ ...current, expiry: formatExpiry(value) }))
    else if (field === 'cvc')
      setCard((current) => ({ ...current, cvc: digitsOnly(value).slice(0, 4) }))
    else setCard((current) => ({ ...current, [field]: value }))
  }

  function fillDemoCard() {
    setCard({ number: '4242 4242 4242 4242', name: shipping.name || user?.name || 'Demo Buyer', expiry: '12/30', cvc: '123' })
    push('Demo card filled — nothing real is charged', 'default')
  }

  function validate() {
    const issues = []
    if (shipping.name.trim().length < 2) issues.push('Enter the name for delivery.')
    if (digitsOnly(shipping.phone).length < 10) issues.push('Enter a 10-digit contact number.')
    if (shipping.address.trim().length < 8) issues.push('Enter a full delivery address.')
    if (!shipping.city.trim()) issues.push('Enter the district or city.')
    if (!shipping.state) issues.push('Choose a state.')
    if (digitsOnly(shipping.pincode).length !== 6) issues.push('Enter a 6-digit PIN code.')

    if (method === 'card') {
      if (digitsOnly(card.number).length !== 16) issues.push('Card number needs 16 digits.')
      const [month, year] = card.expiry.split('/')
      if (!month || !year || Number(month) < 1 || Number(month) > 12) {
        issues.push('Enter a valid expiry as MM/YY.')
      }
      if (digitsOnly(card.cvc).length < 3) issues.push('Enter the CVC from the back of the card.')
      if (card.name.trim().length < 2) issues.push('Enter the name printed on the card.')
    }
    if (method === 'upi' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim())) {
      issues.push('Enter a UPI ID such as name@bank.')
    }
    if (method === 'netbanking' && !bank) issues.push('Choose a bank to continue.')
    return issues
  }

  async function placeOrder(event) {
    event.preventDefault()
    const issues = validate()
    if (issues.length > 0) {
      setError({ status: 400, message: issues[0] })
      return
    }
    setPlacing(true)
    setError(null)

    const paymentLabel =
      method === 'card'
        ? `${brand} ending ${digitsOnly(card.number).slice(-4)}`
        : method === 'upi'
          ? upi.trim()
          : bank

    try {
      const order = await api.createOrder({
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        shipping: {
          name: shipping.name.trim(),
          phone: shipping.phone.trim(),
          address: shipping.address.trim(),
          city: shipping.city.trim(),
          state: shipping.state,
          pincode: shipping.pincode.trim()
        },
        paymentMethod: method,
        paymentLabel
      })
      clear()
      navigate(`/order/${order.id}/success`, { state: { order }, replace: true })
    } catch (exception) {
      setError(exception)
      setPlacing(false)
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-head">
        <Link className="back-link" to="/cart">
          <ArrowLeft size={15} /> Back to basket
        </Link>
        <span className="eyebrow">Checkout · Demo settlement</span>
        <h1>Confirm delivery, then settle.</h1>
        <p>
          This is a working demo checkout. Payment fields are validated in your browser and
          discarded — Proforma never receives or stores card, UPI or bank credentials.
        </p>
      </div>

      <form className="checkout-layout" onSubmit={placeOrder} noValidate>
        <div className="checkout-flow">
          <section className="checkout-card">
            <div className="checkout-card-head">
              <span className="step-index">01</span>
              <div>
                <h2>Delivery details</h2>
                <p>Who should receive this consignment?</p>
              </div>
              {user?.phone && <BadgeCheck size={18} className="step-check" />}
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Full name</span>
                <input
                  value={shipping.name}
                  onChange={(event) => updateShipping('name', event.target.value)}
                  placeholder="Ravi Kumar"
                  autoComplete="name"
                  maxLength={120}
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  value={shipping.phone}
                  onChange={(event) => updateShipping('phone', event.target.value)}
                  placeholder="98765 43210"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={16}
                />
              </label>
              <label className="field field--full">
                <span>Delivery address</span>
                <textarea
                  rows={3}
                  value={shipping.address}
                  onChange={(event) => updateShipping('address', event.target.value)}
                  placeholder="Survey no., village / street, landmark"
                  autoComplete="street-address"
                  maxLength={300}
                />
              </label>
              <label className="field">
                <span>District / city</span>
                <input
                  value={shipping.city}
                  onChange={(event) => updateShipping('city', event.target.value)}
                  placeholder="Thanjavur"
                  autoComplete="address-level2"
                  maxLength={80}
                />
              </label>
              <label className="field">
                <span>PIN code</span>
                <input
                  value={shipping.pincode}
                  onChange={(event) => updateShipping('pincode', digitsOnly(event.target.value).slice(0, 6))}
                  placeholder="613001"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={6}
                />
              </label>
              <label className="field">
                <span>State</span>
                <select
                  value={shipping.state}
                  onChange={(event) => updateShipping('state', event.target.value)}
                  autoComplete="address-level1"
                >
                  <option value="">Choose a state</option>
                  {STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Delivery window</span>
                <select value="standard" disabled>
                  <option value="standard">Standard · 3–6 working days</option>
                </select>
              </label>
            </div>
            <label className="checkbox-row">
              <input type="checkbox" defaultChecked />
              <span>Dispatch to my farm address and notify me by SMS.</span>
            </label>
          </section>

          <section className="checkout-card">
            <div className="checkout-card-head">
              <span className="step-index">02</span>
              <div>
                <h2>Payment method</h2>
                <p>Simulated processor · no bank account is connected.</p>
              </div>
              <Lock size={17} className="step-check" />
            </div>

            <div className="pay-tabs" role="tablist">
              {PAYMENT_TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={method === tab.value}
                    className={`pay-tab${method === tab.value ? ' is-active' : ''}`}
                    onClick={() => setMethod(tab.value)}
                  >
                    <Icon size={17} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {method === 'card' && (
              <div className="card-payment">
                <div className={`demo-card demo-card--${brand.toLowerCase()}`}>
                  <div className="demo-card-top">
                    <span>PROFORMA · DEMO</span>
                    <strong>{brand}</strong>
                  </div>
                  <span className="demo-card-chip" aria-hidden="true" />
                  <span className="demo-card-number">
                    {card.number || '•••• •••• •••• ••••'}
                  </span>
                  <div className="demo-card-bottom">
                    <span>
                      <small>Card holder</small>
                      {card.name || 'YOUR NAME'}
                    </span>
                    <span>
                      <small>Expires</small>
                      {card.expiry || 'MM/YY'}
                    </span>
                  </div>
                </div>

                <div className="form-grid">
                  <label className="field field--full">
                    <span>Card number</span>
                    <input
                      value={card.number}
                      onChange={(event) => updateCard('number', event.target.value)}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      maxLength={19}
                    />
                  </label>
                  <label className="field field--full">
                    <span>Name on card</span>
                    <input
                      value={card.name}
                      onChange={(event) => updateCard('name', event.target.value)}
                      placeholder="Ravi Kumar"
                      autoComplete="cc-name"
                      maxLength={80}
                    />
                  </label>
                  <label className="field">
                    <span>Expiry (MM/YY)</span>
                    <input
                      value={card.expiry}
                      onChange={(event) => updateCard('expiry', event.target.value)}
                      placeholder="12/30"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      maxLength={5}
                    />
                  </label>
                  <label className="field">
                    <span>CVC</span>
                    <input
                      value={card.cvc}
                      onChange={(event) => updateCard('cvc', event.target.value)}
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                    />
                  </label>
                </div>
                <button type="button" className="text-link demo-fill" onClick={fillDemoCard}>
                  Use a demo card instead
                </button>
              </div>
            )}

            {method === 'upi' && (
              <div className="upi-payment">
                <label className="field">
                  <span>UPI ID</span>
                  <input
                    value={upi}
                    onChange={(event) => setUpi(event.target.value)}
                    placeholder="ravi@okhdfcbank"
                    inputMode="email"
                    maxLength={60}
                  />
                </label>
                <div className="payment-aside">
                  <Smartphone size={17} />
                  <p>
                    A collect request would normally appear on your phone. In this demo, the
                    order is marked paid immediately and no money moves.
                  </p>
                </div>
              </div>
            )}

            {method === 'netbanking' && (
              <div className="netbanking-payment">
                <label className="field">
                  <span>Choose your bank</span>
                  <select value={bank} onChange={(event) => setBank(event.target.value)}>
                    <option value="">Select a bank</option>
                    {BANKS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="payment-aside">
                  <Banknote size={17} />
                  <p>
                    Demo only. Selecting a bank does not open a real banking session or
                    authorise any transfer.
                  </p>
                </div>
              </div>
            )}

            <div className="demo-payment-note">
              <ShieldCheck size={16} />
              <span>
                <strong>No real bank account is linked.</strong> Card, UPI and bank fields never
                leave this page. The order is recorded with a simulated payment reference.
              </span>
            </div>
          </section>

          {error && (
            <ErrorNotice
              title={error.status === 409 ? 'Stock changed while you were checking out' : 'Check your details'}
              message={error.message}
            />
          )}

          <div className="checkout-actions">
            <button type="submit" className="btn btn--forest btn--full" disabled={placing}>
              {placing ? 'Settling demo payment…' : `Pay ${inr(total)} in demo mode`}
              <ArrowRight size={16} />
            </button>
            <p className="checkout-terms">
              By placing this order you accept the demo terms. No goods or money are exchanged.
            </p>
          </div>
        </div>

        <aside className="checkout-summary">
          <span className="eyebrow">Consignment</span>
          <div className="checkout-lines">
            {items.map((item) => (
              <div className="checkout-line" key={item.product.id}>
                <div className="checkout-line-media">
                  <ProductVisual product={item.product} variant="thumb" />
                </div>
                <div className="checkout-line-body">
                  <strong>{item.product.name}</strong>
                  <span>
                    {item.quantity} × {inr(item.product.price)} · {item.product.unit}
                  </span>
                </div>
                <span className="checkout-line-total">
                  {inr(Number(item.product.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{inr(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>District delivery</span>
            <strong>{shippingFee === 0 ? 'Free' : inr(shippingFee)}</strong>
          </div>
          <div className="summary-total">
            <span>Amount due</span>
            <strong>{inr(total)}</strong>
          </div>

          <div className="checkout-assurances">
            <div>
              <BadgeCheck size={16} />
              <span>Verified sellers · batch traceable</span>
            </div>
            <div>
              <Truck size={16} />
              <span>Dispatch in 2–4 working days</span>
            </div>
            <div>
              <Check size={16} />
              <span>7-day return window on sealed lots</span>
            </div>
          </div>

          <p className="summary-secure">
            <Lock size={13} /> Demo environment · payments simulated
          </p>
        </aside>
      </form>
    </div>
  )
}