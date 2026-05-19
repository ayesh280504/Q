import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import HeroLighting from "./HeroLighting";
import type { Group, Mesh } from "three";
import * as THREE from "three";
import { heroScrollProgress } from "./scrollProgress";

const body = { color: "#2e2e3a", metalness: 0.65, roughness: 0.32 };
const bodyEdge = { color: "#1a1a24", metalness: 0.8, roughness: 0.4 };
const vinyl = { color: "#0e0e14", metalness: 0.55, roughness: 0.35 };
const ring = { color: "#3f3f52", metalness: 0.9, roughness: 0.12 };
const accent = {
  color: "#f472b6",
  emissive: "#ec4899",
  emissiveIntensity: 1.4,
  metalness: 0.35,
  roughness: 0.25,
};
const screenGlow = {
  color: "#1e1b4b",
  emissive: "#6366f1",
  emissiveIntensity: 0.55,
  metalness: 0.2,
  roughness: 0.4,
};

function Platter({ groupRef }: { groupRef: RefObject<Group | null> }) {
  return (
    <group ref={groupRef} position={[0, 0.42, 0.08]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.05, 1.08, 0.09, 64]} />
        <meshStandardMaterial {...bodyEdge} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.94, 0.94, 0.025, 64]} />
        <meshStandardMaterial {...vinyl} />
      </mesh>
      {[0.28, 0.48, 0.68, 0.86].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <torusGeometry args={[r, 0.01, 12, 64]} />
          <meshStandardMaterial {...ring} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.035, 32]} />
        <meshStandardMaterial {...accent} toneMapped={false} />
      </mesh>
      {/* streak so spin is obvious */}
      <mesh position={[0.55, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.06, 0.35, 0.01]} />
        <meshStandardMaterial {...accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

function MiniScreen() {
  return (
    <group position={[-0.55, 0.38, 0.12]}>
      <RoundedBox args={[0.95, 0.55, 0.04]} radius={0.04} smoothness={4}>
        <meshStandardMaterial {...bodyEdge} />
      </RoundedBox>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.82, 0.42]} />
        <meshStandardMaterial {...screenGlow} />
      </mesh>
      {/* fake waveform bars */}
      {[-0.28, -0.14, 0, 0.14, 0.28].map((x, i) => (
        <mesh key={x} position={[x, 0, 0.04]}>
          <boxGeometry args={[0.05, 0.08 + (i % 3) * 0.06, 0.01]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#fb923c"
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Crossfader({ capRef }: { capRef: RefObject<Mesh | null> }) {
  const minX = -0.42;
  const maxX = 0.42;

  return (
    <group position={[0, 0.02, 0.38]}>
      <RoundedBox args={[1.35, 0.1, 0.22]} radius={0.03} smoothness={3} position={[0, 0, 0]}>
        <meshStandardMaterial color="#14141c" metalness={0.5} roughness={0.5} />
      </RoundedBox>
      {/* slot */}
      <mesh position={[0, 0.06, 0.08]}>
        <boxGeometry args={[1.05, 0.04, 0.06]} />
        <meshStandardMaterial
          color="#0a0a10"
          emissive="#7c3aed"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh ref={capRef} position={[minX, 0.1, 0.12]}>
        <boxGeometry args={[0.22, 0.14, 0.1]} />
        <meshStandardMaterial {...accent} toneMapped={false} />
      </mesh>
      {/* store range on group for useFrame — use constants in parent */}
    </group>
  );
}

export default function ScrollDeckScene() {
  const platterRef = useRef<Group>(null);
  const crossfaderRef = useRef<Mesh>(null);
  const xfMin = -0.42;
  const xfMax = 0.42;

  useFrame(() => {
    const t = heroScrollProgress.current;
    if (platterRef.current) {
      platterRef.current.rotation.y = t * Math.PI * 10;
    }
    if (crossfaderRef.current) {
      crossfaderRef.current.position.x = THREE.MathUtils.lerp(xfMin, xfMax, t);
    }
  });

  return (
    <>
      <HeroLighting />
      <group position={[0.65, -0.05, 0]} rotation={[0, -0.22, 0]} scale={1.35}>
        <RoundedBox args={[2.4, 0.14, 1.5]} radius={0.06} smoothness={4} position={[0, 0.08, 0]}>
          <meshStandardMaterial {...body} />
        </RoundedBox>
        <mesh position={[0, 0.16, 0.68]}>
          <boxGeometry args={[1.8, 0.03, 0.03]} />
          <meshStandardMaterial {...accent} toneMapped={false} />
        </mesh>
        <Platter groupRef={platterRef} />
        <MiniScreen />
        <Crossfader capRef={crossfaderRef} />
      </group>
    </>
  );
}
