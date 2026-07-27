import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cartItems, images } from '../data/mockData'

function buildCartItems() {
  return cartItems
    .map((item) => ({ ...item, image: images.find((image) => image.id === item.imageId) }))
    .filter((item) => item.image)
}

export default function CartPage() {
  const [items, setItems] = useState(buildCartItems)
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)

  const removeItem = (itemId) => setItems((current) => current.filter((item) => item.id !== itemId))

  return (
    <main className="bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Shopping cart</h1>
          <p className="mt-2 text-slate-600">Review selected images and license options before checkout.</p>
          <div className="mt-6 grid gap-4">
            {items.length ? items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center">
                <img src={item.image.image} alt={item.image.title} draggable="false" onContextMenu={(event) => event.preventDefault()} className="h-28 w-full rounded-lg object-cover sm:w-36" />
                <div className="flex-1"><h2 className="font-bold text-slate-950">{item.image.title}</h2><p className="mt-1 text-sm text-slate-500">{item.license} · {item.image.format}</p></div>
                <p className="font-black text-slate-950">${item.price}</p>
                <button type="button" onClick={() => removeItem(item.id)} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-500 transition hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${item.image.title}`}><Trash2 size={18} /></button>
              </div>
            )) : <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">Your cart is empty.</div>}
          </div>
        </section>
        <OrderSummary subtotal={subtotal} disabled={!items.length} />
      </div>
    </main>
  )
}

export function OrderSummary({ subtotal, discount = 0, disabled = false, ctaLabel = 'Continue to Checkout', showCta = true }) {
  const total = Math.max(0, subtotal - discount)
  return (
    <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">Order summary</h2>
      <div className="mt-5 space-y-3 text-sm text-slate-600">
        <div className="flex justify-between"><span>Image price</span><span>${subtotal}</span></div>
        <div className="flex justify-between"><span>Discount code</span><span>{discount ? `-$${discount}` : '$0'}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-950"><span>Total</span><span>${total}</span></div>
      </div>
      {showCta && (disabled ? <button type="button" disabled className="mt-6 block w-full cursor-not-allowed rounded-full bg-slate-200 px-5 py-3 text-center font-bold text-slate-500">Cart is empty</button> : <Link to="/checkout" className="mt-6 block rounded-full bg-blue-600 px-5 py-3 text-center font-bold text-white transition hover:bg-blue-700">{ctaLabel}</Link>)}
    </aside>
  )
}
