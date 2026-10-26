export type Difficulty = "easy" | "medium" | "hard";
export type CaseStatus = "active" | "completed";
export type CaseData = {
  id: string;
  title: string;
  premise: string;
  story: string;
  difficulty: Difficulty;
  suspects: { id: string; name: string; role: string; description: string }[];
  clues: { id: string; label: string; description: string; solutionRelevance?: string; status?: "undiscovered" | "discovered" }[];
  hints: { id: string; text?: string; used?: boolean }[];
  culpritId: string;
  solutionExplanation: string;
  status: CaseStatus;
  discoveredClueIds: string[];
  usedHintIds: string[];
  accusation?: { suspectId: string; correct: boolean };
  score?: { total: number; base: number; cluePoints: number; hintPenalty: number };
};
