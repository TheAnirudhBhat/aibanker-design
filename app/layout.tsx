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
  // Added-to-home-screen (iOS standalone): TRANSPARENT status bar (user call,
  // R33h) — the ambient scene runs clean under the clock instead of a white or
  // black strip cutting the top. The page reserves env(safe-area-inset-top)
  // itself. iOS pairs translucency with white glyphs, the R13 trade-off — fine
  // on the ambient crown and after dark, faint on the all-white personas.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "slice banker",
  },
  // home-screen icon: the slice bolt, white on Valentino (R33v). Lives under
  // public/ — the repo ignores PNGs everywhere else as dev artifacts.
  icons: { apple: "/apple-touch-icon.png" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // A phone frame shouldn't zoom: this kills double-tap zoom and, on iOS, the
  // automatic zoom when you focus an input smaller than 16px (the chat field).
  maximumScale: 1,
  userScalable: false,
  // Extend the flow edge-to-edge under the phone's status bar / notch (no white strip up top).
  viewportFit: "cover",
  // When the on-screen keyboard opens, resize the layout so the chat input stays pinned above it
  // (acts like a native chat app) instead of the keyboard covering the field.
  interactiveWidget: "resizes-content",
  // Tint Safari's chrome to the canvas per SYSTEM scheme — white by day, slice
  // black after dark (the single white value painted a white band over the dark
  // pages, R33h). Standalone ignores this and rides the translucent bar above.
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
