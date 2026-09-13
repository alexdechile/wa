# Comerza — Enrutador de Contacto

Página de contacto de **wa.comerza.cl**: enruta a cada persona a la línea que
corresponde según su necesidad y el horario de atención. Diseñada con
accesibilidad para adultos mayores (botones grandes, control de tamaño de letra,
sin formularios).

Desplegada en **Cloudflare Pages** (Vite + React + Pages Functions).

## Las dos líneas

| Línea | Número | Atiende |
|---|---|---|
| **Humana** | `+56226830645` | Personas, lunes a viernes de 8:30 a 13:00 y de 14:00 a 17:30 |
| **Asistente** (wacli) | `56226832189` | 24/7. Recibe requerimientos y deriva a un humano |

Reglas de enrutamiento:

- **En horario hábil** se ofrecen ambas: la atención humana y la puerta de
  requerimientos.
- **Fuera de horario** (noche, fin de semana y **pausa de almuerzo**) las
  consultas y ventas se derivan al asistente, que sí responde.
- **"Enviar Lista de Materiales"** va siempre al asistente: es la puerta que
  tiene memoria de la conversación.
- El asistente **nunca cotiza**: recibe el requerimiento y promete que un humano
  lo cotizará en horario hábil.

La pausa de almuerzo **cuenta como fuera de horario**. Es un arreglo deliberado:
antes el enrutador decía "Estamos atendiendo" entre 13:00 y 14:00, cuando en
realidad no había nadie.

## Desarrollo

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Telemetría

Cada clic se envía a `/api/track` con botón, horario, línea de destino, país y
user-agent. **No se registra contenido de conversaciones.**

Los datos se guardan en **D1**. El binding está comentado en `wrangler.toml`
porque el enrutador funciona sin él (cae a logs). Para activarlo:

```bash
npx wrangler d1 create comerza-wa
# pegar el database_id en wrangler.toml y descomentar el bloque [[d1_databases]]
npm run db:migrate:remote
```

Esquema en `migrations/0001_contact_events.sql`.

Además, cuando el clic se dirige a la **línea humana** (ventas o soporte en
horario hábil), el enrutador avisa al puente de wacli para que el lazo de
supervisión del host alerte al supervisor. Los clics que van al asistente **no**
generan alerta: los atiende wacli. El aviso no bloquea la respuesta al cliente
(`waitUntil`) y un fallo del puente no afecta la experiencia.

## Panel interno

`/panel` muestra el desarrollo de contactos del día. **No es público**: requiere
sesión, y la sesión se abre con un código de 6 dígitos enviado por WhatsApp.

- Autorizados: `alex@comerza.cl` e `ivan@comerza.cl` — **dos personas**. El flujo
  **no revela** si un correo está autorizado (misma respuesta siempre).
- Códigos de un solo uso, 10 minutos, máximo 5 intentos, máximo 3 emisiones por
  hora, guardados como HMAC (nunca en claro).
- Sesión de 12 horas en cookie `HttpOnly`, `Secure` y `SameSite=Lax`.
- Solo muestra **metadatos de clics**, nunca contenido de conversaciones.

Variables del proyecto de Pages:

| Variable | Uso |
|---|---|
| `DB` | Binding D1 (obligatorio para el panel) |
| `BRIDGE_URL` | URL del puente de wacli (repositorio `bim`) |
| `BRIDGE_TOKEN` | Secreto compartido: firma los HMAC y autentica contra el puente |

Esquema en `migrations/0002_panel_auth.sql`.

## Estructura

```
App.tsx                        Enrutador: decide la línea y registra el clic
panel.tsx / panel.html         Entrada del panel interno
types.ts                       Tipos de botón, línea de destino y tracking
hooks/useChileanTime.ts        Consulta /api/time cada minuto
components/Panel.tsx           UI del panel (acceso por código)
functions/api/time.ts          Horario de atención (America/Santiago)
functions/api/track.ts         Telemetría de clics → D1
functions/api/auth/            OTP: pedir código, verificar, cerrar sesión
functions/api/panel/summary.ts Resumen del día (requiere sesión)
functions/_lib/auth.ts         Whitelist, crypto, cookies y puente
migrations/                    Esquema D1
public/_redirects              Sirve el panel en /panel
```

## Contexto

Este enrutador es la **puerta humana** del ecosistema. La puerta de datos —el
asistente que recibe requerimientos, supervisa que los leads sean atendidos y
reporta— se especifica en el repositorio `bim`, en
`openspec/proposals/comerza-door-experiment/`.
