import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { getClientBySlug, getClientTotals } from "@/lib/data";
import { getTipUrl } from "@/lib/site";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { completeStripeOnboarding } from "../actions";

const statusTone = {
  NOT_STARTED: "neutral",
  PENDING: "amber",
  ACTIVE: "lime",
  RESTRICTED: "red",
} as const;

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

  return (
    <div>
      <PageHeader
        title={client.name}
        description={`${client.propertyType === "HOTEL" ? "Hotel" : "Airbnb"} · joined ${formatDate(client.joinedAt)}`}
        action={
          <Link href="/admin/clients" className="text-sm font-semibold text-brand-olive hover:underline">
            ← All clients
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Gross tips" value={formatMoney(totals.grossPence)} sublabel={`${totals.txCount} tips`} />
        <StatCard label="Platform fee" value={formatMoney(totals.feePence)} />
        <StatCard label="Sent to owner" value={formatMoney(totals.netPence)} accent />
        <StatCard label="Staff" value={String(client.staffCount)} />
      </div>

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
              <dt className="text-black/40">Platform fee per tip</dt>
              <dd className="font-semibold">{formatMoney(client.platformFeePence)}</dd>
            </div>
            <div>
              <dt className="text-black/40">Stripe Connect account</dt>
              <dd className="font-mono text-xs font-semibold">{client.stripeAccountId}</dd>
            </div>
            <div>
              <dt className="text-black/40">Stripe status</dt>
              <dd className="mt-0.5">
                <Badge tone={statusTone[client.stripeStatus]}>{client.stripeStatus.replace("_", " ")}</Badge>
              </dd>
            </div>
          </dl>

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

          <h2 className="mt-6 mb-3 font-bold">Recent tips</h2>
          <div className="divide-y divide-black/5">
            {client.transactions.length === 0 && <p className="text-sm text-black/40">No tips yet.</p>}
            {client.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{t.guestName ?? "Guest"}</p>
                  <p className="text-xs text-black/40">{formatDateTime(t.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatMoney(t.amountPence)}{" "}
                    {t.status !== "SUCCEEDED" && <Badge tone={t.status === "REFUNDED" ? "amber" : "red"}>{t.status}</Badge>}
                  </p>
                  <p className="text-xs text-black/40">net {formatMoney(t.netAmountPence)}</p>
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
            Print this on table cards, room keys, or receipts. Guests scan it to tip staff directly.
          </p>
        </div>
      </div>
    </div>
  );
}
