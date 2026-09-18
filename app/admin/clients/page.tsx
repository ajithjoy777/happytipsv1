import Link from "next/link";
import { getClients } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { formatDate, formatMoney } from "@/lib/format";

const stripeStatusTone = {
  NOT_STARTED: "neutral",
  PENDING: "amber",
  ACTIVE: "lime",
  RESTRICTED: "red",
} as const;

const stripeStatusLabel: Record<string, string> = {
  NOT_STARTED: "Stripe not started",
  PENDING: "Stripe onboarding pending",
  ACTIVE: "Payouts live",
  RESTRICTED: "Needs attention",
};

const billingTone = { ACTIVE: "lime", PAST_DUE: "red", CANCELED: "neutral" } as const;

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Hotels & Airbnbs live on the platform, each paying a monthly subscription (£10/room, capped at £50)."
      />

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="px-4 py-3 font-semibold">Property</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Rooms</th>
              <th className="px-4 py-3 font-semibold">Subscription</th>
              <th className="px-4 py-3 font-semibold">Billing</th>
              <th className="px-4 py-3 font-semibold">Payouts</th>
              <th className="px-4 py-3 font-semibold">Tips</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-black/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin/clients/${c.slug}`} className="font-semibold hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-xs text-black/40">{c.contactName}</p>
                </td>
                <td className="px-4 py-3 text-black/60">{c.propertyType === "HOTEL" ? "Hotel" : "Airbnb"}</td>
                <td className="px-4 py-3 text-black/60">{c.roomCount}</td>
                <td className="px-4 py-3 font-semibold">{formatMoney(c.subscriptionFeePence)}/mo</td>
                <td className="px-4 py-3">
                  <Badge tone={billingTone[c.billingStatus]}>{c.billingStatus.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={stripeStatusTone[c.stripeStatus]}>{stripeStatusLabel[c.stripeStatus]}</Badge>
                </td>
                <td className="px-4 py-3 text-black/60">{c._count.transactions}</td>
                <td className="px-4 py-3 text-black/40">{formatDate(c.joinedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
