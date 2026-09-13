import Link from "next/link";

const courseTracks = [
  { title: "Government exams", value: "govt-exam", description: "Focused study spaces for UPSC, SSC, banking, and state-level exams." },
  { title: "Entrance exams", value: "entrance-exam", description: "Quiet libraries for JEE, NEET, CUET, and other entrance preparation." },
  { title: "School preparation", value: "school", description: "Reliable study hours and facilities for school students." },
  { title: "Professional exams", value: "professional", description: "Flexible plans for CAT, CLAT, CA, and professional certifications." },
];

export default function CoursesPage() {
  return (
    <main className="bg-sand-100 px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">Courses & preparation</p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold text-forest-900 sm:text-5xl">Study spaces matched to your goal</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-forest-900/70">Choose a preparation track, then find a verified library with the seats, hours, and facilities you need.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {courseTracks.map((track) => (
            <article key={track.title} className="rounded-card border border-line bg-white/85 p-6 shadow-soft">
              <h2 className="text-xl font-semibold text-forest-900">{track.title}</h2>
              <p className="mt-2 text-sm leading-6 text-forest-900/70">{track.description}</p>
              <Link href={`/libraries?exam_type=${track.value}`} className="mt-5 inline-flex h-10 items-center rounded-full bg-forest-700 px-5 text-sm font-semibold text-white transition hover:bg-forest-900">Find libraries</Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
