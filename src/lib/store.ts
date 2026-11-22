import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Almacenamiento mínimo tipo "hash" (clave → campo → valor).
 *
 * - En producción usa Upstash Redis por su API REST (sin dependencias extra).
 *   Acepta los nombres de variables que crea Vercel al conectar Upstash
 *   (KV_REST_API_URL / KV_REST_API_TOKEN) o los de Upstash directo
 *   (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
 * - En desarrollo, si no hay variables, guarda todo en .data/store.json
 *   para poder probar sin crear ninguna cuenta.
 */
export interface Store {
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hset(key: string, field: string, value: string): Promise<void>;
  /** Escribe sólo si el campo no existe. Devuelve true si escribió. Atómico en Redis. */
  hsetnx(key: string, field: string, value: string): Promise<boolean>;
  hdel(key: string, field: string): Promise<void>;
}

export class StoreNotConfiguredError extends Error {
  constructor() {
    super(
      "Falta configurar la base de datos de reseñas: definí KV_REST_API_URL y KV_REST_API_TOKEN (o UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN).",
    );
    this.name = "StoreNotConfiguredError";
  }
}

// ---------------------------------------------------------------- Redis (REST)

function redisStore(url: string, token: string): Store {
  async function command<T>(...args: string[]): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as { result?: T; error?: string } | null;
    if (!res.ok || !data || data.error) {
      throw new Error(`Redis ${args[0]} falló: ${data?.error ?? res.status}`);
    }
    return data.result as T;
  }

  return {
    hget: (key, field) => command<string | null>("HGET", key, field),
    async hgetall(key) {
      const flat = await command<string[] | null>("HGETALL", key);
      const out: Record<string, string> = {};
      for (let i = 0; flat && i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
      return out;
    },
    async hset(key, field, value) {
      await command("HSET", key, field, value);
    },
    async hsetnx(key, field, value) {
      return (await command<number>("HSETNX", key, field, value)) === 1;
    },
    async hdel(key, field) {
      await command("HDEL", key, field);
    },
  };
}

// ------------------------------------------------------- Archivo local (dev)

type FileData = Record<string, Record<string, string>>;

function fileStore(): Store {
  const file = path.join(process.cwd(), ".data", "store.json");
  // Cola para que dos escrituras seguidas no se pisen.
  let queue: Promise<unknown> = Promise.resolve();

  async function read(): Promise<FileData> {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as FileData;
    } catch {
      return {};
    }
  }

  function mutate<T>(fn: (data: FileData) => T): Promise<T> {
    const run = queue.then(async () => {
      const data = await read();
      const result = fn(data);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(data, null, 2));
      return result;
    });
    queue = run.catch(() => undefined);
    return run;
  }

  return {
    async hget(key, field) {
      return (await read())[key]?.[field] ?? null;
    },
    async hgetall(key) {
      return (await read())[key] ?? {};
    },
    hset: (key, field, value) =>
      mutate((d) => {
        (d[key] ??= {})[field] = value;
      }),
    hsetnx: (key, field, value) =>
      mutate((d) => {
        const h = (d[key] ??= {});
        if (field in h) return false;
        h[field] = value;
        return true;
      }),
    hdel: (key, field) =>
      mutate((d) => {
        if (d[key]) delete d[key][field];
      }),
  };
}

// --------------------------------------------------------------------------

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) cached = redisStore(url, token);
  else if (process.env.NODE_ENV !== "production") cached = fileStore();
  else throw new StoreNotConfiguredError();

  return cached;
}
