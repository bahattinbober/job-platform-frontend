"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { generateGraph, type GraphLink, type GraphNode } from "@/lib/nod/graph";
import { mapRange } from "@/lib/nod/utils";
import { useReducedMotion } from "@/lib/nod/useReducedMotion";
import { Reveal } from "@/components/nod/Reveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function PeopleMoment() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const section = sectionRef.current;
    const host = hostRef.current;
    if (!section || !host) return;

    let cancelled = false;
    let disposeFn = () => {};

    import("three-forcegraph").then(({ default: ThreeForceGraph }) => {
      if (cancelled) return;

    const data = generateGraph();
    const nodes = data.nodes.filter((n) => n.companyIndex === 0);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = data.links.filter((l) => nodeIds.has(String(l.source)) && nodeIds.has(String(l.target)));

    const destination = nodes.find((n) => n.id === data.destinationId)!;

    const box = new THREE.Box3();
    nodes.forEach((n) => box.expandByPoint(new THREE.Vector3(n.x, n.y, n.z)));
    const centroid = box.getCenter(new THREE.Vector3());
    const spread = box.getSize(new THREE.Vector3()).length() / 2;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f6f2);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.5, 3000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.PointLight(0xffffff, 1.1, 1200, 2);
    key.position.set(centroid.x, centroid.y + 100, centroid.z + 200);
    scene.add(key);
    const signalLight = new THREE.PointLight(0x1f5c4c, 0, 400, 2);
    signalLight.position.set(destination.x, destination.y, destination.z);
    scene.add(signalLight);

    const geo = new THREE.IcosahedronGeometry(4, 1);
    const geoBig = new THREE.IcosahedronGeometry(5.6, 2);
    const nodeMats = new Map<string, THREE.MeshStandardMaterial>();
    const linkMats: { link: GraphLink; mat: THREE.LineBasicMaterial }[] = [];

    const graph = new ThreeForceGraph()
      .graphData({ nodes: nodes as unknown as object[], links: links as unknown as object[] })
      .nodeId("id")
      .warmupTicks(0)
      .cooldownTicks(0)
      .nodeThreeObject((n: object) => {
        const node = n as GraphNode;
        const isPath = node.kind === "bridge" || node.kind === "destination";
        const mat = new THREE.MeshStandardMaterial({
          color: isPath ? 0x9a9a90 : 0xc2c3ba,
          roughness: 0.6,
          metalness: 0,
        });
        nodeMats.set(node.id, mat);
        return new THREE.Mesh(node.kind === "destination" ? geoBig : geo, mat);
      })
      .linkMaterial((l: object) => {
        const link = l as GraphLink;
        const mat = new THREE.LineBasicMaterial({
          color: 0xd3d5cd,
          transparent: true,
          opacity: link.__introPath ? 0.7 : 0.5,
        });
        linkMats.push({ link, mat });
        return mat;
      });

    nodes.forEach((n) => {
      n.fx = n.x;
      n.fy = n.y;
      n.fz = n.z;
    });
    graph.tickFrame();
    scene.add(graph);

    let dirty = true;
    let active = true;
    let rafId = 0;

    function resize() {
      const w = section!.clientWidth;
      const h = window.innerHeight * 0.86;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      dirty = true;
    }
    resize();
    window.addEventListener("resize", resize);

    const bridgeColor = new THREE.Color(0x9a9a90);
    const destColor = new THREE.Color(0x9a9a90);
    const litColor = new THREE.Color(0x1f5c4c);
    const linkIdle = new THREE.Color(0xd3d5cd);

    function update(progress: number) {
      const angle = (-0.55 + progress * 1.1) * Math.PI * 0.32;
      const distance = spread * (2.5 - progress * 1.15);
      camera.position.set(
        centroid.x + Math.sin(angle) * distance,
        centroid.y + spread * 0.28 - progress * spread * 0.15,
        centroid.z + Math.cos(angle) * distance
      );
      const lookTarget = centroid.clone().lerp(new THREE.Vector3(destination.x, destination.y, destination.z), mapRange(progress, 0.55, 1) * 0.85);
      camera.lookAt(lookTarget);

      const amount = mapRange(progress, 0.45, 0.85);
      nodeMats.forEach((mat, id) => {
        if (id === data.bridgeId) mat.color.copy(bridgeColor).lerp(litColor, amount * 0.8);
        else if (id === data.destinationId) {
          mat.color.copy(destColor).lerp(litColor, amount);
          mat.emissive.copy(litColor).multiplyScalar(amount * 0.4);
        }
      });
      linkMats.forEach(({ link, mat }) => {
        if (link.__introPath) mat.color.copy(linkIdle).lerp(litColor, amount);
      });
      signalLight.intensity = amount * 1.8;

      if (labelRef.current) {
        const reveal = mapRange(progress, 0.6, 0.92);
        labelRef.current.style.opacity = String(reveal);
        labelRef.current.style.transform = `translateY(${(1 - reveal) * 14}px)`;
      }
      dirty = true;
    }

    update(0);

    function render() {
      graph.tickFrame();
      renderer.render(scene, camera);
    }
    let settleFrames = 12;
    function loop() {
      if (dirty || settleFrames > 0) {
        render();
        dirty = false;
        if (settleFrames > 0) settleFrames--;
      }
      if (active) rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
    setReady(true);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      // Match the sticky inner stage's real release point (see NetworkStage
      // for why "bottom top" overshoots it) — the stage here is 86vh, not a
      // full viewport.
      end: () => `+=${section.offsetHeight - window.innerHeight * 0.86}`,
      scrub: true,
      onUpdate: (self) => update(self.progress),
      onEnter: () => {
        active = true;
        rafId = requestAnimationFrame(loop);
      },
      onEnterBack: () => {
        active = true;
        rafId = requestAnimationFrame(loop);
      },
      onLeave: () => {
        active = false;
      },
      onLeaveBack: () => {
        active = false;
      },
    });

      disposeFn = () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(rafId);
        trigger.kill();
        renderer.dispose();
        host.removeChild(renderer.domElement);
        nodeMats.forEach((m) => m.dispose());
        linkMats.forEach(({ mat }) => mat.dispose());
        geo.dispose();
        geoBig.dispose();
      };
    });

    return () => {
      cancelled = true;
      disposeFn();
    };
  }, [reducedMotion]);

  return (
    <section id="network-moment" ref={sectionRef} className={reducedMotion ? "" : "relative h-[240vh]"}>
      <div className={reducedMotion ? "" : "sticky top-0 h-[86vh] w-full overflow-hidden"}>
        <div className="mx-auto flex h-full w-full max-w-[1180px] flex-col px-5 pt-28 sm:px-8 sm:pt-32">
          <Reveal className="pointer-events-none relative z-10">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              05 · People you know
            </p>
            <h2 className="max-w-[24ch] font-display text-[clamp(28px,4.6vw,44px)] font-semibold leading-[1.06] tracking-[-0.025em] [font-variation-settings:'wdth'_84,'opsz'_50]">
              Inside Northwind Robotics, you&apos;re not a stranger.
            </h2>
          </Reveal>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 top-[28%] transition-opacity duration-500"
            style={{ opacity: reducedMotion ? 0 : ready ? 1 : 0 }}
          >
            <div ref={hostRef} className="h-full w-full" />
          </div>

          {!reducedMotion && (
            <div
              ref={labelRef}
              className="relative z-10 mt-auto w-fit max-w-[320px] rounded-[4px] border border-edge bg-surface px-5 py-4 opacity-0 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:mb-8"
            >
              <p className="text-[13.5px] leading-snug">
                <span className="font-semibold">Mert Doğan</span> connects you to{" "}
                <span className="font-semibold text-signal">Elif Kaya</span> on the
                platform team.
              </p>
            </div>
          )}

          {reducedMotion && (
            <p className="mt-8 max-w-[46ch] text-[15px] leading-relaxed text-muted">
              Eleven people work on the platform team at Northwind Robotics.
              Mert Doğan, a connection of yours, works alongside Elif Kaya —
              the person NOD found for this role.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
