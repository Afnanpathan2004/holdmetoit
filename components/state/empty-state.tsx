import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="rounded-3xl border border-cafe-border bg-cafe-card p-8 text-center shadow-cafe"
      role="status"
    >
      <p className="font-serif text-lg font-semibold text-cafe-parchment">
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-cafe-oatmeal">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
