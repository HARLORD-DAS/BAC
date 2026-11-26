# Interactive 3D Thermochemical Blood Alcohol Biosensor

An interactive 3D biomedical CAD reconstruction and coupled biochemical–thermal simulation platform built with **React**, **TypeScript**, **Three.js**, **React Three Fiber**, **Drei**, and **Tailwind CSS**.

> **Scientific Transparency Notice:** This application models a *conceptual* thermochemical biosensor architecture. All kinetic rates, apparent enthalpies, thermal resistances, and simulated ESP32/OLED outputs are exploratory engineering simulations. It does **not** claim clinical diagnostic accuracy, validated BAC calibration, or live hardware connectivity.

---

## Implemented Architecture & Features

### 1. Image-Guided 3D CAD Reconstruction (`src/components/BiosensorScene3D.tsx`)
Reconstructs the proposed handheld biosensor on a pure `#FFFFFF` studio canvas with blue, white, silver, and copper materials:
- **Insulated Outer Enclosure**: Medical blue lower housing, dark internal chassis with standoffs, strip guide clips, and upper white cutaway lid with illuminated blue ring button.
- **Disposable Enzyme-Coated Strip**: White microfluidic strip with circular blood application well, capillary track, metallic alignment stop, and co-immobilized **ADH** and **NAD⁺** reagent pad.
- **Interactive 3D Blood Drop**: Volume-scaled glossy crimson droplet (`5–50 µL`, default `20 µL`) that highlights on click, opens sample controls, and animates onto the strip and down the capillary channel.
- **Copper Thermal Transfer Element**: Recessed rectangular spiral coil (switchable to serpentine or solid plate) mounted in a brushed silver carrier plate directly beneath the reaction pad.
- **Active & Reference Thermal Sensors**: QFN sensor package on ceramic/FR4 carrier beneath the copper element plus an isolated reference channel sensor.
- **ESP32 & Power Bay**: Matte black PCB with silver RF shield can, gold header pins, USB port, Li-Po battery bay, and animated signal pulses to the live **CanvasTexture OLED Display**.
- **Exploded View**: Smoothly separates all subassemblies along assembly axes with dashed leader lines while keeping every part clickable.

### 2. Coupled Mathematical Model (`src/simulation/biosensorModel.ts`)
- **Enzymatic Kinetics**:
  $$\text{Ethanol} + \text{NAD}^+ \xrightarrow{\text{ADH}} \text{Acetaldehyde} + \text{NADH} + \text{H}^+$$
  Solved over `0–60 s` (`dt = 0.1 s`) using a two-substrate Michaelis–Menten rate expression modulated by capillary wetting dynamics.
- **Distinction Between NADH and Heat**:
  - Molar NADH formation (`nmol`) tracks chemical conversion.
  - Reaction thermal power equals $\dot{Q}_{\text{rxn}} = (-\Delta H_{\text{app}}) \cdot \frac{dn_{\text{NADH}}}{dt}$, where $\Delta H_{\text{app}}$ is explicitly treated as an **assumed, non-universal** apparent enthalpy configurable by the user.
- **Background Thermal Effects (Condition B)**:
  - Models capillary wetting/hydration enthalpy, sample-to-device initial equilibration, and evaporative/mixing cooling at the air interface so alcohol-free blood produces a realistic non-zero thermal transient rather than an artificial `0 °C` output.
- **4-Node Lumped RC Thermal Network**:
  - Nodes: Reaction Zone ($T_{\text{rxn}}$), Copper Element ($T_{\text{Cu}}$), Active Thermal Sensor ($T_{\text{sensor}}$), and Isolated Reference Sensor ($T_{\text{ref}}$).
  - Uses configured geometry (`rectangular-spiral`, `serpentine`, `solid-plate`), copper thickness, thermal conductivity $k$, strip thickness, sensor standoff gap, ambient temperature, and housing insulation factor.
  - Explicitly preserves energy conservation: copper conducts and spreads heat passively without amplifying thermal energy, and larger copper mass increases thermal capacitance $C_{\text{Cu}}$ (damping peak $\Delta T$).

### 3. Navigation Tabs
1. **3D Device** — Interactive 3D CAD viewport, exploded view, thermal overlay, clickable components, 12 live coupled telemetry parameters, and live temperature/heat-flow graphs.
2. **Interactive Components** — Full engineering catalog of all 10+ components with scientific principles, interconnections, and parameter provenance (`Configured`, `Assumed`, `Conceptual`).
3. **Blood Simulation** — Condition A (With Alcohol) vs Condition B (Without Alcohol), volume/concentration controls, background heat breakdown, and 5-stage sequence tracker.
4. **Biochemical Reaction** — ADH & NAD⁺ kinetic controls, species concentration vs time curves, and NADH vs enthalpy distinction.
5. **Thermal Simulation** — Ambient, strip thickness, insulation, and enthalpy sliders with multi-node Temperature vs Time and Heat Flow vs Time plots.
6. **Copper Coil Analysis** — Geometry selector, thermal resistance breakdown ($R_{\text{strip}} + R_{\text{Cu}} + R_{\text{TIM}}$), thermal capacitance $C_{\text{Cu}}$, and RC time constant $\tau$.
7. **ESP32 Electronics** — Simulated acquisition pipeline (`Sensor → ADC → Differential EMA Filter → OLED`) with live register readouts.
8. **OLED Display** — High-resolution live OLED mirror synced 1:1 with the 3D device screen.
9. **Results Comparison** — Side-by-side Condition A vs Condition B metrics, overlay comparison graphs, and parameter assumptions table.

---

## Setup & Running Locally

```powershell
cd C:\Users\KARTHIK\.gemini\antigravity\scratch\thermochemical-bac-biosensor
npm.cmd install
npm.cmd run dev
```

To create a production build and verify TypeScript types:

```powershell
npm.cmd run build
```
