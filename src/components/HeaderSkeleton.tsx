export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-800 animate-pulse" />
            <div className="w-20 h-4 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="w-16 h-4 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
      </div>
    </header>
  )
}
