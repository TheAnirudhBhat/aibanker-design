"use client";

import { Lock } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { SubstateGroup } from "@/app/data/userStatePresets";
import { setProtoFlag, type ProtoFlagDef } from "@/app/lib/protoFlags";

/**
 * The prototype controls both debug surfaces draw — the desktop control column
 * and the phone's 3-finger sheet — so the two list the same flags and states,
 * in the same order, with the same controls (user call: they had drifted apart).
 */
export function ProtoFlagControls({ defs, values }: { defs: ProtoFlagDef[]; values: Record<string, string> }) {
  return (
    <>
      {defs.map((def) => (
        // the flag id leads the class list so an agentation pin names the row
        <div key={def.id} className={`flag-${def.id} flex flex-col gap-2.5`}>
          <Label className="text-xs">{def.label}</Label>
          <ToggleGroup
            type="single"
            value={values[def.id]}
            onValueChange={(val) => { if (val) setProtoFlag(def.id, val); }}
            variant="outline"
            size="sm"
            className="justify-start flex-wrap"
          >
            {def.options.map((opt) => (
              <ToggleGroupItem key={opt.id} value={opt.id} className="text-xs">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {def.options.find((o) => o.id === values[def.id])?.hint && (
            <p className="text-xs text-muted-foreground">
              {def.options.find((o) => o.id === values[def.id])?.hint}
            </p>
          )}
        </div>
      ))}
    </>
  );
}

export function ProtoSubstateControls({
  controls,
  activeSubstates,
  locked,
  onChange,
}: {
  controls: SubstateGroup[];
  activeSubstates: Record<string, number>;
  locked: boolean;
  onChange: (groupLabel: string, idx: number) => void;
}) {
  return (
    <>
      {controls.map((group, gi) => {
        const activeIdx = activeSubstates[group.label] ?? 0;
        const activeId = group.substates[activeIdx]?.id ?? group.substates[0]?.id;
        return (
          <div key={group.label}>
            {gi > 0 && <Separator className="mb-5" />}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs">{group.label}</Label>
                {locked && <Lock className="size-3 text-muted-foreground" />}
              </div>
              <ToggleGroup
                type="single"
                value={activeId}
                disabled={locked}
                onValueChange={(val) => {
                  if (!val || locked) return;
                  const idx = group.substates.findIndex((s) => s.id === val);
                  if (idx >= 0) onChange(group.label, idx);
                }}
                variant="outline"
                size="sm"
                className="justify-start flex-wrap"
              >
                {group.substates.map((s) => (
                  <ToggleGroupItem key={s.id} value={s.id} className="text-xs">
                    {s.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        );
      })}

      {locked && (
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
          <Lock className="size-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Hit reload to change state
          </p>
        </div>
      )}
    </>
  );
}
