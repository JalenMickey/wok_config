import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import React, { Suspense, useState } from "react";

import BaseUnit, { type BurnerSize } from "./BaseUnit";
import BurnerRing from "./BurnerRing";

export default function WokRangeScene() {
  const DEFAULT_SIZES: BurnerSize[] = [13, 15, 13];
  const [burnerSizes, setBurnerSizes] = useState<BurnerSize[]>(DEFAULT_SIZES);
  const burnerColors = ["#ff6600", "#ff9900", "#ff6600", "#ffaa00", "#ff7700", "#ffbb66"];

  const burnerCount = burnerSizes.length;

  // Burner kinds (per-burner type)
  type BurnerKind = "straight" | "spread120" | "spread160" | "focus" | "slow";
  const burnerKindLabels: Record<BurnerKind, string> = {
    straight: "Fire shoot straight up (140,000 BTU)",
    spread120: "Fire spreads out (120,000 BTU)",
    spread160: "Fire spreads out (160,000 BTU)",
    focus: "Focus fire center (140,000 BTU)",
    slow: "Slow cook (90,000 BTU)",
  };
  const [burnerKinds, setBurnerKinds] = useState<BurnerKind[]>(() => DEFAULT_SIZES.map(() => "straight" as BurnerKind));

  const MIN_GAP_INCH = 4; // enforced minimum gap
  const SIDE_PADDING_INCH = 1;
  const [minGapInch] = useState<number>(MIN_GAP_INCH);
  const [kitchenWidthInch, setKitchenWidthInch] = useState<number>(48);
  const [inchToUnit, setInchToUnit] = useState<number>(0.12);

  const computeRequiredWidthInch = (sizes: number[], gapInch: number) => {
    const totalDiameters = sizes.reduce((a, b) => a + b, 0);
    const totalGaps = Math.max(0, sizes.length - 1) * gapInch;
    return totalDiameters + totalGaps + SIDE_PADDING_INCH * 2;
  };

  const requiredWidthInch = computeRequiredWidthInch(burnerSizes as number[], minGapInch);

  type StyleType = "new" | "california";
  type TopType = "black" | "stainless";

  const [styleType, setStyleType] = useState<StyleType>("california");
  const [topType, setTopType] = useState<TopType>("stainless");

  const pricePerBurner = (() => {
    if (styleType === "new" && topType === "black") return 850;
    if (styleType === "new" && topType === "stainless") return 950;
    if (styleType === "california" && topType === "black") return 950;
    if (styleType === "california" && topType === "stainless") return 1100;
    return 0;
  })();

  const singleUnitSurcharge = burnerCount === 1 ? 250 : 0;
  const totalPrice = pricePerBurner * burnerCount + singleUnitSurcharge;

  const fmt = (v: number) => v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

  return (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      <Canvas shadows camera={{ position: [12, 8, 12], fov: 45 }} style={{ width: "100%", height: "100%" }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 15, 10]} intensity={1} castShadow />
          <Environment preset="warehouse" />

          <BaseUnit
            burnerCount={burnerCount}
            burnerSizes={burnerSizes}
            minGapInch={minGapInch}
            inchToUnit={inchToUnit}
            trayThickness={0.15}
            lipHeight={0.1}
            backHeight={1.5}
            legHeight={1.0}
            wellDepth={0.1}
            materialColor="#555555"
            style={styleType === "new" ? "newyork" : "california"}
            onBurnerSlots={(slots, trayTopY, wellDepth) => {
              // Return BurnerRing nodes after layout so BaseUnit can render them
              return slots.map((slot, i) => (
                <BurnerRing
                  key={i}
                  x={slot.x}
                  z={slot.z}
                  radius={slot.radius}
                  trayTopY={trayTopY}
                  wellDepth={wellDepth}
                  color={burnerColors[i]}
                />
              ));
            }}
          />

          <OrbitControls />
        </Suspense>
      </Canvas>

      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.95)", padding: 12, borderRadius: 8, width: 360, boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Options & Quote</div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Style</div>
          <label style={{ display: "block" }}>
            <input type="radio" name="style" value="california" checked={styleType === "california"} onChange={() => setStyleType("california")} /> California style
          </label>
          <label style={{ display: "block" }}>
            <input type="radio" name="style" value="new" checked={styleType === "new"} onChange={() => setStyleType("new")} /> New York style
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Top</div>
          <label style={{ display: "block" }}>
            <input type="radio" name="top" value="black" checked={topType === "black"} onChange={() => setTopType("black")} /> Black iron top
          </label>
          <label style={{ display: "block" }}>
            <input type="radio" name="top" value="stainless" checked={topType === "stainless"} onChange={() => setTopType("stainless")} /> Stainless steel top
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Kitchen fit</div>
          <div style={{ fontSize: 12, marginBottom: 6 }}>Available width (in):</div>
          <input type="number" min={24} max={120} value={kitchenWidthInch} onChange={(e) => setKitchenWidthInch(Number(e.target.value) || 0)} style={{ width: "100%" }} />
          <div style={{ fontSize: 12, marginTop: 6 }}>Required unit length: <strong>{requiredWidthInch.toFixed(1)}"</strong></div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Scene scale: <strong>{inchToUnit.toFixed(3)} units/in</strong></div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input type="number" step={0.01} min={0.01} max={1} value={inchToUnit} onChange={(e) => setInchToUnit(Number(e.target.value) || 0)} style={{ width: 100 }} />
            <div style={{ fontSize: 11, color: "#555", alignSelf: "center" }}>units per inch</div>
          </div>
          {requiredWidthInch > kitchenWidthInch && (
            <div style={{ color: "#b22222", fontSize: 12, marginTop: 6 }}>Warning: unit exceeds available kitchen width</div>
          )}
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Burner count</div>
          <input
            type="number"
            min={1}
            max={6}
            value={burnerCount}
            onChange={(e) => {
              const v = Math.max(1, Math.min(6, Number(e.target.value) || 1));
              setBurnerSizes((prev) => {
                const copy = prev.slice(0, v);
                while (copy.length < v) copy.push(13 as BurnerSize);
                return copy;
              });
              setBurnerKinds((prev) => {
                const copy = prev.slice(0, v);
                while (copy.length < v) copy.push("straight");
                return copy;
              });
            }}
            style={{ width: 80 }}
          />
        </div>

        <div style={{ maxHeight: 220, overflow: "auto", marginBottom: 8 }}>
          {burnerSizes.map((size, i) => (
            <div key={i} style={{ borderTop: i === 0 ? undefined : "1px solid #eee", paddingTop: 8, paddingBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Burner {i + 1}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <select value={size} onChange={(e) => {
                  const val = Number(e.target.value) as BurnerSize;
                  setBurnerSizes((prev) => prev.map((s, idx) => idx === i ? val : s));
                }}>
                  {[13,15,17,19,21].map((opt) => (
                    <option key={opt} value={opt}>{opt}"</option>
                  ))}
                </select>

                <select value={burnerKinds[i]} onChange={(e) => {
                  const kind = e.target.value as BurnerKind;
                  setBurnerKinds((prev) => prev.map((k, idx) => idx === i ? kind : k));
                }}>
                  {(Object.keys(burnerKindLabels) as BurnerKind[]).map((k) => {
                    const minSize = k === "spread160" || k === "slow" ? 17 : (k === "spread120" ? 13 : 13);
                    return (
                      <option key={k} value={k} disabled={size < minSize}>{burnerKindLabels[k]}</option>
                    );
                  })}
                </select>
              </div>
              {(burnerKinds[i] === "spread160" || burnerKinds[i] === "slow") && size < 17 && (
                <div style={{ color: "#b22222", fontSize: 11, marginTop: 6 }}>Warning: selected burner type requires minimum 17" ring</div>
              )}
              {burnerKinds[i] === "spread120" && size < 13 && (
                <div style={{ color: "#b22222", fontSize: 11, marginTop: 6 }}>Warning: selected burner type may overheat on small rings</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #eee", paddingTop: 8 }}>
          <div style={{ fontSize: 12 }}>Burners: <strong>{burnerCount}</strong></div>
          <div style={{ fontSize: 12 }}>Per burner: <strong>{fmt(pricePerBurner)}</strong></div>
          {singleUnitSurcharge > 0 && <div style={{ fontSize: 12 }}>Single-unit surcharge: <strong>{fmt(singleUnitSurcharge)}</strong></div>}
          <div style={{ marginTop: 6, fontSize: 14 }}>Total: <strong>{fmt(totalPrice)}</strong></div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#555" }}>Lead time: about 7–10 business days</div>
        </div>
      </div>
    </div>
  );
}
