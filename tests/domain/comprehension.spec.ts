import {
  ALLOWED_MISSES,
  type ComprehensionCheck,
  gradeCheck,
  passingCount,
  question,
} from "../../src/domain/comprehension.js";

const check: ComprehensionCheck = {
  milestoneId: "first-buy",
  title: "Owning shares",
  concept: "what owning shares actually is",
  questions: [
    question("a", "Q one?", ["right", "wrong"], 0, "because A."),
    question("b", "Q two?", ["wrong", "right"], 1, "because B."),
    question("c", "Q three?", ["wrong", "wrong", "right"], 2, "because C."),
    question("d", "Q four?", ["right", "wrong"], 0, "because D."),
  ],
};

const answers = (entries: Record<string, string>) => new Map(Object.entries(entries));
const allRight = answers({ a: "0", b: "1", c: "2", d: "0" });

describe("comprehension grading — a check is a teaching moment, not an exam", () => {
  it("passes a perfect run and names the concept rather than only the score", () => {
    const result = gradeCheck(check, allRight);
    expect(result.passed).toBe(true);
    expect(result.correct).toBe(4);
    expect(result.total).toBe(4);
    expect(result.verdict).toContain("what owning shares actually is");
    expect(result.verdict).toContain("4 of 4");
  });

  it("still passes with one miss — the bar is understanding, not perfection", () => {
    const result = gradeCheck(check, answers({ a: "0", b: "1", c: "2", d: "1" }));
    expect(result.correct).toBe(3);
    expect(result.needed).toBe(passingCount(4));
    expect(result.passed).toBe(true);
    expect(ALLOWED_MISSES).toBe(1);
  });

  it("fails two misses, states the bar, and promises the retry rather than a block", () => {
    const result = gradeCheck(check, answers({ a: "1", b: "1", c: "2", d: "1" }));
    expect(result.passed).toBe(false);
    expect(result.correct).toBe(2);
    expect(result.verdict).toContain("3 gets you through");
    expect(result.verdict).toContain("Nothing is lost");
    expect(result.verdict).toContain("take it again");
  });

  it("renders an unanswered question as ABSENT — never a false pick, never a false zero", () => {
    const result = gradeCheck(check, answers({ a: "0", b: "1", c: "2" }));
    const blank = result.answers.find((entry) => entry.questionId === "d");
    expect(blank?.chosen).toBeUndefined();
    expect(blank?.correct).toBe(false);
    expect(result.correct).toBe(3);
  });

  it("treats a malformed or out-of-range index as unanswered, not as a guess", () => {
    const result = gradeCheck(check, answers({ a: "banana", b: "-1", c: "99", d: "" }));
    expect(result.answers.every((entry) => entry.chosen === undefined)).toBe(true);
    expect(result.correct).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("attaches the plain-language reason to every question, right or wrong", () => {
    const result = gradeCheck(check, answers({ a: "0", b: "0", c: "2", d: "0" }));
    expect(result.answers.map((entry) => entry.why)).toEqual([
      "because A.",
      "because B.",
      "because C.",
      "because D.",
    ]);
    const missed = result.answers[1];
    expect(missed?.correct).toBe(false);
    expect(missed?.chosen).toBe("wrong");
    expect(missed?.correctAnswer).toBe("right");
  });

  it("grades by index, so two options that read alike never confuse the answer", () => {
    const twins: ComprehensionCheck = {
      ...check,
      questions: [question("t", "Which?", ["same", "same"], 1, "because index.")],
    };
    expect(gradeCheck(twins, answers({ t: "0" })).correct).toBe(0);
    expect(gradeCheck(twins, answers({ t: "1" })).correct).toBe(1);
  });

  it("never lets the bar fall below one correct answer", () => {
    expect(passingCount(1)).toBe(1);
    expect(passingCount(3)).toBe(2);
    expect(passingCount(5)).toBe(4);
  });
});
