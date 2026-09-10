import type { JobDetail, RoleMatch, SkillCategory } from "./types";

// Used only by the landing page's illustrative "product moments" — the real
// upload/matches/role screens get this from the live API (see lib/api.ts).
const MOCK_PARSED_SKILLS: SkillCategory[] = [
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

/** Stand-in for Resume.parsedSkills until a resume is actually uploaded. */
export const resumeSkills: string[] = MOCK_PARSED_SKILLS.flatMap((c) => c.skills);

/** Stand-in for the API until the backend is wired up. Same shape as the real thing. */
export const jobDetails: JobDetail[] = [
  {
    id: "1",
    title: "Senior Backend Engineer",
    company: "Northwind Robotics",
    location: "Berlin",
    remoteType: "Hybrid",
    score: 0.91,
    skills: ["Node.js", "PostgreSQL", "Redis", "BullMQ", "Kubernetes", "AWS"],
    connection: {
      id: "c1",
      firstName: "Elif",
      lastName: "Kaya",
      position: "Staff Engineer, Platform",
      connectedAt: "2024-03-11",
    },
  },
  {
    id: "2",
    title: "Backend Developer, Payments",
    company: "Lumen Analytics",
    location: "Lisbon",
    remoteType: "Remote",
    score: 0.87,
    skills: ["Node.js", "PostgreSQL", "TypeScript", "Kafka", "Docker"],
    connection: {
      id: "c2",
      firstName: "Mariana",
      lastName: "Costa",
      position: "Engineering Manager",
      connectedAt: "2023-06-02",
    },
  },
  {
    id: "3",
    title: "Node.js Engineer",
    company: "Kestrel Labs",
    location: "Toronto",
    remoteType: "On-site",
    score: 0.84,
    skills: ["Node.js", "TypeScript", "MongoDB", "GraphQL"],
    connection: null,
  },
  {
    id: "4",
    title: "Platform Engineer",
    company: "Anchor Systems",
    location: "Singapore",
    remoteType: "Remote",
    score: 0.79,
    skills: ["Go", "Python", "Kubernetes", "Terraform", "AWS"],
    connection: {
      id: "c3",
      firstName: "Wei Ling",
      lastName: "Tan",
      position: "Senior SRE",
      connectedAt: "2022-11-20",
    },
  },
  {
    id: "5",
    title: "Software Engineer, Data",
    company: "Solace Media",
    location: "Austin",
    remoteType: "Hybrid",
    score: 0.76,
    skills: ["Python", "SQL", "Airflow", "Spark"],
    connection: null,
  },
];

export const roles: RoleMatch[] = jobDetails.map(({ skills: _skills, ...role }) => role);
