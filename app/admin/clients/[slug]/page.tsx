import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { getClientBySlug, getClientTotals } from "@/lib/data";
import { getTipUrl } from "@/lib/site";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { completeStripeOnboarding, markSubscriptionPaid, updateTransactionFeePercent } from "../actions";

const stripeStatusTone = {
  NOT_STARTED: "neutral",
  PENDING: "amber",
  ACTIVE: "lime",
  RESTRICTED: "red",
} as const;

const billingTone = { ACTIVE: "lime", PAST_DUE: "red", CANCELED: "neutral" } as const;

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const totals = await getClientTotals(client.id);
  const tipUrl = getTipUrl(client.slug);
  const qrDataUrl = await QRCode.toDataURL(tipUrl, {
    margin: 1,
    color: { dark: "#0b0b0b", light: "#00000000" },
    width: 240,
  });
  const isLive = client.stripeStatus === "ACTIVE" && client.billingStatus === "ACTIVE";

  return (
    <div>
      <PageHeader
        title={client.name}
        description={`${client.propertyType === "HOTEL" ? "Hotel" : "Airbnb"} · ${client.roomCount} room${client.roomCount > 1 ? "s" : ""} · joined ${formatDate(client.joinedAt)}`}
        action={
          <Link href="/admin/clients" className="text-sm font-semibold text-brand-olive hover:underline">
            ← All clients
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tip volume" value={formatMoney(totals.tipVolumePence)} sublabel={`${totals.txCount} tips`} />
        <StatCard label="Sent to owner" value={formatMoney(totals.netPence)} sublabel="100% of every tip" accent />
        <StatCard label="Subscription paid to date" value={formatMoney(totals.subscriptionPaidPence)} />
        <StatCard label="Staff" value={String(client.staffCount)} />
      </div>

      {!isLive && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          The guest tipping page is currently <strong>offline</strong> —{" "}
          {client.billingStatus !== "ACTIVE"
            ? "this month's subscription hasn't been paid."
            : "Stripe Connect isn't fully set up yet."}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-5 lg:col-span-2">
          <h2 className="mb-3 font-bold">Details</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-black/40">Contact</dt>
              <dd className="font-semibold">{client.contactName}</dd>
            </div>
            <div>
              <dt className="text-black/40">Email</dt>
              <dd className="font-semibold">{client.email}</dd>
            </div>
            <div>
              <dt className="text-black/40">Phone</dt>
              <dd className="font-semibold">{client.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-black/40">Subscription</dt>
              <dd className="font-semibold">
                {formatMoney(client.subscriptionFeePence)}/mo <span className="text-black/40">(£10/room, capped £50)</span>
              </dd>
            </div>
            <div>
              <dt className="text-black/40">Billing status</dt>
              <dd className="mt-0.5">
                <Badge tone={billingTone[client.billingStatus]}>{client.billingStatus.replace("_", " ")}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-black/40">Stripe Connect account</dt>
              <dd className="font-mono text-xs font-semibold">{client.stripeAccountId}</dd>
            </div>
            <div>
              <dt className="text-black/40">Stripe status</dt>
              <dd className="mt-0.5">
                <Badge tone={stripeStatusTone[client.stripeStatus]}>{client.stripeStatus.replace("_", " ")}</Badge>
              </dd>
            </div>
          </dl>

          {client.billingStatus === "PAST_DUE" && (
            <form action={markSubscriptionPaid.bind(null, client.id, client.slug)} className="mt-4">
              <p className="mb-2 text-xs text-black/50">
                Card on file was declined. In production, retrying it (or the owner updating their card) fires
                Stripe Billing&apos;s <code className="rounded bg-black/5 px-1">invoice.paid</code> webhook.
              </p>
              <button className="rounded-lg bg-brand-lime px-3 py-1.5 text-xs font-semibold text-brand-black">
                Simulate: mark subscription as paid
              </button>
            </form>
          )}
          {client.stripeStatus === "PENDING" && (
            <form action={completeStripeOnboarding.bind(null, client.id, client.slug)} className="mt-4">
              <p className="mb-2 text-xs text-black/50">
                Waiting on the owner to finish Stripe Connect KYC. In production this flips automatically via
                Stripe&apos;s <code className="rounded bg-black/5 px-1">account.updated</code> webhook.
              </p>
              <button className="rounded-lg bg-brand-lime px-3 py-1.5 text-xs font-semibold text-brand-black">
                Simulate: mark Stripe onboarding complete
              </button>
            </form>
          )}
          {client.stripeStatus === "RESTRICTED" && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              Stripe has restricted this account — tips cannot be processed until the owner resolves the issue in
              their Stripe dashboard.
            </p>
          )}

          <div className="mt-5 border-t border-black/5 pt-4">
            <p className="text-xs font-semibold text-black/50">Optional per-tip platform fee</p>
            <p className="mt-1 mb-2 text-xs text-black/40">
              Off (0%) by default — the property keeps 100% of every tip. Turn this on to start charging guests an
              extra % on top (added to their card, on top of the tip and Stripe&apos;s processing fee).
            </p>
            <form
              action={updateTransactionFeePercent.bind(null, client.id, client.slug)}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                name="transactionFeePercent"
                min={0}
                max={100}
                defaultValue={client.transactionFeePercent}
                className="w-20 rounded-lg border border-black/10 p-1.5 text-sm"
              />
              <span className="text-sm text-black/50">%</span>
              <button className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10">
                Save
              </button>
              <span className="ml-2 text-xs text-black/40">
                Currently: {client.transactionFeePercent > 0 ? `${client.transactionFeePercent}% charged to guests` : "off"}
              </span>
            </form>
          </div>

          <h2 className="mt-6 mb-3 font-bold">Recent tips</h2>
          <div className="divide-y divide-black/5">
            {client.transactions.length === 0 && <p className="text-sm text-black/40">No tips yet.</p>}
            {client.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{t.guestName ?? "Guest"}</p>
                  <p className="text-xs text-black/40">
                    {formatDateTime(t.createdAt)} · guest charged {formatMoney(t.totalChargedPence)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatMoney(t.tipAmountPence)}{" "}
                    {t.status !== "SUCCEEDED" && <Badge tone={t.status === "REFUNDED" ? "amber" : "red"}>{t.status}</Badge>}
                  </p>
                  <p className="text-xs text-black/40">100% to owner</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-6 mb-3 font-bold">Payout history</h2>
          <div className="divide-y divide-black/5">
            {client.payouts.length === 0 && <p className="text-sm text-black/40">No payouts yet.</p>}
            {client.payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-mono text-xs text-black/50">{p.stripeTransferId}</p>
                  <p className="text-xs text-black/40">{formatDateTime(p.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(p.amountPence)}</p>
                  <Badge tone={p.status === "PAID" ? "lime" : "amber"}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-6 mb-3 font-bold">Subscription invoices</h2>
          <div className="divide-y divide-black/5">
            {client.subscriptionInvoices.length === 0 && <p className="text-sm text-black/40">No invoices yet.</p>}
            {client.subscriptionInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-mono text-xs text-black/50">{inv.stripeInvoiceId}</p>
                  <p className="text-xs text-black/40">
                    {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(inv.amountPence)}</p>
                  <Badge tone={inv.status === "PAID" ? "lime" : inv.status === "FAILED" ? "red" : "amber"}>
                    {inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 text-center">
          <h2 className="mb-3 font-bold">Guest tipping QR code</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt={`QR code for ${client.name}`} className="mx-auto" />
          <p className="mt-3 break-all text-xs text-black/50">{tipUrl}</p>
          <Link
            href={`/tip/${client.slug}`}
            target="_blank"
            className="mt-3 inline-block rounded-lg bg-brand-black px-3 py-1.5 text-xs font-semibold text-brand-cream"
          >
            Open guest page ↗
          </Link>
          <p className="mt-4 text-xs text-black/40">
            Print this on table cards, room keys, or receipts. Guests scan it to tip staff directly — the property
            keeps 100% of every tip.
          </p>
        </div>
      </div>
    </div>
  );
}
