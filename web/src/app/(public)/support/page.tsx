import Link from "next/link";

const supportTopics = ["Finding a library", "Booking and payment", "Cancellation and refunds", "Owner listings"];

export default function SupportPage() {
  return (
    <main className="bg-sand-100 px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">Support</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-forest-900 sm:text-5xl">Help when you need it</h1>
        <p className="mt-4 text-base leading-7 text-forest-900/70">Start with the FAQs or contact our support team for help with a specific booking.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {supportTopics.map((topic) => <Link key={topic} href="/#faqs" className="rounded-2xl border border-line bg-white/85 p-5 text-sm font-semibold text-forest-900 shadow-soft transition hover:border-forest-700">{topic}</Link>)}
        </div>
        <a href="mailto:support@scholarshub.in" className="mt-8 inline-flex h-11 items-center rounded-full bg-forest-700 px-6 text-sm font-semibold text-white transition hover:bg-forest-900">Email support</a>
      </div>
    </main>
  );
}
