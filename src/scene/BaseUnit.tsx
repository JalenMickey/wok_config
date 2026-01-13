import React, { useMemo } from "react";
import * as THREE from "three";

export type BurnerSize = 13 | 15 | 17 | 19 | 21;

export type BurnerSlot = {
  x: number;
  z: number;
  radius: number;
};

type BaseUnitProps = {
  burnerCount: number;
  burnerSizes: readonly BurnerSize[];
  minGapInch?: number;
  inchToUnit?: number;
  depth?: number;
  trayHeight?: number;
  trayThickness?: number;
  lipHeight?: number;
  backHeight?: number;
  legHeight?: number;
  wellDepth?: number;
  materialColor?: string;
  legColor?: string;
  style?: "california" | "newyork";
  onBurnerSlots?: (slots: readonly BurnerSlot[], trayTopY: number, wellDepth: number) => React.ReactNode;
};

export default function BaseUnit({
  burnerCount,
  burnerSizes,
  minGapInch = 5,
  inchToUnit = 0.12,
  depth = 2.5,
  trayHeight = 1.0,
  trayThickness = 0.2,
  lipHeight = 0.1,
  backHeight = 0.6,
  legHeight = 1.0,
  wellDepth = 0.25,
  materialColor = "#777777",
  legColor = "#2e2e2e",
  style = "california",
  onBurnerSlots,
}: BaseUnitProps) {
  const width = useMemo(() => {
    // Compute width from burner diameters (in inches) and required spacing so burners don't get clipped.
    const SIDE_PADDING = 1; // inches of padding on each side
    const gap = minGapInch * inchToUnit; // gap in scene units

    // diameters in scene units (burnerSizes are diameters in inches)
    const diameters = burnerSizes.map((s) => s * inchToUnit);

    const totalDiameters = diameters.reduce((a, b) => a + b, 0);
    const totalGaps = Math.max(0, burnerCount - 1) * gap;

    return totalDiameters + totalGaps + SIDE_PADDING * 2 * inchToUnit;
  }, [burnerCount, burnerSizes, minGapInch, inchToUnit]);

  const trayCenterY = legHeight + trayHeight / 2;

  // Legs
  const legPositions: [number, number, number][] = [
    [ width / 2 - 0.15, legHeight / 2,  depth / 2 - 0.15],
    [ width / 2 - 0.15, legHeight / 2, -depth / 2 + 0.15],
    [-width / 2 + 0.15, legHeight / 2,  depth / 2 - 0.15],
    [-width / 2 + 0.15, legHeight / 2, -depth / 2 + 0.15],
  ];

  // Burner X positions
  const SAFETY = 0.15;
  const usableHalfWidth = width / 2 - SAFETY;
  const usableHalfDepth = depth / 2 - SAFETY - lipHeight;

  const burnerSlots: BurnerSlot[] = useMemo(() => {
    const gap = minGapInch * inchToUnit;

    if (burnerCount === 1) return [{ x: 0, z: 0, radius: (burnerSizes[0] / 2) * inchToUnit }];

    // diameters in scene units (burnerSizes are diameters in inches)
    const diameters = burnerSizes.map((s) => s * inchToUnit);

    const totalWidth = diameters.reduce((a, b) => a + b, 0) + (burnerCount - 1) * gap + 2 * 1 * inchToUnit; // includes SIDE_PADDING (1" each)
    const leftStart = -totalWidth / 2 + 1 * inchToUnit + diameters[0] / 2;

    const slots: BurnerSlot[] = [];
    let cursor = leftStart;
    for (let i = 0; i < burnerCount; i++) {
      const radius = Math.min((burnerSizes[i] / 2) * inchToUnit, usableHalfDepth);
      slots.push({ x: cursor, z: -lipHeight * 0.5, radius });
      // move cursor by this diameter + gap to next center
      cursor += diameters[i] / 2 + gap + (i + 1 < burnerCount ? diameters[i + 1] / 2 : 0);
    }

    return slots;
  }, [burnerSizes, burnerCount, usableHalfDepth, lipHeight, minGapInch, inchToUnit]);

  // Faucet positions:
  // - California: one faucet per burner, mounted on the back splash (one-to-one)
  // - New York: a faucet between every adjacent pair of burners (N-1 faucets),
  //   except when there is only one burner (one faucet centered).
  const faucetPositions = useMemo(() => {
    if (style === "california") {
      return burnerSlots.map((s) => s.x);
    }

    // New York style
    if (burnerSlots.length === 0) return [];
    if (burnerSlots.length === 1) return [burnerSlots[0].x];

    const positions: number[] = [];
    for (let i = 0; i < burnerSlots.length - 1; i++) {
      positions.push((burnerSlots[i].x + burnerSlots[i + 1].x) / 2);
    }
    return positions;
  }, [burnerSlots, burnerCount, style]);

  // Callback to send burner slots to visual components and collect returned nodes
  const burnerChildren = onBurnerSlots
    ? onBurnerSlots(burnerSlots, trayCenterY + trayHeight / 2, wellDepth)
    : null;

  return (
    <group>
      {/* Legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.12, 0.12, legHeight, 16]} />
          <meshStandardMaterial color={legColor} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Tray body (full) */}
      <mesh position={[0, trayCenterY, 0]}>
        <boxGeometry args={[width, trayHeight, depth]} />
        <meshStandardMaterial color={materialColor} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Front Lip */}
      <mesh position={[0, trayCenterY + trayHeight / 2 + lipHeight / 2, depth / 2 - lipHeight / 2]}>
        <boxGeometry args={[width, lipHeight, lipHeight]} />
        <meshStandardMaterial color={materialColor} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Side Lips */}
      {([-1, 1] as const).map((dir) => (
        <mesh key={dir} position={[dir * (width / 2 - lipHeight / 2), trayCenterY + trayHeight / 2 + lipHeight / 2, 0]}>
          <boxGeometry args={[lipHeight, lipHeight, depth]} />
          <meshStandardMaterial color={materialColor} metalness={0.85} roughness={0.25} />
        </mesh>
      ))}

      {/* Back Splash */}
      <mesh position={[0, trayCenterY + trayHeight / 2 + backHeight / 2, -depth / 2 + lipHeight / 2]}>
        <boxGeometry args={[width, backHeight, lipHeight]} />
        <meshStandardMaterial color={materialColor} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Burner Wells */}
      {burnerSlots.map((slot, i) => (
        <mesh
          key={i}
          position={[slot.x, trayCenterY + trayHeight / 2 - trayThickness - wellDepth / 2, slot.z]}
        >
          <cylinderGeometry args={[slot.radius, slot.radius, wellDepth, 64]} />
          <meshStandardMaterial color="#1f1f1f" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}

      {/* California: gas inlet molds on outside front tray wall (one per burner) */}
      {style === "california" && burnerSlots.map((slot, i) => (
        // place panel recessed slightly into the front tray wall (valve will protrude outward)
        <group key={`inlet-${i}`} position={[slot.x, trayCenterY + trayHeight / 4, depth / 2 - 0.02]}>
          {/* Larger rectangular inlet panel on outside front tray wall */}
          <mesh>
            <boxGeometry args={[0.36, 0.34, 0.02]} />
            <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* L-shaped gas valve: stub -> right arm -> vertical riser */}
          {/** Dimensions **/}
          {/* stubLen along +Z, armLen along +X, vertLen along +Y */}
          <group>
            {/* forward stub */}
            <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.08, 16]} />
              <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.35} />
            </mesh>

            {/* elbow at end of stub */}
            <mesh position={[0, 0, 0.08]}>
              <sphereGeometry args={[0.02, 12, 12]} />
              <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.35} />
            </mesh>

            {/* horizontal arm to the right (+X) */}
            <mesh position={[0.08, 0, 0.08]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.16, 12]} />
              <meshStandardMaterial color="#cfcfcf" metalness={1} roughness={0.12} />
            </mesh>

            {/* elbow at end of arm */}
            <mesh position={[0.16, 0, 0.08]}>
              <sphereGeometry args={[0.018, 12, 12]} />
              <meshStandardMaterial color="#cfcfcf" metalness={1} roughness={0.12} />
            </mesh>

            {/* vertical riser up (+Y) */}
            <mesh position={[0.16, 0.06, 0.08]}>
              <cylinderGeometry args={[0.03, 0.03, 0.12, 12]} />
              <meshStandardMaterial color="#cfcfcf" metalness={1} roughness={0.12} />
            </mesh>

            {/* knob at top of riser */}
            <mesh position={[0.16, 0.12, 0.08]}>
              <cylinderGeometry args={[0.03, 0.03, 0.04, 12]} />
              <meshStandardMaterial color="#cfcfcf" metalness={1} roughness={0.12} />
            </mesh>

            {/* lever extending from top of knob: L-shaped (forward then right) */}
            <group position={[0.16, 0.12, 0.08]}>
              {/* first segment: protrude forward (+Z) */}
              <mesh position={[0, 0, 0.03]}>
                <boxGeometry args={[0.01, 0.01, 0.06]} />
                <meshStandardMaterial color="#cfcfcf" metalness={1} roughness={0.12} />
              </mesh>
              {/* second segment: extend to the right (+X) from the end of first */}
              <mesh position={[0.03, 0, 0.06]}>
                <boxGeometry args={[0.06, 0.01, 0.01]} />
                <meshStandardMaterial color="#cfcfcf" metalness={1} roughness={0.12} />
              </mesh>
            </group>
          </group>
        </group>
      ))}

      {/* Faucets (mounted on back splash). California: one per burner. New York: one per two burners. */}
      {faucetPositions.map((xPos, i) => {
        // dimensions (scene units)
        const tubeRadius = 0.02; // tube and base use same diameter (chrome)
        const baseRadius = tubeRadius;
        const baseLen = 0.12; // base cylinder length along +Z
        const stubHorizontal = 0.08; // L joint horizontal segment (along +Z)
        const stubVertical = 0.12; // L joint vertical segment (along +Y)

        // curve: starts at top of vertical stub, moves forward (+Z) first, then up (+Y),
        // then extends forward to nozzle (optionally angles down slightly)
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, stubVertical, baseLen + stubHorizontal), // start at top of vertical stub
          new THREE.Vector3(0, stubVertical + 0.04, baseLen + stubHorizontal), // forward (+Z)
          new THREE.Vector3(0, stubVertical + 0.09, baseLen + stubHorizontal + 0.6), // then up (+Y)
          new THREE.Vector3(0, stubVertical + 0.01, baseLen + stubHorizontal + 0.70), // extend forward and angle down a bit
        ]);

        const chromeMat = (
          <meshStandardMaterial
            color="#cfcfcf"
            metalness={1}
            roughness={0.12}
          />
        );

        return (
          <group
            key={`faucet-${i}`}
            position={[xPos, trayCenterY + trayHeight + backHeight / 3 + 0.12, -depth / 2 + lipHeight + 0.02]}
          >
            {/* Base cylinder oriented along +Z */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[baseRadius, baseRadius, baseLen, 24]} />
              <meshStandardMaterial color="#222222" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Horizontal stub (along +Z) - connects to base, same diameter as tube */}
            <mesh position={[0, 0, baseLen + stubHorizontal / 2]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[tubeRadius, tubeRadius, stubHorizontal, 16]} />
              {chromeMat}
            </mesh>

            {/* Vertical stub (up along +Y) - top of this is the start point for the curved tube */}
            <mesh position={[0, stubVertical / 2, baseLen + stubHorizontal]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[tubeRadius, tubeRadius, stubVertical, 16]} />
              {chromeMat}
            </mesh>

            {/* Lever handle (visual) - pivoted on side of the base */}
            <group position={[0.01, 0, baseLen / 2]} rotation={[0, 0, Math.PI / 2]}>
              {/* pivot pin */}
              <mesh position={[0, -0.04, 0.15]}>
                <cylinderGeometry args={[0.01, 0.01, 0.06, 12]} />
                {chromeMat}
              </mesh>
              {/* lever bar */}
              <mesh position={[0.04, -0.04, 0.15]}>
                <boxGeometry args={[0.12, 0.03, 0.01]} />
                {chromeMat}
              </mesh>
            </group>

            {/* Faucet tube following the L-first-then-up curve */}
            <mesh>
              <tubeGeometry args={[curve, 64, tubeRadius, 12, false]} />
              {chromeMat}
            </mesh>
          </group>
        );
      })}

      {/* Under-tray connections (gas + water) - visually indicate underside connectors */}
      {/* Gas connector centered underneath the tray */}
      <mesh position={[0, trayCenterY - trayHeight / 2 - 0.12, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.2, 12]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Water connectors under each faucet (one connector per rendered faucet) */}
      {faucetPositions.map((xPos, i) => (
        <mesh
          key={`conn-${i}`}
          position={[xPos, trayCenterY - trayHeight / 2 - 0.08, -depth / 2 + lipHeight + 0.02]}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.16, 12]} />
          <meshStandardMaterial color="#1b4f72" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* Render any visual children provided by caller (e.g., BurnerRing components) */}
      {burnerChildren}
    </group>
  );
}
