import type { ResumeParseResult } from "./types";
import { ApiError, getActiveResume, parsedSkillsToCategories, uploadResume } from "./api";

// pdf-parse text extraction happens synchronously inside the upload request;
// skill extraction (OpenRouter) and embedding generation happen afterward on
// a BullMQ queue and land together in one DB write, so they're not
// separately observable — we poll until parsedSkills appears.
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

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 45_000;

export function runResumeProcessing(file: File, handlers: ProcessingHandlers): () => void {
  let cancelled = false;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;

  const finish = (resume: { id: string; parsedSkills: Parameters<typeof parsedSkillsToCategories>[0] }) => {
    handlers.onStage(2);
    handlers.onComplete(parsedSkillsToCategories(resume.parsedSkills));
  };

  const poll = async (resumeId: string, startedAt: number) => {
    if (cancelled) return;
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      finish({ id: resumeId, parsedSkills: null });
      return;
    }
    try {
      const latest = await getActiveResume();
      if (latest?.id === resumeId && latest.parsedSkills) {
        finish(latest);
        return;
      }
    } catch {
      // transient poll failure — keep retrying until the timeout above
    }
    if (!cancelled) pollTimer = setTimeout(() => poll(resumeId, startedAt), POLL_INTERVAL_MS);
  };

  (async () => {
    handlers.onStage(0);
    let resume;
    try {
      resume = await uploadResume(file);
    } catch (err) {
      if (!cancelled) {
        handlers.onError(err instanceof ApiError ? err.message : "Upload failed.");
      }
      return;
    }
    if (cancelled) return;

    handlers.onStage(1);
    if (resume.parsedSkills) {
      finish(resume);
    } else {
      pollTimer = setTimeout(() => poll(resume.id, Date.now()), POLL_INTERVAL_MS);
    }
  })();

  return () => {
    cancelled = true;
    if (pollTimer) clearTimeout(pollTimer);
  };
}
