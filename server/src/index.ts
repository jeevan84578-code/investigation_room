import "dotenv/config";
import cors from "cors";
import express from "express";
import { generateCase } from "./gemini.js";
import { calculateScore } from "./scoring.js";
import { getCase, saveCase, updateCase } from "./store.js";
import { accusationSchema, createCaseSchema, hintSchema } from "./validation.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20kb" }));

function publicCase(item: NonNullable<ReturnType<typeof getCase>>) {
  return { id: item.id, title: item.title, premise: item.premise, story: item.story, difficulty: item.difficulty, suspects: item.suspects, clues: item.clues.map((clue) => ({ id: clue.id, label: clue.label, description: item.discoveredClueIds.includes(clue.id) ? clue.description : undefined, status: item.discoveredClueIds.includes(clue.id) ? "discovered" : "undiscovered" })), hints: item.hints.map((hint) => ({ id: hint.id, text: item.usedHintIds.includes(hint.id) ? hint.text : undefined, used: item.usedHintIds.includes(hint.id) })), progress: { discoveredClueIds: item.discoveredClueIds, usedHintIds: item.usedHintIds, cluesRequired: item.clues.length, hintsAvailable: item.hints.length }, status: item.status };
}

function errorMessage(res: express.Response, status: number, code: string, message: string) { return res.status(status).json({ error: { code, message, details: [] } }); }

app.post("/api/cases", async (req, res) => {
  const parsed = createCaseSchema.safeParse(req.body);
  if (!parsed.success) return errorMessage(res, 400, "INVALID_INPUT", "Enter a premise of 20–500 characters and choose a valid difficulty.");
  try { const generated = await generateCase(parsed.data.premise, parsed.data.difficulty); const saved = saveCase({ ...generated, premise: parsed.data.premise, difficulty: parsed.data.difficulty, status: "active", discoveredClueIds: [], usedHintIds: [] }); return res.status(201).json({ case: publicCase(saved) }); }
  catch (error) { return errorMessage(res, 502, "GENERATION_FAILED", error instanceof Error ? error.message : "Could not generate a mystery."); }
});

app.get("/api/cases/:id", (req, res) => { const item = getCase(req.params.id); if (!item) return errorMessage(res, 404, "CASE_NOT_FOUND", "The mystery could not be found."); return res.json({ case: publicCase(item) }); });

app.post("/api/cases/:id/clues/:clueId/discover", (req, res) => {
  const item = getCase(req.params.id); if (!item) return errorMessage(res, 404, "CASE_NOT_FOUND", "The mystery could not be found."); if (item.status !== "active") return errorMessage(res, 409, "CASE_COMPLETED", "This case is already complete.");
  const clue = item.clues.find((entry) => entry.id === req.params.clueId); if (!clue) return errorMessage(res, 404, "CLUE_NOT_FOUND", "That clue does not belong to this case.");
  const discovered = item.discoveredClueIds.includes(clue.id) ? item.discoveredClueIds : [...item.discoveredClueIds, clue.id]; const updated = updateCase(item.id, { discoveredClueIds: discovered })!;
  return res.json({ clue: { id: clue.id, label: clue.label, description: clue.description, status: "discovered" }, progress: { ...publicCase(updated).progress } });
});

app.post("/api/cases/:id/hints", (req, res) => {
  const item = getCase(req.params.id); if (!item) return errorMessage(res, 404, "CASE_NOT_FOUND", "The mystery could not be found."); if (item.status !== "active") return errorMessage(res, 409, "CASE_COMPLETED", "This case is already complete.");
  const parsed = hintSchema.safeParse(req.body); if (!parsed.success) return errorMessage(res, 400, "INVALID_INPUT", "Choose a valid hint."); const hint = item.hints.find((entry) => entry.id === parsed.data.hintId); if (!hint) return errorMessage(res, 404, "HINT_NOT_FOUND", "That hint does not belong to this case."); if (item.usedHintIds.includes(hint.id)) return errorMessage(res, 409, "HINT_ALREADY_USED", "That hint has already been used.");
  const updated = updateCase(item.id, { usedHintIds: [...item.usedHintIds, hint.id] })!; return res.json({ hint: { id: hint.id, text: hint.text, used: true }, progress: { ...publicCase(updated).progress } });
});

app.post("/api/cases/:id/accuse", (req, res) => {
  const item = getCase(req.params.id); if (!item) return errorMessage(res, 404, "CASE_NOT_FOUND", "The mystery could not be found."); if (item.status !== "active") return errorMessage(res, 409, "CASE_COMPLETED", "This case already has a verdict.");
  const parsed = accusationSchema.safeParse(req.body); if (!parsed.success || !item.suspects.some((suspect) => suspect.id === parsed.data.suspectId)) return errorMessage(res, 400, "INVALID_SUSPECT", "Select a suspect from this case.");
  const correct = parsed.data.suspectId === item.culpritId; const score = calculateScore(item.difficulty, correct, item.discoveredClueIds.length, item.usedHintIds.length); const updated = updateCase(item.id, { status: "completed", accusation: { suspectId: parsed.data.suspectId, correct }, score })!; const culprit = updated.suspects.find((suspect) => suspect.id === updated.culpritId)!;
  return res.json({ result: { correct, culprit, explanation: updated.solutionExplanation, score, progress: { discoveredClueCount: updated.discoveredClueIds.length, hintsUsed: updated.usedHintIds.length } } });
});

app.get("/api/cases/:id/result", (req, res) => { const item = getCase(req.params.id); if (!item) return errorMessage(res, 404, "CASE_NOT_FOUND", "The mystery could not be found."); if (item.status !== "completed" || !item.score || !item.accusation) return errorMessage(res, 409, "CASE_NOT_COMPLETED", "Complete an accusation to see the result."); const culprit = item.suspects.find((suspect) => suspect.id === item.culpritId)!; return res.json({ result: { correct: item.accusation.correct, culprit, explanation: item.solutionExplanation, score: item.score, progress: { discoveredClueCount: item.discoveredClueIds.length, hintsUsed: item.usedHintIds.length } } }); });

app.get("/api/health", (_req, res) => res.json({ ok: true }));
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`Casefile API listening on http://localhost:${port}`));
