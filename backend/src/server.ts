// must stay first: loads the env file before any other import reads process.env
import { ENV_FILE } from "./config/env";

import express from "express";
import type { Express } from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes";
import developerRoutes from "./routes/developer.routes";
import taskRoutes from "./routes/task.routes";
import skillRoutes from "./routes/skill.routes";
import docsRoutes from "./routes/docs.routes";

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

app.use(healthRoutes);
app.use(developerRoutes);
app.use(taskRoutes);
app.use(skillRoutes);
app.use(docsRoutes);

app.listen(PORT, () => {
  console.log(
    `[${process.env.NODE_ENV ?? "development"}] loaded ${ENV_FILE} - listening on http://localhost:${PORT}`
  );
  console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
});

export default app;
