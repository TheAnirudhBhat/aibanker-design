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
  // Added-to-home-screen (iOS standalone): the proto's surfaces are all white now,
  // so the status bar is a plain white bar with dark glyphs — the old translucent
  // style drew white glyphs over the white page, an invisible clock (R13).
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "slice banker",
  },
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
  // Tint the status-bar area to the app canvas so it reads as one surface — the
  // canvas is white in every persona, so the bar stays white even on phones set
  // to dark mode (the dark variant painted a black strip over the white page, R13).
  themeColor: "#FFFFFF",
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
