import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { SaveSessionSchema } from "@/lib/types";

export const runtime = "nodejs";

/** List the signed-in user's saved interview reports. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const rows = await prisma.interviewReport.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const sessions = rows.map((r) => ({
      id: r.id,
      date: r.createdAt.toISOString(),
      role: r.role,
      seniority: r.seniority,
      interviewType: r.interviewType,
      overallScore: r.overallScore,
      report: safeParse(r.data),
    }));
    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ error: "Could not load sessions" }, { status: 500 });
  }
}

/** Persist a finished interview report for the signed-in user. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = SaveSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session", details: parsed.error.flatten() }, { status: 400 });
  }
  const { role, seniority, interviewType, overallScore, report } = parsed.data;

  try {
    const row = await prisma.interviewReport.create({
      data: {
        userId: user.id,
        role,
        seniority,
        interviewType,
        overallScore,
        data: JSON.stringify(report),
      },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ id: row.id, date: row.createdAt.toISOString() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save session" }, { status: 500 });
  }
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
