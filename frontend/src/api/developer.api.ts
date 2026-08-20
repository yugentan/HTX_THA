import client from "./client";
import { Developer } from "../types/developer.types";

export const fetchDevelopers = async (): Promise<Developer[]> => {
  const response = await client.get<Developer[]>("/api/v1/developers");
  return response.data;
};
