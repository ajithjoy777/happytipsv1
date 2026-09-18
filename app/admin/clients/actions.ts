"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function randomId(prefix: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return `${prefix}_${Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
}

// In production this is called from the Stripe Connect onboarding webhook
// (`account.updated` with `charges_enabled: true`), not a button click.
export async function completeStripeOnboarding(clientId: string, slug: string) {
  await prisma.client.update({ where: { id: clientId }, data: { stripeStatus: "ACTIVE" } });
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${slug}`);
}

// Turns the 5%-of-tip platform fee on or off for one client. Off (0%) is the
// default for every early customer — see lib/billing.ts.
export async function updateTransactionFeePercent(clientId: string, slug: string, formData: FormData) {
  const percent = Math.max(0, Math.min(100, Number(formData.get("transactionFeePercent")) || 0));
  await prisma.client.update({ where: { id: clientId }, data: { transactionFeePercent: percent } });
  revalidatePath(`/admin/clients/${slug}`);
}

// In production this is called from Stripe Billing's `invoice.paid` webhook
// once a retried card charge succeeds, not a button click.
export async function markSubscriptionPaid(clientId: string, slug: string) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  const failedInvoice = await prisma.subscriptionInvoice.findFirst({
    where: { clientId, status: "FAILED" },
    orderBy: { createdAt: "desc" },
  });

  if (failedInvoice) {
    await prisma.subscriptionInvoice.update({ where: { id: failedInvoice.id }, data: { status: "PAID" } });
  } else {
    await prisma.subscriptionInvoice.create({
      data: {
        clientId,
        amountPence: client.subscriptionFeePence,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 86400000),
        status: "PAID",
        stripeInvoiceId: randomId("in"),
      },
    });
  }

  await prisma.platformLedgerEntry.create({
    data: {
      type: "SUBSCRIPTION_REVENUE",
      amountPence: client.subscriptionFeePence,
      description: `Monthly subscription — ${client.name} (${client.roomCount} room${client.roomCount > 1 ? "s" : ""})`,
    },
  });

  await prisma.client.update({ where: { id: clientId }, data: { billingStatus: "ACTIVE" } });

  revalidatePath("/admin/clients");
  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/clients/${slug}`);
}
