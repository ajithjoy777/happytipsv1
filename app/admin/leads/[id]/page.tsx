import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { formatDateTime, formatMoney } from "@/lib/format";
import { computeSubscriptionFeePence } from "@/lib/billing";
import { advanceLeadStage, convertLeadToClient, markLeadLost, updateLeadNotes } from "../actions";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { assignedTo: true, client: true },
  });
  if (!lead) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={lead.businessName}
        description={`${lead.propertyType === "HOTEL" ? "Hotel" : "Airbnb"} · added ${formatDateTime(lead.createdAt)}`}
        action={
          <Link href="/admin/leads" className="text-sm font-semibold text-brand-olive hover:underline">
            ← Back to pipeline
          </Link>
        }
      />

      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between">
          <Badge tone={lead.stage === "ACTIVE" ? "lime" : lead.stage === "LOST" ? "neutral" : "olive"}>
            {lead.stage}
          </Badge>
          {lead.client && (
            <Link
              href={`/admin/clients/${lead.client.slug}`}
              className="text-xs font-semibold text-brand-olive hover:underline"
            >
              View client profile →
            </Link>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-black/40">Contact</dt>
            <dd className="font-semibold">{lead.contactName}</dd>
          </div>
          <div>
            <dt className="text-black/40">Email</dt>
            <dd className="font-semibold">{lead.email}</dd>
          </div>
          <div>
            <dt className="text-black/40">Phone</dt>
            <dd className="font-semibold">{lead.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-black/40">Source</dt>
            <dd className="font-semibold">{lead.source.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-black/40">Rooms / units</dt>
            <dd className="font-semibold">
              {lead.roomCount} <span className="text-black/40">→ {formatMoney(computeSubscriptionFeePence(lead.roomCount))}/mo</span>
            </dd>
          </div>
          <div>
            <dt className="text-black/40">Assigned to</dt>
            <dd className="font-semibold">{lead.assignedTo?.name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-black/40">Last updated</dt>
            <dd className="font-semibold">{formatDateTime(lead.updatedAt)}</dd>
          </div>
        </dl>

        <form action={updateLeadNotes.bind(null, lead.id)} className="mt-5">
          <label className="text-xs font-semibold text-black/50">Notes</label>
          <textarea
            name="notes"
            defaultValue={lead.notes ?? ""}
            rows={4}
            className="mt-1 w-full rounded-lg border border-black/10 p-2.5 text-sm"
            placeholder="Call notes, onboarding checklist progress, blockers..."
          />
          <button className="mt-2 rounded-md bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10">
            Save notes
          </button>
        </form>

        {lead.stage !== "ACTIVE" && lead.stage !== "LOST" && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-black/5 pt-4">
            {lead.stage === "NEW" && (
              <form action={advanceLeadStage.bind(null, lead.id, "CONTACTED")}>
                <button className="rounded-lg bg-brand-black px-3 py-1.5 text-xs font-semibold text-brand-cream">
                  Mark contacted
                </button>
              </form>
            )}
            {lead.stage === "CONTACTED" && (
              <form action={advanceLeadStage.bind(null, lead.id, "ONBOARDING")}>
                <button className="rounded-lg bg-brand-black px-3 py-1.5 text-xs font-semibold text-brand-cream">
                  Start onboarding
                </button>
              </form>
            )}
            {lead.stage === "ONBOARDING" && (
              <form action={convertLeadToClient.bind(null, lead.id)}>
                <button className="rounded-lg bg-brand-lime px-3 py-1.5 text-xs font-semibold text-brand-black">
                  Convert to client ✓
                </button>
              </form>
            )}
            <form action={markLeadLost.bind(null, lead.id)}>
              <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                Mark as lost
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
