export default function Loading() {
  return <main className="min-h-screen bg-sand-100 px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl animate-pulse"><div className="h-9 w-64 rounded-full bg-sage-100" /><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 rounded-card bg-white/80" />)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><div className="h-80 rounded-card bg-white/80" /><div className="h-80 rounded-card bg-white/80" /></div></div></main>;
}
