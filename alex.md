# Bitácora y Documentación Maestra (wa.comerza.cl)

## Último Realizado
- **Túnel Permanente de Cloudflare Configurado**:
  - Se autorizó el dominio `comerza.cl` mediante `cloudflared`.
  - Se creó el túnel permanente `comerza-bridge` (ID: `3db11b34-7571-4c03-afd3-b299f19edc6f`).
  - Se configuró la ruta DNS CNAME `bridge-wa.comerza.cl`.
  - Se instaló y habilitó el servicio de systemd user `cloudflared-bridge.service` (activo y persistente).
- **Configuración de Secretos en Cloudflare Pages (`wa`)**:
  - `BRIDGE_TOKEN`: Secreto criptográfico de 64 caracteres configurado.
  - `BRIDGE_URL`: `https://bridge-wa.comerza.cl` configurado.
  - Se guardaron las variables de entorno en `/home/alexdechile/proyectos/bim/.env`.
- **Instalación de cloudflared**:
  - Se instaló el binario oficial `cloudflared` en `~/.local/bin/cloudflared`.
- **Base de Datos D1**:
  - Base D1 `comerza-wa` creada y vinculada en `wrangler.toml`.
  - Migraciones remotas aplicadas (`0001_contact_events.sql` y `0002_panel_auth.sql`).

## ¿Qué hace esta App?
Enrutador de contacto inteligente y telemetría de eventos de contacto para Comerza. Dirige a los clientes según horario comercial (línea humana vs asistente automatizado) y registra telemetría de clics e interacciones en Cloudflare D1.

## Stack Técnico
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Edge / Backend:** Cloudflare Pages Functions (`/functions/api/track.ts`).
- **Base de Datos:** Cloudflare D1 (`comerza-wa`).
- **Integración Host:** Puente HTTP wacli (`bim`) + Túnel Cloudflare (`bridge-wa.comerza.cl`).
