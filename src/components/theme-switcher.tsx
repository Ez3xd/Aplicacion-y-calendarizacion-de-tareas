"use client";

import { useTheme, type Theme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();

  const options: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: "light", label: t("Blanco"), icon: Sun },
    { id: "dark", label: t("Oscuro"), icon: Moon },
    { id: "system", label: t("Sistema"), icon: Monitor },
  ];

  if (compact) {
    return (
      <div className="theme-switcher-compact" role="group" aria-label={t("Selector de tema visual")}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`theme-btn ${isActive ? "active" : ""}`}
              onClick={() => setTheme(opt.id)}
              title={`${opt.label}${opt.id === "system" ? ` (${resolvedTheme})` : ""}`}
              aria-pressed={isActive}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="theme-switcher-group" role="group" aria-label={t("Selector de tema visual")}>
      <span className="theme-switcher-label">{t("Apariencia:")}</span>
      <div className="theme-switcher-pills">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`theme-pill ${isActive ? "active" : ""}`}
              onClick={() => setTheme(opt.id)}
              aria-pressed={isActive}
            >
              <Icon size={13} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
