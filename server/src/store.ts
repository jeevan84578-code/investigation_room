import { randomUUID } from "node:crypto";
import type { CaseData, Difficulty } from "./types.js";

const cases = new Map<string, CaseData>();

export function saveCase(data: Omit<CaseData, "id">) { const id = randomUUID(); const item = { ...data, id }; cases.set(id, item); return item; }
export function getCase(id: string) { return cases.get(id); }
export function updateCase(id: string, update: Partial<CaseData>) { const current = cases.get(id); if (!current) return undefined; const next = { ...current, ...update }; cases.set(id, next); return next; }
export function clearCases() { cases.clear(); }
export function seedCase(difficulty: Difficulty) { return undefined; }
