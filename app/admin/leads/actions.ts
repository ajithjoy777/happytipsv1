"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function randomId(prefix: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return `${prefix}_${Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
}

type LeadStage = "NEW" | "CONTACTED" | "ONBOARDING" | "ACTIVE" | "LOST";

export async function advanceLeadStage(leadId: string, stage: LeadStage) {
  await prisma.lead.update({ where: { id: leadId }, data: { stage } });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function markLeadLost(leadId: string) {
  await prisma.lead.update({ where: { id: leadId }, data: { stage: "LOST" } });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function updateLeadNotes(leadId: string, formData: FormData) {
  const notes = String(formData.get("notes") ?? "");
  await prisma.lead.update({ where: { id: leadId }, data: { notes } });
  revalidatePath(`/admin/leads/${leadId}`);
}

// Turns a converted lead into a live Client: creates the Stripe Connect
// placeholder + a QR-code-ready slug, and marks the lead ACTIVE.
export async function convertLeadToClient(leadId: string) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

  let slug = slugify(lead.businessName);
  const existing = await prisma.client.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${randomId("").slice(1, 5)}`;

  const client = await prisma.client.create({
    data: {
      name: lead.businessName,
      slug,
      propertyType: lead.propertyType,
      contactName: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      staffCount: 1,
      platformFeePence: 1000,
      stripeAccountId: randomId("acct"),
      stripeStatus: "PENDING",
      leadId: lead.id,
    },
  });

  await prisma.lead.update({ where: { id: leadId }, data: { stage: "ACTIVE" } });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${client.slug}`);
}

export async function createLead(formData: FormData) {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const propertyType = String(formData.get("propertyType") ?? "HOTEL") as "HOTEL" | "AIRBNB";
  const source = String(formData.get("source") ?? "OTHER") as
    | "WEBSITE_FORM"
    | "COLD_OUTREACH"
    | "REFERRAL"
    | "EVENT"
    | "OTHER";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!businessName || !contactName || !email) {
    throw new Error("Business name, contact name and email are required.");
  }

  await prisma.lead.create({
    data: { businessName, contactName, email, phone, propertyType, source, notes },
  });

  revalidatePath("/admin/leads");
  redirect("/admin/leads");
}
