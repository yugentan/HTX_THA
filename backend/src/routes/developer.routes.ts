import { Router } from "express";
import { getDeveloperById, getDevelopers } from "../controllers/developer.controller";

const router = Router();

router.get("/api/v1/developers", getDevelopers);
router.get("/api/v1/developers/:id", getDeveloperById);

export default router;
