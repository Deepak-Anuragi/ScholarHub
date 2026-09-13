export default function PrivacyPage() {
  return (
    <main className="bg-sand-100 px-4 py-16 sm:px-6 lg:py-24">
      <article className="mx-auto max-w-3xl text-forest-900">
        <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-forest-900/60">Last updated: September 14, 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-forest-900/75">
          <section><h2 className="text-lg font-semibold text-forest-900">Information we use</h2><p className="mt-2">We use account, booking, and library information to provide authentication, reservations, payments, notifications, and support.</p></section>
          <section><h2 className="text-lg font-semibold text-forest-900">How we protect it</h2><p className="mt-2">Session credentials are protected with secure, httpOnly cookies. Payment details are handled by our payment provider and are not stored by Scholar&apos;s Hub.</p></section>
          <section><h2 className="text-lg font-semibold text-forest-900">Questions</h2><p className="mt-2">For privacy requests, contact support@scholarshub.in.</p></section>
        </div>
      </article>
    </main>
  );
}
