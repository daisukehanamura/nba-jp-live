export default function GamesLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="h-7 w-24 bg-gray-800 rounded mb-4 animate-pulse" />
      <div className="h-10 bg-gray-800 rounded-xl mb-6 animate-pulse" />
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 px-4 py-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-16 bg-gray-800 rounded-full" />
              <div className="h-4 w-14 bg-gray-800 rounded" />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="h-4 w-20 bg-gray-800 rounded" />
                <div className="h-8 w-10 bg-gray-800 rounded" />
              </div>
              <div className="h-6 w-4 bg-gray-800 rounded" />
              <div className="flex flex-col items-center gap-1">
                <div className="h-4 w-20 bg-gray-800 rounded" />
                <div className="h-8 w-10 bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
