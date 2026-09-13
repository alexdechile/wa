# Bitácora y Documentación Maestra (wa.comerza.cl)

## Último Realizado
- **Despliegue y Activación Integral del Ecosistema Puerta**:
  - **Git & GitHub:** Rama `feat/puerta-horario-y-requerimientos` subida a GitHub (`origin/feat/puerta-horario-y-requerimientos`).
  - **Cloudflare Pages:** Compilado (`npm run build`) y desplegado exitosamente en producción (`main`) y preview branch.
  - **Cloudflare D1:** Base de datos `comerza-wa` vinculada y migraciones aplicadas.
  - **Cloudflare Tunnel:** Túnel permanente `comerza-bridge` activo por `systemd` y enrutando `bridge-wa.comerza.cl` → `127.0.0.1:8787`.
  - **Servicios de Host en Systemd (User):**
    - `cloudflared-bridge.service` (Túnel Cloudflare) - ACTIVO.
    - `comerza-bridge.service` (Puente HTTP wacli en puerto 8787) - ACTIVO y respondiendo a través de `https://bridge-wa.comerza.cl`.
    - `comerza-supervision.service` (Supervisión y lazo de alertas) - ACTIVO (intervalo 60s, alertando al supervisor `56993206000` y escalamiento a `56992215761`).
  - **Secretos Configurados en Pages:** `BRIDGE_TOKEN` y `BRIDGE_URL` (`https://bridge-wa.comerza.cl`).

## ¿Qué hace esta App?
Enrutador de contacto inteligente y telemetría de eventos de contacto para Comerza. Dirige a los clientes según horario comercial (línea humana vs asistente automatizado) y registra telemetría de clics e interacciones en Cloudflare D1.

## Stack Técnico
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Edge / Backend:** Cloudflare Pages Functions (`/functions/api/track.ts`).
- **Base de Datos:** Cloudflare D1 (`comerza-wa`).
- **Integración Host:** Puente HTTP wacli (`bim`), Supervisión en TypeScript, Túnel Cloudflare (`bridge-wa.comerza.cl`) gestionados por `systemd --user`.
