"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// In production this is called from the Stripe Connect onboarding webhook
// (`account.updated` with `charges_enabled: true`), not a button click.
export async function completeStripeOnboarding(clientId: string, slug: string) {
  await prisma.client.update({ where: { id: clientId }, data: { stripeStatus: "ACTIVE" } });
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${slug}`);
}

export async function updateClientFee(clientId: string, slug: string, feePence: number) {
  await prisma.client.update({ where: { id: clientId }, data: { platformFeePence: feePence } });
  revalidatePath(`/admin/clients/${slug}`);
}
