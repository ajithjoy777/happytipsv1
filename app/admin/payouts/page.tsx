import { getPayoutsData } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import { formatDateTime, formatMoney } from "@/lib/format";

const ledgerLabel: Record<string, string> = {
  FEE_REVENUE: "Fee revenue (£10/tip)",
  STRIPE_PAYOUT_IN: "Stripe payout → bank",
  CASH_OUT: "Cash out",
  MANUAL_ADJUSTMENT: "Manual adjustment",
};

const ledgerTone = {
  FEE_REVENUE: "lime",
  STRIPE_PAYOUT_IN: "olive",
  CASH_OUT: "red",
  MANUAL_ADJUSTMENT: "amber",
} as const;

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const { ledger, clientPayouts, bankBalancePence, pendingFeeInStripe } = await getPayoutsData();

  const totalClientPayouts = clientPayouts.reduce((s, p) => s + p.amountPence, 0);

  return (
    <div>
      <PageHeader
        title="Payouts & bank"
        description="Your business bank account, plus every payout sent to hotel & Airbnb owners."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          label="Business bank balance"
          value={formatMoney(bankBalancePence)}
          sublabel="Fee revenue + payouts − cash out"
          accent
        />
        <StatCard
          label="Sitting in Stripe (not yet swept)"
          value={formatMoney(pendingFeeInStripe)}
          sublabel="Our fee share from unpaid-out tips"
        />
        <StatCard label="Total sent to owners" value={formatMoney(totalClientPayouts)} sublabel="All-time, via Stripe Connect" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="mb-3 font-bold">Business bank ledger</h2>
          <p className="mb-3 text-xs text-black/50">Cash in / cash out for Happy Tips&apos; own operating account.</p>
          <div className="max-h-[520px] divide-y divide-black/5 overflow-y-auto">
            {ledger.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <Badge tone={ledgerTone[e.type]}>{ledgerLabel[e.type]}</Badge>
                  <p className="mt-1 text-xs text-black/50">{e.description}</p>
                  <p className="text-[11px] text-black/30">{formatDateTime(e.createdAt)}</p>
                </div>
                <p className={`font-semibold ${e.amountPence < 0 ? "text-red-600" : "text-brand-olive"}`}>
                  {formatMoney(e.amountPence)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="mb-3 font-bold">Client payouts</h2>
          <p className="mb-3 text-xs text-black/50">
            Automatic Stripe Connect transfers of net tips to each owner&apos;s bank account.
          </p>
          <div className="max-h-[520px] divide-y divide-black/5 overflow-y-auto">
            {clientPayouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-semibold">{p.client.name}</p>
                  <p className="text-xs text-black/40">
                    {p.transactions.length} tips · {formatDateTime(p.createdAt)}
                  </p>
                  <p className="font-mono text-[11px] text-black/30">{p.stripeTransferId}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(p.amountPence)}</p>
                  <Badge tone={p.status === "PAID" ? "lime" : "amber"}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
