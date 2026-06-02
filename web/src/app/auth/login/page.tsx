import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-forest-900/70">Welcome back</p>
        <h2 className="mt-2 font-display text-2xl text-forest-900">
          Sign in to your account
        </h2>
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
        <label className="grid gap-2 text-sm font-semibold text-forest-900">
          Password
          <input
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
            placeholder="Enter your password"
            type="password"
          />
        </label>
        <div className="flex items-center justify-between text-sm text-forest-900/70">
          <label className="flex items-center gap-2">
            <input className="h-4 w-4 rounded border-line" type="checkbox" />
            Remember me
          </label>
          <Link
            className="text-sm font-semibold text-forest-900 transition hover:text-forest-700"
            href="/auth/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <button
          className="h-11 rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
          type="button"
        >
          Sign in
        </button>
      </form>

      <div className="rounded-2xl border border-line bg-sage-100/60 p-4">
        <p className="text-sm font-semibold text-forest-900">Demo role</p>
        <p className="mt-1 text-sm text-forest-900/70">
          Switch between roles to preview dashboards later.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {"Student,Library Owner,Admin".split(",").map((role) => (
            <button
              key={role}
              className="h-10 rounded-full border border-line bg-white text-sm font-semibold text-forest-900 transition hover:border-forest-700"
              type="button"
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-forest-900/70">
        New to Scholar's Hub?{" "}
        <Link className="font-semibold text-forest-900" href="/auth/signup">
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}
