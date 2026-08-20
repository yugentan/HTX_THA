// must stay first: loads the env file before any other import reads process.env
import { ENV_FILE } from "./config/env";

import express from "express";
import type { Express } from "express";
import cors from "cors";

const app: Express = express();
const PORT: Number = Number(process.env.PORT) || 3000;

// origins allowed to call this API, comma-separated in the env file
const allowedOrigins: string[] = (process.env.CORS_ORIGIN ?? "http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());


app.listen(PORT, () => {
  console.log(
    `[${process.env.NODE_ENV ?? "development"}] loaded ${ENV_FILE} - listening on http://localhost:${PORT}`
  );
  console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
});

export default app;
