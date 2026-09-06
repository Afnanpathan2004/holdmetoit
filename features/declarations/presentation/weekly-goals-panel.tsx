"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveDeclarationsAction,
  toggleWeeklyGoalAction,
} from "@/features/declarations/api/declaration.actions";
import type { CockpitGoal } from "@/features/study-logs/data/cockpit-data";
import { cn } from "@/lib/utils";

interface WeeklyGoalsPanelProps {
  challengeId: string;
  goals: CockpitGoal[];
  targetClock: string;
  canEditDeclarations: boolean;
  canToggleGoals: boolean;
  isReadOnly: boolean;
}

export function WeeklyGoalsPanel({
  challengeId,
  goals,
  targetClock,
  canEditDeclarations,
  canToggleGoals,
  isReadOnly,
}: WeeklyGoalsPanelProps) {
  const completedCount = goals.filter((goal) => goal.completed).length;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (canEditDeclarations) {
    return (
      <DeclarationForm
        challengeId={challengeId}
        initialTargetClock={targetClock}
        initialGoals={goals}
        isPending={isPending}
        feedback={feedback}
        onSubmit={(payload) => {
          setFeedback(null);
          startTransition(async () => {
            const result = await saveDeclarationsAction(payload);
            setFeedback(result.ok ? "Declarations saved." : result.message);
          });
        }}
      />
    );
  }

  return (
    <section className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
            Weekly Intentions
          </h2>
          <p className="text-xs text-cafe-oatmeal">
            Target: <span className="font-mono font-mono-tabular">{targetClock}</span>
          </p>
        </div>
        <p className="text-xs text-cafe-ash">
          {completedCount} / {goals.length} Finished
        </p>
      </header>

      {goals.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-cafe-border px-4 py-6 text-center text-sm text-cafe-oatmeal">
          No weekly goals declared yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {goals.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              disabled={!canToggleGoals || isReadOnly || isPending}
              onToggle={(completed) => {
                setFeedback(null);
                startTransition(async () => {
                  const result = await toggleWeeklyGoalAction({
                    challengeId,
                    goalId: goal.id,
                    completed,
                  });
                  if (!result.ok) {
                    setFeedback(result.message);
                  }
                });
              }}
            />
          ))}
        </ul>
      )}

      {feedback ? (
        <p role="alert" className="mt-4 text-sm text-cafe-terracotta">
          {feedback}
        </p>
      ) : null}

      {isReadOnly ? (
        <p className="mt-4 text-xs text-cafe-ash">
          This challenge is complete — goals are read-only.
        </p>
      ) : null}
    </section>
  );
}

interface GoalRowProps {
  goal: CockpitGoal;
  disabled: boolean;
  onToggle: (completed: boolean) => void;
}

function GoalRow({ goal, disabled, onToggle }: GoalRowProps) {
  return (
    <li>
      <label
        className={cn(
          "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-2xl border border-cafe-border bg-cafe-elevated/40 px-4 py-3",
          goal.completed && "opacity-70",
        )}
      >
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 rounded border-cafe-border accent-cafe-sage"
          checked={goal.completed}
          disabled={disabled}
          onChange={(event) => onToggle(event.target.checked)}
        />
        <span
          className={cn(
            "text-sm text-cafe-parchment",
            goal.completed && "line-through text-cafe-oatmeal",
          )}
        >
          {goal.description}
        </span>
      </label>
    </li>
  );
}

interface DeclarationFormProps {
  challengeId: string;
  initialTargetClock: string;
  initialGoals: CockpitGoal[];
  isPending: boolean;
  feedback: string | null;
  onSubmit: (payload: {
    challengeId: string;
    targetClock: string;
    goals: string[];
  }) => void;
}

function DeclarationForm({
  challengeId,
  initialTargetClock,
  initialGoals,
  isPending,
  feedback,
  onSubmit,
}: DeclarationFormProps) {
  const [targetClock, setTargetClock] = useState(
    initialTargetClock === "00:00:00" ? "35:00:00" : initialTargetClock,
  );
  const [goalLines, setGoalLines] = useState<string[]>(
    initialGoals.length > 0
      ? initialGoals.map((goal) => goal.description)
      : ["", "", ""],
  );

  return (
    <section className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
      <header className="mb-4">
        <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
          Pre-Kickoff Declarations
        </h2>
        <p className="text-xs text-cafe-oatmeal">
          Set your weekly target and 1–10 intentions before kickoff locks them.
        </p>
      </header>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="weekly-target"
            className="mb-2 block text-xs font-medium text-cafe-linen"
          >
            Weekly Target (HH:MM:SS)
          </label>
          <Input
            id="weekly-target"
            value={targetClock}
            onChange={(event) => setTargetClock(event.target.value)}
            placeholder="35:00:00"
            className="font-mono font-mono-tabular"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-cafe-linen">Weekly Goals</p>
          {goalLines.map((goal, index) => (
            <Input
              key={index}
              value={goal}
              placeholder={`Goal ${index + 1}`}
              disabled={isPending}
              onChange={(event) => {
                const next = [...goalLines];
                next[index] = event.target.value;
                setGoalLines(next);
              }}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px]"
            disabled={isPending || goalLines.length >= 10}
            onClick={() => setGoalLines([...goalLines, ""])}
          >
            Add Goal
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px]"
            disabled={isPending || goalLines.length <= 1}
            onClick={() => setGoalLines(goalLines.slice(0, -1))}
          >
            Remove Goal
          </Button>
        </div>

        {feedback ? (
          <p
            role="status"
            className={cn(
              "text-sm",
              feedback.endsWith("saved.") ? "text-cafe-sage" : "text-cafe-terracotta",
            )}
          >
            {feedback}
          </p>
        ) : null}

        <Button
          type="button"
          className="min-h-[44px] w-full"
          disabled={isPending}
          onClick={() =>
            onSubmit({
              challengeId,
              targetClock,
              goals: goalLines.filter((line) => line.trim().length > 0),
            })
          }
        >
          {isPending ? "Saving…" : "Save Declarations"}
        </Button>
      </div>
    </section>
  );
}
