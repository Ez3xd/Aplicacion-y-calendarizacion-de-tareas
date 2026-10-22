import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncGoogleCalendarEvents } from "@/lib/google-calendar";

function rangeForSync() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 90);
  return { start, end };
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Inicia sesión con Google para sincronizar." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "No se encontró tu cuenta." }, { status: 404 });

  try {
    const synced = await syncGoogleCalendarEvents(user.id, rangeForSync());
    return NextResponse.json({ ok: true, synced });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo sincronizar Google Calendar.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
