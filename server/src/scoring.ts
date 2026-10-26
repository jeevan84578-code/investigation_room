import type { Difficulty } from "./types.js";

export const counts: Record<Difficulty, { suspects: number; clues: number; hints: number }> = {
  easy: { suspects: 3, clues: 5, hints: 2 },
  medium: { suspects: 4, clues: 7, hints: 3 },
  hard: { suspects: 5, clues: 9, hints: 3 }
};

export const baseScores: Record<Difficulty, number> = { easy: 100, medium: 150, hard: 200 };

export function calculateScore(difficulty: Difficulty, correct: boolean, discoveredClueCount: number, hintsUsed: number) {
  const base = correct ? baseScores[difficulty] : 0;
  const cluePoints = discoveredClueCount * 5;
  const hintPenalty = hintsUsed * 10;
  return { total: Math.max(0, base + cluePoints - hintPenalty), base, cluePoints, hintPenalty };
}
