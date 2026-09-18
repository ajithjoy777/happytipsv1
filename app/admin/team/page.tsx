import { getUsers } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { formatDate } from "@/lib/format";
import { addTeamMember, toggleActive } from "./actions";

const roleTone = { ADMIN: "lime", FINANCE: "olive", MARKETING: "blue", SUPPORT: "amber" } as const;

const PERMISSIONS = [
  { area: "Leads (CRM)", ADMIN: true, FINANCE: false, MARKETING: true, SUPPORT: true },
  { area: "Clients", ADMIN: true, FINANCE: true, MARKETING: true, SUPPORT: true },
  { area: "Transactions", ADMIN: true, FINANCE: true, MARKETING: false, SUPPORT: false },
  { area: "Payouts & bank", ADMIN: true, FINANCE: true, MARKETING: false, SUPPORT: false },
  { area: "Analytics", ADMIN: true, FINANCE: false, MARKETING: true, SUPPORT: false },
  { area: "Team management", ADMIN: true, FINANCE: false, MARKETING: false, SUPPORT: false },
];

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const users = await getUsers();

  return (
    <div>
      <PageHeader
        title="Team"
        description="Everyone with access to the Happy Tips admin, and what they can see."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-5 lg:col-span-2">
          <h2 className="mb-3 font-bold">People</h2>
          <div className="divide-y divide-black/5">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-black/40">
                    {u.email} · joined {formatDate(u.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={roleTone[u.role]}>{u.role}</Badge>
                  <form action={toggleActive.bind(null, u.id, !u.active)}>
                    <button
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                        u.active ? "text-black/40 hover:text-red-600" : "text-brand-olive"
                      }`}
                    >
                      {u.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-6 mb-3 font-bold">Add a team member</h2>
          <form action={addTeamMember} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-black/50">Name</label>
              <input name="name" required className="mt-1 w-full rounded-lg border border-black/10 p-2 text-sm" />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-black/50">Email</label>
              <input type="email" name="email" required className="mt-1 w-full rounded-lg border border-black/10 p-2 text-sm" />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-black/50">Role</label>
              <select name="role" className="mt-1 w-full rounded-lg border border-black/10 p-2 text-sm">
                <option value="SUPPORT">Support (onboarding)</option>
                <option value="MARKETING">Marketing</option>
                <option value="FINANCE">Finance</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button className="rounded-lg bg-brand-black px-3 py-2 text-sm font-semibold text-brand-cream hover:bg-black sm:col-span-1">
              Add
            </button>
          </form>
          <p className="mt-3 text-xs text-black/40">
            This demo doesn&apos;t have real login yet — adding someone here shows the intended access model.
            Wiring up real invitations + sign-in (e.g. via NextAuth or Clerk) is a next step, see the README.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="mb-3 font-bold">Access by role</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-black/40">
                <th className="pb-2 font-semibold">Area</th>
                <th className="pb-2 text-center font-semibold">Admin</th>
                <th className="pb-2 text-center font-semibold">Fin.</th>
                <th className="pb-2 text-center font-semibold">Mktg</th>
                <th className="pb-2 text-center font-semibold">Supp.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {PERMISSIONS.map((row) => (
                <tr key={row.area}>
                  <td className="py-2 font-medium">{row.area}</td>
                  <td className="py-2 text-center">{row.ADMIN ? "✓" : "—"}</td>
                  <td className="py-2 text-center">{row.FINANCE ? "✓" : "—"}</td>
                  <td className="py-2 text-center">{row.MARKETING ? "✓" : "—"}</td>
                  <td className="py-2 text-center">{row.SUPPORT ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
