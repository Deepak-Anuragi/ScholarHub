interface Props {
  message?: string;
}

export default function FormError({ message }: Props) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <span className="mt-0.5 shrink-0" aria-hidden>
        ⚠
      </span>
      <span>{message}</span>
    </div>
  );
}
