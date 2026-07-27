export default function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}
