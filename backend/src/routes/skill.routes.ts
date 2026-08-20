import { Router } from "express";
import { getSkillById, getSkills } from "../controllers/skill.controller";

const router = Router();

router.get("/api/v1/skills", getSkills);
router.get("/api/v1/skills/:id", getSkillById);

export default router;
