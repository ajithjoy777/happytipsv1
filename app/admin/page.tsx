import Link from "next/link";
import { getDashboardStats } from "@/lib/data";
import { formatMoney, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import { MiniBarChart } from "@/components/MiniBarChart";

const stageTone = {
  NEW: "blue",
  CONTACTED: "amber",
  ONBOARDING: "olive",
  ACTIVE: "lime",
  LOST: "neutral",
} as const;

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Everything happening on the Happy Tips platform, at a glance."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Tips processed (all time)"
          value={formatMoney(stats.allTimeGrossPence)}
          sublabel={`${formatMoney(stats.monthGrossPence)} this month`}
        />
        <StatCard
          label="Platform fee revenue"
          value={formatMoney(stats.allTimeFeePence)}
          sublabel={`${formatMoney(stats.monthFeePence)} this month`}
          accent
        />
        <StatCard label="Active clients" value={String(stats.activeClients)} sublabel="Hotels & Airbnbs live" />
        <StatCard label="Leads in pipeline" value={String(stats.openLeads)} sublabel="Not yet converted" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Recent tips</h2>
            <Link href="/admin/transactions" className="text-xs font-semibold text-brand-olive hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-black/5">
            {stats.recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-semibold">{t.client.name}</p>
                  <p className="text-xs text-black/50">
                    {t.guestName} · {timeAgo(t.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(t.amountPence)}</p>
                  <p className="text-xs text-black/40">net {formatMoney(t.netAmountPence)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Pipeline activity</h2>
            <Link href="/admin/leads" className="text-xs font-semibold text-brand-olive hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentLeads.map((l) => (
              <div key={l.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{l.businessName}</p>
                  <Badge tone={stageTone[l.stage]}>{l.stage}</Badge>
                </div>
                <p className="text-xs text-black/50">
                  {l.assignedTo?.name ?? "Unassigned"} · {timeAgo(l.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="mb-4 font-bold">Website visitors (last 14 days)</h2>
          <MiniBarChart
            data={stats.traffic.map((t) => ({
              label: t.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).slice(0, 5),
              value: t.visitors,
            }))}
          />
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Money waiting to be paid out</h2>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatMoney(stats.pendingPayoutPence)}</p>
          <p className="mt-1 text-xs text-black/50">
            Net amount from recent tips not yet transferred to client bank accounts. Payouts run automatically on a
            weekly Stripe Connect schedule.
          </p>
          <Link
            href="/admin/payouts"
            className="mt-4 inline-block text-xs font-semibold text-brand-olive hover:underline"
          >
            View payouts & bank ledger →
          </Link>
        </div>
      </div>
    </div>
  );
}
