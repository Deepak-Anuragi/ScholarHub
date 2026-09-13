import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="bg-sand-100 px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">Contact</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-forest-900 sm:text-5xl">Let&apos;s help you find the right place to study</h1>
        <p className="mt-4 text-base leading-7 text-forest-900/70">For booking help, listing questions, or partnership enquiries, email our team and we&apos;ll get back to you.</p>
        <div className="mt-8 rounded-card border border-line bg-white/85 p-6 shadow-soft">
          <p className="text-sm font-semibold text-forest-900">Email support</p>
          <a href="mailto:support@scholarshub.in" className="mt-2 inline-block text-sm font-semibold text-forest-700 hover:text-forest-900">support@scholarshub.in</a>
          <p className="mt-3 text-sm text-forest-900/65">Please include your registered email and booking ID when asking about an existing reservation.</p>
        </div>
        <Link href="/#faqs" className="mt-8 inline-flex h-11 items-center rounded-full border border-line bg-white/70 px-6 text-sm font-semibold text-forest-900 transition hover:border-forest-700">Read FAQs</Link>
      </div>
    </main>
  );
}
