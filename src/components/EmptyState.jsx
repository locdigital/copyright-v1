import { SearchX } from 'lucide-react'

export default function EmptyState({ title = 'No results found', message = 'Try adjusting filters or using a broader keyword.' }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <SearchX className="mx-auto text-slate-400" size={38} />
      <h2 className="mt-4 text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-slate-500">{message}</p>
    </div>
  )
}
