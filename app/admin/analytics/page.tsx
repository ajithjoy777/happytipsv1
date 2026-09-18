import { getTrafficData } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { MiniBarChart } from "@/components/MiniBarChart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const traffic = await getTrafficData();

  const sum = (key: "visitors" | "leadFormViews" | "leadsCaptured" | "tipPageViews" | "tipsCompleted") =>
    traffic.reduce((s, t) => s + t[key], 0);

  const visitors = sum("visitors");
  const leadFormViews = sum("leadFormViews");
  const leadsCaptured = sum("leadsCaptured");
  const tipPageViews = sum("tipPageViews");
  const tipsCompleted = sum("tipsCompleted");

  const chartData = (key: "visitors" | "leadFormViews" | "leadsCaptured" | "tipPageViews" | "tipsCompleted") =>
    traffic.map((t) => ({
      label: t.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).slice(0, 5),
      value: t[key],
    }));

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Website traffic and how it turns into leads and guest tips, over the last 30 days."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Website visitors" value={visitors.toLocaleString()} />
        <StatCard label="Lead form views" value={leadFormViews.toLocaleString()} />
        <StatCard
          label="Leads captured"
          value={leadsCaptured.toLocaleString()}
          sublabel={`${((leadsCaptured / leadFormViews) * 100).toFixed(0)}% of form views`}
          accent
        />
        <StatCard label="QR / tip page views" value={tipPageViews.toLocaleString()} />
        <StatCard
          label="Tips completed"
          value={tipsCompleted.toLocaleString()}
          sublabel={`${((tipsCompleted / tipPageViews) * 100).toFixed(0)}% of tip page views`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="mb-4 font-bold">Website visitors</h2>
          <MiniBarChart data={chartData("visitors")} />
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="mb-4 font-bold">Leads captured</h2>
          <MiniBarChart data={chartData("leadsCaptured")} />
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="mb-4 font-bold">Guest tip page views</h2>
          <MiniBarChart data={chartData("tipPageViews")} />
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="mb-4 font-bold">Tips completed</h2>
          <MiniBarChart data={chartData("tipsCompleted")} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="mb-2 font-bold">Sales funnel</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <FunnelStep label="Website visitors" value={visitors} />
          <Arrow />
          <FunnelStep label="Viewed lead form" value={leadFormViews} />
          <Arrow />
          <FunnelStep label="Became a lead" value={leadsCaptured} highlight />
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-center ${
        highlight ? "bg-brand-lime text-brand-black" : "bg-black/5"
      }`}
    >
      <p className="text-lg font-bold">{value.toLocaleString()}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function Arrow() {
  return <span className="text-black/20">→</span>;
}
