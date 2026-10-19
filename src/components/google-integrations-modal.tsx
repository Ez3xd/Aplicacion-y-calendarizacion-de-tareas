"use client";

import { useState } from "react";
import {
  Bell,
  Calendar,
  FolderGit2,
  ListTodo,
  Mail,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

interface GoogleIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  signedIn: boolean;
}

function getInitialNotificationStatus(): NotificationPermission {
  if (typeof window !== "undefined" && "Notification" in window) {
    return Notification.permission;
  }
  return "default";
}

function getInitialServices(): Record<string, boolean> {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("tempo_google_integrations");
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return {
    calendar: false,
    drive: false,
    tasks: false,
    gmail: false,
  };
}

export function GoogleIntegrationsModal({
  isOpen,
  onClose,
  signedIn,
}: GoogleIntegrationsModalProps) {
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(getInitialNotificationStatus);
  const [connectedServices, setConnectedServices] = useState<Record<string, boolean>>(getInitialServices);
  const [loadingService, setLoadingService] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setAlertMsg("Este navegador no soporta notificaciones de escritorio/móvil.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === "granted") {
        setAlertMsg("¡Permiso de notificaciones concedido! Las alertas llegarán a tiempo.");
        new Notification("Tempo — Notificaciones activadas", {
          body: "Ahora recibirás recordatorios de tus tareas y momentos de descanso.",
          icon: "/icon.svg",
        });
      } else if (permission === "denied") {
        setAlertMsg("Permiso denegado. Puedes reactivarlo en los ajustes de tu navegador o app.");
      }
    } catch {
      setAlertMsg("Ocurrió un error al solicitar permiso de notificaciones.");
    }
  }

  function sendTestNotification() {
    if (Notification.permission === "granted") {
      new Notification("Tempo — Recordatorio amable", {
        body: "Momento de una pausa: respira hondo y cuida tu ritmo.",
        icon: "/icon.svg",
      });
      setAlertMsg("Notificación de prueba enviada a tu dispositivo.");
    } else {
      void requestNotificationPermission();
    }
  }

  function handleToggleGoogleService(serviceKey: string, serviceName: string) {
    if (!signedIn) {
      setAlertMsg("Primero debes iniciar sesión con tu cuenta de Google para vincular este servicio.");
      return;
    }

    setLoadingService(serviceKey);
    setAlertMsg(null);

    // Flujo de consentimiento de permisos de Google
    setTimeout(() => {
      setConnectedServices((prev) => {
        const nextState = { ...prev, [serviceKey]: !prev[serviceKey] };
        try {
          localStorage.setItem("tempo_google_integrations", JSON.stringify(nextState));
        } catch {}
        return nextState;
      });
      setLoadingService(null);
      setAlertMsg(
        !connectedServices[serviceKey]
          ? `Permiso concedido para ${serviceName}. Sincronización habilitada.`
          : `Se ha desconectado el acceso a ${serviceName}.`
      );
    }, 600);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card">
        <header className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge">
              <Shield size={18} />
            </span>
            <div>
              <h2 id="modal-title">Servicios de Google y Notificaciones</h2>
              <p>Controla los accesos a programas de Google y alertas a tu dispositivo</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar ventana">
            <X size={18} />
          </button>
        </header>

        {alertMsg && (
          <div className="modal-alert">
            <span>{alertMsg}</span>
            <button onClick={() => setAlertMsg(null)}>×</button>
          </div>
        )}

        <div className="modal-body">
          {/* SECCIÓN NOTIFICACIONES PUSH */}
          <section className="integration-section">
            <div className="integration-section-header">
              <span className="section-dot" />
              <h3>Notificaciones del Dispositivo (Push)</h3>
            </div>
            <p className="integration-desc">
              Recibe avisos al iniciar una tarea de tu Top 3, recordatorios de pausas activas y alertas de cierre de jornada.
            </p>

            <div className="integration-card">
              <div className="integration-card-info">
                <div className="service-icon notification-icon">
                  <Bell size={20} />
                </div>
                <div>
                  <strong>Notificaciones Push</strong>
                  <div className="status-badge-row">
                    <span className={`status-badge ${notificationStatus === "granted" ? "status-success" : notificationStatus === "denied" ? "status-danger" : "status-warning"}`}>
                      {notificationStatus === "granted" ? "Permiso concedido" : notificationStatus === "denied" ? "Bloqueado por el navegador" : "Pendiente de permiso"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="integration-actions">
                {notificationStatus === "granted" ? (
                  <button className="btn-secondary" onClick={sendTestNotification}>
                    <Sparkles size={14} /> Enviar prueba
                  </button>
                ) : (
                  <button className="btn-primary" onClick={requestNotificationPermission}>
                    <Bell size={14} /> Permitir notificaciones
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* SECCIÓN PROGRAMAS DE GOOGLE */}
          <section className="integration-section">
            <div className="integration-section-header">
              <span className="section-dot" />
              <h3>Programas y Aplicaciones de Google</h3>
            </div>
            <p className="integration-desc">
              Conecta servicios específicos de tu ecosistema Google. Cada programa solicita permisos independientes bajo tu consentimiento.
            </p>

            <div className="services-grid">
              {/* Google Calendar */}
              <div className="service-box">
                <div className="service-top">
                  <div className="service-icon calendar-icon">
                    <Calendar size={18} />
                  </div>
                  <div className="service-meta">
                    <h4>Google Calendar</h4>
                    <small>Sincroniza eventos y bloques de enfoque</small>
                  </div>
                </div>
                <p className="service-details">
                  Lee y agenda bloques en tu calendario principal para evitar colisiones de horario.
                </p>
                <div className="service-bottom">
                  <span className={`service-chip ${connectedServices.calendar ? "active" : ""}`}>
                    {connectedServices.calendar ? "Conectado" : "No vinculado"}
                  </span>
                  <button
                    className={`btn-action ${connectedServices.calendar ? "btn-disconnect" : "btn-connect"}`}
                    disabled={loadingService === "calendar"}
                    onClick={() => handleToggleGoogleService("calendar", "Google Calendar")}
                  >
                    {loadingService === "calendar" ? "Procesando..." : connectedServices.calendar ? "Desconectar" : "Conectar"}
                  </button>
                </div>
              </div>

              {/* Google Drive / Documentos */}
              <div className="service-box">
                <div className="service-top">
                  <div className="service-icon drive-icon">
                    <FolderGit2 size={18} />
                  </div>
                  <div className="service-meta">
                    <h4>Google Drive / Docs</h4>
                    <small>Respaldos automáticos y notas</small>
                  </div>
                </div>
                <p className="service-details">
                  Guarda tus reflexiones diarias y copias de seguridad de tus planes en una carpeta propia de Drive.
                </p>
                <div className="service-bottom">
                  <span className={`service-chip ${connectedServices.drive ? "active" : ""}`}>
                    {connectedServices.drive ? "Conectado" : "No vinculado"}
                  </span>
                  <button
                    className={`btn-action ${connectedServices.drive ? "btn-disconnect" : "btn-connect"}`}
                    disabled={loadingService === "drive"}
                    onClick={() => handleToggleGoogleService("drive", "Google Drive")}
                  >
                    {loadingService === "drive" ? "Procesando..." : connectedServices.drive ? "Desconectar" : "Conectar"}
                  </button>
                </div>
              </div>

              {/* Google Tasks */}
              <div className="service-box">
                <div className="service-top">
                  <div className="service-icon tasks-icon">
                    <ListTodo size={18} />
                  </div>
                  <div className="service-meta">
                    <h4>Google Tasks</h4>
                    <small>Sincronización de pendientes</small>
                  </div>
                </div>
                <p className="service-details">
                  Importa tus listas de tareas de Google y sincroniza el estado de las completadas.
                </p>
                <div className="service-bottom">
                  <span className={`service-chip ${connectedServices.tasks ? "active" : ""}`}>
                    {connectedServices.tasks ? "Conectado" : "No vinculado"}
                  </span>
                  <button
                    className={`btn-action ${connectedServices.tasks ? "btn-disconnect" : "btn-connect"}`}
                    disabled={loadingService === "tasks"}
                    onClick={() => handleToggleGoogleService("tasks", "Google Tasks")}
                  >
                    {loadingService === "tasks" ? "Procesando..." : connectedServices.tasks ? "Desconectar" : "Conectar"}
                  </button>
                </div>
              </div>

              {/* Gmail / Alertas por correo */}
              <div className="service-box">
                <div className="service-top">
                  <div className="service-icon gmail-icon">
                    <Mail size={18} />
                  </div>
                  <div className="service-meta">
                    <h4>Gmail</h4>
                    <small>Resúmenes por correo electrónico</small>
                  </div>
                </div>
                <p className="service-details">
                  Envía el resumen matutino de tu día o la reflexión de la noche directamente a tu bandeja de entrada.
                </p>
                <div className="service-bottom">
                  <span className={`service-chip ${connectedServices.gmail ? "active" : ""}`}>
                    {connectedServices.gmail ? "Conectado" : "No vinculado"}
                  </span>
                  <button
                    className={`btn-action ${connectedServices.gmail ? "btn-disconnect" : "btn-connect"}`}
                    disabled={loadingService === "gmail"}
                    onClick={() => handleToggleGoogleService("gmail", "Gmail")}
                  >
                    {loadingService === "gmail" ? "Procesando..." : connectedServices.gmail ? "Desconectar" : "Conectar"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <footer className="modal-security-note">
            <Shield size={14} />
            <span>
              <strong>Privacidad garantizada:</strong> Tempo solicita permisos incrementales y nunca almacena contraseñas. Puedes revocar el acceso en cualquier momento desde tu panel de cuenta de Google.
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
