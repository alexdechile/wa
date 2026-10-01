# Bitácora y Documentación Maestra (wa.comerza.cl)

## Último Realizado
- **Endurecimiento del enrutador y correlación con leads (2026-10-01)**:
  - **Dos agujeros de seguridad cerrados**, ambos explotables sin autenticación:
    - **DoS permanente del panel.** `/api/track` aceptaba cualquier texto como `timestamp` y lo guardaba crudo. `/api/panel/summary` lo formateaba con `Intl` sin `try/catch`, así que un solo POST dejaba una fila que hacía que **el panel entero quedara en 500 para siempre**. Ahora el reloj es del servidor, el filtro por forma de fecha va en SQL y hay una defensa extra en JS.
    - **Inundación de alertas de WhatsApp.** `targetLine` e `isHumanHours` los declaraba el cliente y el edge les creía, sin rate limit: un POST con `{"button":"sales","targetLine":"human"}` disparaba el lazo del host, que alerta por WhatsApp al supervisor. Ahora la línea se deriva del botón con el horario del **servidor** y hay ventana fija en D1 (30 clics/min por IP, 3 leads/10 min).
  - **Regla de enrutamiento con fuente única:** `lib/routing.ts` la usan el frontend y la función de edge. Antes la lógica vivía solo en el navegador.
  - **Horario compartido:** `functions/_lib/schedule.ts` es la única implementación; la consumen `/api/time` y `/api/track`.
  - **Correlación clic ↔ lead (Fase 1):** `notifyLead` ahora devuelve el `id` del lead y manda `clientRef` (`wa:evt:<id>`), un campo que el puente ya aceptaba y nunca se usó. Se agregó `lead_id` a `contact_events`, y el panel muestra el país del contacto en cada lead abierto.
  - **Fix en `bim`:** `toRecord()` no copiaba `clientRef` al `LeadRecord`, así que `GET /leads` no lo devolvía y la correlación no llegaba al panel. Commit `91b168e`, puente reiniciado y verificado.
  - **Secretos separados:** `PANEL_AUTH_SECRET` (HMAC de sesiones del panel) ya no es el mismo `BRIDGE_TOKEN` del puente de wacli. Rotar uno rompía el otro, y una filtración del panel daba acceso al WhatsApp del negocio.
  - **`logout` revoca la sesión** en la base: antes solo borraba la cookie y el token seguía funcionando 12 h.
  - **Headers de seguridad** en `public/_headers` y borrado del `importmap` que apuntaba a `aistudiocdn.com` en el HTML de producción.
  - **Verificado en producción:** POST con `timestamp: "x"` → 200 sin romper el panel; forged `targetLine` ignorado (queda `web` para `store`); click de `sales` en horario hábil generó lead con `clientRef` correcto; `/api/track` inválido → 400; `/api/panel/summary` → 401 sin sesión; anti-enumeración de OTP → 200 genérico.
- **CI/CD con GitHub Actions (2026-10-01)**:
  - **Workflow `.github/workflows/deploy.yml`:** dos jobs. `verify` corre `npm ci`, `typecheck`, `lint` y `build`, y sube `dist` como artefacto. `deploy` baja el artefacto y publica.
    - Push a `main` → Cloudflare Pages rama `production` (publica en wa.comerza.cl).
    - Pull request a `main` → genera preview; si el PR viene de un fork, solo compila, porque los forks no reciben secretos.
    - `workflow_dispatch` para correrlo a mano desde la pestaña Actions.
  - **Secretos en GitHub:** `CLOUDFLARE_API_TOKEN` (secreto) y `CLOUDFLARE_ACCOUNT_ID` (variable, `48c58c35...`). El token viene del archivo de credenciales del servidor y alcanza el proyecto `wa`.
  - **Primer run en verde:** `36893182137`, que dejó producción en el deployment `6c60856e` de Pages. Verificado en vivo: `/` 200, `/panel/` 200, `/favicon.svg` 200, `/api/time` responde.
  - **Bug del deploy encontrado y corregido:** los deploys de Actions estaban publicando **solo los estáticos**. `wrangler-action` no encontraba wrangler (no era devDependency) e instalaba su wrangler@3, que no sube Pages Functions. El run quedaba en verde y `/api/time` pasaba a devolver el HTML del SPA, con `/api/track` en 405. Se corrigió con `wrangler` como devDependency, `npm ci` en el job de deploy, y un paso que verifica la API en producción después de desplegar. **Un deploy ya no puede quedar en verde con el sitio sin backend.**
  - **Migraciones D1 automáticas** antes de publicar, con `continue-on-error` mientras el token de Cloudflare no tenga alcance D1.
  - **GitHub Pages deshabilitado:** el repo publicaba en `alexdechile.github.io/wa` con build **Jekyll** (rama `main`, ruta `/`), que no corresponde a este proyecto y gastaba runners en cada push. Sitio eliminado, ahora responde 404.
  - **Docs corregidas:** `README.md` y `wrangler.toml` ya no dicen que el deploy es manual ni que `main` no despliega.
- **Sincronización de Git y Redploy a Producción (2026-10-01)**:
  - **Repo:** `main` estaba divergido. Rebase del commit local de bitácora sobre `origin/main` (traía `feat: agregar favicon svg simulando hoja de notas`) y push. Rama sincronizada en `5b27ff7`.
  - **Build:** `npm run typecheck`, `npm run lint` y `npm run build` sin errores ni advertencias.
  - **Cloudflare Pages:** Desplegado con `npx wrangler pages deploy dist --project-name wa --branch production` → deployment `a55e3408` en https://wa.comerza.cl. Hasta ese momento seguía sirviéndose `dd24150`, de hace 2 semanas.
  - **Verificación en vivo:** `/` 200, `/panel/` 200, `/favicon.svg` 200 (`image/svg+xml`), `/api/time` responde con estado de horario, `/api/panel/summary` 401 sin sesión, `/api/auth/verify-code` rechaza payload vacío.
  - **D1 `comerza-wa`:** tablas `contact_events`, `auth_codes`, `panel_sessions` presentes y migraciones aplicadas.
- **Activación de Canal de Ventas y Supervisión de SLA (5 min)**:
  - **Cuentas wacli configuradas:** `asistente` (default, `56226832189`) y `ventas1` (`56226830645`).
  - **Sincronización en segundo plano:** `wacli-sync.service` (asistente) y `wacli-sync-ventas1.service` (ventas1) activos y conectados.
  - **Supervisión de SLA y Apertura:** `comerza-supervision-ventas.service` activo. Audita la línea de ventas cada 30s. Si un cliente escribe en horario hábil y el encargado no responde en 5 min, alerta por WhatsApp a Iván (`56993206000`) desde la línea del asistente. Además, emite digest matutino a las 08:30 si quedaron mensajes nocturnos sin responder.
- **Despliegue y Activación Integral del Ecosistema Puerta**:
  - **Git & GitHub:** Rama `feat/puerta-horario-y-requerimientos` subida a GitHub (`origin/feat/puerta-horario-y-requerimientos`).
  - **Cloudflare Pages:** Compilado (`npm run build`) y desplegado en producción. Ojo: la rama de producción de Pages es `production`, no `main`; desplegar con `--branch main` genera solo un PREVIEW (ver `wrangler.toml`).
  - **Cloudflare D1:** Base de datos `comerza-wa` vinculada y migraciones aplicadas.
  - **Cloudflare Tunnel:** Túnel permanente `comerza-bridge` activo por `systemd` y enrutando `bridge-wa.comerza.cl` → `127.0.0.1:8787`.
  - **Servicios de Host en Systemd (User):**
    - `cloudflared-bridge.service` (Túnel Cloudflare) - ACTIVO.
    - `comerza-bridge.service` (Puente HTTP wacli en puerto 8787) - ACTIVO y respondiendo a través de `https://bridge-wa.comerza.cl`.
    - `comerza-supervision.service` (Supervisión y lazo de alertas) - ACTIVO (intervalo 60s, alertando al supervisor `56993206000` y escalamiento a `56992215761`).
    - `comerza-supervision-ventas.service` (Supervisión SLA ventas 5 min y apertura 08:30) - ACTIVO.
    - `wacli-sync.service` (Sync WhatsApp asistente) - ACTIVO.
    - `wacli-sync-ventas1.service` (Sync WhatsApp ventas1) - ACTIVO.
  - **Secretos Configurados en Pages:** `BRIDGE_TOKEN` y `BRIDGE_URL` (`https://bridge-wa.comerza.cl`).

## ¿Qué hace esta App?
Enrutador de contacto inteligente y telemetría de eventos de contacto para Comerza. Dirige a los clientes según horario comercial (línea humana vs asistente automatizado) y registra telemetría de clics e interacciones en Cloudflare D1.

## Stack Técnico
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Edge / Backend:** Cloudflare Pages Functions (`/functions/api/track.ts`).
- **Base de Datos:** Cloudflare D1 (`comerza-wa`).
- **Integración Host:** Puente HTTP wacli (`bim`), Supervisión en TypeScript, Túnel Cloudflare (`bridge-wa.comerza.cl`) gestionados por `systemd --user`.
