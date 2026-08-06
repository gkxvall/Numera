"use client";

import { useEffect, type ReactNode } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useMatchSetupStore } from "@/stores/matchSetupStore";
import { MATCH_PRESETS } from "@/config/matchPresets";
import { matchSettingsSchema, type MatchSettingsInput } from "./schemas";
import { cn } from "@/lib/cn";

export interface MatchSettingsFormProps {
  onBack: () => void;
  onStartMatch: () => void;
}

export function MatchSettingsForm({ onBack, onStartMatch }: MatchSettingsFormProps) {
  const settings = useMatchSetupStore((state) => state.settings);
  const selectedPresetId = useMatchSetupStore((state) => state.selectedPresetId);
  const updateSettings = useMatchSetupStore((state) => state.updateSettings);
  const applyPreset = useMatchSetupStore((state) => state.applyPreset);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<MatchSettingsInput>({
    resolver: zodResolver(matchSettingsSchema),
    defaultValues: settings,
    mode: "onChange",
  });

  // Presets are applied in the store, then mirrored into the form as its baseline — the
  // form itself stays the single source of truth for in-progress edits. Deliberately
  // keyed on `selectedPresetId`, not `settings`: the store's `settings` object gets a new
  // reference on *any* update, including the persist middleware's passive rehydration on
  // mount, which would otherwise silently wipe out whatever the player had just typed.
  useEffect(() => {
    reset(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- settings is read fresh each run; only re-sync when selectedPresetId actually changes (a deliberate preset click), see comment above
  }, [selectedPresetId]);

  const timerEnabled = watch("turnTimerSeconds") !== null;

  function onSubmit(values: MatchSettingsInput) {
    updateSettings(values);
    onStartMatch();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-foreground text-3xl">Match settings</h1>

      <div>
        <h2 className="text-foreground/70 mb-2 text-xs font-semibold uppercase">Presets</h2>
        <div className="flex flex-wrap gap-2">
          {MATCH_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              aria-pressed={preset.id === selectedPresetId}
              className={cn(
                "border-numera-outline rounded-full border-2 px-4 py-2 text-sm font-bold",
                preset.id === selectedPresetId
                  ? "bg-numera-blue text-white"
                  : "bg-numera-surface text-foreground",
              )}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-5"
      >
        <Card className="flex flex-col gap-4">
          <Field label="Game mode" htmlFor="mode">
            <select id="mode" {...register("mode")} className={selectClass}>
              <option value="classic">Classic Survival</option>
              <option value="multiLife">Multi-Life Survival</option>
              <option value="suddenDeath">Sudden Death</option>
            </select>
          </Field>

          <Field
            label="Starting lives"
            htmlFor="startingLives"
            error={errors.startingLives?.message}
          >
            <input
              id="startingLives"
              type="number"
              min={1}
              max={5}
              {...register("startingLives", { valueAsNumber: true })}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Min target"
              htmlFor="targetRange.min"
              error={errors.targetRange?.min?.message}
            >
              <input
                id="targetRange.min"
                type="number"
                {...register("targetRange.min", { valueAsNumber: true })}
                className={inputClass}
              />
            </Field>
            <Field
              label="Max target"
              htmlFor="targetRange.max"
              error={errors.targetRange?.max?.message}
            >
              <input
                id="targetRange.max"
                type="number"
                {...register("targetRange.max", { valueAsNumber: true })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Maximum move (+1 to +N)" htmlFor="maxMove" error={errors.maxMove?.message}>
            <input
              id="maxMove"
              type="number"
              min={1}
              max={6}
              {...register("maxMove", { valueAsNumber: true })}
              className={inputClass}
            />
          </Field>

          <div className="flex items-center justify-between">
            <label htmlFor="timerEnabled" className="text-sm font-semibold">
              Turn timer
            </label>
            <input
              id="timerEnabled"
              type="checkbox"
              checked={timerEnabled}
              onChange={(event) =>
                setValue("turnTimerSeconds", event.target.checked ? 10 : null, {
                  shouldValidate: true,
                })
              }
              className="h-6 w-6"
            />
          </div>
          {timerEnabled && (
            <Field
              label="Timer seconds"
              htmlFor="turnTimerSeconds"
              error={errors.turnTimerSeconds?.message}
            >
              <input
                id="turnTimerSeconds"
                type="number"
                min={3}
                max={60}
                {...register("turnTimerSeconds", { valueAsNumber: true })}
                className={inputClass}
              />
            </Field>
          )}

          <ToggleField
            label="Randomize player order"
            htmlFor="randomizePlayerOrder"
            registration={register("randomizePlayerOrder")}
          />
          <ToggleField
            label="Danger indicator"
            htmlFor="dangerIndicatorEnabled"
            registration={register("dangerIndicatorEnabled")}
          />
          <ToggleField
            label="Adaptive target range"
            htmlFor="adaptiveTargetRange"
            registration={register("adaptiveTargetRange")}
          />
          <ToggleField
            label="Power-ups"
            htmlFor="powerUpsEnabled"
            registration={register("powerUpsEnabled")}
          />

          <Field label="Default bot personality" htmlFor="botDifficulty">
            <select id="botDifficulty" {...register("botDifficulty")} className={selectClass}>
              <option value="random">Random</option>
              <option value="careful">Careful</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
              <option value="trickster">Trickster</option>
            </select>
          </Field>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" size="lg" fullWidth disabled={!isValid}>
            Start match
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "border-numera-outline focus-visible:ring-numera-blue h-11 rounded-xl border-2 px-3 text-base focus-visible:ring-4 focus-visible:outline-none";
const selectClass = inputClass;

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-numera-red text-xs font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}

function ToggleField({
  label,
  htmlFor,
  registration,
}: {
  label: string;
  htmlFor: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      <input id={htmlFor} type="checkbox" {...registration} className="h-6 w-6" />
    </div>
  );
}
