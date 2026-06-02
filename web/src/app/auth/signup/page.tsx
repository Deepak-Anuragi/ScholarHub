import Link from "next/link";

const roles = [
  {
    label: "Student",
    description: "Browse libraries, book seats, and manage IDs.",
  },
  {
    label: "Library Owner",
    description: "List your library, manage slots, and track revenue.",
  },
  {
    label: "Parent",
    description: "Manage bookings for a student account.",
  },
];

export default function SignupPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-forest-900/70">Get started</p>
        <h2 className="mt-2 font-display text-2xl text-forest-900">
          Create your Scholar's Hub account
        </h2>
      </div>

      <form className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-forest-900">
            Full name
            <input
              className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
              placeholder="Your name"
              type="text"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-forest-900">
            Phone number
            <input
              className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
              placeholder="10-digit phone"
              type="tel"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-forest-900">
          Email address
          <input
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
            placeholder="name@email.com"
            type="email"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-forest-900">
          City
          <input
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
            placeholder="Your city"
            type="text"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-forest-900">
          Password
          <input
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
            placeholder="Create a password"
            type="password"
          />
        </label>

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-forest-900">Select role</p>
          <div className="grid gap-2">
            {roles.map((role) => (
              <label
                key={role.label}
                className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3 text-sm text-forest-900"
              >
                <input
                  className="mt-1 h-4 w-4 rounded border-line"
                  defaultChecked={role.label === "Student"}
                  name="role"
                  type="radio"
                />
                <div>
                  <p className="font-semibold text-forest-900">
                    {role.label}
                  </p>
                  <p className="text-sm text-forest-900/70">
                    {role.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          className="h-11 rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
          type="button"
        >
          Create account
        </button>
      </form>

      <p className="text-sm text-forest-900/70">
        Already have an account?{" "}
        <Link className="font-semibold text-forest-900" href="/auth/login">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
