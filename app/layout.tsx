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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // When the on-screen keyboard opens, resize the layout so the chat input stays pinned above it
  // (acts like a native chat app) instead of the keyboard covering the field.
  interactiveWidget: "resizes-content",
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
