/**
 * VISCOM Interview Prep — Concept Art Canvas  (STARTER)
 *
 * ── Already built — read and understand these ────────────────────────────────
 *  • Scene setup: renderer, camera, lights, fog, particles
 *  • Render loop decoupled from React (refs pattern — CORE interview topic)
 *  • Orbit camera: drag to rotate
 *  • Scroll to zoom
 *  • Raycasting: hover highlight + click to select
 *  • Streaming AI panel
 *  • FPS counter
 *
 * ── Your 6 TODOs ─────────────────────────────────────────────────────────────
 *  DONE A — Load a JPG texture onto each card
 *  DONE B — Add a timeline scrubber that moves the cards
 *  TODO C — Make cards snap to a grid when placed
 *  TODO D — Add a bloom / glow post-processing effect
 *  TODO E — Fix the race condition in the AI streaming call
 *  TODO F — Measure and display GPU render time per frame
 *
 * ── Setup ────────────────────────────────────────────────────────────────────
 *  npm install three @types/three
 *  Add REACT_APP_ANTHROPIC_KEY to .env (optional — mock runs without it)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConceptCard {
  id: string;
  label: string;
  color: string;
  accent: string;
  position: [number, number, number];
}

interface CardEntry {
  mesh: THREE.Mesh;
  group: THREE.Group;
  light: THREE.PointLight;
  mat: THREE.MeshStandardMaterial;
  baseY: number;
}

type AiStatus = "idle" | "streaming" | "done" | "error";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CONCEPT_CARDS: ConceptCard[] = [
  { id: "sky",        label: "Sky / Atmosphere",   color: "#4a9eff", accent: "#a8d4ff", position: [-3.2,  1.4,  0.5] },
  { id: "terrain",   label: "Terrain Block",        color: "#9c8b7a", accent: "#d4c4b0", position: [ 0,    0,    0  ] },
  { id: "character", label: "Hero Character",        color: "#e87c3e", accent: "#ffc4a0", position: [ 3.2,  1.2, -0.3] },
  { id: "props",     label: "Environment Props",     color: "#5ec46e", accent: "#b0f0b8", position: [-1.6, -1.6,  1  ] },
  { id: "lighting",  label: "Key Light Setup",       color: "#f5e642", accent: "#fff4a0", position: [ 1.6, -1.4, -1  ] },
];

// ─── TODO C ───────────────────────────────────────────────────────────────────
// Implement snapToGrid. It should round `value` to the nearest multiple of `gridSize`.
function snapToGrid(value: number, gridSize: number): number {
  return value; // placeholder — replace this
}

// ─── Streaming AI call ────────────────────────────────────────────────────────

async function streamRenderPrompt(
  cardLabel: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): Promise<void> {
  const apiKey = process.env.REACT_APP_ANTHROPIC_KEY;

  if (!apiKey) {
    const mock = `Render "${cardLabel}" with cinematic volumetric lighting. Use desaturated base tones with selective color accents to guide the eye. Apply atmospheric haze at 15% opacity for depth. Depth-of-field at f/2.8 isolates the primary subject. Consider rim lighting to separate subject from background.`;
    for (const word of mock.split(" ")) {
      await new Promise<void>(r => setTimeout(r, 55));
      onChunk(word + " ");
    }
    onDone();
    return;
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "messages-2023-12-15",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 120,
        stream: true,
        messages: [{
          role: "user",
          content: `You are a concept art director. Write a precise 2-3 sentence render prompt for the layer: "${cardLabel}". Focus on lighting, mood, camera, and render settings. Be specific and cinematic.`,
        }],
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) {
        const raw = line.slice(6);
        if (raw === "[DONE]") continue;
        try {
          const text = (JSON.parse(raw) as { delta?: { text?: string } })?.delta?.text;
          if (text) onChunk(text);
        } catch { /* ignore parse errors on SSE chunks */ }
      }
    }
    onDone();
  } catch (err) {
    onError((err as Error).message);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConceptCanvas() {
  // All Three.js objects live in refs — never useState.
  // Putting a mesh in useState would trigger a re-render on every frame.
  const mountRef    = useRef<HTMLDivElement>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshMapRef  = useRef<Map<string, CardEntry>>(new Map());
  const raycaster   = useRef(new THREE.Raycaster());
  const mouse       = useRef(new THREE.Vector2());
  const frameRef    = useRef<number | null>(null);
  const currentFrameRef = useRef(0);
  const drag        = useRef({ active: false, lastX: 0, lastY: 0 });
  const orbit       = useRef({ theta: 0, phi: 0, radius: 7 });

  // TODO D — add a ref for your composer here

  // TODO E — add a ref to hold an AbortController here so you can cancel in-flight AI requests

  // React state only for UI — labels, panel text, fps readout
  const [hoveredId,    setHoveredId]    = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<ConceptCard | null>(null);
  const [fps,          setFps]          = useState(0);
  const [renderMs,     setRenderMs]     = useState(0); // TODO F — render time in ms
  const [aiText,       setAiText]       = useState("");
  const [aiStatus,     setAiStatus]     = useState<AiStatus>("idle");

  // TODO B — add state for currentFrame here
  const [currentFrame, setCurrentFrame] = useState(0);

  // ── Scene init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current!;
    const W = el.clientWidth, H = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#080810");
    scene.fog = new THREE.FogExp2("#080810", 0.042);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.set(0, 0, 7);
    cameraRef.current = camera;

    // powerPreference: "high-performance" requests the discrete GPU on dual-GPU machines.
    // pixelRatio capped at 2 — beyond that you're rendering wasted pixels with no visible gain.
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // TODO D — set up EffectComposer with a bloom pass here

    // Lighting
    scene.add(new THREE.AmbientLight("#1a1a3a", 2.5));
    const key = new THREE.DirectionalLight("#ffffff", 3);
    key.position.set(4, 6, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight("#3355ff", 0.7);
    fill.position.set(-4, -2, 2);
    scene.add(fill);

    // Grid floor
    const grid = new THREE.GridHelper(24, 24, "#0a0a1a", "#0f0f22");
    grid.position.y = -3;
    scene.add(grid);

    // Particle atmosphere
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(600 * 3).map(() => (Math.random() - 0.5) * 20);
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({ color: "#223366", size: 0.035, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(pGeo, pMat));

    // Concept card meshes
    CONCEPT_CARDS.forEach(card => {
      const group = new THREE.Group();

      // TODO C — use snapToGrid on card.position before calling group.position.set
      group.position.set(...card.position);

      group.rotation.y = (Math.random() - 0.5) * 0.4;
      group.rotation.x = (Math.random() - 0.5) * 0.08;

      const mat = new THREE.MeshStandardMaterial({
        color: card.color, emissive: card.color,
        emissiveIntensity: 0.2, roughness: 0.6, metalness: 0.2,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), mat);
      mesh.userData.cardId = card.id;
      group.add(mesh);

      // DONE A — load a texture and apply it to mat here
      const loader = new THREE.TextureLoader();
      loader.load('/textures/metal.jpg', (texture) => {
        mat.map = texture;
        mat.needsUpdate = true;
      });
      
      // Bezel outline
      const bezel = new THREE.Mesh(
        new THREE.PlaneGeometry(1.76, 1.11),
        new THREE.MeshBasicMaterial({ color: card.accent, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
      );
      bezel.position.z = -0.002;
      group.add(bezel);

      // Per-card glow light
      const light = new THREE.PointLight(card.color, 0.5, 3.5);
      light.position.set(0, 0, 0.6);
      group.add(light);

      scene.add(group);
      let baseY = card.position[1];
      meshMapRef.current.set(card.id, { mesh, group, light, mat, baseY, });
    });

    // Render loop — completely decoupled from React's render cycle.
    // An async AI call resolving has zero effect on this loop's timing.
    let lastT = performance.now(), frames = 0, fpsAcc = 0;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastT) / 1000;
      lastT = now;
      frames++; fpsAcc += delta;
      if (fpsAcc >= 1) {
        setFps(Math.round(frames / fpsAcc)); // only React call in the loop — once/sec
        frames = 0; fpsAcc = 0;
      }

      const t = now * 0.001;
      meshMapRef.current.forEach(({ group, baseY }) => {
        group.position.y = (currentFrameRef.current / 100 * 3) + baseY;
        //group.position.y += Math.sin(t + group.position.x * 1.2) * 0.001;
      });

      // TODO D — call composer.render() here instead once bloom is set up
      // TODO F — measure how long renderer.render() takes using performance.now()
      //           before and after, then call setRenderMs() with the result (once/sec like FPS)
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W = el.clientWidth, H = el.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    // Every geometry and material must be disposed — skipping this causes VRAM leaks
    return () => {
      cancelAnimationFrame(frameRef.current!);
      window.removeEventListener("resize", onResize);
      meshMapRef.current.forEach(({ mesh, mat }) => {
        mesh.geometry.dispose();
        mat.dispose();
        // TODO A — dispose mat.map here too if you loaded a texture
      });
      pGeo.dispose(); pMat.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    currentFrameRef.current = currentFrame;
  }, [currentFrame]);

  // Mouse: orbit drag + raycast hover
  // Raycasting: mouse px → normalized device coords (-1 to +1) → ray into scene → hit test
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (drag.current.active) {
      const dx = (e.clientX - drag.current.lastX) * 0.006;
      const dy = (e.clientY - drag.current.lastY) * 0.004;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
      orbit.current.theta += dx;
      orbit.current.phi = Math.max(-0.8, Math.min(0.8, orbit.current.phi + dy));
      const { theta, phi, radius } = orbit.current;
      const cam = cameraRef.current!;
      cam.position.set(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(phi),
        radius * Math.cos(theta) * Math.cos(phi)
      );
      cam.lookAt(0, 0, 0);
      return;
    }

    const rect = mountRef.current!.getBoundingClientRect();
    mouse.current.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(mouse.current, cameraRef.current!);

    const meshes = Array.from(meshMapRef.current.values()).map(v => v.mesh);
    const hits = raycaster.current.intersectObjects(meshes);
    const hid = hits.find(h => h.object.userData.cardId)?.object.userData.cardId ?? null;

    // Direct GPU mutation — hover highlight without triggering a React re-render
    meshMapRef.current.forEach(({ mat, light }, id) => {
      mat.emissiveIntensity = id === hid ? 0.6 : 0.2;
      light.intensity = id === hid ? 1.4 : 0.5;
    });
    setHoveredId(hid);
  }, []);

  const handleClick = useCallback(() => {
    if (!hoveredId) return;
    setSelectedCard(CONCEPT_CARDS.find(c => c.id === hoveredId) ?? null);
    setAiText(""); setAiStatus("idle");
  }, [hoveredId]);

  // Scroll zoom — radius clamps 3–14, camera position recomputed in spherical coords
  const handleWheel = useCallback((e: React.WheelEvent) => {
    orbit.current.radius = Math.max(3, Math.min(14, orbit.current.radius + e.deltaY * 0.01));
    const { theta, phi, radius } = orbit.current;
    const cam = cameraRef.current!;
    cam.position.set(
      radius * Math.sin(theta) * Math.cos(phi),
      radius * Math.sin(phi),
      radius * Math.cos(theta) * Math.cos(phi)
    );
    cam.lookAt(0, 0, 0);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedCard || aiStatus === "streaming") return;
    setAiText(""); setAiStatus("streaming");
    await streamRenderPrompt(
      selectedCard.label,
      chunk => setAiText(p => p + chunk),
      ()    => setAiStatus("done"),
      err   => { setAiStatus("error"); setAiText(err); }
    );
  }, [selectedCard, aiStatus]);

  const hovCard = CONCEPT_CARDS.find(c => c.id === hoveredId);

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#080810",
      position: "relative", overflow: "hidden",
      fontFamily: "'DM Mono', 'Courier New', monospace",
    }}>
      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%", cursor: "grab" }}
        onMouseMove={handleMouseMove}
        onMouseDown={e => { drag.current.active = true; drag.current.lastX = e.clientX; drag.current.lastY = e.clientY; }}
        onMouseUp={() => { drag.current.active = false; }}
        onMouseLeave={() => { drag.current.active = false; }}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 44,
        background: "rgba(8,8,16,0.88)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)", display: "flex",
        alignItems: "center", justifyContent: "space-between", padding: "0 20px",
      }}>
        <span style={{ color: "#fff", fontSize: 11, letterSpacing: "0.2em", opacity: 0.4 }}>
          VISCOM · CONCEPT CANVAS
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{
            color: renderMs < 8 ? "#5ec46e" : renderMs < 16 ? "#f5e642" : "#e87c3e",
            fontSize: 11, letterSpacing: "0.1em",
            background: "rgba(255,255,255,0.04)", padding: "3px 10px", borderRadius: 3,
          }}>
            {renderMs.toFixed(1)} ms
          </span>
          <span style={{
            color: fps > 55 ? "#5ec46e" : fps > 30 ? "#f5e642" : "#e87c3e",
            fontSize: 11, letterSpacing: "0.1em",
            background: "rgba(255,255,255,0.04)", padding: "3px 10px", borderRadius: 3,
          }}>
            {fps} FPS
          </span>
        </div>
      </div>

      {/* TODO B — render your timeline scrubber UI here */}
      <div style={{
          position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "rgba(8,8,16,0.88)", borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)", display: "flex", padding: "6px 18px",
        }}>
        <input type="range" min="0" max="100" value={currentFrame} onChange={(e) => setCurrentFrame(Number(e.target.value))}></input>
      </div>

      {/* Hover label */}
      {hovCard && !selectedCard && (
        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: "rgba(8,8,16,0.92)", border: `1px solid ${hovCard.color}44`,
          color: hovCard.accent, padding: "6px 18px", borderRadius: 2,
          fontSize: 10, letterSpacing: "0.18em", pointerEvents: "none",
        }}>
          {hovCard.label.toUpperCase()} — CLICK TO SELECT
        </div>
      )}

      {/* Selected panel */}
      {selectedCard && (
        <div style={{
          position: "absolute", bottom: 20, left: 20, width: 320,
          background: "rgba(8,8,16,0.94)",
          border: `1px solid ${selectedCard.color}28`,
          borderTop: `2px solid ${selectedCard.color}`,
          backdropFilter: "blur(16px)", padding: "16px 18px", borderRadius: "0 0 4px 4px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 9, color: selectedCard.color, letterSpacing: "0.2em", marginBottom: 5 }}>
                SELECTED LAYER
              </div>
              <div style={{ fontSize: 14, color: "#fff", letterSpacing: "0.06em" }}>
                {selectedCard.label}
              </div>
            </div>
            <button
              onClick={() => { setSelectedCard(null); setAiText(""); setAiStatus("idle"); }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 18 }}
            >×</button>
          </div>

          <button onClick={handleGenerate} disabled={aiStatus === "streaming"} style={{
            width: "100%",
            background: aiStatus === "streaming" ? "rgba(255,255,255,0.03)" : `${selectedCard.color}16`,
            border: `1px solid ${selectedCard.color}${aiStatus === "streaming" ? "1a" : "44"}`,
            color: aiStatus === "streaming" ? "rgba(255,255,255,0.25)" : selectedCard.accent,
            padding: "9px 0", borderRadius: 2, fontSize: 10,
            letterSpacing: "0.18em", cursor: aiStatus === "streaming" ? "not-allowed" : "pointer",
            transition: "all 0.2s", marginBottom: aiText ? 12 : 0,
          }}>
            {aiStatus === "streaming" ? "GENERATING  ···" : "→  GENERATE RENDER PROMPT"}
          </button>

          {aiText && (
            <div style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 2, padding: "10px 12px",
              fontSize: 11, lineHeight: 1.75, color: "rgba(255,255,255,0.65)",
              maxHeight: 130, overflowY: "auto",
            }}>
              {aiText}
              {aiStatus === "streaming" && (
                <span style={{
                  display: "inline-block", width: 6, height: 11,
                  background: selectedCard.color, marginLeft: 2, verticalAlign: "middle",
                  animation: "blink 0.75s steps(1) infinite",
                }} />
              )}
            </div>
          )}

          {aiStatus === "done" && (
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={() => navigator.clipboard?.writeText(aiText)} style={{
                flex: 1, background: `${selectedCard.color}18`,
                border: `1px solid ${selectedCard.color}33`,
                color: selectedCard.accent, padding: "7px 0",
                borderRadius: 2, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer",
              }}>COPY PROMPT</button>
              <button onClick={handleGenerate} style={{
                flex: 1, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.35)", padding: "7px 0",
                borderRadius: 2, fontSize: 9, letterSpacing: "0.15em", cursor: "pointer",
              }}>REGENERATE</button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        position: "absolute", bottom: 20, right: 20, textAlign: "right",
        fontSize: 10, color: "rgba(255,255,255,0.18)", lineHeight: 2,
        letterSpacing: "0.1em", pointerEvents: "none",
      }}>
        DRAG TO ORBIT · SCROLL TO ZOOM<br />
        CLICK CARD TO SELECT
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08)}
      `}</style>
    </div>
  );
}
