import { Check } from 'lucide-react'
import { licenseOptions } from '../data/mockData'

export default function LicenseSelector({ selected, onChange }) {
  return (
    <div className="grid gap-3">
      {licenseOptions.map((license) => {
        const active = selected === license.id
        return (
          <button key={license.id} type="button" onClick={() => onChange(license.id)} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-950">{license.name}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{license.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-950">${license.price}</p>
                {active && <Check className="ml-auto mt-2 text-blue-600" size={18} />}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
