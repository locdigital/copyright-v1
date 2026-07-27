import { Globe, MessageCircle, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { footerLinks } from '../data/staticPages'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Image Copyright Hub</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">A clean image marketplace for finding, licensing, and managing creative assets.</p>
            <div className="mt-5 flex gap-3 text-slate-500">
              {[Send, MessageCircle, Globe].map((Icon, index) => <Icon key={index} size={20} />)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {footerLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm text-slate-600 transition hover:text-blue-600">{link.label}</Link>
            ))}
          </div>
        </div>
        <p className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">© 2026 Image Copyright Hub. All rights reserved.</p>
      </div>
    </footer>
  )
}
