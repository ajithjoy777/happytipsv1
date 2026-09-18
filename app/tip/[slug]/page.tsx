import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TipForm } from "@/components/TipForm";

export const dynamic = "force-dynamic";

export default async function TipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await prisma.client.findUnique({ where: { slug } });
  if (!client) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-lime text-lg font-black text-brand-black">
            HT
          </span>
          <h1 className="mt-4 text-2xl font-black text-brand-cream">{client.name}</h1>
          <p className="mt-1 text-sm text-brand-cream/60">
            {client.staffCount > 1 ? "Say thanks to the whole team" : "Say thanks with a tip"}
          </p>
        </div>

        {client.stripeStatus === "ACTIVE" && client.billingStatus === "ACTIVE" ? (
          <TipForm clientId={client.id} clientName={client.name} transactionFeePercent={client.transactionFeePercent} />
        ) : (
          <div className="rounded-2xl bg-white/5 p-6 text-center text-sm text-brand-cream/70">
            This property&apos;s tipping page is temporarily unavailable. Please check back soon.
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-brand-cream/30">Powered by Happy Tips</p>
      </div>
    </div>
  );
}
