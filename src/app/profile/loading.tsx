export default function ProfileLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
      <div className="h-7 w-24 bg-gray-800 rounded animate-pulse" />
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gray-800 rounded-full" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-32 bg-gray-800 rounded" />
            <div className="h-4 w-24 bg-gray-800 rounded" />
          </div>
        </div>
        <div className="h-10 bg-gray-800 rounded-xl" />
      </div>
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 animate-pulse">
        <div className="h-5 w-24 bg-gray-800 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  )
}
