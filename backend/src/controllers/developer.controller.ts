import { Request, Response } from "express";
import {
  findAllDevelopers,
  findDeveloperById,
} from "../repositories/developer.repository";
import { isUuid } from "../utils/uuid";

export const getDevelopers = async (_req: Request, res: Response) => {
  try {
    res.status(200).json(await findAllDevelopers());
  } catch (err) {
    console.error("Failed to fetch developers", err);
    res.status(500).json({ error: "Failed to fetch developers" });
  }
};

export const getDeveloperById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!isUuid(id)) {
    return res.status(400).json({ error: "id must be a UUID" });
  }

  try {
    const developer = await findDeveloperById(id);

    if (!developer) {
      return res.status(404).json({ error: "Developer not found" });
    }

    res.status(200).json(developer);
  } catch (err) {
    console.error("Failed to fetch developer", err);
    res.status(500).json({ error: "Failed to fetch developer" });
  }
};
