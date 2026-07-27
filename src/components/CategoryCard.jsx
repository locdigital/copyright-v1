import { Link } from 'react-router-dom'

export default function CategoryCard({ category }) {
  return (
    <Link to={`/search?category=${category.slug}`} className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={category.image} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="flex items-center justify-between p-4">
        <h3 className="font-semibold text-slate-950">{category.name}</h3>
        <span className="text-sm text-blue-600 opacity-0 transition group-hover:opacity-100">Explore</span>
      </div>
    </Link>
  )
}
