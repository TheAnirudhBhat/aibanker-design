"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";

const NAV_LINKS = [
  { href: "/app/new-user-jun-11", label: "App", prefix: "/app" },
  { href: "/playground/dls", label: "Playground", prefix: "/playground" },
  { href: "/skills", label: "Skills", prefix: "/skills" },
];

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
      </div>
    </header>
  );
}
