import client from "./client";
import { Reference } from "../types/task.types";

export const fetchSkills = async (): Promise<Reference[]> => {
  const response = await client.get<Reference[]>("/api/v1/skills");
  return response.data.map(({ id, name }) => ({ id, name }));
};
