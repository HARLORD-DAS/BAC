export type SampleCondition = 'WITH_ALCOHOL' | 'WITHOUT_ALCOHOL';

export type CopperGeometry = 'rectangular-spiral' | 'serpentine' | 'solid-plate';

export type SimulationStageId = 1 | 2 | 3 | 4 | 5;

export interface SimulationConfig {
  condition: SampleCondition;
  sampleVolumeUl: number; // Default: 20 uL (5 - 50 uL)
  ethanolConcentrationMgDl: number; // Hypothetical BAC-equivalent input (10 - 300 mg/dL)
  adhActivityUnits: number; // Immobilized ADH units (0.5 - 6.0 U, assumed)
  nadInitialMmolL: number; // Effective hydrated NAD+ concentration (5 - 60 mM, assumed)
  reactionRateScale: number; // Kinetic rate multiplier (0.25 - 2.5)
  reactionEnthalpyKJPerMol: number; // Apparent reaction enthalpy magnitude |ΔH_app| (20 - 110 kJ/mol, assumed)
  copperGeometry: CopperGeometry;
  copperThicknessMm: number; // 0.2 - 2.0 mm
  copperConductivityWmK: number; // 50 - 401 W/(m·K)
  sensorOffsetMm: number; // Interface/standoff gap 0.1 - 2.5 mm
  stripThicknessMm: number; // 0.1 - 1.0 mm
  ambientTempC: number; // 15 - 35 °C
  insulationFactor: number; // 0.2 - 0.95 (housing thermal isolation)
}

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  condition: 'WITH_ALCOHOL',
  sampleVolumeUl: 20,
  ethanolConcentrationMgDl: 80, // 0.08% w/v hypothetical input
  adhActivityUnits: 2.5,
  nadInitialMmolL: 35,
  reactionRateScale: 1.0,
  reactionEnthalpyKJPerMol: 65, // Assumed apparent ΔH_app including buffer protonation
  copperGeometry: 'rectangular-spiral',
  copperThicknessMm: 0.8,
  copperConductivityWmK: 398,
  sensorOffsetMm: 0.4,
  stripThicknessMm: 0.35,
  ambientTempC: 23.0,
  insulationFactor: 0.82,
};

export interface ParameterMetadata {
  key: keyof SimulationConfig;
  label: string;
  unit: string;
  classification: 'Assumed' | 'Configured' | 'Literature-Guided';
  note: string;
}

export const MODEL_PARAMETER_DOCS: ParameterMetadata[] = [
  {
    key: 'sampleVolumeUl',
    label: 'Blood Sample Volume',
    unit: 'µL',
    classification: 'Configured',
    note: 'User-selectable specimen volume (default 20 µL, one drop). Scales total ethanol moles and blood thermal mass.',
  },
  {
    key: 'ethanolConcentrationMgDl',
    label: 'Hypothetical Ethanol Concentration',
    unit: 'mg/dL',
    classification: 'Configured',
    note: 'Hypothetical test concentration in Condition A (80 mg/dL ≈ 17.36 mM). Set to 0 mg/dL added ethanol in Condition B.',
  },
  {
    key: 'reactionEnthalpyKJPerMol',
    label: 'Apparent Reaction Enthalpy (-ΔH_app)',
    unit: 'kJ/mol',
    classification: 'Assumed',
    note: 'Not a universal constant: apparent enthalpy depends on buffer ionization, pH, and immobilized enzyme matrix hydration.',
  },
  {
    key: 'adhActivityUnits',
    label: 'Immobilized ADH Catalytic Activity',
    unit: 'U',
    classification: 'Assumed',
    note: 'Assumed effective enzyme activity immobilized in the strip pad; determines kinetic turnover rate, not equilibrium enthalpy.',
  },
  {
    key: 'nadInitialMmolL',
    label: 'Immobilized NAD+ Cofactor Pool',
    unit: 'mM',
    classification: 'Assumed',
    note: 'Assumed effective hydrated cofactor concentration available in the reaction pad; acts as stoichiometric electron acceptor.',
  },
  {
    key: 'copperConductivityWmK',
    label: 'Copper Thermal Conductivity (k_Cu)',
    unit: 'W/(m·K)',
    classification: 'Literature-Guided',
    note: 'Pure annealed copper ≈ 398 W/(m·K) at ~296 K. Adjustable to explore alloy or contact degradation effects.',
  },
  {
    key: 'copperThicknessMm',
    label: 'Copper Element Thickness',
    unit: 'mm',
    classification: 'Configured',
    note: 'Affects both cross-sectional conduction area (lower R_th) and thermal mass C_th = ρ·c·V (higher C_th damps peak ΔT).',
  },
  {
    key: 'insulationFactor',
    label: 'Enclosure Insulation Factor',
    unit: '0–1',
    classification: 'Assumed',
    note: 'Models reduction in convective/conductive heat loss to ambient air provided by the insulated outer housing.',
  },
];

export interface SimulationDataPoint {
  timeS: number;
  stage: SimulationStageId;
  wettingFraction: number; // 0 - 1
  ethanolMm: number; // mM remaining
  nadMm: number; // mM remaining
  nadhMm: number; // mM formed
  nadhNmol: number; // absolute nmol NADH formed
  reactionProgress: number; // 0 - 1 (fractional conversion of limiting reactant)
  adhInstantActivityPct: number; // 0 - 100% effective catalytic engagement
  nadAvailabilityPct: number; // 0 - 100% remaining cofactor

  // Heat flows in mW (milliwatts)
  qReactionMw: number; // Biochemical enthalpy release rate
  qWettingMw: number; // Capillary wetting & matrix hydration heat
  qMixingEvapMw: number; // Mixing + evaporative cooling loss (can be negative)
  qEquilibrationMw: number; // Sample-to-device initial ΔT heat exchange
  qTotalInputMw: number; // Net heat entering reaction zone
  qToCopperMw: number; // Heat conducted from strip to copper coil
  qToSensorMw: number; // Heat conducted from copper coil to active sensor
  qHeatLossMw: number; // Combined losses to ambient & housing

  // Temperatures in °C
  tempReactionZoneC: number;
  tempCopperCoilC: number;
  tempThermalSensorC: number;
  tempReferenceSensorC: number;
  deltaTempActiveVsRefC: number; // T_sensor - T_ref (°C)
  deltaTempActiveVsRefMk: number; // in milliKelvin (mK)

  // Electronics & OLED simulation
  esp32AdcCounts: number; // Simulated 16-bit differential ADC reading
  esp32VoltageMv: number; // Simulated front-end amplified voltage (mV)
  esp32ProcessedMk: number; // Filtered differential thermal signal (mK)
}

export interface ThermalNetworkMetrics {
  geometryLabel: string;
  effectivePathLengthMm: number;
  effectiveAreaMm2: number;
  copperVolumeMm3: number;
  copperMassG: number;
  copperThermalCapacitanceJPerK: number;
  stripThermalResistanceKPerW: number;
  copperThermalResistanceKPerW: number;
  interfaceThermalResistanceKPerW: number;
  totalPathResistanceKPerW: number;
  thermalTimeConstantS: number;
  housingLossConductanceWPerK: number;
}

export interface SimulationSummary {
  totalEthanolNmol: number;
  finalNadhNmol: number;
  finalReactionProgressPct: number;
  totalReactionHeatMj: number; // mJ from biochemical reaction
  totalBackgroundHeatMj: number; // mJ from wetting/equilibration/evap
  peakHeatFlowMw: number;
  peakCopperDeltaTMk: number;
  peakSensorDeltaTMk: number;
  finalSensorDeltaTMk: number;
  integratedThermalAreaMkS: number; // mK·s under ΔT curve
  timeToPeakS: number;
  network: ThermalNetworkMetrics;
}

export interface SimulationResult {
  config: SimulationConfig;
  timeline: SimulationDataPoint[];
  summary: SimulationSummary;
}

export const STAGE_DEFINITIONS: {
  id: SimulationStageId;
  title: string;
  startS: number;
  endS: number;
  description: string;
}[] = [
  {
    id: 1,
    title: 'Sample Application',
    startS: 0,
    endS: 8,
    description: 'Blood droplet contacts sample well and wicks along capillary channel.',
  },
  {
    id: 2,
    title: 'Enzymatic Reaction',
    startS: 8,
    endS: 24,
    description: 'Ethanol + NAD+ --(ADH)--> Acetaldehyde + NADH + H+ (or background wetting only).',
  },
  {
    id: 3,
    title: 'Thermal Transfer',
    startS: 24,
    endS: 40,
    description: 'Heat conducts across strip substrate into the copper spiral coil and thermal sensor.',
  },
  {
    id: 4,
    title: 'Electronic Processing',
    startS: 40,
    endS: 52,
    description: 'Thermal sensor voltages are digitized, reference-subtracted, and filtered by ESP32.',
  },
  {
    id: 5,
    title: 'Results',
    startS: 52,
    endS: 60,
    description: 'OLED displays simulated thermal response, reference delta, and diagnostic caveats.',
  },
];

export function getStageAtTime(timeS: number): SimulationStageId {
  if (timeS < 8) return 1;
  if (timeS < 24) return 2;
  if (timeS < 40) return 3;
  if (timeS < 52) return 4;
  return 5;
}

export function computeThermalNetwork(config: SimulationConfig): ThermalNetworkMetrics {
  // Reaction pad contact area = 8 mm x 6 mm = 48 mm^2
  const padAreaMm2 = 48.0;

  // Copper element footprint ~ 16 mm x 12 mm planar region
  let effectivePathLengthMm = 14.0;
  let effectiveAreaMm2 = 1.6 * config.copperThicknessMm * 2.5;
  let fillFactor = 0.52;
  let geometryLabel = 'Rectangular Spiral Coil';

  if (config.copperGeometry === 'serpentine') {
    effectivePathLengthMm = 19.5;
    effectiveAreaMm2 = 1.3 * config.copperThicknessMm * 2.0;
    fillFactor = 0.44;
    geometryLabel = 'Serpentine Trace';
  } else if (config.copperGeometry === 'solid-plate') {
    effectivePathLengthMm = 4.2;
    effectiveAreaMm2 = 12.0 * config.copperThicknessMm;
    fillFactor = 0.92;
    geometryLabel = 'Solid Copper Plate';
  }

  const footprintMm2 = 192.0; // 16 mm x 12 mm
  const copperVolumeMm3 = footprintMm2 * config.copperThicknessMm * fillFactor;
  // Density of copper = 8.96 g/cm^3 = 0.00896 g/mm^3
  const copperMassG = copperVolumeMm3 * 0.00896;
  // Specific heat of copper = 0.385 J/(g·K)
  const copperThermalCapacitanceJPerK = copperMassG * 0.385;

  // Strip thermal resistance: R = L / (k * A), k_strip = 0.22 W/(m·K) (polymer/cellulose composite)
  const stripThicknessM = config.stripThicknessMm * 1e-3;
  const padAreaM2 = padAreaMm2 * 1e-6;
  const kStrip = 0.22;
  const stripThermalResistanceKPerW = stripThicknessM / (kStrip * padAreaM2);

  // Copper element thermal resistance: vertical + lateral spreading
  const pathM = effectivePathLengthMm * 1e-3;
  const effAreaM2 = Math.max(effectiveAreaMm2 * 1e-6, 1e-8);
  const copperThermalResistanceKPerW = pathM / (config.copperConductivityWmK * effAreaM2);

  // Interface / TIM standoff resistance to sensor (k_TIM ~ 1.2 W/(m·K), sensor die area ~ 9 mm^2)
  const sensorAreaM2 = 9e-6;
  const kTim = 1.2;
  const interfaceThermalResistanceKPerW =
    (config.sensorOffsetMm * 1e-3) / (kTim * sensorAreaM2);

  const totalPathResistanceKPerW =
    stripThermalResistanceKPerW +
    copperThermalResistanceKPerW +
    interfaceThermalResistanceKPerW;

  // Housing loss conductance (lower when insulationFactor is high)
  const baseLossWPerK = 0.022;
  const housingLossConductanceWPerK = baseLossWPerK * (1.15 - config.insulationFactor);

  // Lumped thermal RC time constant of copper + sensor assembly
  const sensorCapacitanceJPerK = 0.045;
  const totalCap = copperThermalCapacitanceJPerK + sensorCapacitanceJPerK;
  const effectiveParallelR =
    1 / (1 / Math.max(totalPathResistanceKPerW, 1) + housingLossConductanceWPerK);
  const thermalTimeConstantS = totalCap * effectiveParallelR;

  return {
    geometryLabel,
    effectivePathLengthMm,
    effectiveAreaMm2,
    copperVolumeMm3,
    copperMassG,
    copperThermalCapacitanceJPerK,
    stripThermalResistanceKPerW,
    copperThermalResistanceKPerW,
    interfaceThermalResistanceKPerW,
    totalPathResistanceKPerW,
    thermalTimeConstantS,
    housingLossConductanceWPerK,
  };
}

/**
 * Deterministic mathematical simulation over t = 0..60 s (dt = 0.1 s).
 * Solves two-substrate ADH Michaelis-Menten kinetics coupled to a 4-node lumped RC thermal network.
 */
export function runBiosensorSimulation(config: SimulationConfig): SimulationResult {
  const dt = 0.1;
  const totalTimeS = 60.0;
  const steps = Math.round(totalTimeS / dt);
  const network = computeThermalNetwork(config);

  // Ethanol molar mass = 46.068 g/mol. mg/dL -> g/L = mg/dL * 0.01 -> mol/L = (mg/dL * 0.01) / 46.068
  const initialEtOHMmolL =
    config.condition === 'WITH_ALCOHOL'
      ? ((config.ethanolConcentrationMgDl * 0.01) / 46.068) * 1000
      : 0.0;

  // Hydrated reaction pad effective fluid volume (~sample volume absorbed in pad, capped around 25 uL)
  const padFluidUl = Math.max(8, Math.min(config.sampleVolumeUl, 32));
  // Dilution into hydrated reagent matrix
  const matrixDilutionFactor = config.sampleVolumeUl / (config.sampleVolumeUl + 6.0);

  let cEtOH = initialEtOHMmolL * matrixDilutionFactor; // mM
  let cNAD = config.nadInitialMmolL; // mM
  let cNADH = 0.0; // mM

  const totalEthanolNmol = initialEtOHMmolL * config.sampleVolumeUl; // mM * uL = nmol
  const totalNadNmol = config.nadInitialMmolL * padFluidUl;
  const limitingNmol = Math.min(totalEthanolNmol, totalNadNmol);

  // Michaelis-Menten parameters (assumed immobilized values)
  const kmEtOH = 1.2; // mM
  const kmNAD = 0.25; // mM
  // Vmax in mM/s scaled by ADH activity (U) & rate scale
  // 1 U = 1 umol/min = 16.67 nmol/s; in ~20 uL, 16.67 nmol/s / 20 uL = 0.833 mM/s (immobilized efficiency ~28%)
  const vMaxMmolPerLS =
    ((config.adhActivityUnits * 16.67 * 0.28) / padFluidUl) * config.reactionRateScale;

  // Thermal capacitances (J/K)
  // Reaction zone: blood sample (3.62 J/gK * 1.055 g/mL) + strip pad (~0.025 J/K)
  const cRxn = config.sampleVolumeUl * 1e-3 * 1.055 * 3.62 + 0.025;
  const cCu = Math.max(network.copperThermalCapacitanceJPerK, 0.02);
  const cSensor = 0.045;
  const cRef = 0.048;

  // Thermal conductances (W/K)
  const gStripToCu = 1 / Math.max(network.stripThermalResistanceKPerW, 0.5);
  const gCuToSensor =
    1 /
    Math.max(
      network.copperThermalResistanceKPerW + network.interfaceThermalResistanceKPerW,
      0.5
    );
  const gRxnAirLoss = 0.0085 * (1.15 - 0.75 * config.insulationFactor);
  const gCuHousingLoss = network.housingLossConductanceWPerK;
  const gSensorHousingLoss = 0.004 * (1.1 - config.insulationFactor);
  const gRefHousingCoupling = 0.006 * (1.1 - config.insulationFactor);

  // Initial temperatures (°C): powered chamber equilibrated at housing baseline before drop arrival
  const tAmb = config.ambientTempC;
  // Electronics quiescent bias (~+0.008 °C inside housing)
  const housingBiasC = 0.008;
  let tRxn = tAmb + housingBiasC;
  let tCu = tAmb + housingBiasC;
  let tSensor = tAmb + housingBiasC;
  let tRef = tAmb + housingBiasC;

  // Mild ambient drift wave to prove differential reference rejection
  const ambientDrift = (t: number) => 0.004 * Math.sin((t / 60) * Math.PI * 1.5);

  let totalReactionHeatMj = 0;
  let totalBackgroundHeatMj = 0;
  let peakHeatFlowMw = 0;
  let peakCopperDeltaTMk = 0;
  let peakSensorDeltaTMk = -Infinity;
  let timeToPeakS = 0;
  let integratedThermalAreaMkS = 0;

  let filteredEsp32Mk = 0;
  const timeline: SimulationDataPoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = Number((i * dt).toFixed(2));
    const stage = getStageAtTime(t);

    // Stage 1-2 wetting curve: droplet lands on strip (~2.5s) and wicks into enzyme pad (3s - 10s)
    const arrivalFactor = t < 1.5 ? 0 : Math.min(1, (t - 1.5) / 2.2);
    const wettingFraction =
      t < 3.0 ? 0.05 * arrivalFactor : Math.min(1, 0.05 + 0.95 * (1 - Math.exp(-(t - 3.0) / 3.0)));

    // Reaction rate (only starts meaningfully once sample wets the enzyme pad after ~3.5s)
    const enzymeEngagement = t < 3.5 ? 0 : 1 - Math.exp(-(t - 3.5) / 2.0);
    let rateMmolPerLS = 0;
    if (config.condition === 'WITH_ALCOHOL' && cEtOH > 1e-6 && cNAD > 1e-6) {
      rateMmolPerLS =
        vMaxMmolPerLS *
        enzymeEngagement *
        (cEtOH / (kmEtOH + cEtOH)) *
        (cNAD / (kmNAD + cNAD));
    }

    const dConc = Math.min(rateMmolPerLS * dt, cEtOH, cNAD);
    const actualRateMmolPerLS = dConc / dt;

    // Update chemical species
    cEtOH = Math.max(0, cEtOH - dConc);
    cNAD = Math.max(0, cNAD - dConc);
    cNADH += dConc;

    const nadhNmol = cNADH * padFluidUl;
    const reactionProgress =
      config.condition === 'WITH_ALCOHOL' && limitingNmol > 0
        ? Math.min(1, nadhNmol / limitingNmol)
        : 0;

    // Biochemical heat release rate: Q_dot (W) = ΔH (J/mol) * dn/dt (mol/s)
    // dn/dt (mol/s) = actualRate (mmol/L/s) * 1e-3 * sampleVol(L) * (padFluidUl / sampleVolumeUl)
    const dnDtMolPerS = actualRateMmolPerLS * 1e-3 * (padFluidUl * 1e-6);
    const qReactionW = config.reactionEnthalpyKJPerMol * 1000 * dnDtMolPerS;
    const qReactionMw = qReactionW * 1000;

    // Background thermal effects (present in BOTH Condition A and Condition B!)
    // 1. Capillary wetting & matrix hydration enthalpy (exothermic pulse around t = 3..14s)
    const volScale = config.sampleVolumeUl / 20.0;
    const qWettingMw =
      t >= 2.2
        ? 0.42 * volScale * Math.exp(-Math.pow((t - 5.8) / 3.4, 2))
        : 0;

    // 2. Mixing + evaporative cooling at open sample-air interface (endothermic negative heat flow)
    const qMixingEvapMw =
      t >= 2.0
        ? -0.14 * Math.pow(volScale, 0.65) * (1 - Math.exp(-(t - 2.0) / 4.0)) * (0.85 + 0.15 * (tAmb - 20) / 15)
        : 0;

    // 3. Blood droplet initial equilibration (+0.28 °C finger-stick / handling warmth above ambient)
    const qEquilibrationMw =
      t >= 2.0 && t <= 12.0
        ? 0.24 * volScale * Math.exp(-(t - 2.0) / 2.6)
        : 0;

    const qBgMw = qWettingMw + qMixingEvapMw + qEquilibrationMw;
    const qTotalInputMw = qReactionMw + qBgMw;
    const qTotalInputW = qTotalInputMw * 1e-3;

    // Ambient effective temperature with tiny drift
    const tAmbNow = tAmb + ambientDrift(t);
    const tChamberNow = tAmbNow + housingBiasC;

    // Thermal conduction fluxes (W)
    const qStripToCuW = gStripToCu * (tRxn - tCu);
    const qCuToSensorW = gCuToSensor * (tCu - tSensor);
    const qLossW =
      gRxnAirLoss * (tRxn - tChamberNow) +
      gCuHousingLoss * (tCu - tChamberNow) +
      gSensorHousingLoss * (tSensor - tChamberNow);

    // Integrate node temperatures (Euler sub-stepping for numerical stability at small C_rxn)
    const subSteps = 5;
    const subDt = dt / subSteps;
    for (let s = 0; s < subSteps; s++) {
      const fRxnToCu = gStripToCu * (tRxn - tCu);
      const fCuToSens = gCuToSensor * (tCu - tSensor);
      const fRxnLoss = gRxnAirLoss * (tRxn - tChamberNow);
      const fCuLoss = gCuHousingLoss * (tCu - tChamberNow);
      const fSensLoss = gSensorHousingLoss * (tSensor - tChamberNow);
      const fRefCoupling = gRefHousingCoupling * (tChamberNow - tRef);

      tRxn += ((qTotalInputW - fRxnToCu - fRxnLoss) / cRxn) * subDt;
      tCu += ((fRxnToCu - fCuToSens - fCuLoss) / cCu) * subDt;
      tSensor += ((fCuToSens - fSensLoss) / cSensor) * subDt;
      tRef += (fRefCoupling / cRef) * subDt;
    }

    const deltaC = tSensor - tRef;
    const deltaMk = deltaC * 1000;

    // Deterministic sensor electronic micro-noise (±1.4 mK) + 16-bit ADC model
    const deterministicNoiseMk =
      1.1 * Math.sin(t * 7.3 + 0.4) + 0.55 * Math.cos(t * 17.1);
    const rawMeasuredMk = deltaMk + deterministicNoiseMk;
    // Simulated front-end gain (e.g., instrumentation amp 1 mK -> 0.45 mV)
    const esp32VoltageMv = rawMeasuredMk * 0.45;
    // 16-bit ADC across ±250 mV -> 1 count = 0.00763 mV
    const esp32AdcCounts = Math.round(esp32VoltageMv / 0.00763);
    // ESP32 exponential moving average filter
    filteredEsp32Mk = i === 0 ? rawMeasuredMk : filteredEsp32Mk * 0.85 + rawMeasuredMk * 0.15;

    // Accumulate summary metrics
    totalReactionHeatMj += qReactionMw * dt;
    totalBackgroundHeatMj += (qWettingMw + qEquilibrationMw) * dt;
    if (qTotalInputMw > peakHeatFlowMw) peakHeatFlowMw = qTotalInputMw;

    const cuDeltaMk = (tCu - tRef) * 1000;
    if (cuDeltaMk > peakCopperDeltaTMk) peakCopperDeltaTMk = cuDeltaMk;

    if (deltaMk > peakSensorDeltaTMk) {
      peakSensorDeltaTMk = deltaMk;
      timeToPeakS = t;
    }
    integratedThermalAreaMkS += Math.max(0, deltaMk) * dt;

    const adhInstantActivityPct =
      config.condition === 'WITH_ALCOHOL'
        ? Math.min(100, (actualRateMmolPerLS / Math.max(vMaxMmolPerLS, 1e-6)) * 100)
        : 0;
    const nadAvailabilityPct = (cNAD / Math.max(config.nadInitialMmolL, 1e-6)) * 100;

    timeline.push({
      timeS: t,
      stage,
      wettingFraction,
      ethanolMm: cEtOH,
      nadMm: cNAD,
      nadhMm: cNADH,
      nadhNmol,
      reactionProgress,
      adhInstantActivityPct,
      nadAvailabilityPct,
      qReactionMw,
      qWettingMw,
      qMixingEvapMw,
      qEquilibrationMw,
      qTotalInputMw,
      qToCopperMw: qStripToCuW * 1000,
      qToSensorMw: qCuToSensorW * 1000,
      qHeatLossMw: qLossW * 1000,
      tempReactionZoneC: tRxn,
      tempCopperCoilC: tCu,
      tempThermalSensorC: tSensor,
      tempReferenceSensorC: tRef,
      deltaTempActiveVsRefC: deltaC,
      deltaTempActiveVsRefMk: deltaMk,
      esp32AdcCounts,
      esp32VoltageMv,
      esp32ProcessedMk: filteredEsp32Mk,
    });
  }

  const last = timeline[timeline.length - 1];

  return {
    config,
    timeline,
    summary: {
      totalEthanolNmol,
      finalNadhNmol: last.nadhNmol,
      finalReactionProgressPct: last.reactionProgress * 100,
      totalReactionHeatMj,
      totalBackgroundHeatMj,
      peakHeatFlowMw,
      peakCopperDeltaTMk,
      peakSensorDeltaTMk,
      finalSensorDeltaTMk: last.deltaTempActiveVsRefMk,
      integratedThermalAreaMkS,
      timeToPeakS,
      network,
    },
  };
}

export function getPointAtTime(
  result: SimulationResult,
  timeS: number
): SimulationDataPoint {
  const clamped = Math.max(0, Math.min(60, timeS));
  const idx = Math.min(
    result.timeline.length - 1,
    Math.max(0, Math.round(clamped / 0.1))
  );
  return result.timeline[idx];
}
