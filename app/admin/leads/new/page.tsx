import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { createLead } from "../actions";

export default function NewLeadPage() {
  return (
    <div className="max-w-lg">
      <PageHeader
        title="New lead"
        description="Add a hotel or Airbnb you're talking to."
        action={
          <Link href="/admin/leads" className="text-sm font-semibold text-brand-olive hover:underline">
            ← Back
          </Link>
        }
      />
      <form action={createLead} className="space-y-4 rounded-2xl border border-black/10 bg-white p-5">
        <div>
          <label className="text-xs font-semibold text-black/50">Business name *</label>
          <input name="businessName" required className="mt-1 w-full rounded-lg border border-black/10 p-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-black/50">Property type</label>
            <select name="propertyType" className="mt-1 w-full rounded-lg border border-black/10 p-2.5 text-sm">
              <option value="HOTEL">Hotel</option>
              <option value="AIRBNB">Airbnb</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-black/50">Source</label>
            <select name="source" className="mt-1 w-full rounded-lg border border-black/10 p-2.5 text-sm">
              <option value="WEBSITE_FORM">Website form</option>
              <option value="COLD_OUTREACH">Cold outreach</option>
              <option value="REFERRAL">Referral</option>
              <option value="EVENT">Event</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-black/50">Rooms / units</label>
          <input
            type="number"
            name="roomCount"
            min={1}
            defaultValue={1}
            className="mt-1 w-full rounded-lg border border-black/10 p-2.5 text-sm"
          />
          <p className="mt-1 text-xs text-black/40">Sets their monthly subscription: £10/room, capped at £50/mo.</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-black/50">Contact name *</label>
          <input name="contactName" required className="mt-1 w-full rounded-lg border border-black/10 p-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-black/50">Email *</label>
            <input type="email" name="email" required className="mt-1 w-full rounded-lg border border-black/10 p-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-black/50">Phone</label>
            <input name="phone" className="mt-1 w-full rounded-lg border border-black/10 p-2.5 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-black/50">Notes</label>
          <textarea name="notes" rows={3} className="mt-1 w-full rounded-lg border border-black/10 p-2.5 text-sm" />
        </div>
        <button className="rounded-lg bg-brand-black px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-black">
          Add lead
        </button>
      </form>
    </div>
  );
}
