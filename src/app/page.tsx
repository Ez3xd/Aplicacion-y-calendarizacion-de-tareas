import { getServerSession } from "next-auth";
import { Dashboard } from "@/components/dashboard";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const demoTasks = [
  { id: "demo-1", title: "Planear estrategia Q4", time: "09:00", endTime: "10:30", category: "Trabajo", categoryColor: "#668264", energyLevel: "HIGH", isTop3: true, status: "PENDING" },
  { id: "demo-2", title: "Revisar propuesta de diseño", time: "10:45", endTime: "11:30", category: "Trabajo", categoryColor: "#668264", energyLevel: "MEDIUM", isTop3: true, status: "COMPLETED" },
  { id: "demo-3", title: "Pausa para caminar", time: "11:30", endTime: "12:00", category: "Salud", categoryColor: "#d0a46c", energyLevel: "LOW", isTop3: false, status: "PENDING" },
  { id: "demo-4", title: "Escribir propuesta", time: "13:00", endTime: "14:30", category: "Trabajo", categoryColor: "#668264", energyLevel: "HIGH", isTop3: true, status: "PENDING" },
  { id: "demo-5", title: "Lectura: diseño sereno", time: "15:00", endTime: "15:30", category: "Personal", categoryColor: "#b7869c", energyLevel: "LOW", isTop3: false, status: "PENDING" },
];

function timeLabel(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Mexico_City",
  }).format(date);
}

function dateLabel(date: Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email
    ? (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id
    : undefined;
  const requestedDate = (await searchParams).date;
  const today = dateLabel(new Date());
  const parsedRequestedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
    ? new Date(`${requestedDate}T00:00:00.000Z`)
    : null;
  const selectedDate = requestedDate && parsedRequestedDate?.toISOString().slice(0, 10) === requestedDate
    ? requestedDate
    : today;

  const tasks = userId
    ? await prisma.task.findMany({
        where: {
          userId,
          date: { equals: new Date(`${selectedDate}T00:00:00.000Z`) },
        },
        include: { category: true },
        orderBy: { startTime: "asc" },
      }).then((items) =>
        items.map((task) => ({
          id: task.id,
          title: task.title,
          time: timeLabel(task.startTime),
          endTime: timeLabel(task.endTime),
          category: task.category?.label ?? "Personal",
          categoryColor: task.category?.color ?? "#668264",
          energyLevel: task.energyLevel,
          isTop3: task.isTop3,
          status: task.status,
        })),
      )
    : selectedDate === today ? demoTasks : [];

  return <Dashboard key={selectedDate} tasks={tasks} userName={session?.user?.name ?? null} signedIn={Boolean(userId)} selectedDate={selectedDate} />;
}
