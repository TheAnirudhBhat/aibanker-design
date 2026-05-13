"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { explorations } from "@/app/preview/registry";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Section link card ─────────────────────────────────────────
const SECTIONS = [
  { href: "/playground/dls", label: "DLS", description: "Colors, typography, spacing, radii, elevation, primitives" },
  { href: "/playground/components", label: "Components", description: "Overlays, trackers, toggles, and chrome compositions" },
  { href: "/playground/visualizations", label: "Visualizations", description: "Data visualizations for spend analysis and tracking" },
  { href: "/playground/widgets", label: "Widgets", description: "Interactive cards for goals, investments, and savings" },
  { href: "/playground/screens", label: "Screens", description: "Individual screens in device frames" },
  { href: "/playground/flows", label: "Flows", description: "Complete user journeys from onboarding to daily use" },
] as const;

function OverviewContent() {
  const searchParams = useSearchParams();
  const componentName = searchParams.get("component");
  const fullscreen = searchParams.get("fullscreen") === "1";
  const variantName = searchParams.get("variant");
  const autoplay = searchParams.get("autoplay") === "1";

  // ── Legacy: fullscreen render ──
  if (fullscreen && componentName) {
    const exp = explorations.find((e) => e.component === componentName);
    const variant = exp?.variants.find((v) => v.name === variantName) ?? exp?.variants[0];
    if (!variant) return <div className="p-10">Variant not found</div>;
    return (
      <>
        <style>{`* { cursor: none !important; }`}</style>
        <div style={{ width: 360, height: 780, overflow: "hidden", position: "relative", background: "#fff" }}>
          {variant.render(autoplay)}
        </div>
      </>
    );
  }

  // ── Legacy: component detail ──
  if (componentName) {
    const exploration = explorations.find((e) => e.component === componentName);
    if (!exploration) {
      return (
        <div className="p-10">
          <p className="text-sm text-muted-foreground">
            No entry for <strong>{componentName}</strong>.
          </p>
          <Link href="/playground" className="text-sm text-primary mt-3 inline-block">
            Back to overview
          </Link>
        </div>
      );
    }

    return (
      <div className="px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-semibold tracking-tight">{exploration.component}</h1>
          <Badge variant="secondary" className="text-xs uppercase">{exploration.category}</Badge>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-6">
          {exploration.variants.map((variant) => (
            <div key={variant.name} className="flex shrink-0 flex-col gap-3">
              <div>
                <h2 className="text-sm font-medium">{variant.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">{variant.description}</p>
              </div>
              <div className="rounded-[32px] bg-[#1a1a1e] p-[6px] shadow-[0_28px_70px_rgba(0,0,0,0.16),0_6px_18px_rgba(0,0,0,0.05)] ring-1 ring-white/5">
                <div className="w-[360px] aspect-[360/780] rounded-[26px] overflow-hidden bg-white relative">
                  {variant.render()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Overview landing ──
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Playground</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse the design system, visualizations, widgets, screens, and flows
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {SECTIONS.map(({ href, label, description }) => (
          <Link key={href} href={href} className="no-underline">
            <Card className="h-full transition-colors hover:border-ring">
              <CardHeader>
                <CardTitle className="text-sm">{label}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted-foreground">Loading...</div>}>
      <OverviewContent />
    </Suspense>
  );
}
