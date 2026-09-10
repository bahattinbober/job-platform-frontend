import { ApiError, getReferralMessage } from "./api";

export type ReferralMessageHandlers = {
  onComplete: (message: string) => void;
  onError: (message: string) => void;
};

export type ReferralMessageContext = {
  jobTitle: string;
  company: string;
  connectionFirstName: string;
  connectionPosition: string | null;
  connectedAt: string | null;
  matchedSkills: string[];
};

/**
 * Simulated with a timer until /jobs/:id/referral-message/:connectionId
 * exists. Swap the body for a fetch to that endpoint — the onComplete /
 * onError contract is what the panel depends on, not how it's produced.
 */
export function generateReferralMessage(
  jobId: string,
  connectionId: string,
  context: ReferralMessageContext,
  handlers: ReferralMessageHandlers
): () => void {
  const timeout = setTimeout(() => {
    handlers.onComplete(buildMockMessage(context));
  }, 1500);

  return () => clearTimeout(timeout);
}

/**
 * The real thing: GET /jobs/:id/referral-message/:connectionId. The mock
 * above stays in place for the landing page's illustrative referral
 * moment — this is what /roles/[id] passes to ReferralPanel instead.
 */
export function generateReferralMessageLive(
  jobId: string,
  connectionId: string,
  _context: ReferralMessageContext,
  handlers: ReferralMessageHandlers
): () => void {
  let cancelled = false;

  getReferralMessage(jobId, connectionId)
    .then((message) => {
      if (!cancelled) handlers.onComplete(message);
    })
    .catch((err) => {
      if (!cancelled) {
        handlers.onError(err instanceof ApiError ? err.message : "Couldn't generate a message.");
      }
    });

  return () => {
    cancelled = true;
  };
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function buildMockMessage(context: ReferralMessageContext): string {
  const { jobTitle, company, connectionFirstName, connectionPosition, connectedAt, matchedSkills } =
    context;
  const sinceYear = connectedAt ? new Date(connectedAt).getFullYear() : null;

  const opener = sinceYear
    ? `Hi ${connectionFirstName} — we've been connected since ${sinceYear}, and I saw the ${jobTitle} opening at ${company} that I think could be a great fit.`
    : `Hi ${connectionFirstName}, I saw the ${jobTitle} opening at ${company} that I think could be a great fit.`;

  const skillsSentence =
    matchedSkills.length > 0
      ? ` A chunk of what the role's asking for is already what I do day to day — ${joinWithAnd(matchedSkills)}.`
      : "";

  const askSentence = connectionPosition
    ? ` Since you're ${connectionPosition} there, would you be up for referring me, or pointing me to whoever's hiring?`
    : " Would you be up for referring me, or pointing me to whoever's hiring?";

  return `${opener}${skillsSentence}${askSentence} Happy to send over my resume or walk through my background. Thanks for considering it!`;
}
