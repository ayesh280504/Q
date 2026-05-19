import { ContactShadows } from "@react-three/drei";

/** No Environment HDR here — it suspends and can leave the canvas blank offline. */
export default function HeroLighting() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <hemisphereLight args={["#e9d5ff", "#1a1a24", 0.95]} />
      <directionalLight position={[4, 6, 5]} intensity={2.8} />
      <directionalLight position={[-3, 4, 2]} intensity={1.2} color="#fbcfe8" />
      <directionalLight position={[0, 2, -4]} intensity={0.75} color="#c4b5fd" />
      <spotLight
        position={[3, 5, 4]}
        angle={0.55}
        penumbra={0.6}
        intensity={3.2}
        color="#fff5f8"
      />
      <pointLight position={[2, 1.2, 3]} intensity={2} color="#f9a8d4" distance={12} />
      <pointLight position={[-1, 2, 2]} intensity={1} color="#a78bfa" distance={10} />
      <ContactShadows
        position={[1.1, -0.35, 0]}
        opacity={0.35}
        scale={10}
        blur={2.5}
        far={4}
        color="#7c3aed"
      />
    </>
  );
}
