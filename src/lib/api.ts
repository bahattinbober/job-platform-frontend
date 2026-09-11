import type { Connection, JobDetail, ResumeParseResult, RoleMatch, SkillCategory } from "./types";
import { clearToken, getToken } from "./session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Attaches the stored session token, if any. No token just means no header. */
function authHeader(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * A 401 on a request that carried a token means the session is dead (expired
 * or revoked) — clear it and bounce to /login so the user isn't left staring
 * at a broken screen. A 401 with no token attached is a normal login-form
 * rejection (wrong password) and is left for the caller to show inline, so
 * this only fires for requests that thought they were authenticated.
 */
async function handleResponse<T>(res: Response, hadAuthHeader: boolean): Promise<T> {
  if (res.status === 401 && hadAuthHeader) {
    clearToken();
    // This is a plain module, not a component — there's no router instance
    // to inject here, and this can fire from any call site in the app. A
    // full navigation is the one redirect mechanism available outside React.
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("Your session expired. Redirecting to sign in…", 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body && typeof body.message === "string" && body.message) ||
      `Request failed with ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = { ...authHeader(), ...init?.headers };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(`Can't reach the backend at ${API_URL}. Is it running?`);
  }

  return handleResponse<T>(res, "Authorization" in headers);
}

// ---- Backend response shapes (private — components never see these) ----

type BackendCompany = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
};

type BackendJob = {
  id: string;
  title: string;
  location: string | null;
  remoteType: string | null;
  skills: string[];
  company: BackendCompany;
};

type BackendConnection = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  position: string | null;
  connectedAt: string | null;
};

type BackendJobNetwork = {
  companyName: string;
  connectionCount: number;
  connections: BackendConnection[];
};

type BackendJobMatch = {
  id: string;
  title: string;
  location: string | null;
  distance: number;
};

/** All keys the AI extractor may return; experience fields are scalars, not skill lists. */
export type ParsedSkills = {
  programming_languages?: string[];
  backend?: string[];
  frontend?: string[];
  databases?: string[];
  devops?: string[];
  cloud?: string[];
  ai_ml?: string[];
  experience_level?: string;
  years_of_experience?: number;
} | null;

export type Resume = {
  id: string;
  fileName: string;
  parsedSkills: ParsedSkills;
  createdAt: string;
};

const SKILL_CATEGORIES: { key: keyof NonNullable<ParsedSkills>; label: string }[] = [
  { key: "programming_languages", label: "Programming languages" },
  { key: "backend", label: "Backend" },
  { key: "frontend", label: "Frontend" },
  { key: "databases", label: "Databases" },
  { key: "devops", label: "DevOps" },
  { key: "cloud", label: "Cloud" },
  { key: "ai_ml", label: "AI / ML" },
];

/** distance is cosine distance (lower = better); the UI wants score (higher = better), 0-1. */
function scoreFromDistance(distance: number): number {
  return Math.max(0, Math.min(1, 1 - distance));
}

function toConnection(c: BackendConnection): Connection {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    position: c.position,
    connectedAt: c.connectedAt,
  };
}

/** The backend's categorized skills object, flattened for the overlap UI. */
export function flattenParsedSkills(parsedSkills: ParsedSkills): string[] {
  if (!parsedSkills) return [];
  return SKILL_CATEGORIES.flatMap(({ key }) => parsedSkills[key] as string[] | undefined ?? []);
}

/** Same object, kept in categories for the upload-result display. */
export function parsedSkillsToCategories(parsedSkills: ParsedSkills): ResumeParseResult {
  if (!parsedSkills) return { categories: [] };
  const categories: SkillCategory[] = SKILL_CATEGORIES.map(({ key, label }) => ({
    key,
    label,
    skills: parsedSkills[key] as string[] | undefined ?? [],
  })).filter((category) => category.skills.length > 0);
  return { categories };
}

// ---- Public API ----

export async function listResumes(): Promise<Resume[]> {
  return request<Resume[]>("/resumes");
}

/** Most recently uploaded resume for the dev user, or null if none exist yet. */
export async function getActiveResume(): Promise<Resume | null> {
  const resumes = await listResumes();
  return resumes[0] ?? null;
}

export async function uploadResume(file: File): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);
  const headers = authHeader();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/resumes/upload`, { method: "POST", headers, body: formData });
  } catch {
    throw new ApiError(`Can't reach the backend at ${API_URL}. Is it running?`);
  }

  return handleResponse<Resume>(res, "Authorization" in headers);
}

export async function listConnections(): Promise<Connection[]> {
  const connections = await request<BackendConnection[]>("/connections");
  return connections.map(toConnection);
}

export async function getMatchingJobs(
  resumeId: string
): Promise<{ id: string; title: string; location: string | null; score: number }[]> {
  const matches = await request<BackendJobMatch[]>(`/resumes/${resumeId}/matching-jobs`);
  return matches.map((m) => ({
    id: m.id,
    title: m.title,
    location: m.location,
    score: scoreFromDistance(m.distance),
  }));
}

type JobSummary = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remoteType: string | null;
  skills: string[];
};

async function getJob(jobId: string): Promise<JobSummary> {
  const job = await request<BackendJob>(`/jobs/${jobId}`);
  return {
    id: job.id,
    title: job.title,
    company: job.company.name,
    location: job.location,
    remoteType: job.remoteType,
    skills: job.skills,
  };
}

/**
 * GET /jobs/:id has no notion of score — that comes from a resume's
 * matching-jobs distance. Pass one in when the caller has it (e.g. from
 * getMatchingJobs); it defaults to 0 for a job with no computed match.
 */
export async function getJobDetail(jobId: string, score = 0): Promise<JobDetail> {
  const [job, network] = await Promise.all([getJob(jobId), getJobNetwork(jobId)]);
  return {
    ...job,
    score,
    connections: network.connections,
  };
}

export async function getJobNetwork(
  jobId: string
): Promise<{ companyName: string; connectionCount: number; connections: Connection[] }> {
  const network = await request<BackendJobNetwork>(`/jobs/${jobId}/network`);
  return {
    companyName: network.companyName,
    connectionCount: network.connectionCount,
    connections: network.connections.map(toConnection),
  };
}

export async function getReferralMessage(jobId: string, connectionId: string): Promise<string> {
  const { message } = await request<{ message: string }>(
    `/jobs/${jobId}/referral-message/${connectionId}`
  );
  return message;
}

/**
 * The mock embedded a connection inside each role; the backend splits job
 * and network across two endpoints. This assembles the same RoleMatch shape
 * the UI already expects, fetching both per job.
 */
// ---- Auth ----

export type AuthUser = { email: string };

export async function registerAccount(email: string, password: string): Promise<void> {
  await request<{ id: string; email: string }>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<string> {
  const { accessToken } = await request<{ accessToken: string }>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return accessToken;
}

/** GET /auth/me returns whatever the JWT strategy attaches — { userId, email }. */
export async function getMe(): Promise<AuthUser> {
  const me = await request<{ email: string }>("/auth/me");
  return { email: me.email };
}

export async function getRoleMatches(resumeId: string): Promise<RoleMatch[]> {
  const matches = await getMatchingJobs(resumeId);
  return Promise.all(
    matches.map(async (match) => {
      const [job, network] = await Promise.all([getJob(match.id), getJobNetwork(match.id)]);
      return {
        id: match.id,
        title: match.title,
        company: job.company,
        location: match.location,
        remoteType: job.remoteType,
        score: match.score,
        connections: network.connections,
      };
    })
  );
}
