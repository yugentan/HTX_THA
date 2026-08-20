import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "NO DB URL!"
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});

/** host:port/database, without the credentials. */
const describeTarget = (): string => {
  try {
    const url = new URL(process.env.DATABASE_URL as string);
    return `${url.hostname}:${url.port || 5432}${url.pathname}`;
  } catch {
    return "the configured database";
  }
};

/**
 * pg reports a host with several addresses as an AggregateError whose own
 * message is empty, so dig out something useful to print.
 */
const describeError = (err: unknown): string => {
  if (err instanceof AggregateError && err.errors.length > 0) {
    const first = err.errors[0] as { code?: string; message?: string };
    return first.code || first.message || "connection refused";
  }

  const e = err as { message?: string; code?: string };
  return e.message || e.code || String(err);
};

// One probe at startup so the log says whether the database is reachable.
// Deliberately not awaited: a slow or missing database must not block boot,
// and the pool reconnects on its own once it comes back.
pool
  .connect()
  .then((client) => {
    client.release();
    console.log(`Database connected: ${describeTarget()}`);
  })
  .catch((err) => {
    console.error(
      `Database not reachable at ${describeTarget()}: ${describeError(err)}`
    );
  });

export const query = <T extends Record<string, unknown>>(
  text: string,
  params?: unknown[]
) => pool.query<T>(text, params);

export const closePool = () => pool.end();

export default pool;
