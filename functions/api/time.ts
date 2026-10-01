// File: functions/api/time.ts

/**
 * Horario de atención humana de Comerza (America/Santiago).
 *
 * La regla vive en `_lib/schedule.ts`, que también la usa `api/track.ts` para
 * decidir a qué línea va cada clic. Publicar el mismo cálculo desde el edge es
 * lo que permite que el frontend y el servidor coincidan sin que el navegador
 * sea la fuente de verdad.
 */

import { getTimeInfo } from '../_lib/schedule';

// This is a Cloudflare Pages function
export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify(getTimeInfo()), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60', // Cache for 1 minute
    },
  });
};