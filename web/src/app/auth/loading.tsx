export default function Loading() {
  return (
    <div className="grid gap-6 animate-pulse">
      <div className="h-6 w-40 rounded-full bg-sage-100" />
      <div className="grid gap-3">
        <div className="h-4 w-24 rounded-full bg-sage-100" />
        <div className="h-11 w-full rounded-xl bg-sage-100" />
        <div className="h-4 w-28 rounded-full bg-sage-100" />
        <div className="h-11 w-full rounded-xl bg-sage-100" />
        <div className="h-11 w-full rounded-full bg-sage-100" />
      </div>
      <div className="h-4 w-56 rounded-full bg-sage-100" />
    </div>
  );
}
