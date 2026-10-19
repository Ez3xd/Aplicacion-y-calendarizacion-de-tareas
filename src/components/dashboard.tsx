"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InstallButton } from "@/components/install-button";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
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
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { GoogleIntegrationsModal } from "@/components/google-integrations-modal";

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

function initials(name: string | null) {
  if (!name) return "A";
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
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
  const [tasks, setTasks] = useState(initialTasks);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const selectedDate = new Date(`${initialDate}T12:00:00-06:00`);
  const completeCount = tasks.filter((task) => task.status === "COMPLETED").length;
  const progress = tasks.length ? Math.round((completeCount / tasks.length) * 100) : 0;
  const topTasks = tasks.filter((task) => task.isTop3);

  const dateText = new Intl.DateTimeFormat("es-MX", {
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
    if (!signedIn) return;

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
      setNotice(error instanceof Error ? error.message : "No se pudo guardar el cambio.");
    }
  }

  function toggleTop3(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    if (!task.isTop3 && topTasks.length >= 3) {
      setNotice("Tu Top 3 ya está completo. Quita una tarea antes de añadir otra.");
      return;
    }
    void persistAction(taskId, "toggle-top3");
  }

  function completeTask(taskId: string) {
    void persistAction(taskId, "toggle-status");
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          date: initialDate,
          startTime: form.get("startTime"),
          endTime: form.get("endTime"),
          category: form.get("category"),
          energyLevel: form.get("energyLevel"),
        }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error ?? "No se pudo guardar la tarea.");
      }
      const task = await response.json() as Task;
      setTasks((current) => [...current, task].sort((a, b) => a.time.localeCompare(b.time)));
      setFormOpen(false);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar la tarea.");
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

        <div className="sidebar-label">ESPACIO PERSONAL</div>
        <nav className="side-nav" aria-label="Navegación principal">
          <a className="nav-link active" href="#"><CalendarDays size={18} /> Mi día</a>
          <a className="nav-link" href="#"><ListTodo size={18} /> Tareas <span className="nav-count">{tasks.length}</span></a>
          <a className="nav-link" href="#"><Target size={18} /> Estadísticas</a>
          <button type="button" className="nav-link nav-btn" onClick={() => setIntegrationsOpen(true)}>
            <ShieldCheck size={18} /> Google & Alertas
          </button>
        </nav>

        <div className="sidebar-label routines-label">TUS RUTINAS <button aria-label="Añadir rutina"><Plus size={15} /></button></div>
        <div className="routine-list">
          {routines.map((routine) => (
            <button
              className="routine-item"
              key={routine.title}
              onClick={() => setNotice(`${routine.title} añadida a tus rutinas. Asígnale un horario para planificarla.`)}
            >
              <span className={`routine-icon ${routine.color}`}>{routine.icon}</span>
              <span className="routine-copy"><span>{routine.title}</span><small>{routine.duration}</small></span>
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
            <div><strong>3 días</strong><span>racha actual</span></div>
            <Sparkles size={16} className="streak-sparkle" />
          </div>
          <button className="profile">
            <span className="avatar">{initials(userName)}</span>
            <span className="profile-info"><strong>{userName ?? "Tu espacio"}</strong><small>{signedIn ? "Plan personal" : "Vista de demostración"}</small></span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">Tu espacio <span>/</span> <strong>Mi día</strong></div>
          <div className="topbar-actions">
            <InstallButton />
            <span className="sync-status"><span className="sync-dot" /> {signedIn ? "Cuenta de Google conectada" : "Vista previa"}</span>
            {!signedIn && <Link className="connect-button" href="/entrar">Conectar Google <ArrowRight size={14} /></Link>}
            <ThemeSwitcher compact />
            <button
              className="icon-button notification-button"
              aria-label="Google y Notificaciones"
              title="Permisos de Google y Notificaciones"
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
              <div className="eyebrow"><span className="eyebrow-line" /> TU DÍA, A TU RITMO</div>
              <h1>Hola{userName ? `, ${userName.split(" ")[0]}` : ""}. <span>Vamos con calma.</span></h1>
              <div className="date-row">
                <button className="date-nav" aria-label="Día anterior" onClick={() => {
                  const date = new Date(`${initialDate}T12:00:00.000Z`);
                  date.setUTCDate(date.getUTCDate() - 1);
                  router.push(`/?date=${date.toISOString().slice(0, 10)}`);
                }}><ChevronLeft size={16} /></button>
                <span>{dateText}</span>
                <button className="date-nav" aria-label="Día siguiente" onClick={() => {
                  const date = new Date(`${initialDate}T12:00:00.000Z`);
                  date.setUTCDate(date.getUTCDate() + 1);
                  router.push(`/?date=${date.toISOString().slice(0, 10)}`);
                }}><ChevronRight size={16} /></button>
                {dateText === new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City" }).format(new Date()) && <span className="today-pill">HOY</span>}
              </div>
            </div>
            {signedIn
              ? <button className="add-task-button" onClick={() => setFormOpen((open) => !open)}><Plus size={17} /> Nueva tarea</button>
              : <Link className="add-task-button" href="/entrar"><Plus size={17} /> Conectar Google</Link>}
          </div>

          {formOpen && <form className="task-form" onSubmit={createTask}>
            <label>Tarea<input name="title" maxLength={120} required placeholder="¿Qué quieres hacer?" /></label>
            <label>Inicio<input name="startTime" type="time" required defaultValue="09:00" /></label>
            <label>Fin<input name="endTime" type="time" required defaultValue="09:30" /></label>
            <label>Categoría<select name="category" defaultValue="PERSONAL"><option value="WORK">Trabajo</option><option value="STUDY">Estudio</option><option value="HEALTH">Salud</option><option value="PERSONAL">Personal</option></select></label>
            <label>Energía<select name="energyLevel" defaultValue="MEDIUM"><option value="HIGH">Alta</option><option value="MEDIUM">Media</option><option value="LOW">Baja</option></select></label>
            <button className="add-task-button" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar tarea"}</button>
          </form>}

          {notice && <div role="status" className="notice"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Cerrar">×</button></div>}

          <div className="dashboard-grid">
            <div className="left-column">
              <section className="focus-card">
                <div className="focus-main">
                  <div className="focus-overline"><span className="focus-icon"><Sparkles size={15} /></span> TU ENFOQUE DE HOY</div>
                  <h2>Un paso a la vez.</h2>
                  <p>El progreso real no necesita prisa.<br />Celebra cada cosa que sí hiciste.</p>
                  <div className="focus-footer"><span className="focus-sun">☀</span> Un día con intención es un buen día.</div>
                </div>
                <div className="progress-wrap">
                  <svg viewBox="0 0 120 120" role="img" aria-label={`${progress}% de tareas completadas`} className="progress-ring">
                    <circle className="progress-track" cx="60" cy="60" r="49" />
                    <circle className="progress-value" cx="60" cy="60" r="49" style={{ strokeDasharray: `${progress * 3.08} 308` }} />
                  </svg>
                  <div className="progress-center"><strong>{progress}<small>%</small></strong><span>completado</span></div>
                  <div className="progress-caption">{completeCount} de {tasks.length} tareas</div>
                </div>
                <div className="leaf-art" aria-hidden="true"><Leaf size={82} strokeWidth={0.8} /></div>
              </section>

              <section className="top3-card">
                <div className="section-heading top3-heading">
                  <div>
                    <div className="section-kicker"><Target size={14} /> LO QUE MÁS IMPORTA</div>
                    <h2>Tu Top 3 <span>{topTasks.length}/3</span></h2>
                  </div>
                  <button className="text-button" onClick={() => setNotice("Elige hasta 3 tareas desde el timeline para priorizarlas.")}>Editar prioridades <ArrowRight size={14} /></button>
                </div>
                <div className="top3-list">
                  {[0, 1, 2].map((slot) => {
                    const task = topTasks[slot];
                    return task ? (
                      <div className="top3-item" key={task.id}>
                        <span className={`priority-number priority-${slot + 1}`}>{String(slot + 1).padStart(2, "0")}</span>
                        <span className="top3-title">{task.title}</span>
                        <span className="top3-time">{task.time}</span>
                        <button className="remove-priority" onClick={() => toggleTop3(task.id)} aria-label={`Quitar ${task.title} del Top 3`}>×</button>
                      </div>
                    ) : (
                      <div className="top3-empty" key={`empty-${slot}`}>
                        <span className="priority-number empty-number">{String(slot + 1).padStart(2, "0")}</span>
                        <span>Un espacio para lo que importa</span>
                        <span className="empty-dash">—</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="timeline-section">
                <div className="section-heading timeline-heading">
                  <div>
                    <div className="section-kicker"><Clock3 size={14} /> TU TIEMPO, CON INTENCIÓN</div>
                    <h2>El plan de hoy</h2>
                  </div>
                  <button className="view-button">Vista diaria <ChevronDown size={14} /></button>
                </div>
                <div className="timeline">
                  {timeline.map(({ hour, tasks: hourTasks }) => (
                    <div className="timeline-row" key={hour}>
                      <span className="timeline-hour">{String(hour).padStart(2, "0")}:00</span>
                      <div className="timeline-track">
                        <span className="timeline-line" />
                        {hourTasks.map((task) => (
                          <article className={`task-block ${task.status === "COMPLETED" ? "task-completed" : ""}`} key={task.id} style={{ borderLeftColor: task.categoryColor }}>
                            <button className="task-check" onClick={() => completeTask(task.id)} aria-label={task.status === "COMPLETED" ? "Marcar pendiente" : "Marcar completada"}>
                              {task.status === "COMPLETED" ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                            </button>
                            <div className="task-content">
                              <div className="task-title-row"><strong>{task.title}</strong>{task.isTop3 && <span className="task-priority"><Sparkles size={11} /> PRIORIDAD</span>}</div>
                              <div className="task-meta"><span className="task-time">{task.time} – {task.endTime}</span><span className="meta-divider" /><span className="category-dot" style={{ background: task.categoryColor }} />{task.category}<span className="meta-divider" /><Zap size={11} />{energyLabel[task.energyLevel] ?? "Energía media"}</div>
                            </div>
                            <button className={`priority-toggle ${task.isTop3 ? "priority-selected" : ""}`} onClick={() => toggleTop3(task.id)} aria-label={task.isTop3 ? "Quitar de prioridades" : "Añadir a Top 3"}><Sparkles size={14} /></button>
                          </article>
                        ))}
                        {hourTasks.length === 0 && <button className="empty-hour" onClick={() => setNotice("Elige “Nueva tarea” y asigna un bloque para este horario.")}><span /><span className="empty-hour-label">Deja espacio para una pausa o añade un bloque</span></button>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="right-column">
              <section className="week-card">
                <div className="week-title-row"><div><div className="section-kicker">TU CONSTANCIA</div><h2>Esta semana</h2></div><button className="more-button" aria-label="Más opciones">···</button></div>
                <div className="week-stats">
                  <div className="stat-number">4.2<span>/5</span><small>días en ritmo</small></div>
                  <div className="stat-change"><ArrowUpRight size={13} /> 12%<small>vs. semana pasada</small></div>
                </div>
                <div className="week-chart" aria-label="Actividad semanal">
                  {[{ d: "L", v: 68 }, { d: "M", v: 89 }, { d: "M", v: 52 }, { d: "J", v: 78 }, { d: "V", v: 95 }, { d: "S", v: 38 }, { d: "D", v: 22 }].map((day, i) => (
                    <div className="chart-column" key={`${day.d}-${i}`}><span className={`chart-bar ${i === 4 ? "chart-today" : ""}`} style={{ height: `${day.v}%` }} />{i === 4 && <i />}</div>
                  ))}
                </div>
                <div className="week-days"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
                <div className="week-footer"><span><span className="legend-dot" /> Constancia</span><button>Ver estadísticas <ArrowRight size={13} /></button></div>
              </section>

              <section className="energy-card">
                <div className="energy-icon"><Zap size={16} fill="currentColor" /></div>
                <div><strong>Cuida tu energía</strong><p>Alterna tareas intensas con<br />momentos para respirar.</p></div>
                <ArrowDownLeft size={17} className="energy-arrow" />
                <div className="energy-meter"><span /><span /><span /><span /><span /></div>
                <div className="energy-meter-label"><span>Suave</span><span>Intenso</span></div>
              </section>

              <section className="ritual-card">
                <div className="ritual-top"><span className="ritual-icon"><Coffee size={16} /></span><span className="section-kicker">UN RECORDATORIO AMABLE</span></div>
                <h3>No olvides hacer<br />una pausa.</h3>
                <p>Tu descanso también<br />es parte del plan.</p>
                <div className="ritual-bottom"><span>Respira. Vas bien.</span><span className="ritual-sun">✳</span></div>
              </section>

              <button className="review-button" onClick={() => setNotice("Tu revisión diaria quedará disponible al activar las notificaciones.")}><Check size={15} /> Cerrar el día <span>Revisar juntos</span><ArrowRight size={14} /></button>
            </aside>
          </div>
          <footer className="dashboard-footer"><span>Hecho para vivir mejor, no para hacer más.</span><span><Link href="/privacidad">Privacidad</Link> · Tómalo con calma <span className="footer-heart">♥</span></span></footer>
        </div>
      </section>

      <GoogleIntegrationsModal
        isOpen={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
        signedIn={signedIn}
      />
    </main>
  );
}
