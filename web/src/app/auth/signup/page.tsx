import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="grid gap-6">
      {/* Heading */}
      <div>
        <p className="text-sm font-semibold text-forest-900/70">Get started</p>
        <h2 className="mt-2 font-display text-2xl text-forest-900">
          Create your Scholar&apos;s Hub account
        </h2>
        <p className="mt-1 text-sm text-forest-900/60">
          Choose how you want to use the platform
        </p>
      </div>

      {/* Role cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Student */}
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 transition hover:shadow-soft">
          <span className="text-3xl" aria-hidden>🎓</span>
          <div>
            <h3 className="font-semibold text-forest-900">I&apos;m a Student</h3>
            <p className="mt-1 text-sm text-forest-900/60">
              Find and book the best study library near you. Compare fees,
              facilities, and reviews.
            </p>
          </div>
          <Link
            href="/auth/signup/student"
            className="mt-auto flex h-10 w-full items-center justify-center rounded-full bg-forest-700 text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
          >
            Sign up as Student
          </Link>
        </div>

        {/* Library Owner */}
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 transition hover:shadow-soft">
          <span className="text-3xl" aria-hidden>🏛️</span>
          <div>
            <h3 className="font-semibold text-forest-900">I Own a Library</h3>
            <p className="mt-1 text-sm text-forest-900/60">
              List your library on Scholar&apos;s Hub and reach thousands of
              students in your city.
            </p>
          </div>
          <Link
            href="/auth/signup/owner"
            className="mt-auto flex h-10 w-full items-center justify-center rounded-full border border-forest-700 text-sm font-semibold text-forest-700 transition hover:bg-forest-700/5"
          >
            Register My Library
          </Link>
        </div>
      </div>

      <p className="text-sm text-forest-900/70">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-forest-900 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
