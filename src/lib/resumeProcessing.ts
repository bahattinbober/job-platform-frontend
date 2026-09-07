import type { ResumeParseResult, SkillCategory } from "./types";

// Three real backend stages: pdf-parse text extraction, OpenRouter skill
// extraction, then the BullMQ embedding queue.
export const PROCESSING_STAGES = [
  { key: "extract", label: "Text extracted" },
  { key: "parse", label: "Skills parsed" },
  { key: "embed", label: "Embedding generated" },
] as const;

export type ProcessingHandlers = {
  onStage: (stageIndex: number) => void;
  onComplete: (result: ResumeParseResult) => void;
  onError: (message: string) => void;
};

/**
 * Simulated with timers until the backend endpoint exists. Swap the body
 * for a fetch/SSE subscription to the real pipeline — the onStage /
 * onComplete contract is what the UI depends on, not how it's driven.
 */
export function runResumeProcessing(
  file: File,
  handlers: ProcessingHandlers
): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  const schedule = (fn: () => void, delay: number) => {
    timeouts.push(setTimeout(fn, delay));
  };

  handlers.onStage(0);
  schedule(() => handlers.onStage(1), 1100);
  schedule(() => handlers.onStage(2), 2200);
  schedule(() => handlers.onComplete(mockResult(file)), 3300);

  return () => timeouts.forEach(clearTimeout);
}

// Shared with mock.ts, so the skills shown here and the ones matched against
// job listings come from the same fictional resume.
export const MOCK_PARSED_SKILLS: SkillCategory[] = [
  {
    key: "programming_languages",
    label: "Programming languages",
    skills: ["TypeScript", "Python", "Go"],
  },
  {
    key: "backend",
    label: "Backend",
    skills: ["Node.js", "PostgreSQL", "Redis", "BullMQ"],
  },
  {
    key: "frontend",
    label: "Frontend",
    skills: ["React", "Next.js", "Tailwind CSS"],
  },
];

function mockResult(_file: File): ResumeParseResult {
  return { categories: MOCK_PARSED_SKILLS };
}
