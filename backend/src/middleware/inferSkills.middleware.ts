import { NextFunction, Request, Response } from "express";
import { findSkillRefs } from "../repositories/skill.repository";

const GEMINI_URL =
  process.env.GEMINI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_MODEL = "gemini-3.6-flash";
const TIMEOUT_MS = 8_000;

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  error?: { message?: string };
};

const buildPrompt = (title: string, skillNames: string[]): string =>
  [
    "You are labelling a software task with the skills needed to complete it.",
    "",
    `Task title: "${title}"`,
    `Available skills: ${skillNames.join(", ")}`,
    "",
    "Return the skills required for this task as a JSON array of strings.",
    "Only use names from the available skills list, copied exactly.",
    "Return every skill that applies, or an empty array if none clearly do.",
  ].join("\n");

/**
 * Asks Gemini which of the given skills a task title needs.
 *
 * Anything the model returns that is not an exact match for a known skill is
 * dropped, so a hallucinated name can never reach the database.
 */
const inferSkillNames = async (
  title: string,
  skillNames: string[]
): Promise<string[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  //console.log(apiKey)
  if (!apiKey || skillNames.length === 0) {
    return [];
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEMINI_URL}/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: buildPrompt(title, skillNames) }] },
          ],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: { type: "STRING", enum: skillNames },
            },
          },
        }),
      }
    );

    const body = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      throw new Error(body.error?.message ?? `Gemini returned ${response.status}`);
    }

    const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    const parsed: unknown = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      return [];
    }

    // keep only exact matches against the skills we actually have
    return skillNames.filter((name) => parsed.includes(name));
  } finally {
    clearTimeout(timeout);
  }
};

/** Turns whatever went wrong into a short, readable reason. */
const describeFailure = (err: unknown): string => {
  if (err instanceof Error) {
    if (err.name === "AbortError") {
      return `timed out after ${TIMEOUT_MS}ms`;
    }

    // node wraps connection problems as "fetch failed" with the real cause inside
    if (err.message === "fetch failed") {
      const cause = (err as { cause?: { code?: string } }).cause;
      return `could not reach Gemini${cause?.code ? ` (${cause.code})` : ""}`;
    }

    if (/api key|permission|unauthenticated|invalid/i.test(err.message)) {
      return `API key rejected: ${err.message}`;
    }

    return err.message;
  }

  return String(err);
};

const FALLBACK_SKILL = "Backend";

/**
 * Inference could not run, so the task is saved with the Backend skill rather
 * than with no skill at all. Logs the task and the reason on the way through.
 */
const fallbackToBackend = async (req: Request, title: string, reason: string) => {
  console.log(`Task: "${title}"`);
  console.log(`Skill inference unavailable (${reason}) - falling back to backend`);

  try {
    const skills = await findSkillRefs();
    const fallback = skills.find(
      (skill) => skill.name.toLowerCase() === FALLBACK_SKILL.toLowerCase()
    );

    if (!fallback) {
      console.warn(
        `no "${FALLBACK_SKILL}" skill exists, saving "${title}" without skills`
      );
      return;
    }

    req.body.skill_ids = [fallback.id];
    console.log(`saved "${title}" with the ${fallback.name} skill`);
  } catch (err) {
    console.error("Could not load skills for the fallback", err);
  }
};

// Use the prompt above to call gemini to gemini if and only if infer_skills is set to true
// Infier flag is only true when frontend selected skills is []
export const inferSkills = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { infer_skills, title, skill_ids } = req.body ?? {};

  // consumed here, the controller never sees it
  delete req.body?.infer_skills;

  const wanted = infer_skills === true;
  const alreadyChosen = Array.isArray(skill_ids) && skill_ids.length > 0;

  if (!wanted || alreadyChosen || typeof title !== "string" || !title.trim()) {
    return next();
  }

  if (!process.env.GEMINI_API_KEY) {
    await fallbackToBackend(req, title.trim(), "GEMINI_API_KEY is not set");
    return next();
  }

  try {
    const skills = await findSkillRefs();
    const names = await inferSkillNames(title.trim(), skills.map((s) => s.name));

    // the call succeeded but matched nothing, e.g. a title like "24084".
    // treat that the same as the model being unavailable
    if (names.length === 0) {
      await fallbackToBackend(req, title.trim(), "no skill matched the title");
      return next();
    }

    req.body.skill_ids = skills
      .filter((skill) => names.includes(skill.name))
      .map((skill) => skill.id);

    console.log(`inferred skills for "${title.trim()}": ${names.join(", ")}`);
  } catch (err) {
    await fallbackToBackend(req, title.trim(), describeFailure(err));
  }

  next();
};
