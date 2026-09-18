export function MiniBarChart({
  data,
  formatValue = (v: number) => String(v),
}: {
  data: { label: string; value: number }[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((d, i) => (
        <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
          <div className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded bg-brand-black px-1.5 py-0.5 text-[10px] font-semibold text-brand-cream group-hover:block">
            {formatValue(d.value)}
          </div>
          <div
            className="w-full rounded-t bg-brand-olive/30 transition-colors group-hover:bg-brand-lime"
            style={{ height: `${Math.max((d.value / max) * 100, 3)}%` }}
          />
          <span className="mt-1 text-[9px] text-black/40">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
