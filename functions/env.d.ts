// This file is for Cloudflare Pages Functions type definitions.
// It allows you to use types for the function context and environment variables.

interface Env {
  // Example of an environment variable binding
  // MY_KV_NAMESPACE: KVNamespace;
}

// Fix: Add definition for EventContext to resolve "Cannot find name 'EventContext'" error.
interface EventContext<Env, Params extends string, Data> {
  request: Request;
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
