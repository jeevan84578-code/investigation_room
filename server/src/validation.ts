import { z } from "zod";
import { counts } from "./scoring.js";
import type { Difficulty } from "./types.js";

export const createCaseSchema = z.object({
  premise: z.string().trim().min(20).max(500),
  difficulty: z.enum(["easy", "medium", "hard"])
});

export const accusationSchema = z.object({ suspectId: z.string().min(1) });
export const hintSchema = z.object({ hintId: z.string().min(1) });

const generatedSchema = z.object({
  title: z.string().min(3),
  story: z.string().min(20),
  suspects: z.array(z.object({ id: z.string(), name: z.string().min(1), role: z.string().min(1), description: z.string().min(1) })),
  clues: z.array(z.object({ id: z.string(), label: z.string().min(1), description: z.string().min(1), solutionRelevance: z.string().min(1) })),
  hints: z.array(z.object({ id: z.string(), text: z.string().min(1) })),
  culpritId: z.string(),
  solutionExplanation: z.string().min(20)
});

export function validateGeneratedCase(input: unknown, difficulty: Difficulty) {
  const parsed = generatedSchema.parse(input);
  const expected = counts[difficulty];
  if (parsed.suspects.length !== expected.suspects || parsed.clues.length !== expected.clues || parsed.hints.length !== expected.hints) throw new Error("Generated case has invalid difficulty counts.");
  const ids = [...parsed.suspects, ...parsed.clues, ...parsed.hints].map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw new Error("Generated case contains duplicate IDs.");
  if (!parsed.suspects.some((suspect) => suspect.id === parsed.culpritId)) throw new Error("Generated culprit does not reference a suspect.");
  return parsed;
}
