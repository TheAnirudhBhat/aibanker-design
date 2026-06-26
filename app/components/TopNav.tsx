"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/lib/theme";

const NAV_LINKS = [
  { href: "/app/new-user-jun-11", label: "App", prefix: "/app" },
  { href: "/playground/dls", label: "Playground", prefix: "/playground" },
  { href: "/skills", label: "Skills", prefix: "/skills" },
];

// Sun | Moon segmented theme toggle — lives top-right of the global nav (dev-harness chrome).
function DarkModeToggle() {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";
  return (
    <button
      type="button"
      onClick={(e) => toggle({ x: e.clientX, y: e.clientY })}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0.5 top-0.5 h-7 w-7 rounded-full bg-foreground shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: isDark ? "translateX(30px)" : "translateX(0px)", viewTransitionName: "theme-toggle-pill" }}
      />
      <span className={`relative z-10 flex h-7 w-7 items-center justify-center transition-colors duration-300 ${!isDark ? "text-background" : "text-muted-foreground"}`}>
        <Sun className="h-3.5 w-3.5" />
      </span>
      <span className={`relative z-10 flex h-7 w-7 items-center justify-center transition-colors duration-300 ${isDark ? "text-background" : "text-muted-foreground"}`}>
        <Moon className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-14 items-center px-6 gap-6">
        {/* Logo */}
        <Link
          href="/app/new-user-jun-11"
          className="text-sm font-semibold tracking-tight text-foreground no-underline"
        >
          AI Banker
        </Link>

        <Separator orientation="vertical" className="h-4" />

        {/* Section tabs */}
        <nav className="flex items-center gap-5">
          {NAV_LINKS.map(({ href, label, prefix }) => {
            const isActive = pathname.startsWith(prefix);
            return (
              <Link
                key={prefix}
                href={href}
                className={`text-sm no-underline transition-colors ${
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
