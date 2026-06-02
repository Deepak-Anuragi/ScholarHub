import Link from "next/link";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Libraries", href: "/libraries" },
  { label: "Seat map", href: "/map" },
  { label: "Sign up", href: "/auth/signup" },
  { label: "Sign in", href: "/auth/login" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-forest-900/70 sm:flex-row sm:items-center sm:justify-between">
        <p>Scholar's Hub. Built for focused learning.</p>
        <div className="flex flex-wrap gap-4">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              className="transition hover:text-forest-900"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
