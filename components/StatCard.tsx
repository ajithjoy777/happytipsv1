export function StatCard({
  label,
  value,
  sublabel,
  accent = false,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? "border-brand-black bg-brand-black text-brand-cream" : "border-black/10 bg-white"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-brand-lime" : "text-black/50"}`}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {sublabel && (
        <p className={`mt-1 text-xs ${accent ? "text-brand-cream/70" : "text-black/50"}`}>{sublabel}</p>
      )}
    </div>
  );
}
