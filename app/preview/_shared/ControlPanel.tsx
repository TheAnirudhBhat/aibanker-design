"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent } from "@/components/ui/card";

// Reusable control panel pattern for playground entries with orthogonal properties.
// Mirrors the in-app persona panel style (`app/(main)/app/[persona]/page.tsx`):
// outlined Card; section label above + segmented ToggleGroup below for selects;
// inline label-left/control-right rows for switches and inputs; Separator between
// fields. Toggle groups stay on a single line.
//
// Two ways to use:
//   1. Slots: <ControlPanel><ControlRow label="X"><CustomControl/></ControlRow></ControlPanel>
//   2. Declarative: const [state, panel] = useControlPanel({ ... }); render {panel}

// ── Primitives ─────────────────────────────────────────────────

export function ControlPanel({ children }: { children: ReactNode }) {
  return (
    <Card className="w-[340px] shrink-0 self-start">
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  );
}

export function ControlRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-9">
      <Label htmlFor={htmlFor} className="text-xs shrink-0">
        {label}
      </Label>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

// ── Declarative hook ───────────────────────────────────────────

export type SelectOption =
  | string
  | { readonly label: string; readonly value: string };

type SelectField = {
  kind: "select";
  label: string;
  options: readonly SelectOption[];
  default: string;
};
type SwitchField = { kind: "switch"; label: string; default: boolean };
type InputField = { kind: "input"; label: string; default: string };

export type Field = SelectField | SwitchField | InputField;
export type Schema = Record<string, Field>;

type OptionValue<O> = O extends string
  ? O
  : O extends { value: infer V }
    ? V
    : never;

type ValueOf<F extends Field> = F extends SelectField
  ? OptionValue<F["options"][number]>
  : F extends SwitchField
    ? boolean
    : F extends InputField
      ? string
      : never;

export type StateOf<S extends Schema> = { [K in keyof S]: ValueOf<S[K]> };

function normalizeOptions(
  options: readonly SelectOption[]
): { label: string; value: string }[] {
  return options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
}

export function useControlPanel<S extends Schema>(
  schema: S
): [StateOf<S>, ReactNode] {
  const defaults = useMemo(() => {
    const obj: Record<string, unknown> = {};
    for (const k in schema) obj[k] = schema[k].default;
    return obj as StateOf<S>;
    // schema is treated as static - defining it inline at the call site is the norm
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, setState] = useState<StateOf<S>>(defaults);

  // schema is captured at first render; consumers declare it inline as a literal,
  // so changing it across renders is treated as "same" by this hook
  const stableSchema = useMemo(() => schema, []);

  const panel = useMemo(
    () => (
      <ControlPanel>
        {Object.entries(stableSchema).map(([key, field], idx) => {
          const id = `cp-${key}`;
          const current = state[key as keyof StateOf<S>] as unknown;

          let control: ReactNode = null;

          if (field.kind === "switch") {
            control = (
              <ControlRow label={field.label} htmlFor={id}>
                <Switch
                  id={id}
                  checked={current as boolean}
                  onCheckedChange={(v) =>
                    setState((s) => ({ ...s, [key]: v }) as StateOf<S>)
                  }
                />
              </ControlRow>
            );
          } else if (field.kind === "select") {
            const opts = normalizeOptions(field.options);
            control = (
              <div className="flex flex-col gap-2.5">
                <Label htmlFor={id} className="text-xs">
                  {field.label}
                </Label>
                <ToggleGroup
                  id={id}
                  type="single"
                  variant="outline"
                  size="sm"
                  value={current as string}
                  onValueChange={(v) => {
                    if (!v) return;
                    setState((s) => ({ ...s, [key]: v }) as StateOf<S>);
                  }}
                  className="justify-start"
                >
                  {opts.map((o) => (
                    <ToggleGroupItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            );
          } else if (field.kind === "input") {
            control = (
              <ControlRow label={field.label} htmlFor={id}>
                <Input
                  id={id}
                  value={current as string}
                  onChange={(e) =>
                    setState((s) => ({ ...s, [key]: e.target.value }) as StateOf<S>)
                  }
                  className="h-8 w-[160px]"
                />
              </ControlRow>
            );
          }

          return (
            <Fragment key={key}>
              {idx > 0 && <Separator />}
              {control}
            </Fragment>
          );
        })}
      </ControlPanel>
    ),
    [state, stableSchema]
  );

  return [state, panel];
}
