import type { JobDetail, RoleMatch } from "./types";
import { MOCK_PARSED_SKILLS } from "./resumeProcessing";

/** Stand-in for Resume.parsedSkills until a resume is actually uploaded. */
export const resumeSkills: string[] = MOCK_PARSED_SKILLS.flatMap((c) => c.skills);

/** Stand-in for the API until the backend is wired up. Same shape as the real thing. */
export const jobDetails: JobDetail[] = [
  {
    id: "1",
    title: "Senior Backend Engineer",
    company: "Getir",
    location: "Istanbul",
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
    company: "Papara",
    location: "Istanbul",
    remoteType: "Remote",
    score: 0.87,
    skills: ["Node.js", "PostgreSQL", "TypeScript", "Kafka", "Docker"],
    connection: {
      id: "c2",
      firstName: "Mert",
      lastName: "Doğan",
      position: "Engineering Manager",
      connectedAt: "2023-06-02",
    },
  },
  {
    id: "3",
    title: "Node.js Engineer",
    company: "Trendyol",
    location: "Istanbul",
    remoteType: "On-site",
    score: 0.84,
    skills: ["Node.js", "TypeScript", "MongoDB", "GraphQL"],
    connection: null,
  },
  {
    id: "4",
    title: "Platform Engineer",
    company: "Insider",
    location: "Izmir",
    remoteType: "Remote",
    score: 0.79,
    skills: ["Go", "Python", "Kubernetes", "Terraform", "AWS"],
    connection: {
      id: "c3",
      firstName: "Zeynep",
      lastName: "Arslan",
      position: "Senior SRE",
      connectedAt: "2022-11-20",
    },
  },
  {
    id: "5",
    title: "Software Engineer, Data",
    company: "Peak Games",
    location: "Istanbul",
    remoteType: "Hybrid",
    score: 0.76,
    skills: ["Python", "SQL", "Airflow", "Spark"],
    connection: null,
  },
];

export const roles: RoleMatch[] = jobDetails.map(({ skills: _skills, ...role }) => role);
