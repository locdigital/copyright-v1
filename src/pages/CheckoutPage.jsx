import { CheckCircle2, Lock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cartItems } from '../data/mockData'
import { OrderSummary } from './CartPage'

const initialForm = {
  fullName: '',
  email: '',
  company: '',
  license: 'Standard License',
  cardNumber: '',
  expiry: '',
  cvc: '',
  discountCode: '',
}

export default function CheckoutPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [discount, setDiscount] = useState(0)
  const [discountMessage, setDiscountMessage] = useState('')
  const [order, setOrder] = useState(null)
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price, 0), [])
  const total = Math.max(0, subtotal - discount)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const applyDiscount = () => {
    const code = form.discountCode.trim().toUpperCase()
    if (!code) {
      setDiscount(0)
      setDiscountMessage('Enter a discount code first.')
      return
    }
    if (['CREATIVE10', 'SAVE10'].includes(code)) {
      setDiscount(10)
      setDiscountMessage('Discount applied successfully.')
      return
    }
    setDiscount(0)
    setDiscountMessage('Invalid discount code.')
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (form.cardNumber.replace(/\D/g, '').length < 12) nextErrors.cardNumber = 'Enter a valid card number.'
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(form.expiry)) nextErrors.expiry = 'Use MM / YY format.'
    if (!/^\d{3,4}$/.test(form.cvc)) nextErrors.cvc = 'Enter a valid CVC.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = (event) => {
    event.preventDefault()
    if (!validate()) return
    setOrder({
      id: `ICH-${Date.now()}`,
      email: form.email,
      license: form.license,
      total,
    })
  }

  if (order) {
    return (
      <main className="bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto text-green-600" size={56} />
            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Purchase confirmed</h1>
            <p className="mt-3 text-slate-600">Your mock order has been completed and the license receipt is ready.</p>
            <div className="mx-auto mt-6 max-w-md rounded-2xl bg-slate-50 p-5 text-left text-sm text-slate-600">
              <p><strong className="text-slate-950">Order:</strong> {order.id}</p>
              <p className="mt-2"><strong className="text-slate-950">Email:</strong> {order.email}</p>
              <p className="mt-2"><strong className="text-slate-950">License:</strong> {order.license}</p>
              <p className="mt-2"><strong className="text-slate-950">Total:</strong> ${order.total}</p>
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => window.print()} className="rounded-full border border-slate-200 px-6 py-3 font-bold text-slate-800 transition hover:bg-slate-50">Print receipt</button>
              <Link to="/search" className="rounded-full bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700">Continue browsing</Link>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Checkout</h1>
          <p className="mt-2 text-slate-600">Complete the mock payment flow to generate a license receipt.</p>
          <form onSubmit={submit} className="mt-8 grid gap-8">
            <CheckoutSection title="Customer information">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldError error={errors.fullName}><input value={form.fullName} onChange={(event) => update('fullName', event.target.value)} className="input" placeholder="Full name" /></FieldError>
                <FieldError error={errors.email}><input value={form.email} onChange={(event) => update('email', event.target.value)} className="input" type="email" placeholder="Email address" /></FieldError>
                <input value={form.company} onChange={(event) => update('company', event.target.value)} className="input sm:col-span-2" placeholder="Company name (optional)" />
              </div>
            </CheckoutSection>
            <CheckoutSection title="Selected license">
              <select value={form.license} onChange={(event) => update('license', event.target.value)} className="input"><option>Standard License</option><option>Extended License</option></select>
            </CheckoutSection>
            <CheckoutSection title="Payment method">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldError error={errors.cardNumber} className="sm:col-span-2"><input value={form.cardNumber} onChange={(event) => update('cardNumber', event.target.value)} className="input" inputMode="numeric" placeholder="Card number · 4242 4242 4242 4242" /></FieldError>
                <FieldError error={errors.expiry}><input value={form.expiry} onChange={(event) => update('expiry', event.target.value)} className="input" placeholder="MM / YY" /></FieldError>
                <FieldError error={errors.cvc}><input value={form.cvc} onChange={(event) => update('cvc', event.target.value)} className="input" inputMode="numeric" placeholder="CVC" /></FieldError>
              </div>
              <p className="mt-3 text-sm text-slate-500"><Lock className="mr-1 inline" size={15} />Mock payment only. Use any valid-looking card details.</p>
            </CheckoutSection>
            <CheckoutSection title="Discount code">
              <div className="flex gap-3"><input value={form.discountCode} onChange={(event) => update('discountCode', event.target.value)} className="input" placeholder="CREATIVE10" /><button type="button" onClick={applyDiscount} className="rounded-full border border-slate-200 px-5 font-bold text-slate-700 transition hover:bg-slate-50">Apply</button></div>
              {discountMessage && <p className={`mt-2 text-sm font-semibold ${discount ? 'text-green-600' : 'text-red-600'}`}>{discountMessage}</p>}
            </CheckoutSection>
            <button type="submit" className="rounded-full bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700">Confirm Purchase · ${total}</button>
          </form>
        </section>
        <OrderSummary subtotal={subtotal} discount={discount} showCta={false} />
      </div>
    </main>
  )
}

function CheckoutSection({ title, children }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-slate-950">{title}</h2>
      {children}
    </section>
  )
}

function FieldError({ error, children, className = '' }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      {children}
      {error && <span className="text-sm font-medium text-red-600">{error}</span>}
    </label>
  )
}
