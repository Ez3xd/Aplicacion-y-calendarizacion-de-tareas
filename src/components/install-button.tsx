"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallButton() {
  const { t } = useLanguage();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  if (!promptEvent) return null;

  return (
    <button className="install-button" onClick={async () => {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      setPromptEvent(null);
    }}>
      <Download size={14} /> {t("Instalar")}
    </button>
  );
}
