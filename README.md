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

## Estructura

```
App.tsx                        Enrutador: decide la línea y registra el clic
types.ts                       Tipos de botón, línea de destino y tracking
hooks/useChileanTime.ts        Consulta /api/time cada minuto
functions/api/time.ts          Horario de atención (America/Santiago)
functions/api/track.ts         Telemetría de clics → D1
migrations/                    Esquema D1
```

## Contexto

Este enrutador es la **puerta humana** del ecosistema. La puerta de datos —el
asistente que recibe requerimientos, supervisa que los leads sean atendidos y
reporta— se especifica en el repositorio `bim`, en
`openspec/proposals/comerza-door-experiment/`.
