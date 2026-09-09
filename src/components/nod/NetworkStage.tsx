"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { generateGraph, type GraphLink, type GraphNode } from "@/lib/nod/graph";
import { buildCameraPath, sampleCameraPath } from "@/lib/nod/camera";
import { mapRange } from "@/lib/nod/utils";
import { useReducedMotion } from "@/lib/nod/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TEASER_WORDS =
  "Hi Elif — I saw the Staff Engineer opening at Northwind Robotics and thought of you.".split(
    " "
  );

function HeroOverlayContent({ fadeRef }: { fadeRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={fadeRef}
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
    >
      <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">
        A network you already have
      </p>
      <h1 className="max-w-[16ch] font-display text-[clamp(38px,8.6vw,92px)] font-semibold leading-[0.98] tracking-[-0.025em] text-white [font-variation-settings:'wdth'_82,'opsz'_72]">
        Your next role knows you already.
      </h1>
      <p className="mt-6 max-w-[42ch] text-[15px] leading-relaxed text-white/65 sm:text-[17px]">
        NOD reads your CV, ranks the roles that fit, and finds the person inside
        the company who can put your name forward — then drafts what to say to
        them.
      </p>
      <Link
        href="/upload"
        className="pointer-events-auto mt-9 rounded-full border border-signal bg-signal px-7 py-3 text-[14px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-white"
      >
        Upload your CV
      </Link>
      <div className="mt-14 flex flex-col items-center gap-2 text-white/45">
        <span className="text-[11px] uppercase tracking-[0.2em]">Scroll to follow the network</span>
        <span aria-hidden className="h-8 w-px animate-pulse bg-white/30" />
      </div>
    </div>
  );
}

export function NetworkStage() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const heroFadeRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<HTMLSpanElement[]>([]);
  const revealedRef = useRef(false);

  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const section = sectionRef.current;
    const host = canvasHostRef.current;
    const stage = stageRef.current;
    if (!section || !host || !stage) return;

    let cancelled = false;
    let disposeFn = () => {};

    // three-forcegraph touches `window` at module scope, so it can only be
    // imported once we're definitely on the client.
    import("three-forcegraph").then(({ default: ThreeForceGraph }) => {
      if (cancelled) return;

    const data = generateGraph();
    const keyframes = buildCameraPath(data);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0b0c);
    scene.fog = new THREE.FogExp2(0x0a0b0c, 0.0028);

    const camera = new THREE.PerspectiveCamera(52, 1, 1, 4000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    const rim = new THREE.PointLight(0xffffff, 1.9, 1600, 2);
    const signalLight = new THREE.PointLight(0x2fae8f, 0, 500, 2);
    scene.add(ambient, rim, signalLight);

    const geoSmall = new THREE.IcosahedronGeometry(3.1, 1);
    const geoMid = new THREE.IcosahedronGeometry(4.6, 1);
    const geoBig = new THREE.IcosahedronGeometry(6.6, 2);

    const nodeMats = new Map<string, THREE.MeshStandardMaterial>();
    const linkMats: { link: GraphLink; mat: THREE.LineBasicMaterial }[] = [];

    const graph = new ThreeForceGraph()
      .graphData({ nodes: data.nodes as unknown as object[], links: data.links as unknown as object[] })
      .nodeId("id")
      .numDimensions(3)
      .warmupTicks(0)
      .cooldownTicks(0)
      .nodeThreeObject((n: object) => {
        const node = n as GraphNode;
        const geo = node.kind === "destination" ? geoBig : node.kind === "bridge" || node.kind === "me" ? geoMid : geoSmall;
        const baseColor = node.kind === "destination" ? 0xe4e4dc : node.kind === "bridge" || node.kind === "me" ? 0xc7c7bd : 0x9a9a90;
        const mat = new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.5,
          metalness: 0.1,
          emissive: 0x000000,
        });
        nodeMats.set(node.id, mat);
        return new THREE.Mesh(geo, mat);
      })
      .linkMaterial((l: object) => {
        const link = l as GraphLink;
        const mat = new THREE.LineBasicMaterial({
          color: 0x55564d,
          transparent: true,
          opacity: link.__introPath ? 0.55 : 0.22,
        });
        linkMats.push({ link, mat });
        return mat;
      })
      .linkWidth(0.5);

    // Fix node positions immediately so nothing drifts or "arrives" — the
    // network must already be settled on the very first frame.
    data.nodes.forEach((n) => {
      n.fx = n.x;
      n.fy = n.y;
      n.fz = n.z;
    });

    graph.tickFrame();
    scene.add(graph);

    const introPathNodeIds = new Set([data.meId, data.bridgeId, data.destinationId]);
    const destinationNode = data.nodes.find((n) => n.id === data.destinationId)!;

    const outPos = new THREE.Vector3();
    const outLook = new THREE.Vector3();
    const initialFov = sampleCameraPath(keyframes, 0, outPos, outLook);
    camera.position.copy(outPos);
    camera.fov = initialFov;
    camera.lookAt(outLook);

    let dirty = true;
    let active = true;
    let rafId = 0;

    function resize() {
      const w = section!.clientWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      dirty = true;
    }
    resize();
    window.addEventListener("resize", resize);

    const pathIdleColor = new THREE.Color(0xc7c7bd);
    const pathLitColor = new THREE.Color(0x2fae8f);
    const backgroundGray = new THREE.Color(0x9a9a90);
    const backgroundDim = new THREE.Color(0x1c1d1a);
    const linkIdleColor = new THREE.Color(0x55564d);
    const linkLitColor = new THREE.Color(0x59c9a6);
    const scratchColor = new THREE.Color();

    function applyHighlight(progress: number) {
      const amount = mapRange(progress, 0.4, 0.66);
      const focusDim = mapRange(progress, 0.34, 0.58);
      nodeMats.forEach((mat, id) => {
        if (introPathNodeIds.has(id)) {
          const isDestination = id === data.destinationId;
          mat.color.copy(pathIdleColor).lerp(pathLitColor, amount);
          const glow = amount * (isDestination ? 1.4 : 0.8);
          mat.emissive.copy(pathLitColor).multiplyScalar(glow * 0.5);
        } else {
          scratchColor.copy(backgroundGray).lerp(backgroundDim, focusDim * 0.82);
          mat.color.copy(scratchColor);
        }
      });
      linkMats.forEach(({ link, mat }) => {
        if (link.__introPath) {
          mat.opacity = 0.55 + amount * 0.4;
          mat.color.copy(linkIdleColor).lerp(linkLitColor, amount);
        } else {
          mat.opacity = 0.22 * (1 - focusDim * 0.85);
        }
      });
      signalLight.position.set(destinationNode.x, destinationNode.y, destinationNode.z);
      signalLight.intensity = amount * 2.2;
    }

    function render() {
      // three-forcegraph's engine init is deferred a frame, so the first
      // tickFrame() call right after graphData() can be a no-op. Calling it
      // here guarantees the (static — cooldownTicks is 0) node positions
      // eventually sync to the meshes, however many frames that takes.
      graph.tickFrame();
      renderer.render(scene, camera);
    }

    // The graph's internal engine starts a frame or two after graphData()
    // is set, so force a handful of renders at startup — otherwise the very
    // first paint can catch node meshes still at their unpositioned default.
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
    render();
    setWebglReady(true);

    gsap.set(wordRefs.current, { y: 6 });

    const mm = gsap.matchMedia();
    let trigger: ScrollTrigger | undefined;

    mm.add("all", () => {
      trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        // Must match exactly where CSS `position: sticky` naturally
        // releases the stage (section height minus the sticky element's
        // own height) — "bottom top" overshoots that by a full viewport,
        // so the last stretch of the scrub would run after the stage had
        // already started scrolling away.
        end: () => `+=${section.offsetHeight - stage.clientHeight}`,
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const fov = sampleCameraPath(keyframes, progress, outPos, outLook);
          camera.position.copy(outPos);
          camera.fov = fov;
          camera.updateProjectionMatrix();
          camera.lookAt(outLook);
          rim.position.copy(camera.position);
          applyHighlight(progress);
          dirty = true;

          if (heroFadeRef.current) {
            const fade = 1 - mapRange(progress, 0.06, 0.24);
            heroFadeRef.current.style.opacity = String(fade);
            heroFadeRef.current.style.transform = `translateY(${(1 - fade) * -28}px)`;
          }
          if (cardRef.current) {
            const reveal = mapRange(progress, 0.66, 0.85);
            cardRef.current.style.opacity = String(reveal);
            cardRef.current.style.transform = `translateY(${(1 - reveal) * 22}px)`;
          }
          if (progress >= 0.93 && !revealedRef.current) {
            revealedRef.current = true;
            gsap.to(wordRefs.current, { opacity: 1, y: 0, stagger: 0.045, duration: 0.4, ease: "power2.out" });
          } else if (progress < 0.9 && revealedRef.current) {
            revealedRef.current = false;
            gsap.set(wordRefs.current, { opacity: 0, y: 6 });
          }
        },
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
    });

      disposeFn = () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(rafId);
        trigger?.kill();
        mm.kill();
        renderer.dispose();
        host.removeChild(renderer.domElement);
        nodeMats.forEach((m) => m.dispose());
        linkMats.forEach(({ mat }) => mat.dispose());
        geoSmall.dispose();
        geoMid.dispose();
        geoBig.dispose();
      };
    });

    return () => {
      cancelled = true;
      disposeFn();
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return <StaticHero />;
  }

  return (
    <section ref={sectionRef} className="relative h-[420vh] sm:h-[480vh] lg:h-[560vh]">
      <div
        ref={stageRef}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#0a0b0c]"
      >
        <div
          ref={canvasHostRef}
          aria-hidden
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: webglReady ? 1 : 0 }}
        />
        {!webglReady && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.06),transparent_60%)]" />
        )}

        <HeroOverlayContent fadeRef={heroFadeRef} />

        <div
          ref={cardRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-5 pb-[8vh] opacity-0 sm:justify-end sm:pr-[6vw]"
        >
          <div className="pointer-events-auto w-full max-w-[380px] rounded-[4px] border border-edge bg-surface px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
              Two people away
            </p>
            <p className="font-display text-[19px] font-semibold tracking-[-0.02em] [font-variation-settings:'wdth'_88]">
              Elif Kaya
            </p>
            <p className="mb-3.5 text-[13px] text-muted">
              Staff Engineer, Platform · Northwind Robotics
            </p>
            <p className="text-[13.5px] leading-relaxed text-ink">
              {TEASER_WORDS.map((word, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    if (el) wordRefs.current[i] = el;
                  }}
                  className="mr-[0.3em] inline-block opacity-0"
                >
                  {word}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StaticHero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0b0c] px-6 text-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(47,174,143,0.08),transparent_55%)]"
      />
      <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">
        A network you already have
      </p>
      <h1 className="max-w-[16ch] font-display text-[clamp(34px,8vw,76px)] font-semibold leading-[1] tracking-[-0.025em] text-white [font-variation-settings:'wdth'_82,'opsz'_72]">
        Your next role knows you already.
      </h1>
      <p className="mt-6 max-w-[42ch] text-[16px] leading-relaxed text-white/65">
        NOD reads your CV, ranks the roles that fit, and finds the person inside
        the company who can put your name forward — then drafts what to say to
        them.
      </p>
      <Link
        href="/upload"
        className="mt-9 rounded-full border border-signal bg-signal px-7 py-3 text-[14px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-white"
      >
        Upload your CV
      </Link>

      <div className="mx-auto mt-16 w-full max-w-[380px] rounded-[4px] border border-edge bg-surface px-6 py-5 text-left shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
          Two people away
        </p>
        <p className="font-display text-[19px] font-semibold tracking-[-0.02em] [font-variation-settings:'wdth'_88]">
          Elif Kaya
        </p>
        <p className="mb-3.5 text-[13px] text-muted">
          Staff Engineer, Platform · Northwind Robotics
        </p>
        <p className="text-[13.5px] leading-relaxed text-ink">{TEASER_WORDS.join(" ")}</p>
      </div>
    </section>
  );
}
