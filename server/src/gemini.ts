import type { Difficulty } from "./types.js";
import { counts } from "./scoring.js";
import { validateGeneratedCase } from "./validation.js";

function demoCase(premise: string, difficulty: Difficulty) {
  const c = counts[difficulty];
  const suspects = Array.from({ length: c.suspects }, (_, index) => ({ id: `suspect-${index + 1}`, name: ["Mara Voss", "Elias Finch", "June Bell", "Theo Ward", "Iris Cole"][index], role: ["Curator", "Storm Chaser", "Caretaker", "Journalist", "Collector"][index], description: ["Had the keys, and a reputation for protecting the collection.", "Arrived just before the storm and knows the coastline well.", "Claims to have stayed in the west wing all night.", "Was documenting the lighthouse for an article.", "Wanted the artifact for a private collection."][index] }));
  const clues = Array.from({ length: c.clues }, (_, index) => ({ id: `clue-${index + 1}`, label: ["Salt on the display case", "A torn raincoat button", "The generator log", "Footprints facing the tide", "A missing brass key", "Wax on the window latch", "A coded ledger", "A second set of boots", "The false distress call"][index], description: ["The residue is fresh, despite the locked gallery.", "The button matches a coat seen near the boathouse.", "One hour was erased from the record.", "The tracks stop where no boat could land.", "Only three people knew where it was kept.", "The latch was opened from inside.", "A payment is hidden among mundane entries.", "The size does not match the caretaker.", "The call sent everyone toward the cliffs."][index], solutionRelevance: index === 0 ? "Points toward the culprit's access to the gallery." : "Narrows the timeline and eliminates an alternative." }));
  const hints = Array.from({ length: c.hints }, (_, index) => ({ id: `hint-${index + 1}`, text: ["Focus on who benefits from the disappearance.", "The storm created an alibi, but it also erased a trail.", "One suspect's story depends on a detail the evidence contradicts."][index] }));
  const culpritId = suspects[suspects.length - 1].id;
  return validateGeneratedCase({ title: "The Lighthouse at Blackwater", story: `A storm has cut the Blackwater lighthouse off from the mainland. ${premise} By dawn, the artifact is gone, the radio is silent, and every survivor has a story that almost fits.`, suspects, clues, hints, culpritId, solutionExplanation: "The final suspect engineered the false distress call, used the storm as cover, and relied on knowledge of the display case. The residue, erased generator hour, and coded ledger place them at the center of the disappearance.", }, difficulty);
}

export async function generateCase(premise: string, difficulty: Difficulty) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return demoCase(premise, difficulty);
  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const prompt = `Return JSON only for a fair fictional mystery. Premise: ${premise}. Difficulty: ${difficulty}. Include exactly ${counts[difficulty].suspects} suspects, ${counts[difficulty].clues} clues, and ${counts[difficulty].hints} hints. Use the schema title, story, suspects[{id,name,role,description}], clues[{id,label,description,solutionRelevance}], hints[{id,text}], culpritId, solutionExplanation. Make the clues logically support the culprit.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) });
    if (!response.ok) throw new Error("Gemini request failed.");
    const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned an empty payload.");
    return validateGeneratedCase(JSON.parse(text), difficulty);
  } catch (error) {
    console.warn("Gemini generation failed, using demo fallback:", error instanceof Error ? error.message : error);
    return demoCase(premise, difficulty);
  }
}
