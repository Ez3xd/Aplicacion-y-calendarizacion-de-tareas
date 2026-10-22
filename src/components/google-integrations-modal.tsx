"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLanguage } from "@/components/language-provider";
import { GOOGLE_APP_URLS } from "@/lib/google-app-urls";

const googleAppShortcuts = [
  {
    name: "Gmail",
    description: "Abre tu bandeja de entrada en Gmail.",
    details: "Lee y responde tu correo directamente en el sitio oficial de Gmail.",
    href: GOOGLE_APP_URLS.gmail,
    Icon: Mail,
    iconClass: "gmail-icon",
  },
  {
    name: "Google Drive",
    description: "Abre tus archivos en Drive.",
    details: "Consulta tus archivos y documentos en el sitio oficial de Google Drive.",
    href: GOOGLE_APP_URLS.drive,
    Icon: HardDrive,
    iconClass: "drive-icon",
  },
  {
    name: "Google Meet",
    description: "Inicia o únete a una reunión.",
    details: "Crea una videollamada o introduce un código desde Google Meet.",
    href: GOOGLE_APP_URLS.meet,
    Icon: Video,
    iconClass: "meet-icon",
  },
];
import {
  Bell,
  Calendar,
  ExternalLink,
  HardDrive,
  Mail,
  Shield,
  Sparkles,
  Video,
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

export function GoogleIntegrationsModal({
  isOpen,
  onClose,
  signedIn,
}: GoogleIntegrationsModalProps) {
  const { t } = useLanguage();
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(getInitialNotificationStatus);
  const [connectedServices, setConnectedServices] = useState<Record<string, boolean>>({ calendar: signedIn });
  const [loadingService, setLoadingService] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setAlertMsg(t("Este navegador no soporta notificaciones de escritorio/móvil."));
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === "granted") {
        setAlertMsg(t("¡Permiso de notificaciones concedido! Las alertas llegarán a tiempo."));
        new Notification(t("Tempo — Notificaciones activadas"), {
          body: t("Ahora recibirás recordatorios de tus tareas y momentos de descanso."),
          icon: "/icon.svg",
        });
      } else if (permission === "denied") {
        setAlertMsg(t("Permiso denegado. Puedes reactivarlo en los ajustes de tu navegador o app."));
      }
    } catch {
      setAlertMsg(t("Ocurrió un error al solicitar permiso de notificaciones."));
    }
  }

  function sendTestNotification() {
    if (Notification.permission === "granted") {
      new Notification(t("Tempo — Recordatorio amable"), {
        body: t("Momento de una pausa: respira hondo y cuida tu ritmo."),
        icon: "/icon.svg",
      });
      setAlertMsg(t("Notificación de prueba enviada a tu dispositivo."));
    } else {
      void requestNotificationPermission();
    }
  }

  async function handleCalendarSync() {
    if (!signedIn) {
      await signIn("google", { callbackUrl: window.location.pathname });
      return;
    }

    setLoadingService("calendar");
    setAlertMsg(null);

    try {
      const response = await fetch("/api/google/calendar/sync", { method: "POST" });
      const result = await response.json() as { error?: string; synced?: number };
      if (!response.ok) throw new Error(result.error ?? "No se pudo sincronizar Google Calendar.");
      setConnectedServices((prev) => ({ ...prev, calendar: true }));
      setAlertMsg(`${t("Google Calendar")} ${t("sincronizado")}: ${result.synced ?? 0} ${t("eventos actualizados")}.`);
    } catch (error) {
      setAlertMsg(error instanceof Error ? t(error.message) : t("No se pudo sincronizar Google Calendar. Reautoriza tu cuenta de Google."));
    } finally {
      setLoadingService(null);
    }
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
              <h2 id="modal-title">{t("Servicios de Google y Notificaciones")}</h2>
              <p>{t("Controla los accesos a programas de Google y alertas a tu dispositivo")}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label={t("Cerrar ventana")}>
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
              <h3>{t("Notificaciones del Dispositivo (Push)")}</h3>
            </div>
            <p className="integration-desc">
              {t("Recibe avisos al iniciar una tarea de tu Top 3, recordatorios de pausas activas y alertas de cierre de jornada.")}
            </p>

            <div className="integration-card">
              <div className="integration-card-info">
                <div className="service-icon notification-icon">
                  <Bell size={20} />
                </div>
                <div>
                  <strong>{t("Notificaciones Push")}</strong>
                  <div className="status-badge-row">
                    <span className={`status-badge ${notificationStatus === "granted" ? "status-success" : notificationStatus === "denied" ? "status-danger" : "status-warning"}`}>
                      {notificationStatus === "granted" ? t("Permiso concedido") : notificationStatus === "denied" ? t("Bloqueado por el navegador") : t("Pendiente de permiso")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="integration-actions">
                {notificationStatus === "granted" ? (
                  <button className="btn-secondary" onClick={sendTestNotification}>
                    <Sparkles size={14} /> {t("Enviar prueba")}
                  </button>
                ) : (
                  <button className="btn-primary" onClick={requestNotificationPermission}>
                    <Bell size={14} /> {t("Permitir notificaciones")}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* SECCIÓN PROGRAMAS DE GOOGLE */}
          <section className="integration-section">
            <div className="integration-section-header">
              <span className="section-dot" />
              <h3>{t("Programas y Aplicaciones de Google")}</h3>
            </div>
            <p className="integration-desc">
              {t("Abre Gmail, Drive y Meet directamente. Son accesos a sus sitios oficiales; Tempo no accede a tus datos ni requiere una API para usarlos.")}
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
                    <small>{t("Sincroniza eventos y bloques de enfoque")}</small>
                  </div>
                </div>
                <p className="service-details">
                  {t("Lee y agenda bloques en tu calendario principal para evitar colisiones de horario.")}
                </p>
                <div className="service-bottom">
                  <span className={`service-chip ${connectedServices.calendar ? "active" : ""}`}>
                    {connectedServices.calendar ? t("Conectado") : t("No vinculado")}
                  </span>
                  <button
                    className={`btn-action ${connectedServices.calendar ? "btn-disconnect" : "btn-connect"}`}
                    disabled={loadingService === "calendar"}
                    onClick={handleCalendarSync}
                  >
                    {loadingService === "calendar" ? t("Sincronizando...") : connectedServices.calendar ? t("Sincronizar") : t("Conectar Google")}
                  </button>
                </div>
              </div>

              {googleAppShortcuts.map(({ name, description, details, href, Icon, iconClass }) => (
                <div className="service-box" key={name}>
                  <div className="service-top">
                    <div className={`service-icon ${iconClass}`}>
                      <Icon size={18} />
                    </div>
                    <div className="service-meta">
                      <h4>{name}</h4>
                      <small>{t(description)}</small>
                    </div>
                  </div>
                  <p className="service-details">{t(details)}</p>
                  <div className="service-bottom">
                    <span className="service-chip">{t("Sitio oficial de Google")}</span>
                    <a
                      className="btn-action btn-connect service-link"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t("Abrir sitio oficial de")} ${name}`}
                    >
                      {t("Abrir")} <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="modal-security-note">
            <Shield size={14} />
            <span>
              <strong>{t("Tus datos siguen bajo tu control:")}</strong> {t("Estos accesos abren los sitios oficiales y no dan a Tempo acceso a Gmail, Drive o Meet. La sincronización de Calendar solicita su propio permiso de Google. Tempo nunca almacena tu contraseña de Google.")}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
