// Deterministic, fabricated network data for the hero graph and the
// "people you know" moment. Nothing here is real — company names, people,
// and connections are invented so the story reads without implying any
// actual data source, customer, or result.

export type NodeKind = "me" | "bridge" | "destination" | "person";

export type GraphNode = {
  id: string;
  name: string;
  role: string;
  company: string;
  companyIndex: number;
  kind: NodeKind;
  // Seed position — three-forcegraph mutates x/y/z on these same objects
  // once the simulation settles, so we read the final values back off them.
  x: number;
  y: number;
  z: number;
  fx?: number;
  fy?: number;
  fz?: number;
};

export type GraphLink = { source: string; target: string; __introPath?: boolean };

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
  meId: string;
  bridgeId: string;
  destinationId: string;
  companies: string[];
  destinationCompanyIndex: number;
};

export const COMPANIES = [
  "Northwind Robotics",
  "Lumen Analytics",
  "Fieldstone Bank",
  "Halcyon Health",
  "Verge Studio",
  "Anchor Systems",
  "Cobalt Freight",
  "Solace Media",
  "Kestrel Labs",
  "Portside Retail",
];

const ROLE_TITLES = [
  "Software Engineer",
  "Staff Engineer",
  "Product Designer",
  "Engineering Manager",
  "Data Scientist",
  "Platform Engineer",
  "Backend Developer",
  "Site Reliability Engineer",
  "Product Manager",
  "Frontend Engineer",
  "Solutions Architect",
  "Research Scientist",
];

const FIRST_NAMES = [
  "Elif", "Mert", "Zeynep", "Priya", "Daniel", "Sofia", "Kwame", "Ana",
  "Liam", "Noor", "Yuki", "Diego", "Ingrid", "Tomas", "Fatima", "Sam",
  "Marta", "Chidi", "Elena", "Omar", "Freya", "Hana", "Lucas", "Nadia",
  "Viktor", "Aiko", "Ben", "Camila", "Rania", "Erik",
];

const LAST_NAMES = [
  "Kaya", "Doğan", "Arslan", "Nair", "Osei", "Ferreira", "Mensah", "Silva",
  "Byrne", "Haddad", "Tanaka", "Rivera", "Bergström", "Novak", "Ahmed",
  "Cole", "Ibarra", "Okafor", "Petrova", "Farouk", "Lindqvist", "Suzuki",
  "Moreau", "Sato", "Popov", "Reyes",
];

// Small deterministic PRNG so the "settled" layout is identical on every
// load and every server/client render — no hydration mismatch, no drift.
function mulberry32(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fibonacciSphere(index: number, total: number, radius: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / (total - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = golden * index;
  return {
    x: Math.cos(theta) * r * radius,
    y: y * radius,
    z: Math.sin(theta) * r * radius,
  };
}

const SEED = 1337;
const PEOPLE_PER_COMPANY = 11;

let cached: GraphData | null = null;

export function generateGraph(): GraphData {
  if (cached) return cached;
  const rng = mulberry32(SEED);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const clusterCenters: { x: number; y: number; z: number }[] = [];

  const CLUSTER_RADIUS = 320;
  const SPREAD = 46;

  COMPANIES.forEach((_, i) => {
    clusterCenters.push(fibonacciSphere(i, COMPANIES.length, CLUSTER_RADIUS));
  });

  const usedNames = new Set<string>();
  const nameFor = () => {
    let name = "";
    do {
      name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    } while (usedNames.has(name));
    usedNames.add(name);
    return name;
  };

  const companyNodeIds: string[][] = COMPANIES.map(() => []);

  COMPANIES.forEach((company, ci) => {
    const center = clusterCenters[ci];
    for (let p = 0; p < PEOPLE_PER_COMPANY; p++) {
      const id = `p-${ci}-${p}`;
      const isFirst = p === 0;
      const isDestinationSlot = ci === 0 && isFirst;
      const isBridgeSlot = ci === 0 && p === 1;
      nodes.push({
        id,
        name: isDestinationSlot ? "Elif Kaya" : isBridgeSlot ? "Mert Doğan" : nameFor(),
        role: isDestinationSlot
          ? "Staff Engineer, Platform"
          : isBridgeSlot
            ? "Engineering Manager"
            : pick(ROLE_TITLES),
        company,
        companyIndex: ci,
        kind: isDestinationSlot ? "destination" : isBridgeSlot ? "bridge" : "person",
        x: center.x + (rng() - 0.5) * SPREAD * 2,
        y: center.y + (rng() - 0.5) * SPREAD * 2,
        z: center.z + (rng() - 0.5) * SPREAD * 2,
      });
      companyNodeIds[ci].push(id);
    }
  });

  // Intra-company edges — each person knows a couple of colleagues.
  companyNodeIds.forEach((ids) => {
    ids.forEach((id, i) => {
      const connections = 2 + Math.floor(rng() * 2);
      for (let c = 0; c < connections; c++) {
        const otherIndex = (i + 1 + Math.floor(rng() * (ids.length - 1))) % ids.length;
        const other = ids[otherIndex];
        if (other !== id) links.push({ source: id, target: other });
      }
    });
  });

  // A handful of cross-company edges for a small-world feel.
  for (let i = 0; i < 22; i++) {
    const a = pick(nodes);
    const b = pick(nodes);
    if (a.id !== b.id) links.push({ source: a.id, target: b.id });
  }

  // "Me" — placed a little outside the whole shape, looking in.
  const meId = "me";
  nodes.push({
    id: meId,
    name: "You",
    role: "",
    company: "",
    companyIndex: -1,
    kind: "me",
    x: 0,
    y: 0,
    z: CLUSTER_RADIUS * 2.1,
  });

  const bridgeId = "p-0-1";
  const destinationId = "p-0-0";

  // First-degree connections: you, spread across companies, always
  // including the bridge so the two-hop path to the destination is real.
  const firstDegreeTargets = new Set<string>([bridgeId]);
  while (firstDegreeTargets.size < 15) {
    firstDegreeTargets.add(pick(nodes).id);
  }
  firstDegreeTargets.forEach((id) => {
    if (id !== meId) links.push({ source: meId, target: id, __introPath: id === bridgeId });
  });

  // Guarantee the bridge -> destination edge that completes the path.
  links.push({ source: bridgeId, target: destinationId, __introPath: true });

  cached = {
    nodes,
    links,
    meId,
    bridgeId,
    destinationId,
    companies: COMPANIES,
    destinationCompanyIndex: 0,
  };
  return cached;
}

/** The induced subgraph for one company, plus "you" and the edge(s) tying you to it. */
export function subgraphForCompany(data: GraphData, companyIndex: number): GraphData {
  const companyIds = new Set(
    data.nodes.filter((n) => n.companyIndex === companyIndex).map((n) => n.id)
  );
  const nodes = data.nodes.filter((n) => companyIds.has(n.id) || n.id === data.meId);
  const nodeIds = new Set(nodes.map((n) => n.id));
  const links = data.links.filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target));
  return {
    ...data,
    nodes,
    links,
  };
}
