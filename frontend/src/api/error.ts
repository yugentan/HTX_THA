import axios from "axios";

type ApiErrorBody = {
  error?: string;
  missing_skills?: string[];
  unknown_skill_ids?: string[];
};

// Axios error handler
export const getApiErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;

    if (body?.error) {
      return body.missing_skills?.length
        ? `${body.error}: ${body.missing_skills.join(", ")}`
        : body.error;
    }

    return err.message;
  }

  return err instanceof Error ? err.message : String(err);
};
