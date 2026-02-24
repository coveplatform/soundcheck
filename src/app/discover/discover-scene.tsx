"use client";

import {
  useRef,
  useState,
  useMemo,
  useEffect,
  Suspense,
  useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Sparkles, OrbitControls, Billboard } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import Link from "next/link";
import { X, ExternalLink, Star, Play, Upload } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DiscoverTrackData = {
  id: string;
  title: string;
  artistName: string;
  artworkUrl: string | null;
  sourceUrl: string;
  isDemo: boolean;
  genre?: string;
  playCount?: number;
  reviewCount?: number;
  rating?: number;
  isFeatured?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const GLOW_COLORS = [
  "#00f0ff",
  "#a855f7",
  "#ff2d9b",
  "#22d3ee",
  "#f472b6",
  "#818cf8",
];

function generateLayout(count: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const theta = golden * i;
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const rAtY = Math.sqrt(1 - y * y);
    const base = 14 + seededRandom(i * 13) * 8;
    const jitter = 2.5;
    return {
      position: [
        Math.cos(theta) * rAtY * base + (seededRandom(i * 41) - 0.5) * jitter,
        y * base * 0.55 + (seededRandom(i * 43) - 0.5) * jitter,
        Math.sin(theta) * rAtY * base + (seededRandom(i * 47) - 0.5) * jitter,
      ] as [number, number, number],
      rotation: [
        (seededRandom(i * 23) - 0.5) * 0.15,
        (seededRandom(i * 29) - 0.5) * 0.3,
        (seededRandom(i * 31) - 0.5) * 0.1,
      ] as [number, number, number],
      scale: 1.8 + seededRandom(i * 37) * 1.0,
      glowColor: GLOW_COLORS[i % GLOW_COLORS.length],
    };
  });
}

/* ------------------------------------------------------------------ */
/*  TrackCard – single floating album cover in 3-D                     */
/* ------------------------------------------------------------------ */

function TrackCard({
  track,
  position,
  cardScale,
  glowColor,
  onHover,
  onLeave,
  onClick,
  interactive,
}: {
  track: DiscoverTrackData;
  position: [number, number, number];
  cardScale: number;
  glowColor: string;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  interactive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const [hovered, setHovered] = useState(false);
  const targetScale = useRef(1);
  const currentScale = useRef(1);

  const edgeGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.04, 1.04)),
    [],
  );

  // Load artwork via TextureLoader – no cleanup cancel so React strict-mode
  // double-mount still gets a texture on the second invocation.
  useEffect(() => {
    if (!track.artworkUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(track.artworkUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (matRef.current) {
        matRef.current.map = tex;
        matRef.current.needsUpdate = true;
      }
    });
  }, [track.artworkUrl]);

  useEffect(() => {
    targetScale.current = hovered ? 1.18 : 1;
  }, [hovered]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const d = Math.min(delta, 0.1) || 0.016;
    const time = state.clock.elapsedTime;

    // Breathing: gentle scale pulse unique per card
    const breath = 1 + Math.sin(time * 0.7 + position[0] * 3 + position[2] * 2) * 0.025;
    currentScale.current +=
      (targetScale.current - currentScale.current) * d * 6;
    groupRef.current.scale.setScalar(cardScale * currentScale.current * breath);

    // Gentle bob
    groupRef.current.position.y =
      Math.sin(time * 0.5 + position[0] * 2) * 0.15;

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = hovered
        ? 0.45 + Math.sin(time * 5) * 0.1
        : 0.12 + Math.sin(time * 1.5 + position[2]) * 0.06;
    }
  });

  // Tap detection: track pointer start position + time, fire onClick only if
  // the finger/cursor moved less than TAP_THRESHOLD px AND held for min duration.
  // This prevents accidental taps during fast scrolling on mobile.
  const tapStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const TAP_THRESHOLD = 20; // px — larger for fat-finger tolerance
  const TAP_MIN_MS = 80;    // ignore ultra-fast accidental touches
  const TAP_MAX_MS = 600;   // ignore long presses (likely drag intent)
  const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

  const pointerOver = () => {
    if (!interactive || isTouchDevice) return;
    setHovered(true);
    onHover();
    document.body.style.cursor = "pointer";
  };
  const pointerOut = () => {
    if (!interactive || isTouchDevice) return;
    setHovered(false);
    onLeave();
    document.body.style.cursor = "default";
  };
  const pointerDown = (e: { clientX: number; clientY: number }) => {
    if (!interactive) return;
    tapStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const pointerUp = (e: { clientX: number; clientY: number }) => {
    if (!interactive) return;
    if (!tapStart.current) return;
    const dx = e.clientX - tapStart.current.x;
    const dy = e.clientY - tapStart.current.y;
    const dt = Date.now() - tapStart.current.t;
    const distSq = dx * dx + dy * dy;
    if (distSq < TAP_THRESHOLD * TAP_THRESHOLD && dt >= TAP_MIN_MS && dt <= TAP_MAX_MS) {
      onClick();
    }
    tapStart.current = null;
  };

  return (
    <group position={position}>
      <Billboard>
        <group ref={groupRef} scale={cardScale}>
          {/* Glow halo */}
          <mesh ref={glowRef} position={[0, 0, -0.06]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Card face — on touch devices skip onPointerOver/Out so
             multi-finger gestures (pinch-to-zoom) pass through to OrbitControls
             instead of being captured by the mesh raycaster. */}
          <mesh
            onPointerOver={pointerOver}
            onPointerOut={pointerOut}
            onPointerDown={(e) => { if (isTouchDevice) e.stopPropagation(); pointerDown(e); }}
            onPointerUp={(e) => { pointerUp(e); }}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              ref={matRef}
              color="#ffffff"
              toneMapped={false}
            />
          </mesh>

          {/* Neon edge lines */}
          <lineSegments geometry={edgeGeo}>
            <lineBasicMaterial
              color={glowColor}
              transparent
              opacity={hovered ? 0.9 : 0.3}
            />
          </lineSegments>
        </group>
      </Billboard>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Nebula clouds – large soft glowing spheres in the background       */
/* ------------------------------------------------------------------ */

const NEBULA_CLOUDS = [
  { pos: [25, 12, -40] as [number, number, number], color: "#00f0ff", scale: 18, opacity: 0.045 },
  { pos: [-30, -8, -35] as [number, number, number], color: "#a855f7", scale: 22, opacity: 0.04 },
  { pos: [10, -20, -50] as [number, number, number], color: "#ff2d9b", scale: 16, opacity: 0.035 },
  { pos: [-20, 15, -45] as [number, number, number], color: "#10b981", scale: 20, opacity: 0.03 },
  { pos: [35, -5, -55] as [number, number, number], color: "#fbbf24", scale: 14, opacity: 0.025 },
];

function NebulaClouds() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const base = NEBULA_CLOUDS[i].opacity;
      mat.opacity = base + Math.sin(t * 0.3 + i * 2) * base * 0.4;
      mesh.scale.setScalar(
        NEBULA_CLOUDS[i].scale + Math.sin(t * 0.15 + i * 3) * 1.5,
      );
    });
  });

  return (
    <group ref={groupRef}>
      {NEBULA_CLOUDS.map((cloud, i) => (
        <mesh key={i} position={cloud.pos}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={cloud.color}
            transparent
            opacity={cloud.opacity}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Constellation lines – faint lines between nearby track cards       */
/* ------------------------------------------------------------------ */

function ConstellationLines({ layout }: { layout: { position: [number, number, number] }[] }) {
  const lineRef = useRef<THREE.LineSegments>(null!);

  const geometry = useMemo(() => {
    const MAX_DIST = 12;
    const verts: number[] = [];
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        const a = layout[i].position;
        const b = layout[j].position;
        const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < MAX_DIST) {
          verts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return geo;
  }, [layout]);

  useFrame((state) => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.06 + Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#00f0ff" transparent opacity={0.06} depthWrite={false} />
    </lineSegments>
  );
}

/* ------------------------------------------------------------------ */
/*  Shooting stars – fast animated streaks across the sky              */
/* ------------------------------------------------------------------ */

function ShootingStars() {
  const COUNT = 5;
  const groupRef = useRef<THREE.Group>(null!);

  const stars = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => ({
      delay: i * 4 + seededRandom(i * 77) * 6,
      speed: 25 + seededRandom(i * 33) * 20,
      startPos: [
        (seededRandom(i * 11) - 0.5) * 80,
        20 + seededRandom(i * 22) * 20,
        (seededRandom(i * 44) - 0.5) * 60,
      ] as [number, number, number],
      dir: new THREE.Vector3(
        -0.5 + seededRandom(i * 55) * -0.5,
        -0.3 - seededRandom(i * 66) * 0.4,
        -0.2 + seededRandom(i * 88) * -0.3,
      ).normalize(),
      length: 3 + seededRandom(i * 99) * 4,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      const line = child as THREE.Line;
      const s = stars[i];
      const cycle = 12 + s.delay;
      const phase = ((t + s.delay) % cycle) / cycle;

      if (phase < 0.15) {
        line.visible = true;
        const progress = phase / 0.15;
        const pos = new THREE.Vector3(...s.startPos).addScaledVector(s.dir, progress * s.speed);
        const tail = pos.clone().addScaledVector(s.dir, -s.length);
        const positions = line.geometry.getAttribute("position");
        positions.setXYZ(0, tail.x, tail.y, tail.z);
        positions.setXYZ(1, pos.x, pos.y, pos.z);
        positions.needsUpdate = true;
        const mat = line.material as THREE.LineBasicMaterial;
        const fade = progress < 0.3 ? progress / 0.3 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        mat.opacity = fade * 0.5;
      } else {
        line.visible = false;
      }
    });
  });

  const lines = useMemo(() => {
    return stars.map(() => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      const mat = new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false });
      return new THREE.Line(geo, mat);
    });
  }, [stars]);

  return (
    <group ref={groupRef}>
      {lines.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Holographic grid floor                                             */
/* ------------------------------------------------------------------ */

function HoloGrid() {
  const gridRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!gridRef.current) return;
    const mat = (gridRef.current.children[0] as THREE.LineSegments)
      .material as THREE.LineBasicMaterial;
    mat.opacity = 0.04 + Math.sin(state.clock.elapsedTime * 0.3) * 0.015;
  });

  const geometry = useMemo(() => {
    const size = 120;
    const step = 4;
    const verts: number[] = [];
    for (let i = -size / 2; i <= size / 2; i += step) {
      verts.push(i, 0, -size / 2, i, 0, size / 2);
      verts.push(-size / 2, 0, i, size / 2, 0, i);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return geo;
  }, []);

  return (
    <group ref={gridRef} position={[0, -18, 0]}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#00f0ff" transparent opacity={0.04} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Full 3-D scene                                                     */
/* ------------------------------------------------------------------ */

function Scene({
  tracks,
  onHoverTrack,
  onSelectTrack,
  selectedTrackId,
  hasInteracted,
}: {
  tracks: DiscoverTrackData[];
  onHoverTrack: (t: DiscoverTrackData | null) => void;
  onSelectTrack: (t: DiscoverTrackData) => void;
  selectedTrackId: string | null;
  hasInteracted: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const layout = useMemo(() => generateLayout(tracks.length), [tracks.length]);

  // Camera zoom-to-track state
  const wasSelected = useRef(false);
  const returnPos = useRef(new THREE.Vector3(0, 0, 35));
  const returnTarget = useRef(new THREE.Vector3(0, 0, 0));

  const selectedIdx = selectedTrackId
    ? tracks.findIndex((t) => t.id === selectedTrackId)
    : -1;
  const selectedPosition =
    selectedIdx >= 0 ? layout[selectedIdx].position : null;

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const d = Math.min(delta, 0.1);

    if (selectedPosition) {
      // Save return position on first frame of selection
      if (!wasSelected.current) {
        returnPos.current.copy(state.camera.position);
        returnTarget.current.copy(controls.target);
        wasSelected.current = true;
      }

      const trackPos = new THREE.Vector3(...selectedPosition);
      const dir = trackPos.clone().normalize();
      if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
      const camPos = trackPos.clone().add(dir.multiplyScalar(3.5));

      controls.target.lerp(trackPos, d * 4);
      state.camera.position.lerp(camPos, d * 4);

      controls.enableRotate = false;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.autoRotate = false;
    } else if (wasSelected.current) {
      // Animate back to previous position
      state.camera.position.lerp(returnPos.current, d * 3);
      controls.target.lerp(returnTarget.current, d * 3);

      if (state.camera.position.distanceTo(returnPos.current) < 0.3) {
        wasSelected.current = false;
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.autoRotate = true;
      }
    }

    controls.update();
  });

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 35, 110]} />

      <ambientLight intensity={0.55} />
      <pointLight position={[15, 15, 15]} intensity={0.7} color="#00f0ff" />
      <pointLight position={[-15, -8, -15]} intensity={0.5} color="#a855f7" />
      <pointLight position={[0, 10, -25]} intensity={0.6} color="#ff2d9b" />
      <pointLight position={[0, -10, 20]} intensity={0.35} color="#ffffff" />

      <Stars
        radius={120}
        depth={80}
        count={6000}
        factor={4}
        saturation={0.4}
        fade
        speed={0.8}
      />

      <Sparkles count={250} scale={[60, 40, 60]} size={2.5} speed={0.3} opacity={0.4} color="#00f0ff" />
      <Sparkles count={120} scale={[50, 30, 50]} size={1.8} speed={0.2} opacity={0.25} color="#a855f7" />
      <Sparkles count={80} scale={[40, 25, 40]} size={1.4} speed={0.15} opacity={0.2} color="#ff2d9b" />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={0.12}
        minDistance={8}
        maxDistance={55}
        enablePan
        panSpeed={0.4}
        rotateSpeed={0.45}
        zoomSpeed={0.7}
        /* Mobile: one finger rotates, two fingers dolly+pan (pinch to zoom) */
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />

      {/* --- Visual enhancements --- */}
      <NebulaClouds />
      <ShootingStars />
      <HoloGrid />

      {tracks.map((track, i) => (
        <TrackCard
          key={track.id}
          track={track}
          position={layout[i].position}
          cardScale={track.isFeatured ? layout[i].scale * 1.15 : layout[i].scale}
          glowColor={track.isFeatured ? "#fbbf24" : layout[i].glowColor}
          onHover={() => onHoverTrack(track)}
          onLeave={() => onHoverTrack(null)}
          onClick={() => onSelectTrack(track)}
          interactive={hasInteracted}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  HUD overlay (HTML on top of canvas)                                */
/* ------------------------------------------------------------------ */

function getPlatformName(url: string) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes("soundcloud")) return "SoundCloud";
    if (h.includes("bandcamp")) return "Bandcamp";
    if (h.includes("youtube") || h.includes("youtu.be")) return "YouTube";
    if (h.includes("spotify")) return "Spotify";
    return "Source";
  } catch {
    return "Source";
  }
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();

    // SoundCloud
    if (h.includes("soundcloud.com")) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&color=00f0ff`;
    }

    // YouTube
    if (h.includes("youtube.com") || h.includes("youtu.be")) {
      let videoId: string | null = null;
      if (h.includes("youtu.be")) {
        videoId = u.pathname.slice(1);
      } else {
        videoId = u.searchParams.get("v");
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
      }
    }

    // Spotify
    if (h.includes("spotify.com")) {
      const match = u.pathname.match(/\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
      if (match) {
        return `https://open.spotify.com/embed/${match[1]}/${match[2]}?theme=0&utm_source=generator`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Client-only wrapper (avoids hydration mismatch for hooks like      */
/*  useSession that return different values on server vs client)        */
/* ------------------------------------------------------------------ */

function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}

/* ------------------------------------------------------------------ */
/*  Live activity feed                                                 */
/* ------------------------------------------------------------------ */

const ACTIVITY_MESSAGES = [
  { artist: "Maya Kim", action: "just received 5 reviews", icon: "⭐" },
  { artist: "Neon Pulse", action: "is trending this week", icon: "🔥" },
  { artist: "DJ Nova", action: "uploaded a new track", icon: "🎵" },
  { artist: "Sarah Moon", action: "got a 4.9 rating", icon: "✨" },
  { artist: "Luna Park", action: "reached 500 plays", icon: "▶" },
  { artist: "Arden", action: "just received expert feedback", icon: "💬" },
  { artist: "Ghost Freq", action: "is featured this week", icon: "🏆" },
  { artist: "Kei", action: "got 3 new reviews today", icon: "⭐" },
  { artist: "River", action: "uploaded a new single", icon: "🎵" },
  { artist: "Atlas", action: "reached 1,000 plays", icon: "▶" },
];

function ActivityFeed() {
  const [current, setCurrent] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showNext = () => {
      const idx = Math.floor(Math.random() * ACTIVITY_MESSAGES.length);
      setCurrent(idx);
      setVisible(true);
      setTimeout(() => setVisible(false), 3500);
    };
    const initial = setTimeout(showNext, 6000);
    const interval = setInterval(showNext, 9000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  const msg = current !== null ? ACTIVITY_MESSAGES[current] : null;

  return (
    <div
      className={`fixed top-16 sm:top-20 right-4 sm:right-6 z-30 transition-all duration-500 hidden sm:block ${
        visible && msg
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-8 pointer-events-none"
      }`}
    >
      {msg && (
        <div className="px-4 py-2.5 bg-black/50 backdrop-blur-xl border border-white/[0.08] rounded-xl text-xs max-w-[240px]">
          <span className="mr-1.5">{msg.icon}</span>
          <span className="text-white/70 font-medium">{msg.artist}</span>
          <span className="text-white/35"> {msg.action}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upload CTA                                                         */
/* ------------------------------------------------------------------ */

function UploadCTA({ clickCount }: { clickCount: number }) {
  const show = clickCount >= 2;

  return (
    <div
      className={`fixed top-[90px] sm:top-[120px] left-1/2 -translate-x-1/2 z-30 transition-all duration-700 ${
        show
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <Link
        href="/signup"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-md shadow-purple-600/20 border border-purple-500/30"
      >
        <Upload className="w-3 h-3" />
        Upload your track
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated count-up hook                                             */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);

  return value;
}

function useCountUpFloat(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased * 10) / 10);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  HUD                                                                */
/* ------------------------------------------------------------------ */

function HUD({
  hoveredTrack,
  selectedTrack,
  selectedGlowColor,
  hasInteracted,
  onDeselect,
  clickCount,
  tracks,
}: {
  hoveredTrack: DiscoverTrackData | null;
  selectedTrack: DiscoverTrackData | null;
  selectedGlowColor: string;
  hasInteracted: boolean;
  onDeselect: () => void;
  clickCount: number;
  tracks: DiscoverTrackData[];
}) {
  const totalPlays = useMemo(
    () => tracks.reduce((s, t) => s + (t.playCount ?? 0), 0),
    [tracks],
  );
  const totalReviews = useMemo(
    () => tracks.reduce((s, t) => s + (t.reviewCount ?? 0), 0),
    [tracks],
  );
  const avgRating = useMemo(() => {
    const rated = tracks.filter((t) => t.rating);
    if (!rated.length) return 0;
    return Math.round((rated.reduce((s, t) => s + (t.rating ?? 0), 0) / rated.length) * 10) / 10;
  }, [tracks]);

  const animPlays = useCountUp(totalPlays, hasInteracted);
  const animReviews = useCountUp(totalReviews, hasInteracted);
  const animRating = useCountUpFloat(avgRating, hasInteracted);
  const animTracks = useCountUp(tracks.length, hasInteracted, 800);
  return (
    <>
      {/* ---- Header ---- */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
          >
            <Logo className="text-white" />
          </Link>
          <ClientOnly fallback={<div className="h-9 w-20 rounded bg-white/5 animate-pulse" />}>
            <div className="flex items-center gap-3">
              <AuthButtons theme="dark" />
            </div>
          </ClientOnly>
        </div>
      </header>

      {/* ---- Hero backdrop – dark gradient that fades on interaction ---- */}
      <div
        className="fixed inset-0 z-[9] pointer-events-none transition-opacity duration-[1400ms] ease-out"
        style={{ opacity: hasInteracted ? 0 : 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-black/60 via-black/30 to-transparent" />
      </div>

      {/* ---- Centre hero text – fades on interaction ---- */}
      <div
        className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center transition-all duration-[1200ms] ease-out"
        style={{
          opacity: hasInteracted ? 0 : 1,
          transform: hasInteracted ? "scale(1.08)" : "scale(1)",
        }}
      >
        <div className="text-center px-4 max-w-2xl">
          <p className="text-[10px] sm:text-xs tracking-[0.5em] text-cyan-400/50 uppercase font-mono mb-4 select-none">
            mixreflect
          </p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none select-none">
            WEEKLY<br />DISCOVER
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/50 font-light leading-relaxed select-none">
            Explore music from independent artists around the world.
            <br className="hidden sm:block" />
            Get expert feedback on your own tracks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 pointer-events-auto">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
            >
              Start uploading — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="px-5 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            >
              Sign in
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-10 text-[11px] sm:text-xs text-white/80 font-mono tracking-wide uppercase select-none">
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Expert reviews
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Real listeners
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              Grow your audience
            </span>
          </div>

          {/* Desktop hint */}
          <p className="hidden sm:block mt-12 text-base text-white/60 font-normal tracking-widest uppercase select-none animate-bounce">
            drag to explore &middot; scroll to zoom
          </p>
          {/* Mobile hint */}
          <p className="block sm:hidden mt-8 text-sm text-white/60 font-normal tracking-widest uppercase select-none animate-bounce">
            swipe to explore &middot; pinch to zoom
          </p>
        </div>
      </div>

      {/* ---- Hovered track info (hidden when a track is selected) ---- */}
      {!selectedTrack && (
        <div
          className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-sm transition-all duration-300 ${
            hoveredTrack
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          {hoveredTrack && (
            <div className="px-5 sm:px-8 py-4 sm:py-5 bg-black/70 backdrop-blur-2xl border border-white/[0.1] rounded-2xl text-center shadow-[0_0_40px_rgba(0,240,255,0.1)]">
              {hoveredTrack.isFeatured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-400 text-[11px] font-semibold mb-3">
                  <Star className="w-3 h-3 fill-amber-400" /> Featured
                </span>
              )}
              <p className="text-white text-lg sm:text-xl font-bold tracking-tight">
                {hoveredTrack.title}
              </p>
              <p className="text-white/45 text-sm mt-1 font-light">
                {hoveredTrack.artistName}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3">
                {hoveredTrack.genre && (
                  <span className="px-2.5 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/25 text-cyan-400 text-[11px] font-medium">
                    {hoveredTrack.genre}
                  </span>
                )}
                {hoveredTrack.playCount != null && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] text-white/60 text-[11px] font-medium">
                    <Play className="w-3 h-3 fill-white/60" />
                    {hoveredTrack.playCount.toLocaleString()}
                  </span>
                )}
                {hoveredTrack.rating != null && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] text-white/60 text-[11px] font-medium">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {hoveredTrack.rating}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Tap-to-dismiss backdrop (mobile-friendly) ---- */}
      {selectedTrack && (
        <div
          className="fixed inset-0 z-40"
          onClick={onDeselect}
          onTouchEnd={onDeselect}
        />
      )}

      {/* ---- Selected track panel (zoomed-in view + embedded player) ---- */}
      <div
        className={`fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-lg transition-all duration-500 ${
          selectedTrack
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        {selectedTrack && (() => {
          const embedUrl = selectedTrack.isDemo
            ? null
            : getEmbedUrl(selectedTrack.sourceUrl);
          return (
            <div
              className="bg-black/80 backdrop-blur-2xl border border-white/[0.08] rounded-xl sm:rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              style={{
                boxShadow: `0 0 60px ${selectedGlowColor}18`,
              }}
            >
              {/* Embedded player — hidden on mobile (audio still auto-plays),
                 visible on desktop */}
              {embedUrl && (
                <div className="w-full border-b border-white/[0.06] overflow-hidden h-0 sm:h-auto">
                  <iframe
                    src={embedUrl}
                    className="w-full"
                    style={{
                      height: embedUrl.includes("soundcloud") ? 80 :
                              embedUrl.includes("spotify") ? 80 :
                              embedUrl.includes("youtube") ? 120 : 80,
                    }}
                    allow="autoplay; encrypted-media"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Track info + actions — compact on mobile */}
              <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-white text-[13px] sm:text-sm font-semibold tracking-tight truncate">
                    {selectedTrack.title}
                  </p>
                  <p className="text-white/35 text-[11px] sm:text-xs font-light truncate">
                    {selectedTrack.artistName}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {selectedTrack.isDemo ? (
                    <Link
                      href="/signup"
                      className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all hover:brightness-125 whitespace-nowrap"
                      style={{
                        backgroundColor: `${selectedGlowColor}25`,
                        border: `1px solid ${selectedGlowColor}40`,
                        color: selectedGlowColor,
                      }}
                    >
                      Sign up
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Link>
                  ) : (
                    <a
                      href={selectedTrack.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all hover:brightness-125 whitespace-nowrap"
                      style={{
                        backgroundColor: `${selectedGlowColor}25`,
                        border: `1px solid ${selectedGlowColor}40`,
                        color: selectedGlowColor,
                      }}
                    >
                      {getPlatformName(selectedTrack.sourceUrl)}
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </a>
                  )}

                  <button
                    onClick={onDeselect}
                    className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-white/50" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ---- Close hint (ESC on desktop, tap on mobile) ---- */}
      <div
        className={`fixed bottom-2 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          selectedTrack
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Desktop: ESC to close */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/[0.08]">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-mono text-white/60">ESC</kbd>
          <span className="text-[11px] text-white/40">to close</span>
        </div>
        {/* Mobile: tap anywhere to close */}
        <div className="flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/[0.08]">
          <span className="text-[11px] text-white/40">Tap anywhere to close</span>
        </div>
      </div>

      {/* ---- Scanline overlay ---- */}
      <div
        className="fixed inset-0 z-40 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.04) 1px, rgba(255,255,255,0.04) 2px)",
          backgroundSize: "100% 2px",
        }}
      />

      {/* ---- Vignette ---- */}
      <div
        className="fixed inset-0 z-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* ---- Corner decorations (hidden on mobile) ---- */}
      <div className="hidden sm:block fixed top-20 left-6 z-20 pointer-events-none select-none">
        <div className="w-8 h-px bg-cyan-400/20" />
        <div className="w-px h-8 bg-cyan-400/20" />
      </div>
      <div className="hidden sm:block fixed top-20 right-6 z-20 pointer-events-none select-none">
        <div className="w-8 h-px bg-purple-400/20 ml-auto" />
        <div className="w-px h-8 bg-purple-400/20 ml-auto" />
      </div>
      <div className="hidden sm:block fixed bottom-6 left-6 z-20 pointer-events-none select-none">
        <div className="w-px h-8 bg-cyan-400/20" />
        <div className="w-8 h-px bg-cyan-400/20" />
      </div>
      <div className="hidden sm:block fixed bottom-6 right-6 z-20 pointer-events-none select-none">
        <div className="w-px h-8 bg-purple-400/20 ml-auto" />
        <div className="w-px h-8 bg-purple-400/20 ml-auto" />
      </div>

      {/* ---- Stats counter bar ---- */}
      {(() => {
        const focused = selectedTrack || hoveredTrack;
        const showTrack = !!focused;
        return (
          <div
            className={`fixed top-[52px] sm:top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none transition-all duration-1000 ${
              hasInteracted ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-5 px-3 sm:px-7 py-2 sm:py-3 bg-black/60 backdrop-blur-xl border border-white/[0.1] rounded-full text-[9px] sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] text-white/70 uppercase font-mono transition-all duration-300">
              {showTrack ? (
                <>
                  <span>{(focused!.playCount ?? 0).toLocaleString()} plays</span>
                  <span className="w-px h-3 sm:h-3.5 bg-white/25" />
                  <span>{focused!.reviewCount ?? 0} reviews</span>
                  <span className="hidden sm:block w-px h-3.5 bg-white/25" />
                  <span className="hidden sm:inline">{focused!.rating ?? "—"} avg</span>
                </>
              ) : (
                <>
                  <span>{animPlays.toLocaleString()} plays</span>
                  <span className="w-px h-3 sm:h-3.5 bg-white/25" />
                  <span>{animReviews} reviews</span>
                  <span className="hidden sm:block w-px h-3.5 bg-white/25" />
                  <span className="hidden sm:inline">{animRating} avg</span>
                  <span className="w-px h-3 sm:h-3.5 bg-white/25" />
                  <span>{animTracks} tracks</span>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ---- Activity feed ---- */}
      <ActivityFeed />

      {/* ---- Upload CTA ---- */}
      <UploadCTA clickCount={clickCount} />

      {/* ---- Ambient status bar ---- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none">
        <p className="text-[9px] tracking-[0.4em] text-white/10 uppercase font-mono">
          sys.online &middot; {new Date().getFullYear()}
        </p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading screen                                                     */
/* ------------------------------------------------------------------ */

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-xs tracking-[0.3em] text-white/20 uppercase font-mono">
          entering the void
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported component                                                 */
/* ------------------------------------------------------------------ */

export function DiscoverScene({
  tracks,
}: {
  tracks: DiscoverTrackData[];
}) {
  const [hoveredTrack, setHoveredTrack] = useState<DiscoverTrackData | null>(
    null,
  );
  const [selectedTrack, setSelectedTrack] = useState<DiscoverTrackData | null>(
    null,
  );
  const [loaded, setLoaded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleInteraction = useCallback(() => {
    if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  const handleSelectTrack = useCallback((t: DiscoverTrackData) => {
    setSelectedTrack(t);
    setClickCount((c) => c + 1);
    // Track view/play for real (non-demo) tracks
    if (!t.isDemo) {
      fetch(`/api/tracks/${t.id}/view`, { method: "POST" }).catch(() => {});
    }
  }, []);

  const selectedGlowColor = useMemo(() => {
    if (!selectedTrack) return "#00f0ff";
    if (selectedTrack.isFeatured) return "#fbbf24";
    const idx = tracks.findIndex((t) => t.id === selectedTrack.id);
    return GLOW_COLORS[idx >= 0 ? idx % GLOW_COLORS.length : 0];
  }, [selectedTrack, tracks]);

  const handleDeselect = useCallback(() => setSelectedTrack(null), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedTrack(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Block ALL default touch behavior at the document level while on this page.
  // This prevents the browser from interpreting pinch/swipe as back/forward navigation.
  const containerRef = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => { e.preventDefault(); };
    el.addEventListener("touchstart", prevent, { passive: false });
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      el.removeEventListener("touchstart", prevent);
      el.removeEventListener("touchmove", prevent);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ touchAction: "none", overscrollBehavior: "none" }}
      onWheel={handleInteraction}
      onPointerDown={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {!loaded && <LoadingOverlay />}

      <Canvas
        camera={{ fov: 60, near: 0.1, far: 200, position: [0, 0, 35] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        onCreated={() => {
          setTimeout(() => setLoaded(true), 400);
        }}
      >
        <Suspense fallback={null}>
          <Scene
            tracks={tracks}
            onHoverTrack={setHoveredTrack}
            onSelectTrack={handleSelectTrack}
            selectedTrackId={selectedTrack?.id ?? null}
            hasInteracted={hasInteracted}
          />
        </Suspense>
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      <HUD
        hoveredTrack={hoveredTrack}
        selectedTrack={selectedTrack}
        selectedGlowColor={selectedGlowColor}
        hasInteracted={hasInteracted}
        onDeselect={handleDeselect}
        clickCount={clickCount}
        tracks={tracks}
      />
    </div>
  );
}
