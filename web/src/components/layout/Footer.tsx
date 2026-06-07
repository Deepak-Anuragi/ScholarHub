import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

import GradientText from "@/components/GradientText/GradientText";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Browse Libraries", href: "/libraries" },
  { label: "Add Library", href: "/auth/signup?role=owner" },
  { label: "Courses", href: "/courses" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const studentLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "FAQs", href: "/faqs" },
  { label: "Support", href: "/support" },
];

const ownerLinks = [
  { label: "List your library", href: "/auth/signup?role=owner" },
  { label: "Owner login", href: "/auth/login?role=owner" },
];

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const socialLinks: {
  label: string;
  href: string;
  icon: () => ReactNode;
}[] = [
  { label: "Twitter", href: "https://twitter.com", icon: TwitterIcon },
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon },
  { label: "LinkedIn", href: "https://linkedin.com", icon: LinkedInIcon },
  { label: "GitHub", href: "https://github.com", icon: GitHubIcon },
];

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-forest-900 dark:text-foreground">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-forest-900/70 transition hover:text-forest-900 dark:text-muted-foreground dark:hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-white/80 dark:border-border dark:bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white">
                <BookOpen className="size-5" aria-hidden />
              </div>
              <span className="font-display text-lg font-semibold text-forest-900 dark:text-foreground">
                Scholar&apos;s Hub
              </span>
            </Link>
            <GradientText
              colors={["#16a34a", "#0ea5e9", "#16a34a"]}
              animationSpeed={6}
              className="max-w-xs text-sm font-medium"
            >
              Find your study spot, in seconds.
            </GradientText>
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map(({ label, href, icon: SocialIcon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-line text-forest-900/70 transition hover:border-[#16a34a] hover:text-[#16a34a] dark:border-border dark:text-muted-foreground dark:hover:text-foreground"
                >
                  <SocialIcon />
                </a>
              ))}
            </div>
          </div>

          <FooterLinkGroup title="Quick links" links={quickLinks} />

          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            <FooterLinkGroup title="For Students" links={studentLinks} />
            <FooterLinkGroup title="For Library Owners" links={ownerLinks} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-sm text-forest-900/70 dark:border-border dark:text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2025 Scholar&apos;s Hub. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/privacy"
              className="transition hover:text-forest-900 dark:hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <span aria-hidden className="hidden sm:inline">
              |
            </span>
            <Link
              href="/terms"
              className="transition hover:text-forest-900 dark:hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
