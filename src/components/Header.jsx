import { Menu, ShoppingCart, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { label: 'Explore', to: '/search' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about-us' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
        <Link to="/" className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-600 bg-clip-text text-3xl font-black tracking-[-0.06em] text-transparent transition hover:from-yellow-400 hover:to-orange-600">
          ICH
        </Link>
        <nav className="hidden items-center justify-center gap-9 text-sm font-semibold text-slate-600 lg:flex">
          {navLinks.map((link) => (
            <NavLink key={link.label} to={link.to} className={({ isActive }) => `transition hover:text-blue-600 ${isActive ? 'text-blue-600' : ''}`}>{link.label}</NavLink>
          ))}
        </nav>
        <div className="hidden items-center justify-end gap-3 lg:flex">
          <Link to="/cart" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"><ShoppingCart size={18} /></Link>
          <Link to="/admin/login" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600">Log In</Link>
        </div>
        <button onClick={() => setOpen(true)} className="col-start-3 ml-auto grid h-10 w-10 place-items-center rounded-full border border-slate-200 lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
      </div>
      {open && <MobileNavigation onClose={() => setOpen(false)} />}
    </header>
  )
}

function MobileNavigation({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 lg:hidden">
      <div className="ml-auto flex h-full w-80 max-w-[85vw] flex-col bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-950">Menu</span>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100" aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="mt-8 flex flex-col gap-4 text-base font-semibold text-slate-700">
          {navLinks.map((link) => (
            <Link key={link.label} to={link.to} onClick={onClose} className="rounded-xl px-3 py-2 hover:bg-blue-50 hover:text-blue-600">{link.label}</Link>
          ))}
          <Link to="/cart" onClick={onClose} className="rounded-xl px-3 py-2 hover:bg-blue-50 hover:text-blue-600">Cart</Link>
        </nav>
        <div className="mt-auto grid gap-3">
          <Link to="/admin/login" onClick={onClose} className="rounded-full bg-blue-600 px-4 py-3 text-center font-semibold text-white">Log In</Link>
        </div>
      </div>
    </div>
  )
}
