export default function CompareLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="mb-6 animate-pulse space-y-2">
        <div className="h-4 w-32 rounded-full bg-sage-200/60" />
        <div className="h-8 w-56 rounded-full bg-sage-200/60" />
        <div className="h-3 w-72 rounded-full bg-sage-100" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-card border border-line bg-white/80 shadow-soft animate-pulse">
        <div
          className="grid"
          style={{ gridTemplateColumns: "minmax(120px, 0.8fr) 1fr 1fr" }}
        >
          {/* Header row */}
          <div className="bg-white/50 px-4 py-5" />
          {[0, 1].map((i) => (
            <div key={i} className="bg-sage-200/60 px-4 py-5">
              <div className="mx-auto h-5 w-3/4 rounded-full bg-white/30" />
              <div className="mx-auto mt-2 h-3 w-1/2 rounded-full bg-white/20" />
            </div>
          ))}

          {/* Data rows */}
          {Array.from({ length: 9 }).flatMap((_, row) => [
            <div key={`label-${row}`} className={`px-4 py-3 ${row % 2 === 1 ? "bg-sage-100/50" : "bg-white/95"}`}>
              <div className="h-3 w-20 rounded-full bg-sage-200/60" />
            </div>,
            ...[0, 1].map((col) => (
              <div
                key={`${row}-${col}`}
                className={`px-4 py-3 ${row % 2 === 1 ? "bg-sage-100/30" : "bg-white/80"}`}
              >
                <div className="mx-auto h-4 w-2/3 rounded-full bg-sage-200/50" />
              </div>
            )),
          ])}
        </div>
      </div>
    </div>
  );
}
