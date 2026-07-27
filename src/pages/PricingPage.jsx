import PricingCard from '../components/PricingCard'
import { pricingPlans } from '../data/mockData'

export default function PricingPage() {
  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Pricing</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">Flexible image licensing for every team size.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">Buy a single asset, start a monthly plan, or manage image licensing across your business.</p>
        <div className="mt-12 grid gap-6 text-left lg:grid-cols-3">
          {pricingPlans.map((plan) => <PricingCard key={plan.name} plan={plan} />)}
        </div>
      </section>
    </main>
  )
}
