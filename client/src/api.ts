export type Difficulty = "easy" | "medium" | "hard";

export type Suspect = {
  id: string;
  name: string;
  role: string;
  description: string;
};

export type Clue = {
  id: string;
  label: string;
  description?: string;
  status: "undiscovered" | "discovered";
};

export type Hint = {
  id: string;
  text?: string;
  used?: boolean;
};

export type Case = {
  id: string;
  title: string;
  premise: string;
  story: string;
  difficulty: Difficulty;
  suspects: Suspect[];
  clues: Clue[];
  hints: Hint[];
  progress: {
    discoveredClueIds: string[];
    usedHintIds: string[];
    cluesRequired: number;
    hintsAvailable: number;
  };
  status: "active" | "completed";
};

export type Result = {
  correct: boolean;
  culprit: Suspect;
  explanation: string;
  score: { total: number; base: number; cluePoints: number; hintPenalty: number };
  progress: { discoveredClueCount: number; hintsUsed: number };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
    });
  } catch {
    throw new Error("Cannot reach the API server. Start the backend and try again.");
  }
  const raw = await response.text();
  let body: any = null;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }
  }
  if (!response.ok) {
    if (body?.error?.message) {
      throw new Error(body.error.message);
    }
    if (response.status >= 500) {
      throw new Error(`API request failed (${response.status}). Make sure the backend server is running on http://localhost:4000.`);
    }
    throw new Error(`Request failed (${response.status}). Please try again.`);
  }
  return body as T;
}

export const api = {
  createCase: (premise: string, difficulty: Difficulty) =>
    request<{ case: Case }>("/api/cases", {
      method: "POST",
      body: JSON.stringify({ premise, difficulty })
    }),
  getCase: (id: string) => request<{ case: Case }>(`/api/cases/${id}`),
  discoverClue: (id: string, clueId: string) =>
    request<{ clue: Clue; progress: Case["progress"] }>(`/api/cases/${id}/clues/${clueId}/discover`, { method: "POST" }),
  requestHint: (id: string, hintId: string) =>
    request<{ hint: Hint; progress: Case["progress"] }>(`/api/cases/${id}/hints`, {
      method: "POST",
      body: JSON.stringify({ hintId })
    }),
  accuse: (id: string, suspectId: string) =>
    request<{ result: Result }>(`/api/cases/${id}/accuse`, {
      method: "POST",
      body: JSON.stringify({ suspectId })
    }),
  result: (id: string) => request<{ result: Result }>(`/api/cases/${id}/result`)
};
