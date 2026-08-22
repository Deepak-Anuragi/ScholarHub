interface Props {
  message?: string;
}

export default function FormSuccess({ message }: Props) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
    >
      <span className="mt-0.5 shrink-0" aria-hidden>
        ✓
      </span>
      <span>{message}</span>
    </div>
  );
}
