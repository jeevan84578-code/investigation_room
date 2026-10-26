# Mystery Investigation Room

## A. Project Requirements

### Project overview and problem statement

Mystery Investigation Room is a web application that lets a player investigate an AI-generated fictional mystery. The player supplies a premise, chooses a difficulty, examines a story and suspects, discovers evidence, requests limited hints, and finally accuses one suspect. The application evaluates the accusation against a server-side solution and presents a verdict, explanation, and score.

The problem addressed is that mystery games often provide either fixed stories with limited replayability or unstructured AI content that cannot be trusted for consistency. This project combines Gemini-generated content with strict schema validation, backend-owned solutions, deterministic progress tracking, and backend scoring so that every generated case is playable and fair.

### Target users and expected user experience

The target users are students, casual puzzle players, mystery fans, and users who want a short interactive reasoning game. The expected experience is:

- A welcoming, polished, responsive interface that works on desktop, tablet, and mobile.
- A simple path from premise entry to an active investigation.
- Clear separation between known information, discoverable clues, optional hints, and hidden solution data.
- Useful feedback during generation, clue discovery, hint requests, and accusation submission.
- A fair result that explains why the accusation was correct or incorrect and how the score was calculated.
- The ability to begin a fresh mystery without manually clearing application state.

### Core features

1. Home page with project introduction and a start action.
2. Mystery creation form with premise input and Easy, Medium, and Hard difficulty choices.
3. AI-generated title, story, suspects, clues, hints, culprit, solution explanation, and clue-to-solution reasoning.
4. Investigation room with story context, suspect cards, clue discovery, hint requests, and progress indicators.
5. Accusation flow that allows selection of one suspect and confirmation before submission.
6. Results page with verdict, culprit, explanation, score breakdown, and a new-mystery action.
7. Backend validation of all AI output and all game actions.
8. Backend-only storage and delivery of the culprit and solution until an accusation is submitted.
9. Persistent case state in MongoDB using Mongoose.
10. Responsive loading, empty, validation, network-error, and success states.

### Optional enhancements

- Anonymous player sessions with a generated session token.
- Case history and replayable completed cases.
- A timer and optional time-based bonus.
- Shareable result links that expose only completed-case data.
- Accessibility improvements such as keyboard-first investigation and reduced-motion support.
- Animations for clue discovery and result reveal.
- Analytics for generation failures, completion rates, and difficulty selection.
- Rate limiting and abuse protection for Gemini generation.

### Technology stack

- **Frontend:** React, Vite, Tailwind CSS, React Router, and a typed API client.
- **Backend:** Node.js, Express, and REST JSON endpoints.
- **Database:** MongoDB with Mongoose.
- **AI:** Gemini API called only from the backend using a server-side API key.
- **Language and tooling:** TypeScript is preferred across frontend and backend; ESLint, Prettier, and a test runner such as Vitest/Jest may be used.
- **Deployment:** Any deployment that supports a Vite frontend, Node.js/Express API, MongoDB, and secure environment variables. The production frontend must use the deployed API base URL.

### Project limitations and final deliverables

Limitations:

- The game is fictional and must not present generated content as real-world fact.
- Gemini output is probabilistic; all output must be schema-validated and rejected or regenerated when invalid.
- The initial release does not require user accounts, payments, multiplayer, or a full content-management system.
- The culprit and solution must never be sent to the browser in active-case payloads.
- Score calculation must not trust client-provided clue, hint, or accusation counts.
- Generation may fail due to provider, quota, timeout, or malformed-output errors; these must be surfaced clearly.

Final deliverables:

- A responsive React/Vite/Tailwind frontend implementing all required pages and states.
- A Node.js/Express backend implementing the documented API.
- Mongoose models and MongoDB persistence for active and completed cases.
- Gemini integration with structured-output prompting and validation.
- Environment-variable documentation and safe configuration examples.
- Automated tests for validation, scoring, authorization of case actions, and core UI behavior.
- A deployable production build in which the full user flow works.
- This `SPEC.md`, kept current with the implementation.

## B. User Flow

1. **User opens the website.** The Home page explains the game and shows a primary “Start a Mystery” button. If a prior active case exists in the current browser session, the user may resume it.
2. **User enters a mystery premise and selects a difficulty level.** The Create Mystery page requires a non-empty premise within the configured length limit and one of Easy, Medium, or Hard. The page shows the suspect, clue, and hint counts for each difficulty.
3. **Gemini generates the mystery, suspects, clues, and hints.** The frontend submits only the premise and difficulty. The backend builds the Gemini prompt, validates the response, checks the required counts and consistency, strips solution fields from the active-case response, and stores the complete case.
4. **User investigates and discovers clues.** The Investigation Room displays the story and suspect cards. Clues begin locked or undiscovered. The player can discover available clues one at a time; the backend records discovery and returns only the newly authorized clue data and updated progress.
5. **User requests hints if needed.** The player can request an available hint. The backend records usage, reveals the hint, prevents duplicate use, and updates the hint count and score projection. Hints may be limited by difficulty.
6. **User accuses a suspect.** The Accusation page lists the suspects and requires a deliberate confirmation. The frontend submits only the selected suspect ID; the backend compares it to its private culprit field.
7. **The application reveals the verdict, culprit, explanation, and score.** On successful accusation, the backend calculates the score from authoritative progress, marks the case complete, and returns the completed result. The Results page shows whether the accusation was correct, the culprit, the explanation, discovered-clue and used-hint counts, and the final score.
8. **User can start another mystery.** The “New Mystery” action clears or replaces the active case reference and returns to Create Mystery.

## C. UI and Page Specifications

### Shared application behavior

- Use a consistent responsive shell with a header, page title, progress context, and primary/secondary actions.
- Use semantic headings, labels, buttons, focus states, sufficient contrast, and keyboard-accessible controls.
- On mobile, stack cards and controls vertically; avoid horizontal scrolling for core content.
- Preserve the active case ID in session storage or an equivalent browser session mechanism, but treat the backend as the source of truth.
- Show inline validation before requests and clear API errors after failed requests.
- Use skeletons or progress indicators for generation and page-level fetches.
- Disable duplicate submissions while requests are in flight.
- Provide a retry action for recoverable network or generation failures.
- Never render hidden culprit, solution explanation, or unrevealed clue answer data in HTML, serialized initial state, or client logs.

### Home

**Purpose:** Introduce the game and begin the user journey.

**Essential elements:**

- Product name and concise explanation.
- Primary “Start a Mystery” button.
- Brief explanation of the three difficulty levels.
- Optional resume action when a valid active case is stored locally.

**States and navigation:**

- Initial page loads without an API request.
- Start navigates to `/create`.
- Resume navigates to `/cases/:id/investigate`.
- If the stored case is invalid or expired, remove the local reference and show the create flow.

### Create Mystery

**Purpose:** Collect the premise and difficulty.

**Essential elements:**

- Premise textarea with label, character guidance, and validation.
- Difficulty selector with Easy, Medium, and Hard cards or radio controls.
- Counts shown for the selected difficulty.
- Submit button labeled “Generate Mystery”.
- Back link to Home.

**Validation and states:**

- Premise must be trimmed, within the configured minimum and maximum length, and rejected if blank.
- Difficulty must be one of the supported enum values.
- During generation, disable form controls and show a progress state such as “Building your case”.
- On success, store the returned case ID and navigate to the Investigation Room.
- On failure, preserve entered values and show a specific, user-safe message with retry.

### Investigation Room

**Purpose:** Let the player read context, inspect suspects, discover clues, and use hints.

**Essential elements:**

- Mystery title, difficulty, and story.
- Suspect cards with names, roles, descriptions, and optionally alibis or motives that are safe to reveal.
- Clue list showing locked, available, and discovered states.
- “Discover clue” actions that map to individual clue IDs.
- Hint panel with remaining hint count and “Request hint” action.
- Progress indicator for clues discovered and hints used.
- “Make an accusation” action, available only when the case is active.

**States and navigation:**

- Page fetch shows a skeleton or loading indicator.
- Invalid or inaccessible case shows an error with navigation to Create Mystery.
- Clue discovery updates only after a successful backend response.
- Already discovered clues are read-only and remain visible.
- When all required investigation actions are complete, accusation remains available; the player is not forced to discover every clue.
- The accusation action navigates to `/cases/:id/accuse`.

### Accusation

**Purpose:** Collect and confirm the player’s final suspect choice.

**Essential elements:**

- Case title and concise reminder of the investigation.
- Radio/card selection for each suspect.
- Clear warning that submission ends the investigation.
- “Submit accusation” button and a cancel/back action.

**States and navigation:**

- Require exactly one suspect selection.
- Disable submission during the request.
- On success, navigate to `/cases/:id/results`.
- If the case is already complete, redirect to Results rather than allowing a second accusation.
- On failure, preserve selection and show a retryable message.

### Results

**Purpose:** Reveal the completed outcome and explain the score.

**Essential elements:**

- Verdict: correct or incorrect accusation.
- Culprit name.
- Explanation of the solution and how the clues support it.
- Final score.
- Score breakdown: base accusation score, discovered-clue points, hint deductions, and minimum-score handling.
- Counts of discovered clues and used hints.
- “Start another mystery” button.

**States and navigation:**

- Fetch completed result data on direct navigation.
- Do not show result content for an active, unsubmitted case; redirect to Investigation Room.
- Show a clear error if the result cannot be loaded.
- New Mystery returns to `/create` and replaces the previous active-case reference.

## D. Backend and Database Design

### API conventions

- Base path: `/api`.
- Content type: `application/json`.
- IDs are MongoDB ObjectIds represented as strings.
- All error responses use a consistent shape:

```json
{
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "The mystery could not be found.",
    "details": []
  }
}
```

- Successful responses use a top-level resource or result object.
- Validate request bodies with a shared schema library or explicit typed validators.
- Do not expose stack traces, Gemini prompts, API keys, private solution fields, or raw provider errors to clients.
- Use appropriate status codes: `201` for generated cases, `200` for reads and actions, `400` for invalid input, `404` for missing cases, `409` for invalid state transitions, `429` for rate limits, and `500`/`502` for safe server/provider failures.
- Add request IDs and structured server logs. Log operational metadata, not hidden solutions or sensitive user content.

### POST /api/cases — Generate a mystery

Request:

```json
{
  "premise": "A priceless painting disappears during a storm at a coastal museum.",
  "difficulty": "medium"
}
```

Validation:

- `premise` must be a string, trimmed, non-empty, and within configured length bounds.
- `difficulty` must be exactly `easy`, `medium`, or `hard`.
- Apply request rate limiting and a generation timeout.

Response `201`:

```json
{
  "case": {
    "id": "case-id",
    "title": "The Vanishing at Blackwater Museum",
    "story": "Safe introductory story text.",
    "difficulty": "medium",
    "suspects": [
      {
        "id": "suspect-1",
        "name": "Avery Stone",
        "role": "Curator",
        "description": "Safe suspect description."
      }
    ],
    "clues": [
      {
        "id": "clue-1",
        "label": "Wet Footprints",
        "description": "Safe clue description.",
        "status": "undiscovered"
      }
    ],
    "progress": {
      "discoveredClueIds": [],
      "usedHintIds": [],
      "cluesRequired": 7,
      "hintsAvailable": 3
    },
    "status": "active"
  }
}
```

The response must not include `culpritId`, solution reasoning, answer-bearing hint metadata, or any other hidden solution field.

### GET /api/cases/:id — Retrieve an active mystery

Response `200` returns the active-case representation above, with discovered clues and used hints revealed according to progress. Hidden solution fields remain omitted. A completed case may return a safe active summary or `409 CASE_COMPLETED`, depending on frontend routing conventions.

### POST /api/cases/:id/clues/:clueId/discover — Discover a clue

Request body: empty object or no body.

Rules:

- Case must exist and be active.
- `clueId` must belong to the case.
- Discovery is idempotent: discovering an already discovered clue returns the existing safe clue and current progress without awarding points twice.
- Do not reveal solution-only metadata before accusation.

Response `200`:

```json
{
  "clue": {
    "id": "clue-1",
    "label": "Wet Footprints",
    "description": "The discovered clue text."
  },
  "progress": {
    "discoveredClueIds": ["clue-1"],
    "discoveredCount": 1,
    "clueCount": 7
  }
}
```

### POST /api/cases/:id/hints — Request a hint

Request:

```json
{
  "hintId": "hint-1"
}
```

Rules:

- Case must exist and be active.
- `hintId` must belong to the case and must not already be used.
- Reject requests after the available hint limit is reached.
- Return only the hint text intended for the player.

Response `200`:

```json
{
  "hint": {
    "id": "hint-1",
    "text": "Look closely at who could access the east gallery."
  },
  "progress": {
    "usedHintIds": ["hint-1"],
    "hintsUsed": 1,
    "hintsAvailable": 3
  }
}
```

### POST /api/cases/:id/accuse — Submit an accusation

Request:

```json
{
  "suspectId": "suspect-2"
}
```

Rules:

- Case must exist and be active.
- `suspectId` must belong to the case.
- Reject duplicate accusations after the case is complete.
- Compare the submitted suspect ID with the backend-only culprit ID.
- Calculate score entirely from persisted backend progress.
- Store accusation and completion metadata atomically where possible.

Response `200`:

```json
{
  "result": {
    "correct": true,
    "culprit": {
      "id": "suspect-2",
      "name": "Morgan Reed"
    },
    "explanation": "The evidence establishes ...",
    "score": {
      "total": 165,
      "base": 150,
      "cluePoints": 35,
      "hintPenalty": 20
    },
    "progress": {
      "discoveredClueCount": 7,
      "hintsUsed": 2
    }
  }
}
```

### GET /api/cases/:id/result — Retrieve the completed result

Response `200` returns the completed result shape above. It is available only after accusation. If the case is still active, return `409 CASE_NOT_COMPLETED`; if it does not exist, return `404`.

### Mongoose database model

Collection: `cases`.

Conceptual schema:

```ts
type Difficulty = "easy" | "medium" | "hard";
type CaseStatus = "active" | "completed";

interface CaseDocument {
  title: string;
  premise: string;
  story: string;
  difficulty: Difficulty;
  suspects: Array<{
    id: string;
    name: string;
    role: string;
    description: string;
  }>;
  clues: Array<{
    id: string;
    label: string;
    description: string;
    solutionRelevance: string;
  }>;
  hints: Array<{
    id: string;
    text: string;
  }>;
  culpritId: string;
  solutionExplanation: string;
  status: CaseStatus;
  progress: {
    discoveredClueIds: string[];
    usedHintIds: string[];
  };
  accusation?: {
    suspectId: string;
    correct: boolean;
    submittedAt: Date;
  };
  score?: {
    base: number;
    cluePoints: number;
    hintPenalty: number;
    total: number;
  };
  createdAt: Date;
  completedAt?: Date;
}
```

The database may contain the private fields, but serializers must use separate active-case and completed-result DTOs so private fields cannot leak accidentally. Add indexes appropriate for case lookup and lifecycle cleanup. If anonymous session ownership is implemented, store a server-generated session token hash and require it on all case actions.

### Security and integrity

- Store `GEMINI_API_KEY`, `MONGODB_URI`, and other secrets only in server environment variables or deployment secret storage.
- Never call Gemini directly from the browser.
- Never include `culpritId`, `solutionExplanation`, or `solutionRelevance` in active-case responses.
- Use server-side ownership/session checks if cases are associated with anonymous sessions.
- Apply body-size limits, rate limits, input validation, and provider timeouts.
- Sanitize or safely render generated text; do not inject generated HTML.
- Use atomic state transitions or conditional updates to avoid double discovery, double hints, or duplicate accusations.

## E. AI Behavior and Scoring Rules

### Difficulty requirements

| Difficulty | Suspects | Clues | Hints | Correct accusation base |
| --- | ---: | ---: | ---: | ---: |
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

The generated case must contain exactly the required number of suspects, clues, and hints for the selected difficulty. IDs must be unique within each collection, and the culprit ID must reference exactly one generated suspect.

### Gemini prompt and output contract

The backend should request JSON-only structured output and include the selected difficulty counts, premise, content-safety boundaries, and consistency rules in the prompt. The expected internal response is:

```json
{
  "title": "string",
  "story": "string",
  "suspects": [
    {
      "id": "string",
      "name": "string",
      "role": "string",
      "description": "string"
    }
  ],
  "clues": [
    {
      "id": "string",
      "label": "string",
      "description": "string",
      "solutionRelevance": "string"
    }
  ],
  "hints": [
    {
      "id": "string",
      "text": "string"
    }
  ],
  "culpritId": "string",
  "solutionExplanation": "string"
}
```

Validation before saving must verify:

- Required fields exist and have the expected primitive types.
- All strings are non-empty, trimmed, and within safe length limits.
- Counts exactly match the selected difficulty.
- IDs are unique and use a safe format.
- `culpritId` references a generated suspect.
- Every clue has meaningful `solutionRelevance`.
- The solution explanation identifies a coherent chain of evidence.
- The case is internally consistent: the culprit has a plausible motive/opportunity, the clues support the culprit, and at least one alternative suspect is meaningfully ruled out.
- No generated text contains an instruction to reveal hidden fields, executable markup, or unsafe content.

If validation fails, the backend should attempt a bounded regeneration or repair request. If the bounded attempt still fails, return a safe generation error and do not save a partial case.

### Scoring rules

Score only on the backend at accusation time:

```text
base =
  easy: 100
  medium: 150
  hard: 200

cluePoints = discoveredClueCount * 5
hintPenalty = hintsUsed * 10
total = max(0, base if accusation is correct else 0 + cluePoints - hintPenalty)
```

Interpretation: a correct accusation earns the difficulty base plus clue points minus hint penalties; an incorrect accusation earns no base points but still receives discovered-clue points minus hint penalties. The final score can never be below zero. The exact formula must be implemented with explicit parentheses:

```ts
const base = correct ? baseByDifficulty[difficulty] : 0;
const total = Math.max(0, base + discoveredClueCount * 5 - hintsUsed * 10);
```

The backend must derive counts from persisted arrays, not from values submitted by the client. Store the resulting breakdown with the completed case so repeated result requests return the same score.

## F. Acceptance Criteria

The project is complete when all of the following are true:

1. Users can generate mysteries at Easy, Medium, and Hard difficulty levels.
2. Each generated mystery has exactly the required suspect, clue, and hint counts.
3. Players can read the story, inspect suspects, discover clues, request available hints, and submit an accusation.
4. The culprit and solution are not present in active-case API responses, browser state, page source, or client logs before accusation.
5. Invalid premises, difficulty values, case IDs, clue IDs, hint IDs, and suspect IDs receive clear validation errors.
6. Duplicate clue discovery and duplicate hint use cannot award extra points or bypass limits.
7. A completed case cannot be accused twice or have its score changed by repeated requests.
8. Scores are calculated and validated by the backend using the documented formula and have a minimum of zero.
9. Results display the correct culprit, verdict, explanation, score, and score breakdown.
10. Loading, error, empty, retry, and disabled-submission states are implemented for the main API interactions.
11. The application is responsive and usable on desktop, tablet, and mobile widths.
12. Automated tests cover Gemini response validation, difficulty counts, scoring, solution secrecy, state transitions, and representative frontend flows.
13. Environment variables and deployment setup are documented without exposing secrets.
14. The application works end-to-end on the deployed website, including frontend-to-API communication, Gemini generation, MongoDB persistence, investigation actions, accusation, and results.
