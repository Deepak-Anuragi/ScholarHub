export default function TermsPage() {
  return (
    <main className="bg-sand-100 px-4 py-16 sm:px-6 lg:py-24">
      <article className="mx-auto max-w-3xl text-forest-900">
        <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-forest-900/60">Last updated: September 14, 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-forest-900/75">
          <section><h2 className="text-lg font-semibold text-forest-900">Using the service</h2><p className="mt-2">Provide accurate account details, keep your login information private, and use bookings only for their stated purpose.</p></section>
          <section><h2 className="text-lg font-semibold text-forest-900">Bookings</h2><p className="mt-2">Library availability, pricing, access rules, and cancellation terms are shown in the listing or booking flow. Library-specific policies apply to each reservation.</p></section>
          <section><h2 className="text-lg font-semibold text-forest-900">Support</h2><p className="mt-2">Questions about these terms can be sent to support@scholarshub.in.</p></section>
        </div>
      </article>
    </main>
  );
}
