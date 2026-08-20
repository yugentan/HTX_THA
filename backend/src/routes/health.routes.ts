import { Router } from "express";
import { getHealth } from "../controllers/health.controller";

const router = Router();

router.get("/api/v1/health", getHealth);

export default router;
