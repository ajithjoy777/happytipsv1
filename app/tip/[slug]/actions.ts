"use server";

import { prisma } from "@/lib/prisma";
import { computeTipCheckout } from "@/lib/billing";

function randomId(prefix: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return `${prefix}_${Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
}

export async function submitTip(clientId: string, formData: FormData) {
  const tipPounds = Number(formData.get("amount"));
  const guestName = String(formData.get("guestName") ?? "").trim() || "A guest";

  if (!Number.isFinite(tipPounds) || tipPounds <= 0) {
    return { ok: false, error: "Enter a valid tip amount." };
  }

  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  if (client.stripeStatus !== "ACTIVE" || client.billingStatus !== "ACTIVE") {
    return { ok: false, error: "This property isn't ready to receive tips yet." };
  }

  const tipAmountPence = Math.round(tipPounds * 100);
  const checkout = computeTipCheckout(tipAmountPence, client.transactionFeePercent);

  await prisma.transaction.create({
    data: {
      clientId: client.id,
      guestName,
      tipAmountPence: checkout.tipAmountPence,
      stripeFeePence: checkout.stripeFeePence,
      platformFeePence: checkout.platformFeePence,
      totalChargedPence: checkout.totalChargedPence,
      netAmountPence: checkout.tipAmountPence, // the property always keeps 100% of the tip
      stripePaymentIntentId: randomId("pi"),
      status: "SUCCEEDED",
    },
  });

  return { ok: true, ...checkout };
}
