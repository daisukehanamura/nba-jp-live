export default function RankingLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
      <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
      <div className="h-28 bg-gray-800 rounded-2xl animate-pulse" />
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 animate-pulse">
            <div className="w-7 h-5 bg-gray-800 rounded" />
            <div className="w-8 h-8 bg-gray-800 rounded-full" />
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-4 w-28 bg-gray-800 rounded" />
              <div className="h-3 w-20 bg-gray-800 rounded" />
            </div>
            <div className="h-5 w-16 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </main>
  )
}
