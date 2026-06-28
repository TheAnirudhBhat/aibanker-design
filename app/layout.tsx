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
  // Added-to-home-screen (iOS standalone): a transparent status bar so the flow shows through it
  // instead of iOS drawing its default white bar (which read as a mismatched strip over the
  // Valentino launch screen). Pairs with viewport-fit=cover + the app-bar safe-area inset.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "slice banker",
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Extend the flow edge-to-edge under the phone's status bar / notch (no white strip up top).
  viewportFit: "cover",
  // When the on-screen keyboard opens, resize the layout so the chat input stays pinned above it
  // (acts like a native chat app) instead of the keyboard covering the field.
  interactiveWidget: "resizes-content",
  // Tint the status-bar area to the app canvas so it reads as one surface, not a white bar.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
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
