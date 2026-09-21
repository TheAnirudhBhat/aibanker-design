import type { Metadata, Viewport } from "next";
import { Rubik, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Agentation } from "agentation";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "slice banker prototype",
  description: "Chat-first personal banker prototype",
  // Added-to-home-screen (iOS standalone): OPAQUE status bar, tinted by the
  // theme-color below (white by day, slice black after dark). R33h made it
  // translucent so the ambient scene ran clean under the clock, but since
  // iOS 26.1 a translucent bar over viewport-fit=cover gets a system-drawn
  // scroll-edge band that no CSS or meta reaches (near-black on iOS 27): the
  // "black layer" over the top of every scene (user report, 2026-09-21). The
  // web view now starts under the bar, env(safe-area-inset-top) reads 0 and
  // the chrome follows it down; the scene's calm top meets the bar's tint.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "slice banker",
  },
  // the slice wordmark on Valentino (the user's own asset, R33w) serves as
  // BOTH the favicon and the home-screen icon. Lives under public/ — the repo
  // ignores PNGs everywhere else as dev artifacts (the default favicon.ico is
  // gone so it can't compete).
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // A phone frame shouldn't zoom: this kills double-tap zoom and, on iOS, the
  // automatic zoom when you focus an input smaller than 16px (the chat field).
  maximumScale: 1,
  userScalable: false,
  // Kept for the BOTTOM inset (the home indicator); the top now belongs to the
  // opaque status bar above.
  viewportFit: "cover",
  // When the on-screen keyboard opens, resize the layout so the chat input stays pinned above it
  // (acts like a native chat app) instead of the keyboard covering the field.
  interactiveWidget: "resizes-content",
  // Tint Safari's chrome to the canvas per SYSTEM scheme — white by day, slice
  // black after dark (the single white value painted a white band over the dark
  // pages, R33h). Standalone paints its opaque status bar with it too.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090b0c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rubik.variable} ${bricolage.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === "development" && <Agentation endpoint="http://localhost:4747" />}
      </body>
    </html>
  );
}
