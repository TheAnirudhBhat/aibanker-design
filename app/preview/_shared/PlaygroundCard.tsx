"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { ItemStatus } from "./status-registry";
import DeviceFrame from "./DeviceFrame";

// Context that lets a nested rendered component publish its control panel
// into the parent card's right-side slot. Use via `useSlotControls(panel)`.
const SlotControlsContext = createContext<((c: ReactNode) => void) | null>(null);

/**
 * Call from inside a variant-rendered component to publish a control panel
 * into the parent PlaygroundCard's right slot. Pass `null` to clear.
 */
export function useSlotControls(panel: ReactNode) {
  const set = useContext(SlotControlsContext);
  useEffect(() => {
    if (!set) return;
    set(panel);
    return () => set(null);
  }, [set, panel]);
}

const STATUS_BADGE_VARIANT: Record<ItemStatus, "outline" | "secondary" | "default"> = {
  exploring: "outline",
  confirmed: "secondary",
  integrated: "default",
};

type Props = {
  id?: string;
  name: string;
  description?: string;
  status: ItemStatus;
  variants?: string[];
  activeVariantIndex?: number;
  onVariantChange?: (index: number) => void;
  deviceFrame?: boolean;
  autoplay?: boolean;
  onToggleAutoplay?: () => void;
  /** Optional control panel rendered to the right of the preview. */
  controls?: ReactNode;
  children: ReactNode;
};

export default function PlaygroundCard({
  id,
  name,
  description,
  status,
  variants,
  activeVariantIndex = 0,
  onVariantChange,
  deviceFrame = false,
  autoplay,
  onToggleAutoplay,
  controls,
  children,
}: Props) {
  const hasVariants = variants && variants.length > 1;
  const [resetKey, setResetKey] = useState(0);
  const [slotControls, setSlotControlsState] = useState<ReactNode>(null);
  const setSlotControls = useCallback((c: ReactNode) => setSlotControlsState(c), []);
  const effectiveControls = slotControls ?? controls;

  // The page renders inside a custom scrollable container (flex-1 overflow-y-auto),
  // so the browser's default hash-jump doesn't reach in. Listen for hash matches
  // and use scrollIntoView, which traverses nested scrollable ancestors.
  useEffect(() => {
    if (!id) return;
    const scrollIfMatched = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === `#${id}`) {
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" });
        });
      }
    };
    scrollIfMatched();
    window.addEventListener("hashchange", scrollIfMatched);
    return () => window.removeEventListener("hashchange", scrollIfMatched);
  }, [id]);

  return (
    <Card id={id} className="rounded-none shadow-none scroll-mt-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">{name}</CardTitle>
            {description && (
              <CardDescription className="mt-0.5">{description}</CardDescription>
            )}
          </div>
          <Badge
            variant={STATUS_BADGE_VARIANT[status]}
            className="shrink-0"
            title="Auto-derived from code. Change the code or run design-lint to change this."
          >
            {status}
          </Badge>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {hasVariants && onVariantChange && (
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={String(activeVariantIndex)}
              onValueChange={(val) => {
                if (val !== "") onVariantChange(Number(val));
              }}
            >
              {variants.map((v, i) => (
                <ToggleGroupItem key={v} value={String(i)} className="text-xs capitalize">
                  {v}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
          {onToggleAutoplay && (
            <Button
              variant={autoplay ? "default" : "outline"}
              size="icon"
              className="size-7"
              onClick={onToggleAutoplay}
              title={autoplay ? "Pause autoplay" : "Start autoplay"}
            >
              {autoplay ? <Pause className="size-3" /> : <Play className="size-3" />}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setResetKey((k) => k + 1)}
            title="Restart flow"
          >
            <RotateCcw className="size-3" />
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <SlotControlsContext.Provider value={setSlotControls}>
        <CardContent className="p-0" key={`${resetKey}-${activeVariantIndex}`}>
          <div className="flex gap-6 p-6">
            {deviceFrame ? (
              <div className="flex justify-center">
                <DeviceFrame>{children}</DeviceFrame>
              </div>
            ) : (
              <div className="w-[360px]">{children}</div>
            )}
            {effectiveControls}
          </div>
        </CardContent>
      </SlotControlsContext.Provider>
    </Card>
  );
}
