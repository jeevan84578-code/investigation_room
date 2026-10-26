import { describe, expect, it } from "vitest";
import { calculateScore } from "./scoring.js";

describe("calculateScore", () => {
  it("calculates a correct medium score", () => expect(calculateScore("medium", true, 7, 2)).toEqual({ total: 165, base: 150, cluePoints: 35, hintPenalty: 20 }));
  it("never returns a negative score", () => expect(calculateScore("easy", false, 0, 2).total).toBe(0));
});
