import Link from "next/link";
import { getClients } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { formatDate } from "@/lib/format";

const statusTone = {
  NOT_STARTED: "neutral",
  PENDING: "amber",
  ACTIVE: "lime",
  RESTRICTED: "red",
} as const;

const statusLabel: Record<string, string> = {
  NOT_STARTED: "Stripe not started",
  PENDING: "Stripe onboarding pending",
  ACTIVE: "Live",
  RESTRICTED: "Needs attention",
};

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Hotels & Airbnbs live on the platform, collecting tips via their QR code."
      />

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="px-4 py-3 font-semibold">Property</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Staff</th>
              <th className="px-4 py-3 font-semibold">Tips collected</th>
              <th className="px-4 py-3 font-semibold">Status</th>
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
                <td className="px-4 py-3 text-black/60">{c.staffCount}</td>
                <td className="px-4 py-3 text-black/60">{c._count.transactions} tips</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[c.stripeStatus]}>{statusLabel[c.stripeStatus]}</Badge>
                </td>
                <td className="px-4 py-3 text-black/40">{formatDate(c.joinedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
