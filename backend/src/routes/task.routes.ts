import { Router } from "express";
import { getTaskById, getTasks, patchTask, postTask } from "../controllers/task.controller";
import { inferSkills } from "../middleware/inferSkills.middleware";

const router = Router();

router.get("/api/v1/tasks", getTasks);
router.get("/api/v1/tasks/:id", getTaskById);
router.post("/api/v1/tasks", inferSkills, postTask); // for creation, infer only when task skill is not populated
router.patch("/api/v1/tasks/:id", patchTask); // for updating status and asignment

export default router;
