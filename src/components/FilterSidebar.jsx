const filterGroups = [
  { label: 'Content type', options: ['Photos', 'Illustrations', 'Vectors', 'All Images'] },
  { label: 'Category', options: ['Nature', 'Business', 'Technology', 'People', 'Travel', 'Food'] },
  { label: 'Image orientation', options: ['Landscape', 'Portrait', 'Square'] },
  { label: 'Image color', options: ['Blue', 'Green', 'Black', 'White', 'Warm'] },
  { label: 'Image size', options: ['Small', 'Medium', 'Large', 'Vector'] },
  { label: 'File format', options: ['JPG', 'PNG', 'SVG', 'EPS'] },
  { label: 'License type', options: ['Standard', 'Extended'] },
]

export default function FilterSidebar() {
  return (
    <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Filters</h2>
        <p className="mt-1 text-sm text-slate-500">Refine your search results.</p>
      </div>
      {filterGroups.map((group) => (
        <div key={group.label} className="border-t border-slate-100 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">{group.label}</h3>
          <div className="space-y-2">
            {group.options.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="border-t border-slate-100 pt-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Price range</h3>
        <input type="range" min="0" max="100" defaultValue="60" className="w-full accent-blue-600" />
        <div className="mt-2 flex justify-between text-xs text-slate-500"><span>$0</span><span>$100+</span></div>
      </div>
    </aside>
  )
}
