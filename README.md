# Tempo

Aplicación de planificación diaria hecha con Next.js, Prisma y PostgreSQL. Las tareas se guardan por cuenta y se comparten al iniciar sesión desde otro dispositivo. La interfaz se adapta a móviles y puede instalarse como PWA; para abrir y guardar tareas necesita conexión a Internet.

## Probar con Docker

Requisitos: Docker Desktop con Docker Compose y una cuenta OAuth de Google para probar el inicio de sesión. No pongas datos reales en la instancia local de prueba.

1. Crea el archivo local de entorno:

   ```powershell
   Copy-Item .env.docker.example .env
   ```

2. Genera un secreto para NextAuth:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Pega el resultado en `NEXTAUTH_SECRET` dentro de `.env`. Cambia también `POSTGRES_PASSWORD` y la contraseña correspondiente dentro de `DATABASE_URL`, conservando el host `db`.

3. Configura un cliente OAuth web en Google Cloud:
   - Añade `http://localhost:3002` a los orígenes JavaScript autorizados.
   - Añade `http://localhost:3002/api/auth/callback/google` a los URI de redirección autorizados.
   - Configura la pantalla de consentimiento y, mientras la aplicación esté en pruebas, añade tu cuenta como usuario de prueba.
   - Copia el ID y el secreto del cliente a `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`.

4. Arranca la base de datos, ejecuta las migraciones y levanta la aplicación:

   ```powershell
   docker compose up --build
   ```

   Abre <http://localhost:3002>. La primera compilación puede tardar varios minutos. El puerto local se configura con `APP_PORT` en `.env` (predeterminado: 3002). La base de datos se conserva en un volumen Docker. Para detener los contenedores usa `Ctrl+C` y luego `docker compose down`. **`docker compose down -v` borra los datos de prueba de PostgreSQL.**

Para revisar los registros: `docker compose logs -f app`. Para ver el estado: `docker compose ps`.

## PWA y sincronización

- En Chrome/Edge, usa el botón **Instalar** cuando el navegador lo ofrezca. En iPhone/iPad, abre la URL en Safari y elige **Compartir → Añadir a pantalla de inicio**.
- En móvil y PC usa la misma URL pública y entra con la misma cuenta de Google. Las tareas, prioridades y estados se guardan en PostgreSQL.
- El modo sin conexión solo muestra una página informativa; no almacena ni sincroniza cambios offline.
- El servicio worker no guarda en caché las páginas con sesión ni la información de tareas.

## Alcance de Google y privacidad

El inicio de sesión pide solo `openid`, `email` y `profile`, para autenticar y mostrar la identidad básica. **No pide permiso de Google Calendar en esta versión.** Aunque existe código servidor de apoyo para Calendar, todavía no está conectado a una acción visible en la interfaz; por eso no se solicita ese permiso. Si se implementa la integración, debe añadirse un consentimiento claro en el momento de activar la función y pedir únicamente los scopes estrictamente necesarios.

`/privacidad` contiene un borrador informativo que identifica expresamente los datos pendientes del responsable del servicio, sus proveedores, contacto y plazos de conservación. No es una certificación ni un aviso listo para producción. Antes de invitar usuarios, completa y revisa el aviso según el país del operador y de cada público objetivo, implementa eliminación/exportación de cuentas y datos, y publica la política y el contacto en la pantalla OAuth. No existe una configuración técnica que garantice por sí sola cumplimiento legal en todos los países.

## Despliegue público

El contenedor está listo para ejecutarse detrás de un proxy HTTPS en un servidor que soporte Docker Compose. En producción:

1. Configura un dominio HTTPS, PostgreSQL administrado o protegido, copias de seguridad y secretos únicos fuera del repositorio.
2. Define `NEXTAUTH_URL` con el dominio HTTPS y `DATABASE_URL` accesible desde los contenedores.
3. En Google Cloud configura el dominio autorizado y la redirección `https://TU-DOMINIO/api/auth/callback/google`. Completa la pantalla de consentimiento y solicita a Google cualquier verificación necesaria para el público y los scopes usados.
4. Ejecuta `docker compose up --build` para que el servicio de migración aplique los cambios y después inicie la app.

No uses las credenciales de prueba, contraseñas de ejemplo ni el servidor de desarrollo en producción.

## Desarrollo local sin Docker

Requiere Node.js 20 o posterior y PostgreSQL. Configura `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`, luego ejecuta:

```powershell
npm ci
npm run db:generate
npm run db:migrate -- --name init
npm run dev
```

## Calendario

`src/lib/google-calendar.ts` incluye utilidades servidor para consultar, sincronizar y crear eventos con Google Calendar, pero no hay interfaz ni consentimiento incremental que las active. No se consideran una integración disponible para el usuario hasta que se conecten explícitamente.
