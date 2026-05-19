"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Reusable control panel pattern for playground entries with orthogonal properties.
// Renders shadcn primitives in the canonical "label left, control right" row.
//
// Two ways to use:
//   1. Slots: <ControlPanel><ControlRow label="X"><CustomControl/></ControlRow></ControlPanel>
//   2. Declarative: const [state, panel] = useControlPanel({ ... }); render {panel}

// ── Primitives ─────────────────────────────────────────────────

export function ControlPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-[240px] shrink-0 flex-col gap-3 border-l pl-6">
      {children}
    </div>
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
      <Label htmlFor={htmlFor} className="text-sm text-muted-foreground shrink-0">
        {label}
      </Label>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

// ── Declarative hook ───────────────────────────────────────────

type SelectField = {
  kind: "select";
  label: string;
  options: readonly string[];
  default: string;
};
type SwitchField = { kind: "switch"; label: string; default: boolean };
type InputField = { kind: "input"; label: string; default: string };

export type Field = SelectField | SwitchField | InputField;
export type Schema = Record<string, Field>;

type ValueOf<F extends Field> = F extends SelectField
  ? F["options"][number]
  : F extends SwitchField
    ? boolean
    : F extends InputField
      ? string
      : never;

export type StateOf<S extends Schema> = { [K in keyof S]: ValueOf<S[K]> };

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
        {Object.entries(stableSchema).map(([key, field]) => {
          const id = `cp-${key}`;
          const current = state[key as keyof StateOf<S>] as unknown;

          if (field.kind === "switch") {
            return (
              <ControlRow key={key} label={field.label} htmlFor={id}>
                <Switch
                  id={id}
                  checked={current as boolean}
                  onCheckedChange={(v) =>
                    setState((s) => ({ ...s, [key]: v }) as StateOf<S>)
                  }
                />
              </ControlRow>
            );
          }

          if (field.kind === "select") {
            return (
              <ControlRow key={key} label={field.label} htmlFor={id}>
                <Select
                  value={current as string}
                  onValueChange={(v) =>
                    setState((s) => ({ ...s, [key]: v }) as StateOf<S>)
                  }
                >
                  <SelectTrigger id={id} size="sm" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlRow>
            );
          }

          if (field.kind === "input") {
            return (
              <ControlRow key={key} label={field.label} htmlFor={id}>
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

          return null;
        })}
      </ControlPanel>
    ),
    [state, stableSchema]
  );

  return [state, panel];
}
