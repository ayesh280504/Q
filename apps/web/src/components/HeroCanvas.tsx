import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import HeroScene from "./HeroScene";

function HeroCamera() {
  useFrame(({ camera }) => {
    camera.position.set(0.4, 1.55, 2.75);
    camera.lookAt(0.55, 0.25, 0);
  });
  return null;
}

export default function HeroCanvas() {
  return (
    <Canvas
      className="hero-canvas"
      camera={{ position: [0.4, 1.55, 2.75], fov: 42 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.65,
      }}
    >
      <HeroCamera />
      <HeroScene />
    </Canvas>
  );
}
