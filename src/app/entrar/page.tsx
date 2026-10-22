"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export default function SignInPage() {
  const { t } = useLanguage();
  return (
    <main className="signin-page">
      <section>
        <Link href="/" className="signin-brand">tempo<span>.</span></Link>
        <h1>{t("Entra a tu espacio")}</h1>
        <p>{t("Usaremos tu cuenta de Google para iniciar sesión y mostrar tu nombre y correo. Tus tareas se guardan en Tempo para que puedas verlas desde tus dispositivos.")}</p>
        <p>{t("También puedes autorizar Google Calendar para importar tus eventos y evitar conflictos de horario.")}</p>
        <button className="connect-button" onClick={() => void signIn("google", { callbackUrl: "/" })}>
          {t("Continuar con Google")} <ArrowRight size={16} />
        </button>
        <small>{t("Al continuar, Google te mostrará los permisos solicitados. Consulta el")} <Link href="/privacidad">{t("aviso de privacidad")}</Link>.</small>
      </section>
    </main>
  );
}
