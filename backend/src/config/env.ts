import path from "path";
import dotenv from "dotenv";

// Imported first by server.ts so the env file is loaded before any other
// module reads process.env at import time (TypeScript hoists all requires
// above plain statements, so dotenv.config() inside server.ts runs too late).

// setting env file
export const ENV_FILE =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";

dotenv.config({ path: path.resolve(process.cwd(), ENV_FILE), quiet: true });
