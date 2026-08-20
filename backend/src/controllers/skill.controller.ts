import { Request, Response } from "express";
import { findAllSkills, findSkillById } from "../repositories/skill.repository";
import { isUuid } from "../utils/uuid";

export const getSkills = async (_req: Request, res: Response) => {
  try {
    res.status(200).json(await findAllSkills());
  } catch (err) {
    console.error("Failed to fetch skills", err);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
};

export const getSkillById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!isUuid(id)) {
    return res.status(400).json({ error: "id must be a UUID" });
  }

  try {
    const skill = await findSkillById(id);

    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.status(200).json(skill);
  } catch (err) {
    console.error("Failed to fetch skill", err);
    res.status(500).json({ error: "Failed to fetch skill" });
  }
};
