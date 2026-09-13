# Bitácora y Documentación Maestra (wa.comerza.cl)

## Último Realizado
- **Creación y vinculación de Base de Datos D1**:
  - Se creó la base D1 `comerza-wa` en Cloudflare con ID `19972fa5-b040-442e-9213-c6dbbac53aef`.
  - Se descomentó y configuró el binding `DB` en `wrangler.toml`.
  - Se aplicaron exitosamente las migraciones remotas (`0001_contact_events.sql` y `0002_panel_auth.sql`).

## ¿Qué hace esta App?
Enrutador de contacto inteligente y telemetría de eventos de contacto para Comerza. Dirige a los clientes según horario comercial (línea humana vs asistente automatizado) y registra telemetría de clics e interacciones en Cloudflare D1.

## Stack Técnico
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Edge / Backend:** Cloudflare Pages Functions (`/functions/api/track.ts`).
- **Base de Datos:** Cloudflare D1 (`comerza-wa`).
