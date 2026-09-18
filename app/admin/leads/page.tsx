import Link from "next/link";
import { getLeads } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { timeAgo } from "@/lib/format";
import { advanceLeadStage, convertLeadToClient, markLeadLost } from "./actions";

const COLUMNS = [
  { stage: "NEW", title: "New", next: "CONTACTED", nextLabel: "Mark contacted" },
  { stage: "CONTACTED", title: "Contacted", next: "ONBOARDING", nextLabel: "Start onboarding" },
  { stage: "ONBOARDING", title: "Onboarding", next: null, nextLabel: null },
  { stage: "ACTIVE", title: "Active client", next: null, nextLabel: null },
  { stage: "LOST", title: "Lost", next: null, nextLabel: null },
] as const;

const sourceLabel: Record<string, string> = {
  WEBSITE_FORM: "Website form",
  COLD_OUTREACH: "Cold outreach",
  REFERRAL: "Referral",
  EVENT: "Event",
  OTHER: "Other",
};

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Hotels & Airbnbs in your sales pipeline — from first contact to fully onboarded client."
        action={
          <Link
            href="/admin/leads/new"
            className="rounded-lg bg-brand-black px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-black"
          >
            + New lead
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const columnLeads = leads.filter((l) => l.stage === col.stage);
          return (
            <div key={col.stage} className="rounded-2xl bg-black/[0.03] p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-bold">{col.title}</h2>
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold">
                  {columnLeads.length}
                </span>
              </div>
              <div className="space-y-3">
                {columnLeads.map((lead) => (
                  <div key={lead.id} className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
                    <Link href={`/admin/leads/${lead.id}`} className="block">
                      <p className="text-sm font-bold leading-tight">{lead.businessName}</p>
                      <p className="text-xs text-black/50">{lead.contactName}</p>
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone="neutral">{lead.propertyType === "HOTEL" ? "Hotel" : "Airbnb"}</Badge>
                      <Badge tone="neutral">{sourceLabel[lead.source]}</Badge>
                    </div>
                    <p className="mt-2 text-[11px] text-black/40">
                      {lead.assignedTo?.name ?? "Unassigned"} · updated {timeAgo(lead.updatedAt)}
                    </p>

                    {col.stage !== "ACTIVE" && col.stage !== "LOST" && (
                      <div className="mt-3 flex flex-col gap-1.5 border-t border-black/5 pt-2.5">
                        {col.next && (
                          <form action={advanceLeadStage.bind(null, lead.id, col.next)}>
                            <button className="w-full rounded-md bg-brand-black py-1.5 text-xs font-semibold text-brand-cream hover:bg-black">
                              {col.nextLabel} →
                            </button>
                          </form>
                        )}
                        {col.stage === "ONBOARDING" && (
                          <form action={convertLeadToClient.bind(null, lead.id)}>
                            <button className="w-full rounded-md bg-brand-lime py-1.5 text-xs font-semibold text-brand-black hover:brightness-95">
                              Convert to client ✓
                            </button>
                          </form>
                        )}
                        <form action={markLeadLost.bind(null, lead.id)}>
                          <button className="w-full rounded-md py-1 text-[11px] font-medium text-black/40 hover:text-red-600">
                            Mark as lost
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
                {columnLeads.length === 0 && (
                  <p className="px-1 text-xs text-black/30">No leads here.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
