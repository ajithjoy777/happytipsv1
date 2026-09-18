const styles: Record<string, string> = {
  neutral: "bg-black/5 text-brand-black",
  lime: "bg-brand-lime text-brand-black",
  olive: "bg-brand-olive/15 text-brand-olive",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof styles;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
