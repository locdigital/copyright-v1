import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import FilterSidebar from '../components/FilterSidebar'
import MasonryGallery from '../components/MasonryGallery'
import SearchBar from '../components/SearchBar'
import { fetchPublicImages } from '../services/publicApi'

const sorts = ['Most relevant', 'Most popular', 'Newest', 'Lowest price', 'Highest price']

export default function SearchPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [images, setImages] = useState([])
  const [pagination, setPagination] = useState({ total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetchPublicImages({ q: query, category, limit: 48 })
      .then((data) => {
        if (!active) return
        setImages(data.images || [])
        setPagination(data.pagination || { total: 0 })
      })
      .catch((fetchError) => {
        if (!active) return
        setImages([])
        setPagination({ total: 0 })
        setError(fetchError.message || 'Unable to load images.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [query, category])

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SearchBar compact />
        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Search results</h1>
            <p className="mt-1 text-slate-600">{pagination.total || images.length} images found {query && `for “${query}”`}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDrawerOpen(true)} className="inline-flex h-14 min-w-44 items-center justify-center gap-4 rounded-full border border-slate-200 bg-white px-8 text-lg font-semibold text-slate-950 shadow-sm shadow-slate-200/70 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 lg:hidden"><SlidersHorizontal size={28} strokeWidth={2.4} /> <span className="leading-none">Filters</span></button>
            <label className="relative inline-flex h-12 min-w-56 items-center rounded-full border border-slate-200 bg-white shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
              <select className="h-full w-full appearance-none rounded-full bg-transparent py-0 pl-6 pr-12 text-base font-semibold leading-none text-slate-700 outline-none">
                {sorts.map((sort) => <option key={sort}>{sort}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            </label>
          </div>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block"><FilterSidebar /></div>
          {loading ? <p className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">Loading images…</p> : error ? <p className="rounded-2xl bg-red-50 p-8 text-center text-red-600">{error}</p> : images.length ? <MasonryGallery images={images} /> : <EmptyState />}
        </div>
      </div>
      {drawerOpen && <FilterDrawer onClose={() => setDrawerOpen(false)} />}
    </main>
  )
}

function FilterDrawer({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden">
      <div className="h-full w-80 max-w-[88vw] overflow-y-auto bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-950">Filters</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100"><X size={18} /></button>
        </div>
        <FilterSidebar />
      </div>
    </div>
  )
}
