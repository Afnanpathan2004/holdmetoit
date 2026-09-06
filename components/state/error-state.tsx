interface ErrorStateProps {
  title: string;
  message: string;
}

export function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <div
      className="rounded-3xl border border-cafe-terracotta/40 bg-cafe-terracotta-surface p-6 text-center"
      role="alert"
    >
      <p className="font-serif text-base font-semibold text-cafe-parchment">
        {title}
      </p>
      <p className="mt-2 text-sm text-cafe-linen">{message}</p>
    </div>
  );
}
