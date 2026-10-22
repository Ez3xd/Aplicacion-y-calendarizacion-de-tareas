# Tempo

<p align="center">
  <strong>Tu día, a tu ritmo.</strong><br />
  Un planificador personal para organizar tareas, cuidar tu energía y ver tu progreso con claridad.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-PostgreSQL-2d3748?logo=prisma" />
</p>

Tempo es una aplicación de planificación diaria adaptable a computadoras y móviles. Puedes organizar actividades por horario y categoría, marcar prioridades, revisar estadísticas y conservar tus tareas en este dispositivo o sincronizarlas con tu cuenta.

> **Actualización · 22 de octubre de 2026**
>
> Esta guía reúne las funciones disponibles, las mejoras recientes de interfaz y las alternativas actuales para usar servicios de Google.

## Contenido

- [Novedades de esta actualización](#novedades-de-esta-actualización)
- [Qué puedes hacer](#qué-puedes-hacer)
- [Servicios de Google: qué funciona](#servicios-de-google-qué-funciona)
- [Iniciar el proyecto con Docker](#iniciar-el-proyecto-con-docker)
- [Desarrollo local sin Docker](#desarrollo-local-sin-docker)
- [Configuración de Google OAuth](#configuración-de-google-oauth)
- [Comandos disponibles](#comandos-disponibles)
- [Datos, privacidad y límites](#datos-privacidad-y-límites)
- [Despliegue](#despliegue)

## Novedades de esta actualización

### Paneles más claros para trabajar

Al seleccionar **Tareas** o **Estadísticas**, se abre un panel central destacado y el fondo se desenfoca. Los paneles se cierran con el botón de cierre, al tocar fuera o con `Esc`, y se adaptan a pantallas pequeñas.

- **Tareas:** filtros para ver todas, pendientes o completadas; resumen del día; y controles para marcar actividades o crear una nueva.
- **Estadísticas:** porcentaje de progreso, actividades pendientes y completadas, prioridades, tiempo planificado y distribución por categoría.

### Idioma y apariencia

En **Ajustes** puedes seleccionar **Español** o **English**, además de elegir el tema claro, oscuro o el del sistema. Las preferencias de idioma y apariencia se guardan en el navegador del dispositivo actual; todavía no se sincronizan entre dispositivos.

### Accesos a Gmail, Drive y Meet

La sección que antes mostraba rutinas de ejemplo ahora ofrece accesos directos a **Gmail**, **Google Drive** y **Google Meet**. También están disponibles en **Google y Alertas**. Cada enlace abre el sitio oficial de Google en otra pestaña: no hace falta una integración propia ni conceder a Tempo permisos para leer correo, archivos o reuniones.

### Tareas, calendario y validaciones

- El formulario permite registrar título, descripción, fecha, horario, categoría, prioridad, energía, repetición, recordatorio y ubicación.
- El progreso y el Top 3 se pueden actualizar desde la vista diaria y desde el panel de tareas. El Top 3 admite hasta tres actividades por día.
- Cuando no has iniciado sesión, las tareas que creas se guardan en el almacenamiento local del navegador. Al iniciar sesión, las tareas de la cuenta se guardan en PostgreSQL y pueden consultarse desde otros dispositivos.
- Puedes importar y exportar actividades mediante archivos de calendario `.ics` desde **Ajustes → Calendario local**.
- El servidor valida los datos de las tareas y protege sus operaciones para que cada cuenta solo cambie sus propias actividades.
- La vista del día incluye controles para cambiar de fecha, alternar entre día, semana y agenda, y revisar el avance y las prioridades.

### Estabilidad y puesta en marcha

- Se restauró la ruta de retorno de Google OAuth para que la autenticación y las rutas generadas por Next.js estén disponibles durante el build.
- Se mantuvieron las directivas compatibles con Tailwind CSS 3 para evitar errores al cargar los estilos en el navegador.
- Se documentó cómo reenviar el puerto indicado por Next.js en VS Code y cómo mantenerlo alineado con `NEXTAUTH_URL` y la URL de retorno de Google.

## Qué puedes hacer

| Área | Funciones |
| --- | --- |
| Plan diario | Vista por horario, avance de tareas, Top 3 y navegación entre fechas. |
| Actividades | Categorías, prioridad, energía, descripción, ubicación, recurrencia y recordatorios. |
| Estadísticas | Progreso del día, tareas, tiempo reservado y reparto por categoría. |
| Apariencia | Temas claro, oscuro y automático. |
| Idiomas | Interfaz en español e inglés; preferencia local por dispositivo. |
| Calendario | Sincronización con Google Calendar y archivos `.ics` para importar o exportar. |
| Aplicación web | Diseño adaptable e instalación como PWA cuando el navegador la ofrezca. |
| Servicios Google | Accesos directos oficiales a Gmail, Drive y Meet, sin integración API con Tempo. |

## Servicios de Google: qué funciona

| Servicio | Estado | Qué hace |
| --- | --- | --- |
| Inicio de sesión con Google | Disponible | Autentica la cuenta y muestra la identidad básica. |
| Google Calendar | Sincronización disponible | La aplicación solicita el permiso de eventos de Calendar y puede importar eventos próximos. |
| Gmail | Acceso directo | Abre Gmail en otra pestaña; Tempo no lee ni envía correos. |
| Google Drive | Acceso directo | Abre Drive en otra pestaña; Tempo no lee ni guarda archivos allí. |
| Google Meet | Acceso directo | Abre Meet en otra pestaña; Tempo no crea ni administra reuniones desde la aplicación. |

Los enlaces directos usan las cuentas que ya estén abiertas en el navegador. No son una sincronización entre esos servicios y Tempo. No se solicitan permisos API para Gmail, Drive o Meet.

## Iniciar el proyecto con Docker

**Necesitas:** Docker Desktop con Docker Compose y credenciales OAuth de Google si quieres probar el inicio de sesión o la sincronización de Calendar.

1. Crea el archivo de configuración local:

   ```powershell
   Copy-Item .env.docker.example .env
   ```

2. Genera un secreto para NextAuth:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Pega el valor en `NEXTAUTH_SECRET`. En `.env`, cambia también `POSTGRES_PASSWORD` y la contraseña de `DATABASE_URL`; para Docker Compose, conserva `db` como host de la base de datos.

3. En Google Cloud, configura un cliente OAuth de tipo **Aplicación web**:
   - Origen autorizado: `http://localhost:3002`
   - URI de redirección autorizado: `http://localhost:3002/api/auth/callback/google`
   - Mientras la pantalla de consentimiento esté en modo de pruebas, añade tu cuenta como usuario de prueba.
   - Copia el ID y el secreto del cliente en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

4. Construye y levanta la aplicación y sus servicios:

   ```powershell
   docker compose up --build
   ```

5. Abre <http://localhost:3002>.

El puerto del equipo se configura con `APP_PORT` (predeterminado: `3002`). PostgreSQL conserva sus datos en un volumen de Docker. Para detener la aplicación, pulsa `Ctrl+C` y ejecuta `docker compose down`. **`docker compose down -v` también elimina el volumen y los datos de prueba.**

Comandos útiles:

```powershell
docker compose ps
docker compose logs -f app
```

## Desarrollo local sin Docker

**Necesitas:** Node.js 20 o posterior, PostgreSQL y npm.

1. Configura `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`.
2. Instala dependencias, genera el cliente de Prisma y aplica las migraciones del proyecto:

   ```powershell
   npm ci
   npm run db:generate
   npm run db:migrate
   ```

3. Inicia Next.js:

   ```powershell
   npm run dev
   ```

4. Abre la dirección local que indique la terminal. Si trabajas en un entorno remoto o en VS Code, reenvía el puerto que muestre Next.js —normalmente `3000`— en el panel **Puertos** y utiliza la URL que proporciona el entorno.

Para OAuth, `NEXTAUTH_URL` y la URI de retorno configurada en Google deben corresponder a la dirección desde la que pruebas. El callback es `<NEXTAUTH_URL>/api/auth/callback/google`. Después de cambiar la URL, reinicia el servidor.

## Configuración de Google OAuth

La autenticación solicita los permisos de identidad `openid`, `email` y `profile`. También solicita `https://www.googleapis.com/auth/calendar.events` para habilitar la sincronización visible con Google Calendar. La sincronización consulta eventos en un intervalo de hasta 90 días.

Los accesos a Gmail, Drive y Meet solo abren sus sitios oficiales y **no requieren ni solicitan scopes API** para esos servicios. Revisa la pantalla de consentimiento, los dominios autorizados, la URI de retorno y los requisitos de verificación de Google antes de publicar la aplicación.

## Comandos disponibles

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia Next.js en modo desarrollo. |
| `npm run build` | Genera la compilación de producción. |
| `npm run start` | Ejecuta el script `next start`; para la configuración de producción `standalone`, utiliza Docker Compose. |
| `npm run lint` | Ejecuta ESLint. |
| `npm run typecheck` | Comprueba los tipos de TypeScript. |
| `npm run db:generate` | Genera el cliente de Prisma. |
| `npm run db:migrate` | Aplica migraciones en desarrollo. |
| `npm run db:deploy` | Aplica migraciones en despliegues. |

## Datos, privacidad y límites

- Las tareas de una cuenta autenticada se guardan en PostgreSQL. Las tareas creadas sin iniciar sesión se guardan en el almacenamiento local del navegador, por lo que no se comparten automáticamente entre dispositivos.
- Las preferencias de idioma y tema también son locales al navegador.
- El funcionamiento que necesita datos o sincronización requiere conexión a Internet. La vista sin conexión muestra una página informativa y no sincroniza cambios.
- El service worker no guarda en caché las páginas autenticadas ni la información privada de las tareas.
- Las notificaciones disponibles dependen del permiso del navegador. Activar el permiso no significa que exista un servicio de notificaciones programadas en segundo plano.
- [El aviso de privacidad](./src/app/privacidad/page.tsx) sigue siendo un borrador. Antes de publicar, completa y revisa los datos del responsable, proveedores, contacto, plazos de conservación y procedimientos para exportar y eliminar datos. Ajusta el texto a las jurisdicciones aplicables y a los permisos OAuth realmente configurados.

No uses credenciales de ejemplo ni datos personales reales en una instalación de prueba. Ninguna configuración técnica sustituye la revisión de privacidad y seguridad necesaria antes de ofrecer el servicio públicamente.

## Despliegue

El proyecto incluye una imagen Docker de producción y un servicio que aplica las migraciones antes de iniciar la aplicación. Para un despliegue público:

1. Usa un dominio con HTTPS, secretos únicos y una base de datos protegida con copias de seguridad.
2. Configura `NEXTAUTH_URL` con la URL pública y `DATABASE_URL` con la dirección accesible desde los contenedores.
3. Configura en Google Cloud el dominio autorizado y `https://TU-DOMINIO/api/auth/callback/google`; revisa los scopes y requisitos de verificación aplicables.
4. Ejecuta `docker compose up --build` y verifica los registros y el estado de los servicios.

No uses el servidor de desarrollo ni contraseñas de ejemplo en producción.
