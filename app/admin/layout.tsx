import Link from "next/link";
import { SidebarNav } from "@/components/SidebarNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="flex w-64 shrink-0 flex-col bg-brand-black text-brand-cream">
        <Link href="/" className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-lime text-sm font-black text-brand-black">
            HT
          </span>
          <span className="text-lg font-black tracking-tight">Happy Tips</span>
        </Link>
        <SidebarNav />
        <div className="mx-3 mb-4 rounded-lg bg-white/5 p-3">
          <p className="text-xs font-semibold text-brand-cream">Ajith Joy</p>
          <p className="text-[11px] text-brand-cream/50">Admin · full access</p>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden bg-brand-cream">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
