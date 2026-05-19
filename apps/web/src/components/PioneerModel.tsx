import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
import HeroLighting from "./HeroLighting";
import type { Group } from "three";
import * as THREE from "three";
import { heroScrollProgress } from "./scrollProgress";

const MODEL_URL = "/models/pioneer-mixer.glb";

function tuneMaterial(mat: THREE.Material) {
  if (!(mat instanceof THREE.MeshStandardMaterial)) return;
  mat.metalness = Math.min(mat.metalness ?? 0.5, 0.45);
  mat.roughness = Math.min(Math.max(mat.roughness ?? 0.5, 0.3), 0.75);
  const lum =
    0.2126 * mat.color.r + 0.7152 * mat.color.g + 0.0722 * mat.color.b;
  if (lum < 0.1) {
    mat.color.multiplyScalar(1.9);
    mat.emissiveIntensity = 0.18;
    mat.emissive.lerp(new THREE.Color("#333344"), 0.3);
  }
}

export default function PioneerModel() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(tuneMaterial);
    });
  }, [scene]);

  useFrame(() => {
    if (!group.current) return;
    const t = heroScrollProgress.current;
    group.current.rotation.y = -0.35 + t * Math.PI * 1.25;
  });

  return (
    <>
      <HeroLighting />
      <group ref={group} position={[1.1, -0.05, 0]} rotation={[-0.4, -0.35, 0]} scale={0.9}>
        <Center>
          <primitive object={scene} />
        </Center>
      </group>
    </>
  );
}
