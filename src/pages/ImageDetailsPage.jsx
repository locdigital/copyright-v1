import { Heart, ShieldCheck, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LicenseSelector from '../components/LicenseSelector'
import MasonryGallery from '../components/MasonryGallery'
import { fetchPublicImage } from '../services/publicApi'

export default function ImageDetailsPage() {
  const { id } = useParams()
  const [license, setLicense] = useState('standard')
  const [image, setImage] = useState(null)
  const [similarImages, setSimilarImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetchPublicImage(id)
      .then((data) => {
        if (!active) return
        setImage(data.image)
        setSimilarImages(data.similarImages || [])
      })
      .catch((fetchError) => {
        if (!active) return
        setError(fetchError.message || 'Unable to load image.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  if (loading) return <main className="bg-white"><div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500 sm:px-6 lg:px-8">Loading image details…</div></main>
  if (error || !image) return <main className="bg-white"><div className="mx-auto max-w-7xl px-4 py-20 text-center text-red-600 sm:px-6 lg:px-8">{error || 'Image not found.'}</div></main>

  const contributor = image.contributor
  const watermarkOwner = image.copyrightOwner || 'Image Copyright Hub'
  const watermarks = Array.from({ length: 18 })

  return (
    <main className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <div>
          <div className="relative overflow-hidden rounded-lg bg-slate-100 shadow-sm">
            <img src={image.image || '/favicon.svg'} alt={image.altText || image.title} draggable="false" onError={(event) => { event.currentTarget.src = '/favicon.svg' }} onContextMenu={(event) => event.preventDefault()} className="h-auto w-full object-contain" />
            <div className="pointer-events-none absolute inset-[-18%] z-10 grid rotate-[-32deg] grid-cols-3 place-items-center gap-x-32 gap-y-24 opacity-20 sm:grid-cols-3 sm:gap-x-44 sm:gap-y-28 lg:gap-x-56">
              {watermarks.map((_, index) => <span key={index} className="inline-flex whitespace-nowrap text-[11px] font-black text-white [gap:10px] [text-shadow:0_1px_8px_rgba(15,23,42,0.35)] sm:text-xs"><span>{watermarkOwner}</span><span>Image Copyright Hub</span></span>)}
            </div>
            <div className="pointer-events-none absolute bottom-5 left-4 z-10 origin-left -rotate-90 text-xs font-black text-white/80 [text-shadow:0_1px_8px_rgba(15,23,42,0.45)]">Image Copyright Hub · #{image.id}</div>
            <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 bg-slate-950/70 px-4 py-2.5 text-white backdrop-blur-sm sm:px-6">
              <span className="text-base font-black tracking-tight sm:text-xl">Image Copyright Hub</span>
              <span className="text-right text-[11px] font-semibold uppercase tracking-wider text-white/75 sm:text-xs">Preview ID: {image.id}</span>
            </div>
          </div>
          <section className="mt-10">
            <h2 className="text-2xl font-black text-slate-950">Similar images</h2>
            <div className="mt-6"><MasonryGallery images={similarImages} /></div>
          </section>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{image.type}</span>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{image.title}</h1>
                <p className="mt-3 leading-7 text-slate-600">{image.description}</p>
              </div>
              <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"><Heart size={20} /></button>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <img src={contributor?.avatar || '/favicon.svg'} alt={contributor?.name || 'Image Copyright Hub'} className="h-12 w-12 rounded-lg object-cover" />
              <div><p className="font-semibold text-slate-950">{contributor?.name}</p><p className="text-sm text-slate-500">{contributor?.role}</p></div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {[
                ['Dimensions', image.dimensions], ['Format', image.format], ['File size', image.fileSize], ['Upload date', image.uploadDate], ['Category', image.category], ['License', image.license],
              ].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-3"><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-900">{value}</dd></div>)}
            </dl>
            <div className="mt-6"><h2 className="mb-3 font-bold text-slate-950">Choose license</h2><LicenseSelector selected={license} onChange={setLicense} /></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link to="/cart" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 font-bold text-slate-800 transition hover:bg-slate-50"><ShoppingCart size={18} /> Add to cart</Link>
              <Link to="/checkout" className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"><ShieldCheck size={18} /> Buy License</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">{(image.keywords || []).map((keyword) => <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{keyword}</span>)}</div>
          </div>
        </aside>
      </div>
    </main>
  )
}
