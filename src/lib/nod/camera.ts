import * as THREE from "three";
import type { GraphData, GraphNode } from "./graph";

export type CameraKeyframe = {
  t: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
};

function vec(n: GraphNode) {
  return new THREE.Vector3(n.x, n.y, n.z);
}

function bboxOf(nodes: GraphNode[]) {
  const box = new THREE.Box3();
  nodes.forEach((n) => box.expandByPoint(vec(n)));
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) / 2;
  return { center, radius };
}

/**
 * Builds the camera path through the network: whole-graph overview → the
 * connection's cluster → along the introducing edge → close on them.
 * Read from the *settled* node positions, so it's exact regardless of the
 * force parameters used to get there.
 */
export function buildCameraPath(data: GraphData): CameraKeyframe[] {
  const me = data.nodes.find((n) => n.id === data.meId)!;
  const bridge = data.nodes.find((n) => n.id === data.bridgeId)!;
  const destination = data.nodes.find((n) => n.id === data.destinationId)!;
  // "me" sits far outside the graph on purpose (a vantage point, not part of
  // the visual mass), so it's excluded here or the overview framing skews
  // toward it instead of the actual cluster of companies.
  const { center, radius } = bboxOf(data.nodes.filter((n) => n.kind !== "me"));

  const meV = vec(me);
  const bridgeV = vec(bridge);
  const destV = vec(destination);

  const overviewPos = center
    .clone()
    .add(new THREE.Vector3(meV.x, meV.y, meV.z).normalize().multiplyScalar(radius * 2.5))
    .add(new THREE.Vector3(0, radius * 0.18, 0));

  const clusterDir = bridgeV.clone().sub(center).normalize();
  const clusterPos = bridgeV.clone().add(clusterDir.clone().multiplyScalar(150)).add(
    new THREE.Vector3(0, 40, 0)
  );

  const edgeMid = bridgeV.clone().lerp(destV, 0.55);
  const edgeDir = destV.clone().sub(bridgeV).normalize();
  const edgePos = edgeMid.clone().add(edgeDir.clone().multiplyScalar(-40)).add(
    clusterDir.clone().multiplyScalar(70)
  );

  const closeDir = destV.clone().sub(bridgeV).normalize().add(clusterDir).normalize();
  const closePos = destV.clone().add(closeDir.clone().multiplyScalar(58)).add(new THREE.Vector3(0, 8, 0));

  const finalPos = destV.clone().add(closeDir.clone().multiplyScalar(38)).add(new THREE.Vector3(0, 4, 0));

  return [
    { t: 0.0, pos: overviewPos, look: center, fov: 52 },
    { t: 0.16, pos: overviewPos, look: center, fov: 52 },
    { t: 0.42, pos: clusterPos, look: bridgeV, fov: 48 },
    { t: 0.62, pos: edgePos, look: destV.clone().lerp(bridgeV, 0.2), fov: 42 },
    { t: 0.8, pos: closePos, look: destV, fov: 34 },
    { t: 1.0, pos: finalPos, look: destV, fov: 30 },
  ];
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

/** Mutates `outPos`/`outLook` in place and returns the fov — called every scroll tick. */
export function sampleCameraPath(
  keyframes: CameraKeyframe[],
  progress: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3
): number {
  const p = Math.min(1, Math.max(0, progress));
  let i = 0;
  while (i < keyframes.length - 2 && keyframes[i + 1].t <= p) i++;
  const a = keyframes[i];
  const b = keyframes[i + 1];
  const span = b.t - a.t || 1;
  const local = smoothstep(Math.min(1, Math.max(0, (p - a.t) / span)));

  outPos.copy(tmpPos.copy(a.pos).lerp(b.pos, local));
  outLook.copy(tmpLook.copy(a.look).lerp(b.look, local));
  return a.fov + (b.fov - a.fov) * local;
}
