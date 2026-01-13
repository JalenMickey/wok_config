type BurnerRingProps = {
  x: number;
  z: number;
  radius: number;
  trayTopY: number;
  wellDepth?: number;
  color?: string;
};

export default function BurnerRing({
  x,
  z,
  radius,
  trayTopY,
  wellDepth = 0.25,
  color = "#ff6600",
}: BurnerRingProps) {
  // Position the visible ring slightly above the tray top so it's not occluded.
  const y = trayTopY - wellDepth / 2 + 0.02;

  return (
    <group position={[x, y, z]}>
      <mesh>
        <cylinderGeometry args={[radius * 0.98, radius * 0.98, 0.06, 64]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.25} />
      </mesh>
      {/* subtle rim for clarity */}
      {/* <mesh position={[0, 0.035, 0]}>
        <torusGeometry args={[radius * 0.9, 0.03, 16, 100]} />
        <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.3} />
      </mesh> */}
    </group>
  );
}
