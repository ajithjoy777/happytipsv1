"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function addTeamMember(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "SUPPORT") as "ADMIN" | "FINANCE" | "MARKETING" | "SUPPORT";

  if (!name || !email) throw new Error("Name and email are required.");

  await prisma.user.create({ data: { name, email, role } });
  revalidatePath("/admin/team");
}

export async function toggleActive(userId: string, active: boolean) {
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin/team");
}
