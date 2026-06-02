import Link from "next/link";

type HeaderAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type SiteHeaderProps = {
  actions?: HeaderAction[];
  mobileAction?: HeaderAction;
  showNav?: boolean;
};

const defaultActions: HeaderAction[] = [
  { label: "Sign in", href: "/auth/login", variant: "secondary" },
  { label: "List your library", href: "/auth/signup?role=owner", variant: "primary" },
];

const defaultMobileAction: HeaderAction = {
  label: "Explore",
  href: "/libraries",
  variant: "primary",
};

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Libraries", href: "/libraries" },
  { label: "Seat map", href: "/map" },
  { label: "How it works", href: "/#how-it-works" },
];

export function SiteHeader({
  actions = defaultActions,
  mobileAction = defaultMobileAction,
  showNav = true,
}: SiteHeaderProps) {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-700 text-sm font-semibold text-sand-100">
          SH
        </div>
        <div>
          <p className="font-display text-lg text-forest-900">Scholar's Hub</p>
          <p className="text-sm text-forest-900/70">
            Find your study spot, in seconds.
          </p>
        </div>
      </Link>

      {showNav ? (
        <nav className="hidden items-center gap-6 text-sm font-medium text-forest-900/70 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              className="transition hover:text-forest-900"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : (
        <div className="hidden md:block" />
      )}

      <div className="flex items-center gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={
              action.variant === "primary"
                ? "hidden h-11 items-center rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900 md:inline-flex"
                : "hidden h-11 items-center rounded-full border border-line bg-white/70 px-5 text-sm font-medium text-forest-900 transition hover:border-forest-700 md:inline-flex"
            }
          >
            {action.label}
          </Link>
        ))}
        <Link
          href={mobileAction.href}
          className="inline-flex h-11 items-center rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900 md:hidden"
        >
          {mobileAction.label}
        </Link>
      </div>
    </header>
  );
}
