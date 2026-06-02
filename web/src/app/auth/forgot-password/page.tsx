import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-forest-900/70">Reset access</p>
        <h2 className="mt-2 font-display text-2xl text-forest-900">
          Forgot your password?
        </h2>
        <p className="mt-2 text-sm text-forest-900/70">
          Enter your email and we will send a reset link.
        </p>
      </div>

      <form className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-forest-900">
          Email address
          <input
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
            placeholder="name@email.com"
            type="email"
          />
        </label>
        <button
          className="h-11 rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
          type="button"
        >
          Send reset link
        </button>
      </form>

      <p className="text-sm text-forest-900/70">
        Remembered your password?{" "}
        <Link className="font-semibold text-forest-900" href="/auth/login">
          Back to sign in
        </Link>
        .
      </p>
    </div>
  );
}
