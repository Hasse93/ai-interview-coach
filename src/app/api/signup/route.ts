import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SignupSchema } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid details", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password } = parsed.data;
  const normEmail = email.toLowerCase().trim();

  try {
    const existing = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: normEmail, name: name || null, password: hash },
      select: { id: true, email: true, name: true },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not create the account. Is the database configured?" },
      { status: 500 },
    );
  }
}
