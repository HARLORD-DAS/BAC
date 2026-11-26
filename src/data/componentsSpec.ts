export type ComponentId =
  | 'blood-drop'
  | 'blood-zone'
  | 'strip'
  | 'adh-coating'
  | 'nad-coating'
  | 'copper-coil'
  | 'thermal-sensor'
  | 'esp32'
  | 'oled-display'
  | 'battery-power'
  | 'enclosure';

export interface ComponentSpec {
  id: ComponentId;
  name: string;
  shortLabel: string;
  category: 'Sample & Assay' | 'Thermal Path' | 'Electronics & UI' | 'Mechanical';
  scientificFunction: string;
  scientificPrinciple: string;
  connections: string[];
  importantNote?: string;
  specifications: { label: string; value: string; basis: 'Configured' | 'Assumed' | 'Conceptual' }[];
  accentColor: string;
  anchor3D: [number, number, number];
}

export const COMPONENT_SPECS: Record<ComponentId, ComponentSpec> = {
  'blood-drop': {
    id: 'blood-drop',
    name: 'Blood Sample Droplet (Simulated)',
    shortLabel: 'Blood Sample',
    category: 'Sample & Assay',
    scientificFunction:
      'Delivers a metered micro-volume capillary or whole-blood specimen (default 20 µL) onto the strip sample well, introducing potential ethanol solute and thermal mass/wetting energy.',
    scientificPrinciple:
      'Capillary wicking draws the aqueous blood plasma through the porous matrix into the immobilized enzyme reaction zone while introducing wetting, mixing, and ambient-equilibration thermal transients.',
    connections: [
      'Deposited onto the Blood Application Zone of the disposable strip',
      'Flows via microfluidic capillary channel to the ADH + NAD+ reaction pad',
    ],
    importantNote:
      'Both alcohol-present and alcohol-absent blood drops produce background thermal effects from wetting, mixing, evaporation, and temperature equilibration.',
    specifications: [
      { label: 'Default Volume', value: '20 µL (configurable 5–50 µL)', basis: 'Configured' },
      { label: 'Assumed Density', value: '1.055 g/mL (whole blood)', basis: 'Assumed' },
      { label: 'Specific Heat Capacity', value: '3.62 J/(g·K)', basis: 'Assumed' },
      { label: 'Initial Drop Temp', value: 'Ambient + 0.35 °C handling offset (configurable)', basis: 'Assumed' },
    ],
    accentColor: '#b91c1c',
    anchor3D: [-3.55, 0.72, 0],
  },
  'blood-zone': {
    id: 'blood-zone',
    name: 'Blood Application Zone',
    shortLabel: 'Sample Well',
    category: 'Sample & Assay',
    scientificFunction:
      'Hydrophilic receiving well at the distal left end of the disposable strip that accepts the blood droplet and meters wicking into the microfluidic channel.',
    scientificPrinciple:
      'Controlled surface energy and porous wicking regulate fluid arrival rate into the enzyme pad and limit rapid spreading losses.',
    connections: [
      'Receives the 3D Blood Sample Droplet',
      'Feeds the microfluidic capillary channel inside the Enzyme-Coated Strip',
    ],
    specifications: [
      { label: 'Well Diameter', value: '4.5 mm circular recess', basis: 'Conceptual' },
      { label: 'Channel Width', value: '1.2 mm capillary track', basis: 'Conceptual' },
      { label: 'Wetting Time Constant', value: '~2.5 s capillary fill window', basis: 'Assumed' },
    ],
    accentColor: '#dc2626',
    anchor3D: [-3.55, 0.34, 0],
  },
  strip: {
    id: 'strip',
    name: 'Disposable Enzyme-Coated Strip',
    shortLabel: 'Disposable Strip',
    category: 'Sample & Assay',
    scientificFunction:
      'Single-use polymeric/cellulose substrate carrying the sample well, capillary channel, and immobilized biochemical reagent pad directly above the thermal transfer element.',
    scientificPrinciple:
      'Provides mechanical registration in the insulated housing slot and a thin thermal conduction path (thickness-dependent thermal resistance) from the reaction pad to the copper element.',
    connections: [
      'Inserted through the left guide slot of the Insulated Outer Enclosure',
      'Supports the Blood Application Zone, ADH Coating, and NAD+ Coating',
      'Rests directly atop the Copper Spiral Coil carrier',
    ],
    importantNote:
      'Strip substrate thickness and thermal conductivity directly limit how fast and how much reaction heat reaches the copper element before dissipating to air.',
    specifications: [
      { label: 'Strip Dimensions', value: '52 × 11 × 0.35 mm (adjustable)', basis: 'Configured' },
      { label: 'Substrate Thermal k', value: '0.22 W/(m·K) (polymer/cellulose composite)', basis: 'Assumed' },
      { label: 'Reaction Pad Area', value: '8.0 × 6.0 mm (48 mm²)', basis: 'Assumed' },
    ],
    accentColor: '#1e73b8',
    anchor3D: [-2.15, 0.32, 0],
  },
  'adh-coating': {
    id: 'adh-coating',
    name: 'ADH (Alcohol Dehydrogenase) Coating',
    shortLabel: 'ADH Coating',
    category: 'Sample & Assay',
    scientificFunction:
      'Catalyzes the selective enzymatic oxidation of ethanol to acetaldehyde using NAD+ as the obligatory hydride/electron acceptor.',
    scientificPrinciple:
      'Enzymatic catalysis lowers the activation barrier for ethanol oxidation (Ethanol + NAD+ --(ADH)--> Acetaldehyde + NADH + H+), converting chemical free energy into enthalpy release.',
    connections: [
      'Immobilized within the reagent pad on the Disposable Strip',
      'Co-localized with the NAD+ Cofactor Coating',
      'Transfers generated biochemical enthalpy downward into the Copper Spiral Coil',
    ],
    importantNote:
      'ADH activity governs reaction rate (d[NADH]/dt) and thermal power (mW), but does not change total stoichiometric enthalpy unless substrate or cofactor is limiting.',
    specifications: [
      { label: 'Enzyme Class', value: 'EC 1.1.1.1 (Alcohol Dehydrogenase)', basis: 'Conceptual' },
      { label: 'Default Loading', value: '2.5 U equivalent immobilized activity', basis: 'Assumed' },
      { label: 'Assumed Km (Ethanol)', value: '1.2 mM (apparent immobilized)', basis: 'Assumed' },
    ],
    accentColor: '#d97706',
    anchor3D: [-1.45, 0.39, -0.14],
  },
  'nad-coating': {
    id: 'nad-coating',
    name: 'NAD+ Cofactor Coating',
    shortLabel: 'NAD+ Coating',
    category: 'Sample & Assay',
    scientificFunction:
      'Serves as the stoichiometric oxidized nicotinamide adenine dinucleotide electron acceptor required for ADH turnover, being reduced to NADH + H+.',
    scientificPrinciple:
      'Two-electron (hydride) transfer converts NAD+ to NADH in 1:1 molar stoichiometry with oxidized ethanol. Cofactor depletion caps maximum reaction conversion if ethanol exceeds immobilized NAD+.',
    connections: [
      'Co-immobilized with ADH Coating in the reaction pad',
      'Limits reaction velocity via two-substrate Michaelis-Menten kinetics when depleted',
    ],
    importantNote:
      'NADH formation (mol) and thermal heat release (J) are distinct physical quantities linked via an apparent reaction enthalpy (ΔH_app), which depends on buffer protonation and matrix conditions.',
    specifications: [
      { label: 'Cofactor Role', value: 'Stoichiometric hydride/electron acceptor', basis: 'Conceptual' },
      { label: 'Immobilized Reservoir', value: '35 mM effective hydrated concentration', basis: 'Assumed' },
      { label: 'Assumed Km (NAD+)', value: '0.25 mM', basis: 'Assumed' },
    ],
    accentColor: '#0284c7',
    anchor3D: [-1.45, 0.39, 0.14],
  },
  'copper-coil': {
    id: 'copper-coil',
    name: 'COPPER THERMAL TRANSFER COIL',
    shortLabel: 'Copper Coil',
    category: 'Thermal Path',
    scientificFunction:
      'Transfers thermal energy from the reaction region on the disposable strip towards the thermal sensor beneath it.',
    scientificPrinciple:
      'Passive heat conduction through copper (Fourier’s Law: q = -k · ∇T). Spreads lateral heat from the reaction pad toward the sensor contact interface.',
    connections: [
      'Located directly underneath the Disposable Strip reaction zone',
      'Mounted above the Thermal Sensor on a silver carrier frame',
      'Thermally isolated from the outer case by the Insulated Outer Enclosure',
    ],
    importantNote:
      'IMPORTANT: The copper coil does NOT directly generate electrical current from the biochemical reaction, and it does NOT amplify thermal energy. Adding copper mass increases thermal capacitance (C_th), which damps peak ΔT while smoothing noise.',
    specifications: [
      { label: 'Material', value: 'Electrolytic Copper (k = 398 W/(m·K) default)', basis: 'Configured' },
      { label: 'Geometry Options', value: 'Rectangular Spiral / Serpentine / Solid Plate', basis: 'Configured' },
      { label: 'Default Thickness', value: '0.80 mm (adjustable 0.2–2.0 mm)', basis: 'Configured' },
      { label: 'Carrier Block', value: 'Brushed aluminum/polymer isolated frame', basis: 'Conceptual' },
    ],
    accentColor: '#c86d3b',
    anchor3D: [-1.45, -0.02, 0],
  },
  'thermal-sensor': {
    id: 'thermal-sensor',
    name: 'Active & Reference Thermal Sensor Assembly',
    shortLabel: 'Thermal Sensor',
    category: 'Thermal Path',
    scientificFunction:
      'Measures micro-kelvin/milli-kelvin temperature changes coupled through the copper coil (active channel) alongside an isolated reference thermal channel for ambient drift rejection.',
    scientificPrinciple:
      'Thermoresistive / thermopile / precision IC temperature transduction converts local temperature difference into an electrical voltage or digital register value.',
    connections: [
      'Positioned directly beneath the Copper Spiral Coil across a thin thermal interface layer',
      'Transmits electrical sensor signals via wiring harness to the ESP32 ADC/I2C bus',
      'Paired with a thermally isolated Reference Sensor inside the housing',
    ],
    importantNote:
      'Differential measurement (T_active − T_reference) rejects slow ambient drift, but still detects background blood wetting and mixing heat present in alcohol-free blood.',
    specifications: [
      { label: 'Package', value: 'SMD QFN sensor IC on tan ceramic/FR4 carrier', basis: 'Conceptual' },
      { label: 'Simulated Resolution', value: '0.001 °C (1 mK) digital readout', basis: 'Assumed' },
      { label: 'Simulated Noise Floor', value: '±0.0018 °C RMS', basis: 'Assumed' },
      { label: 'Interface Standoff', value: '0.40 mm TIM layer (adjustable)', basis: 'Configured' },
    ],
    accentColor: '#eab308',
    anchor3D: [-1.45, -0.45, 0],
  },
  esp32: {
    id: 'esp32',
    name: 'ESP32 Processing & Data Handling Module',
    shortLabel: 'ESP32 Board',
    category: 'Electronics & UI',
    scientificFunction:
      'Acquires simulated active and reference thermal channel readings, performs baseline subtraction, low-pass filtering, kinetic window integration, and drives the OLED display.',
    scientificPrinciple:
      'Microcontroller signal acquisition, differential compensation (ΔT = T_active − T_ref), moving-average filtering, and I2C/SPI display telemetry formatting.',
    connections: [
      'Receives electrical signals from the Thermal Sensor carrier',
      'Powered by the Battery & Power Section',
      'Drives the OLED Display and front illuminated control ring',
    ],
    importantNote:
      'Software simulation only: this application models ESP32 acquisition and signal processing mathematically and does not claim physical hardware connectivity or clinical BAC calibration.',
    specifications: [
      { label: 'Module Form Factor', value: 'ESP32-WROOM style RF shield + custom carrier PCB', basis: 'Conceptual' },
      { label: 'Simulated ADC/Bus', value: '16-bit differential / I2C telemetry at 20 Hz', basis: 'Assumed' },
      { label: 'Firmware Pipeline', value: 'Sample -> Filter -> ΔT Integration -> OLED Render', basis: 'Configured' },
    ],
    accentColor: '#2563eb',
    anchor3D: [1.35, -0.15, 0],
  },
  'oled-display': {
    id: 'oled-display',
    name: 'OLED Display & User Button Interface',
    shortLabel: 'OLED Display',
    category: 'Electronics & UI',
    scientificFunction:
      'Displays live simulated assay telemetry including sample volume, reaction mode (ACTIVE / BACKGROUND), thermal response, sensor status, and simulation state.',
    scientificPrinciple:
      'Self-emissive monochrome/cyan-blue OLED matrix driven via simulated I2C frames from the ESP32 controller, paired with an illuminated ring trigger button.',
    connections: [
      'Mounted in the upper white lid of the Outer Enclosure',
      'Receives rendered display buffers from the ESP32 module',
    ],
    importantNote:
      'Because thermal feasibility requires experimental validation, the OLED intentionally avoids outputting a fake calibrated clinical BAC value.',
    specifications: [
      { label: 'Display Type', value: '128×64 dual-color/cyan OLED panel', basis: 'Conceptual' },
      { label: 'Update Cadence', value: 'Synced live with simulation stage & ΔT', basis: 'Configured' },
      { label: 'Control Ring', value: 'Illuminated LED status ring button', basis: 'Conceptual' },
    ],
    accentColor: '#06b6d4',
    anchor3D: [1.1, 1.08, 0],
  },
  'battery-power': {
    id: 'battery-power',
    name: 'Battery & Power Management Section',
    shortLabel: 'Battery & Power',
    category: 'Electronics & UI',
    scientificFunction:
      'Supplies regulated low-noise 3.3 V DC power to the ESP32, thermal sensor frontend, and OLED display.',
    scientificPrinciple:
      'Single-cell Li-Po energy storage with LDO regulation to minimize electrical self-heating and power-supply ripple near the micro-thermal sensor.',
    connections: [
      'Housed in the rear insulated power bay beneath the ESP32 board',
      'Feeds power harness to the ESP32 and Thermal Sensor bias circuit',
    ],
    importantNote:
      'Quiescent power dissipation contributes a minor steady background thermal offset (~0.008 °C) accounted for in both active and reference channels.',
    specifications: [
      { label: 'Cell Chemistry', value: '3.7 V Li-Po pouch cell (conceptual)', basis: 'Conceptual' },
      { label: 'Regulated Rail', value: '3.3 V low-noise LDO', basis: 'Assumed' },
      { label: 'Self-Heating Offset', value: '+8 mK steady housing bias', basis: 'Assumed' },
    ],
    accentColor: '#10b981',
    anchor3D: [2.65, -0.45, 0],
  },
  enclosure: {
    id: 'enclosure',
    name: 'Insulated Outer Enclosure',
    shortLabel: 'Outer Enclosure',
    category: 'Mechanical',
    scientificFunction:
      'Provides mechanical protection, strip insertion alignment, and thermal isolation from external air drafts and user hand warmth.',
    scientificPrinciple:
      'Low-thermal-conductivity polymer shell (blue base + white top cover) enclosing an internal air-gap chassis reduces convective heat loss coefficient h_loss.',
    connections: [
      'Surrounds the Copper Coil, Thermal Sensor, ESP32, and Battery Bay',
      'Provides the left-side slot guide for the Disposable Strip',
      'Houses the OLED Display and illuminated ring button in the upper white shell',
    ],
    specifications: [
      { label: 'Construction', value: 'Blue ABS/PC insulated lower shell + white upper bezel', basis: 'Conceptual' },
      { label: 'Internal Chassis', value: 'Dark charcoal mounting frame with standoffs', basis: 'Conceptual' },
      { label: 'Insulation Effectiveness', value: '82% default isolation factor (adjustable)', basis: 'Configured' },
    ],
    accentColor: '#155d99',
    anchor3D: [0.1, -0.65, 1.05],
  },
};

export const COMPONENT_LIST: ComponentSpec[] = Object.values(COMPONENT_SPECS);
