"use client";

import { useState, type ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { ItemStatus } from "./status-registry";
import DeviceFrame from "./DeviceFrame";

const STATUS_BADGE_VARIANT: Record<ItemStatus, "outline" | "secondary" | "default"> = {
  exploring: "outline",
  confirmed: "secondary",
  integrated: "default",
};

type Props = {
  name: string;
  description?: string;
  status: ItemStatus;
  onCycleStatus: () => void;
  variants?: string[];
  activeVariantIndex?: number;
  onVariantChange?: (index: number) => void;
  deviceFrame?: boolean;
  autoplay?: boolean;
  onToggleAutoplay?: () => void;
  children: ReactNode;
};

export default function PlaygroundCard({
  name,
  description,
  status,
  onCycleStatus,
  variants,
  activeVariantIndex = 0,
  onVariantChange,
  deviceFrame = false,
  autoplay,
  onToggleAutoplay,
  children,
}: Props) {
  const hasVariants = variants && variants.length > 1;
  const [resetKey, setResetKey] = useState(0);

  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">{name}</CardTitle>
            {description && (
              <CardDescription className="mt-0.5">{description}</CardDescription>
            )}
          </div>
          <button
            type="button"
            onClick={onCycleStatus}
            className="shrink-0 cursor-pointer border-none bg-transparent p-0"
          >
            <Badge variant={STATUS_BADGE_VARIANT[status]}>{status}</Badge>
          </button>
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

      <CardContent className="p-0" key={resetKey}>
        {deviceFrame ? (
          <div className="flex justify-center p-6">
            <DeviceFrame>{children}</DeviceFrame>
          </div>
        ) : (
          <div className="p-6">
            <div className="w-[360px]">
              {children}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
