import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PricingCard({ plan }) {
  return (
    <article className={`relative rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${plan.recommended ? 'border-blue-600 bg-blue-600 text-white shadow-blue-200' : 'border-slate-200 bg-white text-slate-950'}`}>
      {plan.recommended && <span className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-600">Recommended</span>}
      <h3 className="text-xl font-bold">{plan.name}</h3>
      <p className={`mt-2 text-sm ${plan.recommended ? 'text-blue-100' : 'text-slate-500'}`}>{plan.licenseType}</p>
      <p className="mt-6 text-4xl font-black tracking-tight">{plan.price}</p>
      <p className={`mt-2 text-sm ${plan.recommended ? 'text-blue-100' : 'text-slate-600'}`}>{plan.allowance}</p>
      <ul className="mt-6 space-y-3">
        {plan.benefits.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2 text-sm"><Check size={17} />{benefit}</li>
        ))}
      </ul>
      <Link to="/checkout" className={`mt-8 block rounded-full px-5 py-3 text-center text-sm font-bold transition ${plan.recommended ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-slate-950 text-white hover:bg-blue-600'}`}>{plan.cta}</Link>
    </article>
  )
}
