# Bitácora y Documentación Maestra (wa.comerza.cl)

## Último Realizado
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
