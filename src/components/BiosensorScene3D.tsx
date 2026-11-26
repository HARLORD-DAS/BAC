import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Html,
  Line,
  OrbitControls,
  RoundedBox,
} from '@react-three/drei';
import * as THREE from 'three';
import { COMPONENT_SPECS, ComponentId } from '../data/componentsSpec';
import {
  SimulationConfig,
  SimulationDataPoint,
} from '../simulation/biosensorModel';
import { getOledDisplayStrings } from './OledEmulator';

interface BiosensorScene3DProps {
  config: SimulationConfig;
  point: SimulationDataPoint;
  selectedId: ComponentId | null;
  onSelectComponent: (id: ComponentId | null) => void;
  exploded: boolean;
  showThermalOverlay: boolean;
  showLabels: boolean;
  isRunning: boolean;
  hasStarted: boolean;
}

/** Map ΔT (mK) to a scientific thermal heatmap color */
function thermalColor(deltaMk: number): THREE.Color {
  const norm = THREE.MathUtils.clamp(deltaMk / 22.0, 0, 1);
  // Cool copper/slate -> amber -> bright orange-red
  const c = new THREE.Color();
  if (norm < 0.35) {
    c.lerpColors(new THREE.Color('#2563eb'), new THREE.Color('#f59e0b'), norm / 0.35);
  } else {
    c.lerpColors(new THREE.Color('#f59e0b'), new THREE.Color('#ef4444'), (norm - 0.35) / 0.65);
  }
  return c;
}

/** Create curved 3D copper spiral / serpentine tube geometry matching the reference image */
function createCopperTraceGeometry(
  style: SimulationConfig['copperGeometry'],
  thicknessMm: number
): THREE.BufferGeometry {
  const tubeRadius = THREE.MathUtils.clamp(0.022 + thicknessMm * 0.014, 0.024, 0.055);
  const points: THREE.Vector3[] = [];

  if (style === 'rectangular-spiral') {
    // Multi-turn planar rectangular spiral matching the reference image
    const turns = [
      { rx: 0.72, rz: 0.44 },
      { rx: 0.56, rz: 0.33 },
      { rx: 0.40, rz: 0.22 },
      { rx: 0.24, rz: 0.11 },
    ];
    turns.forEach((t, idx) => {
      const nextRx = idx < turns.length - 1 ? turns[idx + 1].rx : t.rx;
      points.push(new THREE.Vector3(-t.rx, 0, -t.rz));
      points.push(new THREE.Vector3(t.rx, 0, -t.rz));
      points.push(new THREE.Vector3(t.rx, 0, t.rz));
      points.push(new THREE.Vector3(-nextRx, 0, t.rz));
    });
    points.push(new THREE.Vector3(-0.24, 0, 0));
  } else if (style === 'serpentine') {
    const cols = 6;
    const xStart = -0.68;
    const xEnd = 0.68;
    const step = (xEnd - xStart) / cols;
    for (let i = 0; i <= cols; i++) {
      const x = xStart + i * step;
      const zA = i % 2 === 0 ? -0.42 : 0.42;
      const zB = i % 2 === 0 ? 0.42 : -0.42;
      points.push(new THREE.Vector3(x, 0, zA));
      points.push(new THREE.Vector3(x, 0, zB));
    }
  } else {
    // Solid plate outline ring (main plate rendered separately)
    points.push(
      new THREE.Vector3(-0.7, 0, -0.42),
      new THREE.Vector3(0.7, 0, -0.42),
      new THREE.Vector3(0.7, 0, 0.42),
      new THREE.Vector3(-0.7, 0, 0.42),
      new THREE.Vector3(-0.7, 0, -0.42)
    );
  }

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.12);
  return new THREE.TubeGeometry(curve, 160, tubeRadius, 12, false);
}

/** Dynamic OLED screen canvas texture synced with live simulation values */
function useOledCanvasTexture(
  config: SimulationConfig,
  point: SimulationDataPoint,
  isRunning: boolean,
  hasStarted: boolean
) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    return c;
  }, []);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [canvas]);

  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const strings = getOledDisplayStrings(config, point, isRunning, hasStarted);

    // OLED deep black background
    ctx.fillStyle = '#050b14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle border
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // Cyan droplet icon on the left matching reference image
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(64, 52);
    ctx.bezierCurveTo(96, 108, 102, 138, 102, 152);
    ctx.arc(64, 152, 38, 0, Math.PI, false);
    ctx.bezierCurveTo(26, 138, 32, 108, 64, 52);
    ctx.fill();

    // Header
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 21px monospace';
    ctx.fillText(strings.title, 125, 44);

    ctx.strokeStyle = 'rgba(56,189,248,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(125, 56);
    ctx.lineTo(486, 56);
    ctx.stroke();

    // Telemetry lines
    ctx.font = '19px monospace';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText(strings.sampleLine, 125, 88);

    ctx.fillStyle =
      config.condition === 'WITH_ALCOHOL' ? '#fcd34d' : '#67e8f9';
    ctx.fillText(strings.reactionLine, 125, 118);

    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(strings.thermalLine, 125, 148);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(strings.statusLine.slice(0, 32), 125, 178);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(strings.resultLine.slice(0, 32), 125, 214);

    texture.needsUpdate = true;
  }, [canvas, texture, config, point, isRunning, hasStarted]);

  return texture;
}

/** Animated heat & electrical flow particles */
const FlowPulses: React.FC<{
  point: SimulationDataPoint;
  hasStarted: boolean;
  showThermalOverlay: boolean;
  exploded: boolean;
}> = ({ point, hasStarted, showThermalOverlay, exploded }) => {
  const heatGroupRef = useRef<THREE.Group>(null);
  const elecGroupRef = useRef<THREE.Group>(null);

  const elecCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.45, -0.44, 0.15),
        new THREE.Vector3(-0.35, -0.38, 0.35),
        new THREE.Vector3(0.45, -0.22, 0.18),
        new THREE.Vector3(1.25, -0.14, 0.0),
        new THREE.Vector3(1.45, 0.55, 0.0),
        new THREE.Vector3(1.25, 1.05, 0.0),
      ]),
    []
  );

  const elecPoints = useMemo(() => elecCurve.getPoints(48), [elecCurve]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (heatGroupRef.current) {
      heatGroupRef.current.children.forEach((child, idx) => {
        const phase = (t * 0.8 + idx * 0.25) % 1;
        const yStart = exploded ? 0.95 : 0.3;
        const yEnd = exploded ? -0.95 : -0.42;
        child.position.y = THREE.MathUtils.lerp(yStart, yEnd, phase);
      });
    }
    if (elecGroupRef.current) {
      elecGroupRef.current.children.forEach((child, idx) => {
        const phase = (t * 0.65 + idx * 0.2) % 1;
        const pos = elecCurve.getPoint(phase);
        child.position.copy(pos);
      });
    }
  });

  const showHeat =
    showThermalOverlay ||
    (hasStarted && (point.stage === 2 || point.stage === 3 || point.stage === 5));
  const showElec = hasStarted && (point.stage === 4 || point.stage === 5);

  return (
    <group>
      {/* Thermal transfer pathway: Reaction zone -> Copper coil -> Thermal sensor */}
      {showHeat && (
        <group ref={heatGroupRef}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={`heat-${i}`} position={[-1.45, 0, (i - 1.5) * 0.08]} rotation-x={Math.PI}>
              <coneGeometry args={[0.055, 0.14, 12]} />
              <meshStandardMaterial
                color="#f97316"
                emissive="#ea580c"
                emissiveIntensity={1.2}
                roughness={0.25}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Electrical signal pathway: Sensor -> ESP32 -> OLED */}
      <Line
        points={elecPoints}
        color={showElec ? '#0ea5e9' : '#1e73b8'}
        lineWidth={showElec ? 2.5 : 1.3}
        transparent
        opacity={showElec ? 0.9 : 0.35}
      />
      {showElec && (
        <group ref={elecGroupRef}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={`elec-${i}`}>
              <sphereGeometry args={[0.048, 12, 12]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={1.6}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

/** Interactive 3D CAD assembly matching the uploaded reference device */
const DeviceAssembly: React.FC<BiosensorScene3DProps> = ({
  config,
  point,
  selectedId,
  onSelectComponent,
  exploded,
  showThermalOverlay,
  showLabels,
  isRunning,
  hasStarted,
}) => {
  const [hoveredId, setHoveredId] = useState<ComponentId | null>(null);

  // Group refs for smooth explode/assemble animation
  const stripGroupRef = useRef<THREE.Group>(null);
  const copperGroupRef = useRef<THREE.Group>(null);
  const sensorGroupRef = useRef<THREE.Group>(null);
  const esp32GroupRef = useRef<THREE.Group>(null);
  const batteryGroupRef = useRef<THREE.Group>(null);
  const topLidGroupRef = useRef<THREE.Group>(null);
  const baseHousingRef = useRef<THREE.Group>(null);
  const bloodDropRef = useRef<THREE.Mesh>(null);
  const moleculesGroupRef = useRef<THREE.Group>(null);

  const oledTexture = useOledCanvasTexture(config, point, isRunning, hasStarted);

  const copperGeo = useMemo(
    () => createCopperTraceGeometry(config.copperGeometry, config.copperThicknessMm),
    [config.copperGeometry, config.copperThicknessMm]
  );

  // Smooth exploded-view and blood-drop animation
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const speed = Math.min(1, delta * 5.5);

    const target = (y: number, x = 0, z = 0) => ({
      x: exploded ? x : 0,
      y: exploded ? y : 0,
      z: exploded ? z : 0,
    });

    const lerpGroup = (ref: React.RefObject<THREE.Group>, tx: number, ty: number, tz: number) => {
      if (!ref.current) return;
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, tx, speed);
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, ty, speed);
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, tz, speed);
    };

    const sT = target(0.82, -0.55, 0);
    lerpGroup(stripGroupRef, sT.x, sT.y, sT.z);

    const cT = target(0.15, 0, 0);
    lerpGroup(copperGroupRef, cT.x, cT.y, cT.z);

    const tsT = target(-0.48, 0, 0);
    lerpGroup(sensorGroupRef, tsT.x, tsT.y, tsT.z);

    const eT = target(0.22, 0.3, 0);
    lerpGroup(esp32GroupRef, eT.x, eT.y, eT.z);

    const bT = target(-0.55, 0.35, 0);
    lerpGroup(batteryGroupRef, bT.x, bT.y, bT.z);

    const lidT = target(1.18, 0.15, 0);
    lerpGroup(topLidGroupRef, lidT.x, lidT.y, lidT.z);

    const baseT = target(-0.68, 0, 0);
    lerpGroup(baseHousingRef, baseT.x, baseT.y, baseT.z);

    // Blood drop descent into sample well during Stage 1
    if (bloodDropRef.current) {
      const volScale = Math.cbrt(config.sampleVolumeUl / 20);
      const dropProgress = hasStarted ? THREE.MathUtils.clamp(point.timeS / 2.8, 0, 1) : 0;
      const baseHoverY = 0.62 + (exploded ? 0.92 : 0);
      const wellY = 0.35 + (exploded ? 0.82 : 0);
      const targetY =
        dropProgress === 0
          ? baseHoverY + Math.sin(t * 2.2) * 0.025
          : THREE.MathUtils.lerp(baseHoverY, wellY, dropProgress);
      bloodDropRef.current.position.y = targetY;
      bloodDropRef.current.position.x = -3.45 + (exploded ? -0.55 : 0);
      const flatten = 1 - dropProgress * 0.48;
      const spread = 1 + dropProgress * 0.35;
      bloodDropRef.current.scale.set(
        volScale * spread,
        volScale * flatten,
        volScale * spread
      );
    }

    // Biochemical molecules subtle Brownian motion in reaction pad
    if (moleculesGroupRef.current) {
      moleculesGroupRef.current.children.forEach((m, idx) => {
        m.position.y = 0.38 + Math.sin(t * 3 + idx * 1.1) * 0.035;
        m.rotation.y = t * 1.2 + idx;
      });
    }
  });

  const handleSelect = (id: ComponentId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectComponent(id);
  };

  const handlePointerOver = (id: ComponentId) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredId(id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHoveredId(null);
    document.body.style.cursor = 'auto';
  };

  const highlightProps = (
    id: ComponentId,
    baseEmissive: string | THREE.Color = '#000000',
    baseIntensity = 0
  ) => {
    const active = selectedId === id;
    const hovered = hoveredId === id;
    return {
      emissive: active ? '#1e73b8' : hovered ? '#38bdf8' : baseEmissive,
      emissiveIntensity: active ? 0.45 : hovered ? 0.25 : baseIntensity,
    };
  };

  const stripThicknessWorld = THREE.MathUtils.clamp(
    0.04 + config.stripThicknessMm * 0.06,
    0.045,
    0.11
  );
  const copperPlateThickness = THREE.MathUtils.clamp(
    0.04 + config.copperThicknessMm * 0.04,
    0.045,
    0.13
  );
  const copperDeltaMk = (point.tempCopperCoilC - point.tempReferenceSensorC) * 1000;
  const rxnDeltaMk = (point.tempReactionZoneC - point.tempReferenceSensorC) * 1000;
  const sensorDeltaMk = point.deltaTempActiveVsRefMk;

  const copperGlowColor = thermalColor(copperDeltaMk);
  const showHeatVisual =
    showThermalOverlay || (hasStarted && point.stage >= 2 && copperDeltaMk > 0.2);

  // Capillary wicking fill progress (t = 2..7 s)
  const wickProgress = hasStarted
    ? THREE.MathUtils.clamp((point.timeS - 2.0) / 5.0, 0, 1)
    : 0;

  return (
    <group position={[0.1, 0.1, 0]}>
      {/* ============================================================
          1. INSULATED OUTER ENCLOSURE (LOWER BLUE SHELL + CHASSIS)
         ============================================================ */}
      <group
        ref={baseHousingRef}
        onClick={handleSelect('enclosure')}
        onPointerOver={handlePointerOver('enclosure')}
        onPointerOut={handlePointerOut}
      >
        {/* Main Blue Insulated Lower Shell */}
        <RoundedBox args={[6.9, 0.85, 2.55]} radius={0.26} smoothness={6} position={[0.45, -0.68, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            color="#1b6ca8"
            roughness={0.34}
            metalness={0.08}
            {...highlightProps('enclosure')}
          />
        </RoundedBox>

        {/* White perimeter collar / middle bezel */}
        <RoundedBox args={[6.82, 0.2, 2.48]} radius={0.1} smoothness={4} position={[0.45, -0.22, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#f1f5f9" roughness={0.28} metalness={0.05} />
        </RoundedBox>

        {/* Dark Charcoal Internal Structural Chassis */}
        <RoundedBox args={[6.2, 0.56, 2.08]} radius={0.12} smoothness={4} position={[0.45, -0.34, 0]} receiveShadow>
          <meshStandardMaterial color="#272d35" roughness={0.55} metalness={0.22} />
        </RoundedBox>

        {/* Front-left Blue Strip Guide Clips flanking the strip slot */}
        <RoundedBox args={[0.75, 0.34, 0.36]} radius={0.06} position={[-2.62, 0.14, -0.68]} castShadow>
          <meshStandardMaterial color="#1e73b8" roughness={0.32} />
        </RoundedBox>
        <RoundedBox args={[0.75, 0.34, 0.36]} radius={0.06} position={[-2.62, 0.14, 0.68]} castShadow>
          <meshStandardMaterial color="#1e73b8" roughness={0.32} />
        </RoundedBox>

        {/* Chassis mounting standoffs */}
        {[
          [-0.2, -0.1, -0.78],
          [2.9, -0.1, -0.78],
          [-0.2, -0.1, 0.78],
          [2.9, -0.1, 0.78],
        ].map(([x, y, z], idx) => (
          <mesh key={idx} position={[x, y, z]}>
            <cylinderGeometry args={[0.07, 0.08, 0.24, 16]} />
            <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* ============================================================
          2. UPPER WHITE SHELL + OLED DISPLAY + ILLUMINATED BUTTON
         ============================================================ */}
      <group ref={topLidGroupRef}>
        {/* Raised White Sculpted Upper Cover (hovering cutaway like reference image) */}
        <RoundedBox
          args={[3.95, 0.52, 2.38]}
          radius={0.24}
          smoothness={6}
          position={[1.55, 0.88, 0]}
          castShadow
          receiveShadow
          onClick={handleSelect('enclosure')}
          onPointerOver={handlePointerOver('enclosure')}
          onPointerOut={handlePointerOut}
        >
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.24}
            metalness={0.05}
            {...highlightProps('enclosure')}
          />
        </RoundedBox>

        {/* OLED Bezel & Live Display Screen */}
        <group
          position={[1.15, 1.13, 0]}
          onClick={handleSelect('oled-display')}
          onPointerOver={handlePointerOver('oled-display')}
          onPointerOut={handlePointerOut}
        >
          <RoundedBox args={[2.15, 0.08, 1.15]} radius={0.04} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.2}
              metalness={0.3}
              {...highlightProps('oled-display')}
            />
          </RoundedBox>
          {/* Live OLED Canvas Plane */}
          <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.92, 0.96]} />
            <meshBasicMaterial map={oledTexture} toneMapped={false} />
          </mesh>
        </group>

        {/* Circular Illuminated Blue Ring Power/Start Button */}
        <group
          position={[2.72, 1.14, 0]}
          onClick={handleSelect('oled-display')}
          onPointerOver={handlePointerOver('oled-display')}
          onPointerOut={handlePointerOut}
        >
          <mesh>
            <cylinderGeometry args={[0.32, 0.34, 0.06, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.21, 0.028, 12, 36]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0ea5e9"
              emissiveIntensity={isRunning ? 2.2 : 1.1}
            />
          </mesh>
        </group>
      </group>

      {/* ============================================================
          3. DISPOSABLE ENZYME-COATED STRIP + BLOOD ZONE + ADH + NAD+
         ============================================================ */}
      <group ref={stripGroupRef}>
        {/* Main White Polymer/Cellulose Strip */}
        <RoundedBox
          args={[4.75, stripThicknessWorld, 0.94]}
          radius={0.02}
          smoothness={3}
          position={[-1.85, 0.28, 0]}
          castShadow
          receiveShadow
          onClick={handleSelect('strip')}
          onPointerOver={handlePointerOver('strip')}
          onPointerOut={handlePointerOut}
        >
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.42}
            metalness={0.02}
            {...highlightProps('strip')}
          />
        </RoundedBox>

        {/* Metallic Right Alignment Clip at Strip Tip */}
        <RoundedBox args={[0.28, 0.22, 0.98]} radius={0.02} position={[0.42, 0.3, 0]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.28} />
        </RoundedBox>

        {/* Blood Application Zone (Sample Well + Microfluidic Track) */}
        <group
          onClick={handleSelect('blood-zone')}
          onPointerOver={handlePointerOver('blood-zone')}
          onPointerOut={handlePointerOut}
        >
          <mesh position={[-3.45, 0.28 + stripThicknessWorld / 2 + 0.005, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.015, 28]} />
            <meshStandardMaterial
              color="#e2e8f0"
              roughness={0.5}
              {...highlightProps('blood-zone')}
            />
          </mesh>
          {/* Microfluidic capillary channel */}
          <mesh position={[-2.45, 0.28 + stripThicknessWorld / 2 + 0.003, 0]}>
            <boxGeometry args={[1.8, 0.008, 0.11]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
          </mesh>
          {/* Animated Blood Wicking Fluid Front */}
          {wickProgress > 0 && (
            <mesh
              position={[
                -3.35 + wickProgress * 0.9,
                0.28 + stripThicknessWorld / 2 + 0.008,
                0,
              ]}
            >
              <boxGeometry args={[Math.max(0.05, wickProgress * 1.85), 0.012, 0.095]} />
              <meshStandardMaterial
                color="#991b1b"
                roughness={0.18}
                emissive="#7f1d1d"
                emissiveIntensity={0.2}
              />
            </mesh>
          )}
        </group>

        {/* Enzyme-Coated Reaction Pad Base + ADH Coating + NAD+ Coating */}
        <group position={[-1.45, 0.28 + stripThicknessWorld / 2 + 0.015, 0]}>
          {/* Cream/amber immobilized enzyme pad */}
          <RoundedBox
            args={[0.92, 0.03, 0.68]}
            radius={0.012}
            onClick={handleSelect('strip')}
            onPointerOver={handlePointerOver('strip')}
            onPointerOut={handlePointerOut}
          >
            <meshStandardMaterial
              color={showHeatVisual ? thermalColor(rxnDeltaMk) : '#f3e3a4'}
              roughness={0.58}
              emissive={showHeatVisual ? thermalColor(rxnDeltaMk) : '#000000'}
              emissiveIntensity={showHeatVisual ? 0.35 : 0}
            />
          </RoundedBox>

          {/* Clickable ADH Coating Zone (Amber catalytic matrix half-layer) */}
          <mesh
            position={[0, 0.02, -0.15]}
            onClick={handleSelect('adh-coating')}
            onPointerOver={handlePointerOver('adh-coating')}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[0.78, 0.016, 0.25]} />
            <meshStandardMaterial
              color="#eab308"
              roughness={0.45}
              {...highlightProps('adh-coating', '#ca8a04')}
            />
          </mesh>

          {/* Clickable NAD+ Cofactor Coating Zone (Sky-blue electron acceptor half-layer) */}
          <mesh
            position={[0, 0.02, 0.15]}
            onClick={handleSelect('nad-coating')}
            onPointerOver={handlePointerOver('nad-coating')}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[0.78, 0.016, 0.25]} />
            <meshStandardMaterial
              color="#38bdf8"
              roughness={0.4}
              {...highlightProps('nad-coating', '#0284c7')}
            />
          </mesh>
        </group>

        {/* Animated Enzymatic Reaction Particles (Stage 2+ in Condition A) */}
        {hasStarted && point.stage >= 2 && (
          <group ref={moleculesGroupRef}>
            {config.condition === 'WITH_ALCOHOL'
              ? [-0.3, -0.1, 0.1, 0.3].map((dx, i) => (
                  <mesh key={`nadh-${i}`} position={[-1.45 + dx, 0.4, (i % 2 === 0 ? -1 : 1) * 0.14]}>
                    <sphereGeometry args={[0.036, 12, 12]} />
                    <meshStandardMaterial
                      color={point.reactionProgress > 0.15 ? '#10b981' : '#f97316'}
                      emissive={point.reactionProgress > 0.15 ? '#059669' : '#ea580c'}
                      emissiveIntensity={1.1}
                    />
                  </mesh>
                ))
              : [-0.2, 0.2].map((dx, i) => (
                  <mesh key={`bg-${i}`} position={[-1.45 + dx, 0.38, 0]}>
                    <sphereGeometry args={[0.026, 10, 10]} />
                    <meshStandardMaterial
                      color="#93c5fd"
                      transparent
                      opacity={0.65}
                    />
                  </mesh>
                ))}
          </group>
        )}
      </group>

      {/* ============================================================
          4. INTERACTIVE 3D BLOOD DROP OBJECT
         ============================================================ */}
      <mesh
        ref={bloodDropRef}
        position={[-3.45, 0.62, 0]}
        castShadow
        onClick={handleSelect('blood-drop')}
        onPointerOver={handlePointerOver('blood-drop')}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.21, 32, 32]} />
        <meshPhysicalMaterial
          color={config.condition === 'WITH_ALCOHOL' ? '#a60d18' : '#8f111a'}
          roughness={0.09}
          metalness={0.02}
          clearcoat={1.0}
          clearcoatRoughness={0.06}
          reflectivity={0.95}
          {...highlightProps('blood-drop')}
        />
      </mesh>

      {/* ============================================================
          5. COPPER SPIRAL COIL & SILVER THERMAL CARRIER BLOCK
         ============================================================ */}
      <group
        ref={copperGroupRef}
        onClick={handleSelect('copper-coil')}
        onPointerOver={handlePointerOver('copper-coil')}
        onPointerOut={handlePointerOut}
      >
        {/* Brushed Silver Carrier Frame */}
        <RoundedBox
          args={[2.15, 0.18, 1.32]}
          radius={0.04}
          position={[-1.35, -0.05, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#b4bcc6"
            metalness={0.76}
            roughness={0.28}
            {...highlightProps('copper-coil')}
          />
        </RoundedBox>

        {/* Recessed Copper Coil / Serpentine / Solid Plate */}
        <group position={[-1.45, 0.04, 0]}>
          {config.copperGeometry === 'solid-plate' && (
            <RoundedBox args={[1.45, copperPlateThickness, 0.88]} radius={0.03} castShadow>
              <meshStandardMaterial
                color={showHeatVisual ? copperGlowColor : '#c86d3b'}
                metalness={0.88}
                roughness={0.22}
                {...highlightProps(
                  'copper-coil',
                  showHeatVisual ? copperGlowColor : '#000000',
                  showHeatVisual ? 0.4 : 0
                )}
              />
            </RoundedBox>
          )}
          <mesh geometry={copperGeo} castShadow receiveShadow>
            <meshStandardMaterial
              color={showHeatVisual ? copperGlowColor : '#d2723c'}
              metalness={0.9}
              roughness={0.2}
              {...highlightProps(
                'copper-coil',
                showHeatVisual ? copperGlowColor : '#000000',
                showHeatVisual ? 0.35 : 0
              )}
            />
          </mesh>
        </group>
      </group>

      {/* ============================================================
          6. THERMAL SENSOR + REFERENCE SENSOR ASSEMBLY
         ============================================================ */}
      <group
        ref={sensorGroupRef}
        onClick={handleSelect('thermal-sensor')}
        onPointerOver={handlePointerOver('thermal-sensor')}
        onPointerOut={handlePointerOut}
      >
        {/* Dark Mounting Pedestal */}
        <RoundedBox args={[1.28, 0.18, 1.05]} radius={0.03} position={[-1.45, -0.52, 0]} castShadow>
          <meshStandardMaterial color="#3c434d" metalness={0.5} roughness={0.45} />
        </RoundedBox>
        {/* Tan Ceramic / FR4 Carrier Board */}
        <RoundedBox args={[0.88, 0.08, 0.72]} radius={0.02} position={[-1.45, -0.41, 0]} castShadow>
          <meshStandardMaterial
            color="#cbb486"
            roughness={0.5}
            {...highlightProps('thermal-sensor')}
          />
        </RoundedBox>
        {/* Active QFN Thermal Sensor IC Chip */}
        <RoundedBox args={[0.38, 0.08, 0.38]} radius={0.015} position={[-1.45, -0.35, 0]} castShadow>
          <meshStandardMaterial
            color={showHeatVisual ? thermalColor(sensorDeltaMk) : '#181c22'}
            roughness={0.35}
            metalness={0.2}
            {...highlightProps(
              'thermal-sensor',
              showHeatVisual ? thermalColor(sensorDeltaMk) : '#000000',
              showHeatVisual ? 0.45 : 0
            )}
          />
        </RoundedBox>
        {/* Silver IC Pin Contacts */}
        {[-0.12, -0.04, 0.04, 0.12].map((p, idx) => (
          <React.Fragment key={idx}>
            <mesh position={[-1.45 + p, -0.37, 0.21]}>
              <boxGeometry args={[0.035, 0.02, 0.05]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[-1.45 + p, -0.37, -0.21]}>
              <boxGeometry args={[0.035, 0.02, 0.05]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Isolated Reference Thermal Sensor */}
        <RoundedBox args={[0.34, 0.06, 0.28]} radius={0.015} position={[-0.45, -0.44, 0.75]} castShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </RoundedBox>
      </group>

      {/* ============================================================
          7. ESP32 DEVELOPMENT BOARD
         ============================================================ */}
      <group
        ref={esp32GroupRef}
        onClick={handleSelect('esp32')}
        onPointerOver={handlePointerOver('esp32')}
        onPointerOut={handlePointerOut}
      >
        {/* Matte Black PCB */}
        <RoundedBox args={[2.35, 0.08, 1.55]} radius={0.03} position={[1.45, -0.18, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            color="#15181e"
            roughness={0.48}
            metalness={0.18}
            {...highlightProps('esp32')}
          />
        </RoundedBox>

        {/* Silver Metallic ESP32-WROOM RF Shield Can */}
        <RoundedBox args={[0.98, 0.16, 0.96]} radius={0.03} position={[1.75, -0.07, 0.05]} castShadow>
          <meshStandardMaterial
            color="#cdd5de"
            metalness={0.86}
            roughness={0.22}
            {...highlightProps('esp32')}
          />
        </RoundedBox>

        {/* PCB Antenna Keepout Strip */}
        <mesh position={[2.38, -0.13, 0.05]}>
          <boxGeometry args={[0.28, 0.02, 0.88]} />
          <meshStandardMaterial color="#1f2937" roughness={0.5} />
        </mesh>

        {/* Secondary Black IC + USB-UART Chip */}
        <RoundedBox args={[0.36, 0.06, 0.36]} radius={0.01} position={[0.78, -0.11, -0.2]} castShadow>
          <meshStandardMaterial color="#0f172a" roughness={0.35} />
        </RoundedBox>

        {/* Gold Header Pin Rows along Top & Bottom Edges */}
        {Array.from({ length: 12 }, (_, i) => -0.95 + i * 0.17).map((dx, idx) => (
          <React.Fragment key={idx}>
            <mesh position={[1.45 + dx, -0.11, -0.68]}>
              <cylinderGeometry args={[0.026, 0.026, 0.09, 10]} />
              <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[1.45 + dx, -0.11, 0.68]}>
              <cylinderGeometry args={[0.026, 0.026, 0.09, 10]} />
              <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Micro-USB Connector */}
        <RoundedBox args={[0.24, 0.12, 0.36]} radius={0.015} position={[2.58, -0.12, 0]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
        </RoundedBox>
      </group>

      {/* ============================================================
          8. BATTERY & POWER MANAGEMENT BAY
         ============================================================ */}
      <group
        ref={batteryGroupRef}
        onClick={handleSelect('battery-power')}
        onPointerOver={handlePointerOver('battery-power')}
        onPointerOut={handlePointerOut}
      >
        <RoundedBox args={[1.45, 0.24, 1.25]} radius={0.05} position={[2.35, -0.45, 0]} castShadow>
          <meshStandardMaterial
            color="#334155"
            metalness={0.45}
            roughness={0.38}
            {...highlightProps('battery-power')}
          />
        </RoundedBox>
        {/* Power Protection Tab */}
        <mesh position={[1.58, -0.42, 0]}>
          <boxGeometry args={[0.14, 0.14, 0.65]} />
          <meshStandardMaterial color="#10b981" roughness={0.45} />
        </mesh>
      </group>

      {/* ============================================================
          9. ANIMATED THERMAL & ELECTRONIC FLOW PULSES + EXPLODED LINES
         ============================================================ */}
      <FlowPulses
        point={point}
        hasStarted={hasStarted}
        showThermalOverlay={showThermalOverlay}
        exploded={exploded}
      />

      {exploded && (
        <group>
          <Line
            points={[
              new THREE.Vector3(-1.45, 1.1, 0),
              new THREE.Vector3(-1.45, -1.0, 0),
            ]}
            color="#94a3b8"
            lineWidth={1.2}
            dashed
            dashSize={0.12}
            gapSize={0.08}
          />
          <Line
            points={[
              new THREE.Vector3(1.6, 2.0, 0),
              new THREE.Vector3(1.6, -1.0, 0),
            ]}
            color="#94a3b8"
            lineWidth={1.2}
            dashed
            dashSize={0.12}
            gapSize={0.08}
          />
        </group>
      )}

      {/* ============================================================
          10. FLOATING SCIENTIFIC CALLOUT LABELS & SELECTED ANCHOR
         ============================================================ */}
      {(showLabels || exploded) &&
        (
          [
            { id: 'blood-drop' as ComponentId, pos: [-3.45 + (exploded ? -0.55 : 0), exploded ? 1.75 : 1.05, 0] as [number, number, number] },
            { id: 'strip' as ComponentId, pos: [-2.15 + (exploded ? -0.55 : 0), exploded ? 1.4 : 0.68, -0.65] as [number, number, number] },
            { id: 'copper-coil' as ComponentId, pos: [-1.45, exploded ? 0.48 : 0.18, 0.85] as [number, number, number] },
            { id: 'thermal-sensor' as ComponentId, pos: [-1.45, exploded ? -0.82 : -0.58, 0.72] as [number, number, number] },
            { id: 'esp32' as ComponentId, pos: [1.55 + (exploded ? 0.3 : 0), exploded ? 0.52 : 0.18, 0.82] as [number, number, number] },
            { id: 'oled-display' as ComponentId, pos: [1.25 + (exploded ? 0.15 : 0), exploded ? 2.65 : 1.55, 0] as [number, number, number] },
            { id: 'enclosure' as ComponentId, pos: [-0.8, exploded ? -1.45 : -0.85, 1.38] as [number, number, number] },
          ]
        ).map((item) => {
          const spec = COMPONENT_SPECS[item.id];
          const isSel = selectedId === item.id;
          return (
            <Html key={item.id} position={item.pos} center distanceFactor={10} zIndexRange={[10, 0]}>
              <button
                type="button"
                onClick={() => onSelectComponent(item.id)}
                className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm transition ${
                  isSel
                    ? 'border-medical-600 bg-medical-600 text-white'
                    : 'border-medical-200 bg-white/95 text-medical-800 hover:border-medical-500 hover:bg-medical-50'
                }`}
              >
                {spec.shortLabel}
              </button>
            </Html>
          );
        })}

      {/* Floating badge exclusively for the clicked/selected component when labels are off */}
      {!showLabels && !exploded && selectedId && (
        <Html
          position={COMPONENT_SPECS[selectedId].anchor3D}
          center
          distanceFactor={9.5}
          zIndexRange={[20, 0]}
        >
          <div className="pointer-events-none flex flex-col items-center">
            <div className="whitespace-nowrap rounded-lg border border-medical-600 bg-white/95 px-3 py-1.5 text-xs font-semibold text-medical-800 shadow-md">
              {COMPONENT_SPECS[selectedId].name}
            </div>
            <div className="h-4 w-0.5 bg-medical-600" />
          </div>
        </Html>
      )}
    </group>
  );
};

export const BiosensorScene3D: React.FC<BiosensorScene3DProps> = (props) => {
  return (
    <div className="relative h-full w-full bg-white">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [-3.4, 3.3, 6.2], fov: 36, near: 0.1, far: 100 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onPointerMissed={() => props.onSelectComponent(null)}
      >
        <color attach="background" args={['#ffffff']} />

        {/* Studio Biomedical Lighting */}
        <ambientLight intensity={0.72} />
        <directionalLight
          position={[5, 8, 6]}
          intensity={1.35}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={25}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <directionalLight position={[-6, 4, -4]} intensity={0.55} color="#dbeafe" />
        <pointLight position={[-1.45, 1.5, 1.2]} intensity={0.45} color="#fff7ed" />

        <Environment preset="studio" environmentIntensity={0.45} />

        <DeviceAssembly {...props} />

        <ContactShadows
          position={[0.2, -1.08, 0]}
          opacity={0.28}
          scale={12}
          blur={2.2}
          far={3.5}
          color="#1e293b"
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.07}
          minDistance={3.2}
          maxDistance={12.5}
          maxPolarAngle={Math.PI * 0.49}
          target={[-0.2, 0.15, 0]}
        />
      </Canvas>
    </div>
  );
};
