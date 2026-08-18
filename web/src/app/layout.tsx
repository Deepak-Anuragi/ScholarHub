import type { Metadata } from "next";
import { Fraunces, Space_Grotesk, Inter } from "next/font/google";

import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: "Scholar's Hub",
  description: "Find your study spot, in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", spaceGrotesk.variable, fraunces.variable, "font-sans", inter.variable)}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <LenisProvider>
            <AppShell>{children}</AppShell>
          </LenisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
