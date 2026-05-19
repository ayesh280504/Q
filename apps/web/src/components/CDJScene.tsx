import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import HeroLighting from "./HeroLighting";
import type { Group, Mesh } from "three";
import * as THREE from "three";
import { heroScrollProgress } from "./scrollProgress";

/** Brighter materials so the deck reads on a dark page */
const deckTop = { color: "#3d3d4a", metalness: 0.75, roughness: 0.28 };
const deckSide = { color: "#252530", metalness: 0.85, roughness: 0.35 };
const platterMat = { color: "#1c1c26", metalness: 0.9, roughness: 0.15 };
const vinylMat = {
  color: "#111118",
  metalness: 0.6,
  roughness: 0.4,
};
const accent = {
  color: "#f472b6",
  emissive: "#ec4899",
  emissiveIntensity: 1.2,
  metalness: 0.4,
  roughness: 0.3,
};

function JogWheel({ groupRef }: { groupRef: RefObject<Group | null> }) {
  return (
    <group ref={groupRef} position={[-0.15, 0.48, 0.05]}>
      {/* base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.15, 1.18, 0.1, 64]} />
        <meshStandardMaterial {...platterMat} />
      </mesh>
      {/* vinyl surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[1.02, 1.02, 0.02, 64]} />
        <meshStandardMaterial {...vinylMat} />
      </mesh>
      {/* groove rings */}
      {[0.35, 0.55, 0.75, 0.92].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
          <torusGeometry args={[r, 0.012, 16, 64]} />
          <meshStandardMaterial color="#2a2a38" metalness={0.95} roughness={0.1} />
        </mesh>
      ))}
      {/* center cap — pink, easy to spot while spinning */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 32]} />
        <meshStandardMaterial {...accent} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
        <circleGeometry args={[0.12, 32]} />
        <meshStandardMaterial color="#0a0a0f" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

function DeckUnit() {
  return (
    <group>
      {/* main deck body */}
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.2, 1.85]} />
        <meshStandardMaterial {...deckTop} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[3.15, 0.08, 1.8]} />
        <meshStandardMaterial {...deckSide} />
      </mesh>
      {/* pink edge light strip */}
      <mesh position={[0, 0.26, 0.88]}>
        <boxGeometry args={[2.4, 0.04, 0.04]} />
        <meshStandardMaterial {...accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ChannelFader({ meshRef }: { meshRef: RefObject<Mesh | null> }) {
  return (
    <group position={[1.35, 0, 0.1]}>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.12, 0.85, 0.14]} />
        <meshStandardMaterial color="#0c0c12" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* slot highlight */}
      <mesh position={[0, 0.42, 0.08]}>
        <boxGeometry args={[0.04, 0.75, 0.02]} />
        <meshStandardMaterial color="#1f1f2e" emissive="#7c3aed" emissiveIntensity={0.15} />
      </mesh>
      <mesh ref={meshRef} position={[0, 0.42, 0.1]} castShadow>
        <boxGeometry args={[0.18, 0.28, 0.12]} />
        <meshStandardMaterial {...accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function CDJScene() {
  const platterRef = useRef<Group>(null);
  const faderRef = useRef<Mesh>(null);
  const faderMinY = 0.18;
  const faderMaxY = 0.68;

  useFrame(() => {
    const t = heroScrollProgress.current;
    if (platterRef.current) {
      platterRef.current.rotation.y = t * Math.PI * 6;
    }
    if (faderRef.current) {
      faderRef.current.position.y = THREE.MathUtils.lerp(faderMinY, faderMaxY, t);
    }
  });

  return (
    <>
      <HeroLighting />

      <group position={[1.1, -0.02, 0]} rotation={[0, -0.35, 0]} scale={1.2}>
        <DeckUnit />
        <JogWheel groupRef={platterRef} />
        <ChannelFader meshRef={faderRef} />
      </group>
    </>
  );
}
