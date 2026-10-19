import "server-only";

import { google, type calendar_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";

export interface CalendarTimeRange {
  start: Date;
  end: Date;
}

export interface CreateCalendarEventInput extends CalendarTimeRange {
  title: string;
  description?: string;
  taskId?: string;
}

async function getCalendarClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { id: true, access_token: true, refresh_token: true, expires_at: true },
  });

  if (!account?.access_token) {
    throw new Error("La cuenta no tiene credenciales de Google Calendar.");
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : undefined,
  );

  auth.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  auth.on("tokens", (tokens) => {
    void prisma.account.update({
      where: { id: account.id },
      data: {
        ...(tokens.access_token && { access_token: tokens.access_token }),
        ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
        ...(tokens.expiry_date && { expires_at: Math.floor(tokens.expiry_date / 1000) }),
      },
    });
  });

  return google.calendar({ version: "v3", auth });
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function findCalendarConflicts(
  userId: string,
  range: CalendarTimeRange,
  excludeTaskId?: string,
) {
  if (range.end <= range.start) {
    throw new Error("El fin del bloque debe ser posterior al inicio.");
  }

  const [calendar, tasks] = await Promise.all([
    getCalendarClient(userId),
    prisma.task.findMany({
      where: {
        userId,
        status: { not: "CANCELLED" },
        ...(excludeTaskId && { id: { not: excludeTaskId } }),
        startTime: { lt: range.end },
        endTime: { gt: range.start },
      },
      select: { id: true, title: true, startTime: true, endTime: true },
    }),
  ]);

  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: range.start.toISOString(),
    timeMax: range.end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const externalEvents = (data.items ?? [])
    .filter((event) => event.status !== "cancelled")
    .map((event) => {
      const start = toDate(event.start?.dateTime ?? event.start?.date);
      const end = toDate(event.end?.dateTime ?? event.end?.date);
      return start && end && start < range.end && end > range.start
        ? { id: event.id ?? "", title: event.summary ?? "Evento de Google Calendar", startTime: start, endTime: end }
        : null;
    })
    .filter((event): event is NonNullable<typeof event> => event !== null);

  return [...externalEvents, ...tasks];
}

export async function createCalendarEvent(
  userId: string,
  input: CreateCalendarEventInput,
) {
  const conflicts = await findCalendarConflicts(
    userId,
    { start: input.start, end: input.end },
    input.taskId,
  );
  if (conflicts.length > 0) {
    throw new Error(
      `Colisión de horario: "${conflicts[0].title}" ya ocupa ese bloque.`,
    );
  }

  const calendar = await getCalendarClient(userId);
  const { data } = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: input.title,
      description: input.description,
      start: { dateTime: input.start.toISOString() },
      end: { dateTime: input.end.toISOString() },
    },
  });

  if (!data.id) throw new Error("Google Calendar no devolvió un ID de evento.");

  if (input.taskId) {
    await prisma.task.update({
      where: { id: input.taskId, userId },
      data: { googleCalendarEventId: data.id },
    });
    await prisma.calendarEvent.upsert({
      where: { userId_googleEventId: { userId, googleEventId: data.id } },
      create: {
        userId,
        googleEventId: data.id,
        summary: input.title,
        description: input.description,
        startTime: input.start,
        endTime: input.end,
        htmlLink: data.htmlLink,
        appTaskId: input.taskId,
      },
      update: {
        summary: input.title,
        description: input.description,
        startTime: input.start,
        endTime: input.end,
        htmlLink: data.htmlLink,
      },
    });
  }

  return data;
}

export async function syncGoogleCalendarEvents(
  userId: string,
  range: CalendarTimeRange,
) {
  const calendar = await getCalendarClient(userId);
  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: range.start.toISOString(),
    timeMax: range.end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const events = (data.items ?? []).filter(
    (event): event is calendar_v3.Schema$Event & { id: string } =>
      Boolean(event.id && event.status !== "cancelled"),
  );

  for (const event of events) {
    const start = toDate(event.start?.dateTime ?? event.start?.date);
    const end = toDate(event.end?.dateTime ?? event.end?.date);
    if (!start || !end) continue;

    await prisma.calendarEvent.upsert({
      where: {
        userId_googleEventId: { userId, googleEventId: event.id },
      },
      create: {
        userId,
        googleEventId: event.id,
        summary: event.summary ?? "Evento sin título",
        description: event.description,
        startTime: start,
        endTime: end,
        isAllDay: Boolean(event.start?.date),
        htmlLink: event.htmlLink,
      },
      update: {
        summary: event.summary ?? "Evento sin título",
        description: event.description,
        startTime: start,
        endTime: end,
        isAllDay: Boolean(event.start?.date),
        htmlLink: event.htmlLink,
      },
    });
  }

  return events.length;
}
