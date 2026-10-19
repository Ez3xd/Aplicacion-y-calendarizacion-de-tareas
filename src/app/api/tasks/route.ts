import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const categories = {
  WORK: { label: "Trabajo", color: "#668264" },
  STUDY: { label: "Estudio", color: "#7890aa" },
  HEALTH: { label: "Salud", color: "#d0a46c" },
  PERSONAL: { label: "Personal", color: "#b7869c" },
} as const;
const energyLevels = ["HIGH", "MEDIUM", "LOW"] as const;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function isCategory(value: unknown): value is keyof typeof categories {
  return typeof value === "string" && Object.hasOwn(categories, value);
}

function isEnergyLevel(value: unknown): value is typeof energyLevels[number] {
  return typeof value === "string" && energyLevels.includes(value as typeof energyLevels[number]);
}

async function authenticatedUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function POST(request: Request) {
  const userId = await authenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para guardar tareas." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "La tarea enviada no es válida." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const date = typeof input.date === "string" ? input.date : "";
  const startTime = typeof input.startTime === "string" ? input.startTime : "";
  const endTime = typeof input.endTime === "string" ? input.endTime : "";
  const categoryName = isCategory(input.category) ? input.category : null;
  const energyLevel = isEnergyLevel(input.energyLevel) ? input.energyLevel : null;

  if (!title || title.length > 120 || !datePattern.test(date) ||
      !timePattern.test(startTime) || !timePattern.test(endTime) ||
      !categoryName || !energyLevel) {
    return NextResponse.json({ error: "Revisa el título, la fecha, el horario y la categoría." }, { status: 400 });
  }

  const day = new Date(`${date}T00:00:00.000Z`);
  const start = new Date(`${date}T${startTime}:00-06:00`);
  const end = new Date(`${date}T${endTime}:00-06:00`);
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date ||
      Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "La fecha o el horario no son válidos; el término debe ser posterior al inicio." }, { status: 400 });
  }

  const category = categories[categoryName];
  const savedCategory = await prisma.category.upsert({
    where: { userId_name: { userId, name: categoryName } },
    create: { userId, name: categoryName, ...category },
    update: {},
  });
  const task = await prisma.task.create({
    data: {
      userId,
      categoryId: savedCategory.id,
      title,
      date: day,
      startTime: start,
      endTime: end,
      energyLevel,
    },
    include: { category: true },
  });

  return NextResponse.json({
    id: task.id,
    title: task.title,
    time: startTime,
    endTime: endTime,
    category: task.category?.label ?? category.label,
    categoryColor: task.category?.color ?? category.color,
    energyLevel: task.energyLevel,
    isTop3: task.isTop3,
    status: task.status,
  }, { status: 201 });
}

export async function PATCH(request: Request) {
  const userId = await authenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Inicia sesión para actualizar tareas." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "La actualización enviada no es válida." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const taskId = typeof input.taskId === "string" ? input.taskId : "";
  const action = input.action;
  if (!taskId || (action !== "toggle-status" && action !== "toggle-top3")) {
    return NextResponse.json({ error: "La actualización enviada no es válida." }, { status: 400 });
  }

  const outcome = await prisma.$transaction(async (transaction) => {
    const task = await transaction.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true, date: true, status: true, isTop3: true },
    });
    if (!task) return "missing";

    if (action === "toggle-top3" && !task.isTop3) {
      const priorities = await transaction.task.count({
        where: { userId, date: task.date, isTop3: true },
      });
      if (priorities >= 3) return "limit";
    }

    await transaction.task.updateMany({
      where: { id: task.id, userId },
      data: action === "toggle-top3"
        ? { isTop3: !task.isTop3 }
        : { status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" },
    });
    return "updated";
  }, { isolationLevel: "Serializable" });

  if (outcome === "missing") {
    return NextResponse.json({ error: "No se encontró esa tarea." }, { status: 404 });
  }
  if (outcome === "limit") {
    return NextResponse.json({ error: "El Top 3 ya está completo para ese día." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
