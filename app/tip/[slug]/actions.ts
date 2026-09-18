"use server";

import { prisma } from "@/lib/prisma";

function randomId(prefix: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return `${prefix}_${Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
}

export async function submitTip(clientId: string, formData: FormData) {
  const amountPounds = Number(formData.get("amount"));
  const guestName = String(formData.get("guestName") ?? "").trim() || "A guest";

  if (!Number.isFinite(amountPounds) || amountPounds <= 0) {
    return { ok: false, error: "Enter a valid tip amount." };
  }

  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  if (client.stripeStatus !== "ACTIVE") {
    return { ok: false, error: "This property isn't ready to receive tips yet." };
  }

  const amountPence = Math.round(amountPounds * 100);
  const fee = client.platformFeePence;
  const net = Math.max(amountPence - fee, 0);

  await prisma.transaction.create({
    data: {
      clientId: client.id,
      guestName,
      amountPence,
      platformFeePence: fee,
      netAmountPence: net,
      stripePaymentIntentId: randomId("pi"),
      status: "SUCCEEDED",
    },
  });

  return { ok: true, amountPence, feePence: fee, netPence: net };
}
