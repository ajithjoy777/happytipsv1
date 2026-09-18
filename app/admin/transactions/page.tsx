import { getTransactions } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { formatDateTime, formatMoney } from "@/lib/format";

const statusTone = { SUCCEEDED: "lime", FAILED: "red", REFUNDED: "amber" } as const;

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  const totalGross = transactions.filter((t) => t.status === "SUCCEEDED").reduce((s, t) => s + t.amountPence, 0);
  const totalFee = transactions.filter((t) => t.status === "SUCCEEDED").reduce((s, t) => s + t.platformFeePence, 0);

  return (
    <div>
      <PageHeader
        title="Transactions"
        description={`${transactions.length} tips shown · ${formatMoney(totalGross)} gross · ${formatMoney(
          totalFee
        )} platform fee`}
      />

      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Guest</th>
              <th className="px-4 py-3 font-semibold">Gross</th>
              <th className="px-4 py-3 font-semibold">Platform fee</th>
              <th className="px-4 py-3 font-semibold">Net to owner</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Stripe ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-black/[0.02]">
                <td className="whitespace-nowrap px-4 py-2.5 text-black/50">{formatDateTime(t.createdAt)}</td>
                <td className="px-4 py-2.5 font-semibold">{t.client.name}</td>
                <td className="px-4 py-2.5 text-black/60">{t.guestName ?? "—"}</td>
                <td className="px-4 py-2.5 font-semibold">{formatMoney(t.amountPence)}</td>
                <td className="px-4 py-2.5 text-black/60">{formatMoney(t.platformFeePence)}</td>
                <td className="px-4 py-2.5 text-black/60">{formatMoney(t.netAmountPence)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[t.status]}>{t.status}</Badge>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-black/40">{t.stripePaymentIntentId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
