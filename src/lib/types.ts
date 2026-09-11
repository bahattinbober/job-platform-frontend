// Mirrors the shape the backend returns from /resumes/:id/matching-jobs,
// with the network lookup from /jobs/:id/network folded in.
export type Connection = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  connectedAt: string | null;
};

export type RoleMatch = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remoteType: string | null;
  /** Cosine distance turned into a 0–1 similarity. Lower distance, higher score. */
  score: number;
  connections: Connection[];
};

// Mirrors /jobs/:id: a RoleMatch plus the required skills, so the detail
// screen can show the overlap with Resume.parsedSkills.
export type JobDetail = RoleMatch & {
  skills: string[];
};

// Mirrors the shape returned once the embedding queue finishes and
// /resumes/:id/skills is populated.
export type SkillCategory = {
  key: string;
  label: string;
  skills: string[];
};

export type ResumeParseResult = {
  categories: SkillCategory[];
};