export default function GamesLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">NBA 試合</h1>

      {/* DateNav スケルトン */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
        <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* カードスケルトン */}
      <div className="flex flex-col gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-12 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-6 w-4 bg-gray-100 rounded animate-pulse" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
