import { json } from '../_lib/auth';
import { readJsonBody, TOO_LARGE_MESSAGE } from '../_lib/body';

/**
 * Clasificador de mensajes entrantes con Cloudflare Workers AI.
 *
 * Lo consume el monitor de ventas (`bim/scripts/supervision-ventas.ts`) para
 * distinguir si un contacto nuevo y desconocido que escribe a la línea de
 * ventas es un cliente potencial o no (proveedor, personal, spam/bot).
 *
 * Autenticación: `Authorization: Bearer <BRIDGE_TOKEN>`.
 * Regla de negocio: ante la duda, responde `isCustomer: true` para no perder
 * una venta real.
 */

const MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8-fast';
const MAX_CLASSIFY_BYTES = 4096;

type Category = 'customer' | 'supplier' | 'personal' | 'spam' | 'unknown';

interface ClassifyRequest {
  text?: string;
  senderName?: string;
  phone?: string;
  recentMessages?: Array<{ text: string; fromMe?: boolean }>;
}

interface ClassifyResult {
  isCustomer: boolean;
  category: Category;
  confidence: number;
  reason: string;
}

const VALID_CATEGORIES = new Set<Category>([
  'customer',
  'supplier',
  'personal',
  'spam',
  'unknown',
]);

function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.byteLength !== bb.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < ab.byteLength; i++) {
    diff |= ab[i] ^ bb[i];
  }
  return diff === 0;
}

function parseModelJson(raw: string): ClassifyResult | null {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const categoryRaw = typeof parsed.category === 'string' ? parsed.category.trim().toLowerCase() : 'unknown';
    const category: Category = VALID_CATEGORIES.has(categoryRaw as Category)
      ? (categoryRaw as Category)
      : 'unknown';

    const confidenceRaw = Number(parsed.confidence);
    const confidence = Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(1, confidenceRaw))
      : 0;

    const isCustomer =
      typeof parsed.isCustomer === 'boolean'
        ? parsed.isCustomer
        : category === 'customer' || category === 'unknown';

    const reason =
      typeof parsed.reason === 'string' && parsed.reason.trim()
        ? parsed.reason.trim().slice(0, 160)
        : 'sin detalle';

    return { isCustomer, category, confidence, reason };
  } catch {
    return null;
  }
}

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  const expectedToken = env.BRIDGE_TOKEN?.trim();
  if (!expectedToken) {
    return json({ ok: false, error: 'BRIDGE_TOKEN no configurado' }, 503);
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !constantTimeEqual(match[1].trim(), expectedToken)) {
    return json({ ok: false, error: 'No autorizado' }, 401);
  }

  const body = await readJsonBody<ClassifyRequest>(request, MAX_CLASSIFY_BYTES);
  if (body.ok === false) {
    const reason = 'reason' in body ? body.reason : 'invalid';
    return json(
      { ok: false, error: reason === 'too_large' ? TOO_LARGE_MESSAGE : 'JSON inválido' },
      reason === 'too_large' ? 413 : 400,
    );
  }

  const text = (body.value.text ?? '').trim();
  if (!text) {
    return json({
      ok: true,
      isCustomer: true,
      category: 'unknown',
      confidence: 0,
      reason: 'Sin texto para analizar; ante la duda se trata como cliente.',
    });
  }

  if (!env.AI) {
    return json({
      ok: true,
      fallback: true,
      isCustomer: true,
      category: 'unknown',
      confidence: 0,
      reason: 'Binding AI no disponible; ante la duda se trata como cliente.',
    });
  }

  const historyLines = (body.value.recentMessages ?? [])
    .slice(-5)
    .map((m) => `${m.fromMe ? 'Vendedor' : 'Contacto'}: ${m.text.slice(0, 200)}`)
    .join('\n');

  const systemPrompt = [
    'Eres un clasificador de mensajes de WhatsApp para Comerza, una empresa chilena de materiales de construcción y ferretería industrial.',
    'Tu trabajo es decidir si quien escribe a la línea de Ventas es un CLIENTE o NO es un cliente.',
    'Categorías posibles:',
    '- "customer": pide cotización, precios, stock, factura, despacho de compra, ayuda con materiales, o hace una consulta comercial/técnica.',
    '- "supplier": proveedor ofreciendo mercadería, cobrando factura, coordinando entrega hacia Comerza, o respondiendo a una compra nuestra.',
    '- "personal": familiar, amigo, conocido, conversación personal o doméstica ajena al negocio.',
    '- "spam": publicidad masiva, promociones, estafas, bots, notificaciones automáticas de bancos/OTP/servicios.',
    '- "unknown": mensaje demasiado corto, ambiguo o sin contexto suficiente (ej: "hola", "buenos días", "consulta").',
    'REGLA CRÍTICA: Ante cualquier duda o ambigüedad, clasifica como "unknown" con isCustomer=true. Nunca descartes un posible cliente si no estás muy seguro.',
    'Responde ÚNICAMENTE con un objeto JSON válido con estas claves exactas:',
    '{"isCustomer": boolean, "category": "customer"|"supplier"|"personal"|"spam"|"unknown", "confidence": number, "reason": "explicación breve en español"}',
  ].join('\n');

  const userPrompt = [
    body.value.senderName ? `Nombre contacto: ${body.value.senderName}` : null,
    historyLines ? `Historial reciente:\n${historyLines}` : null,
    `Mensaje nuevo recibido: "${text.slice(0, 600)}"`,
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const aiResp = await env.AI.run<{ response?: unknown }>(MODEL, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 180,
    });

    // Workers AI entrega `response` como string o ya parseado como objeto cuando es JSON válido.
    let parsed: ClassifyResult | null = null;
    if (aiResp?.response && typeof aiResp.response === 'object') {
      parsed = parseModelJson(JSON.stringify(aiResp.response));
    } else if (typeof aiResp?.response === 'string') {
      parsed = parseModelJson(aiResp.response);
    }

    if (!parsed) {
      return json({
        ok: true,
        fallback: true,
        isCustomer: true,
        category: 'unknown',
        confidence: 0,
        reason: 'Respuesta no estructurada del modelo; se trata como cliente.',
      });
    }

    return json({
      ok: true,
      ...parsed,
    });
  } catch (error) {
    console.error('[classify] Error ejecutando Workers AI:', error);
    return json({
      ok: true,
      fallback: true,
      isCustomer: true,
      category: 'unknown',
      confidence: 0,
      reason: 'Error en Workers AI; ante la duda se trata como cliente.',
    });
  }
};
