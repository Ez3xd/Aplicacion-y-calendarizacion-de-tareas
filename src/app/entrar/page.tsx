"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SignInPage() {
  return (
    <main className="signin-page">
      <section>
        <Link href="/" className="signin-brand">tempo<span>.</span></Link>
        <h1>Entra a tu espacio</h1>
        <p>Usaremos tu cuenta de Google para iniciar sesión y mostrar tu nombre y correo. Tus tareas se guardan en Tempo para que puedas verlas desde tus dispositivos.</p>
        <p>Esta versión no solicita acceso a Google Calendar.</p>
        <button className="connect-button" onClick={() => void signIn("google", { callbackUrl: "/" })}>
          Continuar con Google <ArrowRight size={16} />
        </button>
        <small>Al continuar, Google te mostrará los permisos solicitados. Consulta el <Link href="/privacidad">aviso de privacidad</Link>.</small>
      </section>
    </main>
  );
}
