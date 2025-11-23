"use server";

import { prisma } from "@/lib/db";
import { encrypt, getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerAction(formData: FormData) {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!username || !email || !password) return { error: "All fields required" };

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) return { error: "User already exists" };

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, email, password: hashed }
  });

  return { success: true };
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid credentials" };

  const match = await bcrypt.compare(password, user.password);
  if (!match) return { error: "Invalid credentials" };

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user: { id: user.id, username: user.username } });

  (await cookies()).set("session", session, { expires, httpOnly: true });
  redirect("/dashboard");
}

export async function logoutAction() {
  (await cookies()).set("session", "", { expires: new Date(0) });
  redirect("/");
}

export async function buyItemAction(itemId: string, cost: number) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.coins < cost) return { error: "Insufficient funds" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { coins: { decrement: cost } }
    }),
    prisma.inventoryItem.create({
      data: { userId: user.id, itemId }
    })
  ]);
  return { success: true };
}
