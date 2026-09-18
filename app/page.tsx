import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-black px-4 text-center text-brand-cream">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lime text-xl font-black text-brand-black">
        HT
      </span>
      <h1 className="mt-6 text-3xl font-black tracking-tight">Happy Tips — Platform Demo</h1>
      <p className="mt-3 max-w-md text-sm text-brand-cream/60">
        The backend that runs everything behind happytips.com: leads, hotel & Airbnb clients, guest tips, Stripe
        Connect payouts, your bank ledger, your team, and website analytics.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/admin"
          className="rounded-lg bg-brand-lime px-6 py-3 text-sm font-black text-brand-black hover:brightness-95"
        >
          Enter admin demo →
        </Link>
        <Link
          href="/tip/lensfield-hotel"
          target="_blank"
          className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-brand-cream hover:bg-white/5"
        >
          Try the guest tip page ↗
        </Link>
      </div>
      <p className="mt-10 text-[11px] text-brand-cream/30">
        Demo data — nothing here is a real payment. See the README for how this connects to real Stripe Connect.
      </p>
    </div>
  );
}
