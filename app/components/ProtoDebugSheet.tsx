"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { SubstateGroup } from "@/app/data/userStatePresets";
import { protoFlagsFor, useProtoFlagValues, useProtoScreen, visibleProtoFlags } from "@/app/lib/protoFlags";
// Shared with the desktop left-nav so the persona switch always lists every surface.
import { APP_PERSONAS } from "@/app/data/appNav";
import { useTheme } from "@/app/lib/theme";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ProtoFlagControls, ProtoSubstateControls } from "@/app/components/ProtoControls";

type ProtoDebugSheetProps = {
  open: boolean;
  onClose: () => void;
  personaId: string;
  title: string;
  description: string;
  controls?: SubstateGroup[];
  activeSubstates: Record<string, number>;
  locked: boolean;
  onSubstateChange: (groupLabel: string, idx: number) => void;
};

/**
 * The phone's prototype debug panel, surfaced by the 3-finger tap-and-hold. It is the desktop
 * control column's own card — same header, same flags and states through the same ProtoControls,
 * in the same order, with the same lock — so the two can't drift apart (user call: they had).
 * A phone has no top bar or left nav, so theme and reload sit under the header and the persona
 * switch at the foot.
 * Dev-only chrome, not product UI.
 */
export default function ProtoDebugSheet({
  open,
  onClose,
  personaId,
  title,
  description,
  controls,
  activeSubstates,
  locked,
  onSubstateChange,
}: ProtoDebugSheetProps) {
  const router = useRouter();
  const { mode, toggle } = useTheme();
  const flagValues = useProtoFlagValues(personaId);
  const protoScreen = useProtoScreen();
  const flagDefs = visibleProtoFlags(protoFlagsFor(personaId), flagValues, protoScreen);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-black/40" onClick={onClose}>
      <Card
        className="animate-editor-in max-h-[80dvh] overflow-y-auto overscroll-contain rounded-b-none rounded-t-3xl border-x-0 border-b-0 pt-3"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* grabber */}
        <div aria-hidden className="mx-auto -mb-3 h-1 w-9 shrink-0 rounded-full bg-border" />

        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          <CardAction>
            <Button variant="outline" size="icon-sm" className="rounded-full" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </Button>
          </CardAction>
        </CardHeader>

        {/* theme + reload sit up top, where the desktop keeps them (its top bar):
            at the foot of a long sheet they fell under iOS's toolbar and out of
            reach (user call: the theme couldn't be changed on a phone) */}
        <CardContent className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => toggle()}>
            {mode === "dark" ? "Light mode" : "Dark mode"}
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </CardContent>

        {flagDefs.length > 0 && (
          <CardContent className="flex flex-col gap-5">
            <ProtoFlagControls defs={flagDefs} values={flagValues} />
          </CardContent>
        )}

        {!!controls?.length && (
          <CardContent className="flex flex-col gap-5">
            <ProtoSubstateControls controls={controls} activeSubstates={activeSubstates} locked={locked} onChange={onSubstateChange} />
          </CardContent>
        )}

        {/* phone-only: what the desktop gets from its left nav */}
        <CardContent className="flex flex-col gap-5">
          <Separator />
          <div className="flex flex-col gap-2.5">
            <Label className="text-xs">Persona</Label>
            <ToggleGroup
              type="single"
              value={personaId}
              onValueChange={(val) => {
                if (val && val !== personaId) router.push(`/app/${val}`);
                onClose();
              }}
              variant="outline"
              size="sm"
              className="justify-start flex-wrap"
            >
              {APP_PERSONAS.map((p) => (
                <ToggleGroupItem key={p.id} value={p.id} className="text-xs">
                  {p.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
