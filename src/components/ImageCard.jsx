import { Eye, Heart, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

const fallbackImage = '/favicon.svg'

function getAspectRatio(image) {
  if (image.aspectRatio) return image.aspectRatio
  const orientation = String(image.orientation || '').toLowerCase()
  if (orientation === 'portrait') return 0.72
  if (orientation === 'square') return 1
  return 1.45
}

export default function ImageCard({ image }) {
  const contributorName = image.contributor?.name || 'Image Copyright Hub'
  const aspectRatio = getAspectRatio(image)

  return (
    <Link to={`/image/${image.slug || image.id}`} className="group relative block break-inside-avoid overflow-hidden rounded-lg bg-slate-100 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80" style={{ aspectRatio }}>
      <img src={image.image || fallbackImage} alt={image.altText || image.title} draggable="false" onError={(event) => { event.currentTarget.src = fallbackImage }} onContextMenu={(event) => event.preventDefault()} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      <div className="absolute left-3 top-3 z-10 text-white/95 drop-shadow"><Star size={16} /></div>
      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent p-3 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="flex justify-end gap-2">
          {[Heart, Eye].map((Icon, index) => (
            <button key={index} type="button" onClick={(event) => event.preventDefault()} className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-900 shadow-sm transition hover:bg-blue-600 hover:text-white" aria-label="Image action">
              <Icon size={16} />
            </button>
          ))}
        </div>
        <div className="text-white">
          <h3 className="line-clamp-1 text-sm font-bold">{image.title}</h3>
          <p className="line-clamp-1 text-xs text-white/80">by {contributorName}</p>
        </div>
      </div>
    </Link>
  )
}
