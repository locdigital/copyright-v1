import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const contentTypes = ['All Images', 'Photos', 'Illustrations', 'Vectors']

export default function SearchBar({ compact = false }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All Images')
  const navigate = useNavigate()

  const submitSearch = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    params.set('type', type)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={submitSearch} className={`mx-auto flex w-full overflow-hidden border border-slate-200 bg-white shadow-sm transition focus-within:border-blue-500 focus-within:shadow-blue-100 ${compact ? 'h-12 max-w-4xl rounded-2xl' : 'max-w-[850px] flex-col rounded-[18px] shadow-xl shadow-slate-200/70 sm:h-[68px] sm:flex-row'}`}>
      <select value={type} onChange={(event) => setType(event.target.value)} className={`${compact ? 'hidden sm:block' : 'block'} border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none sm:border-b-0 sm:border-r sm:py-0`}>
        {contentTypes.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <div className="flex min-h-14 flex-1 items-center gap-3 px-4">
        <Search size={20} className="text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search photos, vectors, illustrations..." className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base" />
      </div>
      <button className={`${compact ? 'px-5 sm:px-8' : 'min-h-14 px-6 sm:min-h-full sm:px-9'} bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700`} type="submit">
        Search
      </button>
    </form>
  )
}
