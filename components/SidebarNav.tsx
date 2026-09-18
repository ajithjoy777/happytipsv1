"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "◆" },
  { href: "/admin/leads", label: "Leads", icon: "◎" },
  { href: "/admin/clients", label: "Clients", icon: "▣" },
  { href: "/admin/transactions", label: "Transactions", icon: "≡" },
  { href: "/admin/payouts", label: "Payouts & Bank", icon: "£" },
  { href: "/admin/team", label: "Team", icon: "☺" },
  { href: "/admin/analytics", label: "Analytics", icon: "▲" },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-lime text-brand-black"
                : "text-brand-cream/70 hover:bg-white/5 hover:text-brand-cream"
            }`}
          >
            <span className="w-4 text-center text-xs">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
