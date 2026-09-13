// This file is for Cloudflare Pages Functions type definitions.
// It allows you to use types for the function context and environment variables.

/**
 * Tipos mínimos de D1.
 *
 * Se declaran a mano en vez de instalar `@cloudflare/workers-types` para no
 * cambiar el modelo de tipos del proyecto. Son estructuralmente compatibles con
 * el runtime real. Si algún día se agrega `@cloudflare/workers-types`, hay que
 * borrar estas declaraciones para evitar conflictos.
 */
interface D1Result {
  success: boolean;
  meta?: Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  first<T = unknown>(): Promise<T | null>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface Env {
  /**
   * Base D1 para la telemetría del enrutador. Es opcional a propósito: sin el
   * binding la app sigue funcionando y la telemetría solo queda en logs.
   */
  DB?: D1Database;
  /** URL del puente de wacli en el host (ver repositorio bim). */
  BRIDGE_URL?: string;
  /** Secreto compartido con el puente de wacli. */
  BRIDGE_TOKEN?: string;
}

interface IncomingRequest extends Request {
  /** Metadatos de Cloudflare: no existen en el DOM pero sí en el runtime. */
  cf?: { country?: string };
}

// Fix: Add definition for EventContext to resolve "Cannot find name 'EventContext'" error.
interface EventContext<Env, Params extends string, Data> {
  request: IncomingRequest;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  functionPath: string;
  data: Data;
}

type PagesFunction<
  Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>
> = (context: EventContext<Env, Params, Data>) => Response | Promise<Response>;
