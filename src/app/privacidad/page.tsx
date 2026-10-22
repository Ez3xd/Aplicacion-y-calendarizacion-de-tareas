"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function PrivacyPage() {
  const { t } = useLanguage();
  return (
    <main className="privacy-page">
      <article>
        <Link href="/">{t("← Volver a Tempo")}</Link>
        <p className="privacy-draft">{t("Borrador: no publicar para usuarios externos sin completar y revisar los datos del operador y las leyes aplicables.")}</p>
        <h1>{t("Aviso de privacidad de Tempo")}</h1>
        <p>{t("Este aviso describe el tratamiento de datos en la versión de prueba de Tempo. Antes de operar públicamente, el responsable debe completar su identidad, domicilio, correo de contacto, jurisdicción y plazos de conservación.")}</p>

        <h2>{t("Quién opera el servicio")}</h2>
        <p>{t("Responsable: Anderson Reyes. Domicilio: Universidad de Oriente. Contacto de privacidad: andersonezequiel.reyes@gamil.com. Estos campos son obligatorios antes de publicar el servicio.")}</p>

        <h2>{t("Datos y permisos solicitados")}</h2>
        <p>{t("Al iniciar sesión con Google, la aplicación solicita permisos básicos de identidad y permiso para administrar eventos de Google Calendar, que se usa en la sincronización del calendario. El adaptador de autenticación guarda en la base de datos el identificador de la cuenta de Google y los datos técnicos de autenticación que entrega el proveedor. Los accesos directos a Gmail, Drive y Meet solo abren sus sitios oficiales en otra pestaña: Tempo no recibe acceso a esos servicios ni solicita sus permisos.")}</p>
        <p>{t("Las tareas que el usuario crea (título, fecha, horario, categoría, nivel de energía, estado y prioridad) se guardan en la base de datos del servicio y se asocian a su cuenta. Google procesa la autenticación según sus propios términos y políticas de privacidad.")}</p>

        <h2>{t("Finalidades y terceros")}</h2>
        <p>{t("Los datos de cuenta se usan para autenticar al usuario y separar sus tareas de las de otras cuentas. Las tareas se usan para mostrar y sincronizar la planificación entre dispositivos. La aplicación no vende datos ni los usa para publicidad. El proveedor de alojamiento y el proveedor de base de datos recibirán los datos necesarios para operar el servicio; el operador debe identificarlos aquí antes de producción.")}</p>

        <h2>{t("Conservación, seguridad y derechos")}</h2>
        <p>{t("Los datos se conservan en la base de datos configurada por el operador. Esta versión aún no incluye una opción de eliminar cuenta o exportar datos desde la aplicación. Antes de invitar a usuarios, el operador debe publicar plazos concretos de conservación, un canal efectivo para ejercer los derechos aplicables y un procedimiento para eliminar los datos y copias de respaldo.")}</p>
        <p>{t("El servicio debe desplegarse detrás de HTTPS, proteger las credenciales y la base de datos y limitar el acceso administrativo. La conexión local de prueba no está destinada a datos reales.")}</p>

        <h2>{t("Google OAuth y publicación")}</h2>
        <p>{t("El operador debe completar y publicar una política de privacidad accesible desde la pantalla de consentimiento de Google, configurar correctamente el dominio y las URL de redirección y solicitar la verificación de Google cuando corresponda. Si se añaden permisos de Calendar, deberán explicarse antes de solicitarlos, pedirse solo al activar esa función y someterse a los requisitos de verificación aplicables.")}</p>
        <p>{t("Este texto es una base informativa para pruebas, no asesoría ni certificación legal. El operador debe adaptarlo a cada jurisdicción y solicitar revisión profesional antes de ofrecer el servicio al público.")}</p>
      </article>
    </main>
  );
}
