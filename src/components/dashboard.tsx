"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InstallButton } from "@/components/install-button";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Coffee,
  Flame,
  Leaf,
  ListTodo,
  Plus,
  Sparkles,
  Target,
  Zap,
  ShieldCheck,
  MapPin,
  Repeat2,
  ListChecks,
  Settings,
  X,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { GoogleIntegrationsModal } from "@/components/google-integrations-modal";
import { useLanguage } from "@/components/language-provider";

type Task = {
  id: string;
  title: string;
  time: string;
  endTime: string;
  category: string;
  categoryColor: string;
  energyLevel: string;
  isTop3: boolean;
  status: string;
  description?: string | null;
  location?: string | null;
  priority?: string;
  recurrence?: string;
  reminderMinutes?: number | null;
};

const routines = [
  { title: "Revisar email", duration: "15 min", icon: "✉️", color: "routine-peach" },
  { title: "Tomar agua", duration: "5 min", icon: "💧", color: "routine-blue" },
  { title: "Leer un poco", duration: "15 min", icon: "📖", color: "routine-lilac" },
];

const energyLabel: Record<string, string> = {
  HIGH: "Alta energía",
  MEDIUM: "Energía media",
  LOW: "Baja energía",
};

const categoryLabels: Record<string, string> = { WORK: "Trabajo", STUDY: "Estudio", HEALTH: "Salud", PERSONAL: "Personal" };

const localTasksKey = (date: string) => `tempo-local-tasks:${date}`;

function saveLocalTasks(date: string, tasks: Task[]) {
  try { localStorage.setItem(localTasksKey(date), JSON.stringify(tasks)); } catch {}
}

function icsDate(value: string) {
  return value.replace(/[-:]/g, "") + "00";
}

function downloadCalendar(tasks: Task[], date: string) {
  const events = tasks.map((task) => [
    "BEGIN:VEVENT",
    `UID:${task.id}@tempo.local`,
    `DTSTART:${icsDate(`${date}T${task.time}:00`)}`,
    `DTEND:${icsDate(`${date}T${task.endTime}:00`)}`,
    `SUMMARY:${task.title.replace(/[\\,;]/g, "\\$&")}`,
    task.description ? `DESCRIPTION:${task.description.replace(/\n/g, "\\n")}` : "",
    "END:VEVENT",
  ].filter(Boolean).join("\r\n")).join("\r\n");
  const blob = new Blob([`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Tempo//Local Calendar//EN\r\n${events}\r\nEND:VCALENDAR`], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tempo-${date}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function parseIcsTasks(text: string, date: string): Task[] {
  return text.split("BEGIN:VEVENT").slice(1).map((event, index) => {
    const value = (key: string) => event.match(new RegExp(`(?:^|\\n)${key}(?:;[^:]*)?:([^\\r\\n]*)`))?.[1]?.trim() ?? "";
    const time = value("DTSTART").match(/T(\d{2})(\d{2})/);
    const endTime = value("DTEND").match(/T(\d{2})(\d{2})/);
    return {
      id: `ics-${Date.now()}-${index}`,
      title: value("SUMMARY") || "Evento importado",
      time: time ? `${time[1]}:${time[2]}` : "09:00",
      endTime: endTime ? `${endTime[1]}:${endTime[2]}` : "09:30",
      category: "Importado",
      categoryColor: "#3b74b8",
      energyLevel: "MEDIUM",
      isTop3: false,
      status: "PENDING",
      description: value("DESCRIPTION").replace(/\\n/g, "\n"),
      location: null,
      priority: "MEDIUM",
      recurrence: "NONE",
      reminderMinutes: null,
    };
  }).filter((task) => task.time < task.endTime || task.time === "00:00");
}

function initials(name: string | null) {
  if (!name) return "A";
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function taskDurationMinutes(task: Task) {
  const [startHour, startMinute] = task.time.split(":").map(Number);
  const [endHour, endMinute] = task.endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : 0;
}

export function Dashboard({
  tasks: initialTasks,
  userName,
  signedIn,
  selectedDate: initialDate,
}: {
  tasks: Task[];
  userName: string | null;
  signedIn: boolean;
  selectedDate: string;
}) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(localTasksKey(initialDate));
        if (saved) return JSON.parse(saved) as Task[];
      } catch {}
    }
    return initialTasks;
  });
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "agenda">("day");
  const [activePanel, setActivePanel] = useState<"tasks" | "statistics" | "settings" | null>(null);
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");
  const selectedDate = new Date(`${initialDate}T12:00:00-06:00`);
  const completeCount = tasks.filter((task) => task.status === "COMPLETED").length;
  const pendingTasks = tasks.length - completeCount;
  const progress = tasks.length ? Math.round((completeCount / tasks.length) * 100) : 0;
  const topTasks = tasks.filter((task) => task.isTop3);
  const scheduledMinutes = tasks.reduce((total, task) => total + taskDurationMinutes(task), 0);
  const categoryStats = tasks.reduce<Record<string, number>>((stats, task) => {
    stats[task.category] = (stats[task.category] ?? 0) + 1;
    return stats;
  }, {});
  const visibleTasks = tasks.filter((task) => (
    taskFilter === "all" ||
    (taskFilter === "pending" ? task.status !== "COMPLETED" : task.status === "COMPLETED")
  ));

  useEffect(() => {
    if (!activePanel) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActivePanel(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePanel]);

  const dateText = new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  }).format(selectedDate);

  const timeline = useMemo(() => {
    const hours = Array.from({ length: 10 }, (_, index) => index + 8);
    return hours.map((hour) => ({
      hour,
      tasks: tasks.filter((task) => Number(task.time.slice(0, 2)) === hour),
    }));
  }, [tasks]);

  async function persistAction(taskId: string, action: "toggle-status" | "toggle-top3") {
    const previous = tasks;
    setTasks((current) => current.map((task) => task.id !== taskId ? task : action === "toggle-top3"
      ? { ...task, isTop3: !task.isTop3 }
      : { ...task, status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" }));
    setNotice("");
    if (!signedIn) {
      const nextTasks = tasks.map((task) => task.id !== taskId ? task : action === "toggle-top3"
        ? { ...task, isTop3: !task.isTop3 }
        : { ...task, status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" });
      saveLocalTasks(initialDate, nextTasks);
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error ?? "No se pudo guardar el cambio.");
      }
      router.refresh();
    } catch (error) {
      setTasks(previous);
      setNotice(error instanceof Error ? t(error.message) : t("No se pudo guardar el cambio."));
    }
  }

  function toggleTop3(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    if (!task.isTop3 && topTasks.length >= 3) {
      setNotice(t("Tu Top 3 ya está completo. Quita una tarea antes de añadir otra."));
      return;
    }
    void persistAction(taskId, "toggle-top3");
  }

  function completeTask(taskId: string) {
    void persistAction(taskId, "toggle-status");
  }

  function exportIcs() {
    downloadCalendar(tasks, initialDate);
    setNotice(t("Calendario exportado correctamente."));
  }

  function importIcs(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      const imported = parseIcsTasks(text, initialDate);
      const nextTasks = [...tasks, ...imported].sort((a, b) => a.time.localeCompare(b.time));
      setTasks(nextTasks);
      saveLocalTasks(initialDate, nextTasks);
      setNotice(imported.length ? `${imported.length} eventos importados correctamente.` : t("No se encontraron eventos válidos en el archivo."));
    });
    event.target.value = "";
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") ?? initialDate);
    const title = String(form.get("title") ?? "").trim();
    const startTime = String(form.get("startTime") ?? "09:00");
    const endTime = String(form.get("endTime") ?? "09:30");
    try {
      if (!signedIn) {
        const localTask: Task = {
          id: `local-${Date.now()}`,
          title,
          time: startTime,
          endTime,
          category: categoryLabels[String(form.get("category") ?? "PERSONAL")] ?? "Personal",
          categoryColor: "#668264",
          energyLevel: String(form.get("energyLevel") ?? "MEDIUM"),
          isTop3: false,
          status: "PENDING",
          description: String(form.get("description") ?? "").trim() || null,
          location: String(form.get("location") ?? "").trim() || null,
          priority: String(form.get("priority") ?? "MEDIUM"),
          recurrence: String(form.get("recurrence") ?? "NONE"),
          reminderMinutes: Number(form.get("reminderMinutes") ?? 0),
        };
        const nextTasks = date === initialDate
          ? [...tasks, localTask].sort((a, b) => a.time.localeCompare(b.time))
          : [localTask];
        saveLocalTasks(date, nextTasks);
        if (date === initialDate) setTasks(nextTasks);
        setFormOpen(false);
        setNotice(t("Tarea guardada en este dispositivo."));
        if (date !== initialDate) router.push(`/?date=${date}`);
        return;
      }
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date,
          startTime,
          endTime,
          category: form.get("category"),
          energyLevel: form.get("energyLevel"),
          priority: form.get("priority"),
          recurrence: form.get("recurrence"),
          reminderMinutes: Number(form.get("reminderMinutes")),
          location: form.get("location"),
          description: form.get("description"),
        }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error ?? t("No se pudo guardar la tarea."));
      }
      const task = await response.json() as Task;
      setTasks((current) => [...current, task].sort((a, b) => a.time.localeCompare(b.time)));
      setFormOpen(false);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? t(error.message) : t("No se pudo guardar la tarea."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <aside className="sidebar">
        <a href="#" className="brand" aria-label="Tempo inicio">
          <span className="brand-mark"><Clock3 size={19} strokeWidth={2.4} /></span>
          <span>tempo<span className="brand-period">.</span></span>
        </a>

        <div className="sidebar-label">{t("ESPACIO PERSONAL")}</div>
        <nav className="side-nav" aria-label={t("Navegación principal")}>
          <button type="button" className={`nav-link nav-btn ${activePanel === null ? "active" : ""}`} onClick={() => setActivePanel(null)}>
            <CalendarDays size={18} /> {t("Mi día")}
          </button>
          <button type="button" className={`nav-link nav-btn ${activePanel === "tasks" ? "active" : ""}`} onClick={() => { setTaskFilter("all"); setActivePanel("tasks"); }}>
            <ListTodo size={18} /> {t("Tareas")} <span className="nav-count">{tasks.length}</span>
          </button>
          <button type="button" className={`nav-link nav-btn ${activePanel === "statistics" ? "active" : ""}`} onClick={() => setActivePanel("statistics")}>
            <Target size={18} /> {t("Estadísticas")}
          </button>
          <button type="button" className="nav-link nav-btn" onClick={() => setIntegrationsOpen(true)}>
            <ShieldCheck size={18} /> {t("Google & Alertas")}
          </button>
          <button type="button" className={`nav-link nav-btn ${activePanel === "settings" ? "active" : ""}`} onClick={() => setActivePanel("settings")}>
            <Settings size={18} /> {t("Ajustes")}
          </button>
        </nav>

        <div className="sidebar-label routines-label">{t("TUS RUTINAS")} <button aria-label={t("Añadir rutina")}><Plus size={15} /></button></div>
        <div className="routine-list">
          {routines.map((routine) => (
            <button
              className="routine-item"
              key={routine.title}
              onClick={() => setNotice(t(`${routine.title} añadida a tus rutinas. Asígnale un horario para planificarla.`))}
            >
              <span className={`routine-icon ${routine.color}`}>{routine.icon}</span>
              <span className="routine-copy"><span>{t(routine.title)}</span><small>{routine.duration}</small></span>
              <Plus size={15} className="routine-add" />
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-theme-container">
            <ThemeSwitcher />
          </div>
          <div className="streak-card">
            <div className="streak-icon"><Flame size={17} fill="currentColor" /></div>
            <div><strong>{t("3 días")}</strong><span>{t("racha actual")}</span></div>
            <Sparkles size={16} className="streak-sparkle" />
          </div>
          <button className="profile">
            <span className="avatar">{initials(userName)}</span>
            <span className="profile-info"><strong>{userName ?? t("Tu espacio")}</strong><small>{signedIn ? t("Plan personal") : t("Vista de demostración")}</small></span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">{t("Tu espacio")} <span>/</span> <strong>{t("Mi día")}</strong></div>
          <div className="topbar-actions">
            <InstallButton />
            <span className="sync-status"><span className="sync-dot" /> {signedIn ? t("Cuenta de Google conectada") : t("Modo local: guardado en este dispositivo")}</span>
            {!signedIn && <Link className="connect-button" href="/entrar">{t("Conectar Google")} <ArrowRight size={14} /></Link>}
            <ThemeSwitcher compact />
            <button
              className="icon-button notification-button"
              aria-label={t("Google y Notificaciones")}
              title={t("Permisos de Google y Notificaciones")}
              onClick={() => setIntegrationsOpen(true)}
            >
              <Bell size={18} />
              <i />
            </button>
            <span className="avatar top-avatar">{initials(userName)}</span>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="day-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> {t("TU DÍA, A TU RITMO")}</div>
              <h1>{t("Hola")}{userName ? `, ${userName.split(" ")[0]}` : ""}. <span>{t("Vamos con calma.")}</span></h1>
              <div className="date-row">
                <button className="date-nav" aria-label={t("Día anterior")} onClick={() => {
                  const date = new Date(`${initialDate}T12:00:00.000Z`);
                  date.setUTCDate(date.getUTCDate() - 1);
                  router.push(`/?date=${date.toISOString().slice(0, 10)}`);
                }}><ChevronLeft size={16} /></button>
                <span>{dateText}</span>
                <button className="date-nav" aria-label={t("Día siguiente")} onClick={() => {
                  const date = new Date(`${initialDate}T12:00:00.000Z`);
                  date.setUTCDate(date.getUTCDate() + 1);
                  router.push(`/?date=${date.toISOString().slice(0, 10)}`);
                }}><ChevronRight size={16} /></button>
                {dateText === new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City" }).format(new Date()) && <span className="today-pill">{t("HOY")}</span>}
              </div>
            </div>
            <button className="add-task-button" onClick={() => setFormOpen((open) => !open)}><Plus size={17} /> {t("Nueva tarea")}</button>
          </div>

          {formOpen && <form className="task-form" onSubmit={createTask}>
            <label className="form-wide">{t("Título")}<input name="title" maxLength={120} required placeholder={t("¿Qué quieres hacer?")} /></label>
            <label className="form-wide">{t("Descripción")}<textarea name="description" maxLength={1000} placeholder={t("Notas, detalles o checklist...")} /></label>
            <label>{t("Fecha")}<input name="date" type="date" required defaultValue={initialDate} /></label>
            <label>{t("Inicio")}<input name="startTime" type="time" required defaultValue="09:00" /></label>
            <label>{t("Fin")}<input name="endTime" type="time" required defaultValue="09:30" /></label>
            <label>{t("Categoría")}<select name="category" defaultValue="PERSONAL"><option value="WORK">{t("Trabajo")}</option><option value="STUDY">{t("Estudio")}</option><option value="HEALTH">{t("Salud")}</option><option value="PERSONAL">{t("Personal")}</option></select></label>
            <label>{t("Prioridad")}<select name="priority" defaultValue="MEDIUM"><option value="HIGH">{t("Alta")}</option><option value="MEDIUM">{t("Media")}</option><option value="LOW">{t("Baja")}</option></select></label>
            <label>{t("Energía")}<select name="energyLevel" defaultValue="MEDIUM"><option value="HIGH">{t("Alta")}</option><option value="MEDIUM">{t("Media")}</option><option value="LOW">{t("Baja")}</option></select></label>
            <label>{t("Repetir")}<select name="recurrence" defaultValue="NONE"><option value="NONE">{t("No se repite")}</option><option value="DAILY">{t("Cada día")}</option><option value="WEEKLY">{t("Cada semana")}</option><option value="MONTHLY">{t("Cada mes")}</option><option value="YEARLY">{t("Cada año")}</option></select></label>
            <label>{t("Recordatorio")}<select name="reminderMinutes" defaultValue="15"><option value="0">{t("Sin recordatorio")}</option><option value="5">{t("5 min antes")}</option><option value="15">{t("15 min antes")}</option><option value="30">{t("30 min antes")}</option><option value="60">{t("1 hora antes")}</option></select></label>
            <label className="form-wide">{t("Ubicación")}<input name="location" maxLength={200} placeholder={t("Lugar o enlace de reunión")} /></label>
            <button className="add-task-button" type="submit" disabled={saving}>{saving ? t("Guardando...") : t("Guardar tarea")}</button>
          </form>}

          {notice && <div role="status" className="notice"><span>{t(notice)}</span><button onClick={() => setNotice("")} aria-label={t("Cerrar")}>×</button></div>}

          <div className="dashboard-grid">
            <div className="left-column">
              <section className="focus-card">
                <div className="focus-main">
                  <div className="focus-overline"><span className="focus-icon"><Sparkles size={15} /></span> {t("TU ENFOQUE DE HOY")}</div>
                  <h2>{t("Un paso a la vez.")}</h2>
                  <p>{t("El progreso real no necesita prisa.")}<br />{t("Celebra cada cosa que sí hiciste.")}</p>
                  <div className="focus-footer"><span className="focus-sun">☀</span> {t("Un día con intención es un buen día.")}</div>
                </div>
                <div className="progress-wrap">
                  <svg viewBox="0 0 120 120" role="img" aria-label={`${progress}% de tareas completadas`} className="progress-ring">
                    <circle className="progress-track" cx="60" cy="60" r="49" />
                    <circle className="progress-value" cx="60" cy="60" r="49" style={{ strokeDasharray: `${progress * 3.08} 308` }} />
                  </svg>
                  <div className="progress-center"><strong>{progress}<small>%</small></strong><span>{t("completado")}</span></div>
                  <div className="progress-caption">{completeCount} {language === "es" ? "de" : "of"} {tasks.length} {t("tareas")}</div>
                </div>
                <div className="leaf-art" aria-hidden="true"><Leaf size={82} strokeWidth={0.8} /></div>
              </section>

              <section className="top3-card">
                <div className="section-heading top3-heading">
                  <div>
                    <div className="section-kicker"><Target size={14} /> {t("LO QUE MÁS IMPORTA")}</div>
                    <h2>{t("Tu Top 3")} <span>{topTasks.length}/3</span></h2>
                  </div>
                  <button className="text-button" onClick={() => setNotice(t("Elige hasta 3 tareas desde el timeline para priorizarlas."))}>{t("Editar prioridades")} <ArrowRight size={14} /></button>
                </div>
                <div className="top3-list">
                  {[0, 1, 2].map((slot) => {
                    const task = topTasks[slot];
                    return task ? (
                      <div className="top3-item" key={task.id}>
                        <span className={`priority-number priority-${slot + 1}`}>{String(slot + 1).padStart(2, "0")}</span>
                        <span className="top3-title">{task.title}</span>
                        <span className="top3-time">{task.time}</span>
                        <button className="remove-priority" onClick={() => toggleTop3(task.id)} aria-label={`${t("Quitar de prioridades")}: ${task.title}`}>×</button>
                      </div>
                    ) : (
                      <div className="top3-empty" key={`empty-${slot}`}>
                        <span className="priority-number empty-number">{String(slot + 1).padStart(2, "0")}</span>
                        <span>{t("Un espacio para lo que importa")}</span>
                        <span className="empty-dash">—</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="timeline-section">
                <div className="section-heading timeline-heading">
                  <div>
                    <div className="section-kicker"><Clock3 size={14} /> {t("TU TIEMPO, CON INTENCIÓN")}</div>
                    <h2>{t("El plan de hoy")}</h2>
                  </div>
                  <div className="view-switcher" role="group" aria-label={t("Vista del calendario")}>
                    {([['day', t("Día")], ['week', t("Semana")], ['agenda', t("Agenda")]] as const).map(([id, label]) => (
                      <button key={id} className={viewMode === id ? "active" : ""} onClick={() => setViewMode(id)}>{label}</button>
                    ))}
                  </div>
                </div>
                {viewMode === "week" && <div className="calendar-summary"><CalendarDays size={17} /><span>{t("Vista semanal")}</span><strong>{tasks.length} {t("actividades planificadas")}</strong></div>}
                {viewMode === "agenda" && <div className="calendar-summary"><ListChecks size={17} /><span>{t("Agenda")}</span><strong>{t("Ordenada por hora de inicio")}</strong></div>}
                <div className="timeline">
                  {timeline.map(({ hour, tasks: hourTasks }) => (
                    <div className="timeline-row" key={hour}>
                      <span className="timeline-hour">{String(hour).padStart(2, "0")}:00</span>
                      <div className="timeline-track">
                        <span className="timeline-line" />
                        {hourTasks.map((task) => (
                          <article className={`task-block ${task.status === "COMPLETED" ? "task-completed" : ""}`} key={task.id} style={{ borderLeftColor: task.categoryColor }}>
                            <button className="task-check" onClick={() => completeTask(task.id)} aria-label={task.status === "COMPLETED" ? t("Marcar pendiente") : t("Marcar completada")}>
                              {task.status === "COMPLETED" ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                            </button>
                            <div className="task-content">
                              <div className="task-title-row"><strong>{task.title}</strong>{task.isTop3 && <span className="task-priority"><Sparkles size={11} /> {t("PRIORIDAD")}</span>}</div>
                              <div className="task-meta"><span className="task-time">{task.time} – {task.endTime}</span><span className="meta-divider" /><span className="category-dot" style={{ background: task.categoryColor }} />{t(task.category)}<span className="meta-divider" /><Zap size={11} />{t(energyLabel[task.energyLevel] ?? "Energía media")}{task.priority === "HIGH" && <><span className="meta-divider" /><strong className="high-priority">{t("Urgente")}</strong></>}{task.recurrence && task.recurrence !== "NONE" && <><span className="meta-divider" /><Repeat2 size={11} /> {t("Repetitiva")}</>}{task.location && <><span className="meta-divider" /><MapPin size={11} /> {task.location}</>}</div>
                            </div>
                            <button className={`priority-toggle ${task.isTop3 ? "priority-selected" : ""}`} onClick={() => toggleTop3(task.id)} aria-label={task.isTop3 ? t("Quitar de prioridades") : t("Añadir a Top 3")}><Sparkles size={14} /></button>
                          </article>
                        ))}
                        {hourTasks.length === 0 && <button className="empty-hour" onClick={() => setNotice(t("Elige “Nueva tarea” y asigna un bloque para este horario."))}><span /><span className="empty-hour-label">{t("Deja espacio para una pausa o añade un bloque")}</span></button>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="right-column">
              <section className="week-card">
                <div className="week-title-row"><div><div className="section-kicker">{t("TU CONSTANCIA")}</div><h2>{t("Esta semana")}</h2></div><button className="more-button" aria-label={t("Más opciones")}>···</button></div>
                <div className="week-stats">
                  <div className="stat-number">4.2<span>/5</span><small>{t("días en ritmo")}</small></div>
                  <div className="stat-change"><ArrowUpRight size={13} /> 12%<small>{t("vs. semana pasada")}</small></div>
                </div>
                <div className="week-chart" aria-label={t("Actividad semanal")}>
                  {(language === "es"
                    ? [{ d: "L", v: 68 }, { d: "M", v: 89 }, { d: "M", v: 52 }, { d: "J", v: 78 }, { d: "V", v: 95 }, { d: "S", v: 38 }, { d: "D", v: 22 }]
                    : [{ d: "M", v: 68 }, { d: "T", v: 89 }, { d: "W", v: 52 }, { d: "T", v: 78 }, { d: "F", v: 95 }, { d: "S", v: 38 }, { d: "S", v: 22 }]
                  ).map((day, i) => (
                    <div className="chart-column" key={`${day.d}-${i}`}><span className={`chart-bar ${i === 4 ? "chart-today" : ""}`} style={{ height: `${day.v}%` }} />{i === 4 && <i />}</div>
                  ))}
                </div>
                <div className="week-days">{(language === "es" ? ["L", "M", "M", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"]).map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
                <div className="week-footer"><span><span className="legend-dot" /> {t("Constancia")}</span><button>{t("Ver estadísticas")} <ArrowRight size={13} /></button></div>
              </section>

              <section className="energy-card">
                <div className="energy-icon"><Zap size={16} fill="currentColor" /></div>
                <div><strong>{t("Cuida tu energía")}</strong><p>{t("Alterna tareas intensas con")}<br />{t("momentos para respirar.")}</p></div>
                <ArrowDownLeft size={17} className="energy-arrow" />
                <div className="energy-meter"><span /><span /><span /><span /><span /></div>
                <div className="energy-meter-label"><span>{t("Suave")}</span><span>{t("Intenso")}</span></div>
              </section>

              <section className="ritual-card">
                <div className="ritual-top"><span className="ritual-icon"><Coffee size={16} /></span><span className="section-kicker">{t("UN RECORDATORIO AMABLE")}</span></div>
                <h3>{t("No olvides hacer")}<br />{t("una pausa.")}</h3>
                <p>{t("Tu descanso también")}<br />{t("es parte del plan.")}</p>
                <div className="ritual-bottom"><span>{t("Respira. Vas bien.")}</span><span className="ritual-sun">✳</span></div>
              </section>

              <button className="review-button" onClick={() => setNotice(t("Tu revisión diaria quedará disponible al activar las notificaciones."))}><Check size={15} /> {t("Cerrar el día")} <span>{t("Revisar juntos")}</span><ArrowRight size={14} /></button>
            </aside>
          </div>
          <footer className="dashboard-footer"><span>{t("Hecho para vivir mejor, no para hacer más.")}</span><span><Link href="/privacidad">{t("Privacidad")}</Link> · {t("Tómalo con calma")} <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>

      <GoogleIntegrationsModal
        isOpen={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
        signedIn={signedIn}
      />

      {activePanel && (
        <div
          className="modal-backdrop workspace-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActivePanel(null);
          }}
        >
          <section
            className={`modal-card workspace-modal ${activePanel === "settings" ? "settings-card" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-panel-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge">
                  {activePanel === "tasks" ? <ListTodo size={18} /> : activePanel === "statistics" ? <BarChart3 size={18} /> : <Settings size={18} />}
                </span>
                <div>
                  <h2 id="workspace-panel-title">
                    {activePanel === "tasks" ? t("Tus tareas") : activePanel === "statistics" ? t("Tus estadísticas") : t("Ajustes de Tempo")}
                  </h2>
                  <p>
                    {activePanel === "tasks" ? `${dateText} · ${tasks.length} ${t("actividades")}` : activePanel === "statistics" ? t("Un resumen de tu progreso para este día.") : t("Personaliza tu espacio de planificación")}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActivePanel(null)} aria-label={t("Cerrar ventana")}>
                <X size={18} />
              </button>
            </header>
            {activePanel === "tasks" && (
              <div className="modal-body workspace-body">
                <div className="panel-summary-strip">
                  <div><strong>{tasks.length}</strong><span>{t("Total")}</span></div>
                  <div><strong>{pendingTasks}</strong><span>{t("Pendientes")}</span></div>
                  <div><strong>{completeCount}</strong><span>{t("Completadas")}</span></div>
                </div>
                <div className="task-filter-tabs" role="group" aria-label={t("Filtrar tareas")}>
                  {([
                    ["all", t("Todas"), tasks.length],
                    ["pending", t("Pendientes"), pendingTasks],
                    ["completed", t("Completadas"), completeCount],
                  ] as const).map(([filter, label, count]) => (
                    <button
                      type="button"
                      key={filter}
                      className={taskFilter === filter ? "active" : ""}
                      aria-pressed={taskFilter === filter}
                      onClick={() => setTaskFilter(filter)}
                    >
                      {label}<span>{count}</span>
                    </button>
                  ))}
                </div>
                {visibleTasks.length ? (
                  <div className="task-panel-list">
                    {visibleTasks.map((task) => (
                      <article className={`task-panel-item ${task.status === "COMPLETED" ? "is-completed" : ""}`} key={task.id} style={{ "--task-color": task.categoryColor } as React.CSSProperties}>
                        <button
                          type="button"
                          className="task-panel-check"
                          onClick={() => completeTask(task.id)}
                          aria-label={task.status === "COMPLETED" ? t("Marcar pendiente") : t("Marcar completada")}
                        >
                          {task.status === "COMPLETED" ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                        <div className="task-panel-copy">
                          <strong>{task.title}</strong>
                          <span><Clock3 size={13} /> {task.time} – {task.endTime}<i /> <span className="category-dot" style={{ background: task.categoryColor }} /> {t(task.category)}</span>
                        </div>
                        <div className="task-panel-tags">
                          {task.isTop3 && <span className="task-panel-priority"><Sparkles size={12} /> {t("Prioridad")}</span>}
                          <span className={`task-panel-status ${task.status === "COMPLETED" ? "done" : ""}`}>
                            {task.status === "COMPLETED" ? t("Completada") : t("Pendiente")}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="panel-empty-state">
                    <span><ListTodo size={22} /></span>
                    <strong>{taskFilter === "completed" ? t("Todavía no hay tareas completadas") : t("No hay tareas pendientes")}</strong>
                    <p>{taskFilter === "completed" ? t("Cuando completes una tarea, aparecerá aquí.") : t("Disfruta el espacio libre o añade una tarea para organizar tu día.")}</p>
                  </div>
                )}
                <footer className="panel-footer">
                  <span>{t("Organiza tu día a tu ritmo.")}</span>
                  <button type="button" className="btn-primary" onClick={() => { setActivePanel(null); setFormOpen(true); }}>
                    <Plus size={15} /> {t("Nueva tarea")}
                  </button>
                </footer>
              </div>
            )}
            {activePanel === "statistics" && (
              <div className="modal-body workspace-body">
                <div className="stats-highlight">
                  <div className="stats-highlight-copy">
                    <span>{t("PROGRESO DEL DÍA")}</span>
                    <strong>{progress}<small>%</small></strong>
                    <p>{completeCount} {language === "es" ? "de" : "of"} {tasks.length} {t("tareas completadas")}</p>
                  </div>
                  <div className="stats-ring" style={{ "--progress": `${progress}%` } as React.CSSProperties}>
                    <span>{progress}%</span>
                  </div>
                </div>
                <div className="stats-metric-grid">
                  <article className="stats-metric">
                    <span className="stats-metric-icon pending"><Clock3 size={17} /></span>
                    <div><strong>{pendingTasks}</strong><small>{t("Pendientes")}</small></div>
                  </article>
                  <article className="stats-metric">
                    <span className="stats-metric-icon completed"><CheckCircle2 size={17} /></span>
                    <div><strong>{completeCount}</strong><small>{t("Completadas")}</small></div>
                  </article>
                  <article className="stats-metric">
                    <span className="stats-metric-icon focus"><Target size={17} /></span>
                    <div><strong>{topTasks.length}<small> / 3</small></strong><small>{t("Prioridades del día")}</small></div>
                  </article>
                  <article className="stats-metric">
                    <span className="stats-metric-icon time"><CalendarDays size={17} /></span>
                    <div>
                      <strong>{Math.floor(scheduledMinutes / 60)}<small> h {scheduledMinutes % 60} min</small></strong>
                      <small>{t("Tiempo planificado")}</small>
                    </div>
                  </article>
                </div>
                <section className="category-stats">
                  <div className="category-stats-heading"><div><h3>{t("Tareas por categoría")}</h3><p>{t("Así se distribuye tu planificación de hoy.")}</p></div><span>{tasks.length} {t("en total")}</span></div>
                  {Object.entries(categoryStats).length ? (
                    <div className="category-stats-list">
                      {Object.entries(categoryStats).map(([category, count]) => (
                        <div className="category-stat-row" key={category}>
                          <div><span className="category-dot" style={{ background: tasks.find((task) => task.category === category)?.categoryColor ?? "#668264" }} /><span>{t(category)}</span><strong>{count}</strong></div>
                          <div className="category-stat-track"><span style={{ width: `${Math.round((count / tasks.length) * 100)}%`, background: tasks.find((task) => task.category === category)?.categoryColor ?? "#668264" }} /></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="category-stats-empty">{t("Añade tareas para ver aquí el resumen de tu actividad.")}</div>
                  )}
                </section>
                <footer className="panel-footer">
                  <span>{t("Cada pequeño avance cuenta.")}</span>
                  <button type="button" className="btn-secondary" onClick={() => { setTaskFilter("all"); setActivePanel("tasks"); }}>
                    <ListTodo size={15} /> {t("Ver tareas")}
                  </button>
                </footer>
              </div>
            )}
            {activePanel === "settings" && <div className="modal-body settings-body">
              <section className="settings-section">
                <h3>{t("Idioma")}</h3>
                <p>{t("Selecciona el idioma de la aplicación.")}</p>
                <label className="language-setting">
                  <span>{t("Idioma de la aplicación")}</span>
                  <select
                    className="language-select"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value === "en" ? "en" : "es")}
                    aria-label={t("Idioma de la aplicación")}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </label>
              </section>
              <section className="settings-section">
                <h3>{t("Apariencia")}</h3>
                <p>{t("Elige claro, oscuro o sigue automáticamente la configuración de tu dispositivo.")}</p>
                <ThemeSwitcher />
              </section>
              <section className="settings-section">
                <h3>{t("Cuenta e integraciones")}</h3>
                <p>{signedIn ? t("Tu cuenta de Google está conectada. Puedes sincronizar Calendar y administrar notificaciones.") : t("Conecta Google para guardar tus tareas y sincronizar tu calendario.")}</p>
                <button className="btn-primary" onClick={() => { setActivePanel(null); setIntegrationsOpen(true); }}>
                  <ShieldCheck size={14} /> {t("Google y notificaciones")}
                </button>
              </section>
              <section className="settings-section">
                <h3>{t("Calendario local")}</h3>
                <p>{t("Tus tareas pueden vivir en este dispositivo sin cuentas externas. También puedes moverlas mediante archivos ICS.")}</p>
                <div className="calendar-file-actions">
                  <button className="btn-secondary" onClick={exportIcs}>{t("Exportar este día")}</button>
                  <label className="btn-secondary file-button">
                    {t("Importar ICS")}
                    <input type="file" accept=".ics,text/calendar" onChange={importIcs} />
                  </label>
                </div>
              </section>
              <section className="settings-section">
                <h3>{t("Experiencia")}</h3>
                <p>{t("Tempo guarda tu preferencia de apariencia en este dispositivo y funciona como aplicación instalable desde el navegador.")}</p>
                <InstallButton />
              </section>
            </div>}
          </section>
        </div>
      )}
    </main>
  );
}
