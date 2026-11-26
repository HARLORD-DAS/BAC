import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Box,
  Cpu,
  Droplets,
  Flame,
  FlaskConical,
  Layers,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Scale,
  Tag,
  Thermometer,
} from 'lucide-react';
import { ComponentId, COMPONENT_LIST } from './data/componentsSpec';
import {
  DEFAULT_SIMULATION_CONFIG,
  getPointAtTime,
  runBiosensorSimulation,
  SimulationConfig,
  STAGE_DEFINITIONS,
} from './simulation/biosensorModel';
import { BiosensorScene3D } from './components/BiosensorScene3D';
import { ComponentInspectorPanel } from './components/ComponentInspectorPanel';
import { OledEmulator } from './components/OledEmulator';
import { MultiLineChart } from './components/ScientificCharts';
import {
  BiochemicalReactionTab,
  BloodSimulationTab,
  CopperCoilAnalysisTab,
  Esp32ElectronicsTab,
  InteractiveComponentsTab,
  OledDisplayTab,
  ResultsComparisonTab,
  ThermalSimulationTab,
} from './components/SimulationDashboardTabs';

type NavTabId =
  | '3d-device'
  | 'interactive-components'
  | 'blood-simulation'
  | 'biochemical-reaction'
  | 'thermal-simulation'
  | 'copper-coil-analysis'
  | 'esp32-electronics'
  | 'oled-display'
  | 'results-comparison';

const NAV_TABS: { id: NavTabId; label: string; icon: React.ReactNode }[] = [
  { id: '3d-device', label: '3D Device', icon: <Box className="h-3.5 w-3.5" /> },
  {
    id: 'interactive-components',
    label: 'Interactive Components',
    icon: <Layers className="h-3.5 w-3.5" />,
  },
  {
    id: 'blood-simulation',
    label: 'Blood Simulation',
    icon: <Droplets className="h-3.5 w-3.5" />,
  },
  {
    id: 'biochemical-reaction',
    label: 'Biochemical Reaction',
    icon: <FlaskConical className="h-3.5 w-3.5" />,
  },
  {
    id: 'thermal-simulation',
    label: 'Thermal Simulation',
    icon: <Thermometer className="h-3.5 w-3.5" />,
  },
  {
    id: 'copper-coil-analysis',
    label: 'Copper Coil Analysis',
    icon: <Flame className="h-3.5 w-3.5" />,
  },
  {
    id: 'esp32-electronics',
    label: 'ESP32 Electronics',
    icon: <Cpu className="h-3.5 w-3.5" />,
  },
  {
    id: 'oled-display',
    label: 'OLED Display',
    icon: <Monitor className="h-3.5 w-3.5" />,
  },
  {
    id: 'results-comparison',
    label: 'Results Comparison',
    icon: <Scale className="h-3.5 w-3.5" />,
  },
];

export function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('3d-device');
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_SIMULATION_CONFIG);
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>(null);
  const [exploded, setExploded] = useState(false);
  const [showThermalOverlay, setShowThermalOverlay] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  // Simulation playback state (0 .. 60 s physical time, played at 3.5x speed = ~17s full run)
  const [simTimeS, setSimTimeS] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const updateConfig = (patch: Partial<SimulationConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  // Run primary simulation and synchronous A/B comparison runs
  const result = useMemo(() => runBiosensorSimulation(config), [config]);
  const compareWithAlcoholResult = useMemo(
    () => runBiosensorSimulation({ ...config, condition: 'WITH_ALCOHOL' }),
    [config]
  );
  const compareNoAlcoholResult = useMemo(
    () => runBiosensorSimulation({ ...config, condition: 'WITHOUT_ALCOHOL' }),
    [config]
  );

  const currentPoint = useMemo(
    () => getPointAtTime(result, simTimeS),
    [result, simTimeS]
  );

  // Animation loop
  useEffect(() => {
    if (!isRunning) return;
    let last = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dtReal = (now - last) / 1000;
      last = now;
      setSimTimeS((prev) => {
        const next = prev + dtReal * 3.5;
        if (next >= 60) {
          setIsRunning(false);
          return 60;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning]);

  const handleSimulateBloodReaction = () => {
    setSimTimeS(0);
    setHasStarted(true);
    setIsRunning(true);
  };

  const handlePauseResume = () => {
    if (!hasStarted) {
      handleSimulateBloodReaction();
      return;
    }
    if (simTimeS >= 60) {
      handleSimulateBloodReaction();
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStarted(false);
    setSimTimeS(0);
  };

  const currentStageDef = STAGE_DEFINITIONS.find((s) => s.id === currentPoint.stage);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-600 text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-medical-800 sm:text-lg">
                Interactive 3D Thermochemical Blood Alcohol Biosensor
              </h1>
              <p className="text-[11px] text-slate-500">
                Concept architecture simulation — biochemical kinetics, copper heat conduction &amp; ESP32/OLED telemetry (requires experimental validation)
              </p>
            </div>
          </div>

          {/* Global Simulation Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Condition A / B Toggle */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => updateConfig({ condition: 'WITH_ALCOHOL' })}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${
                  config.condition === 'WITH_ALCOHOL'
                    ? 'bg-medical-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cond A: Alcohol ({config.ethanolConcentrationMgDl} mg/dL)
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ condition: 'WITHOUT_ALCOHOL' })}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${
                  config.condition === 'WITHOUT_ALCOHOL'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cond B: No Alcohol
              </button>
            </div>

            <button
              type="button"
              onClick={handleSimulateBloodReaction}
              className="inline-flex items-center gap-1.5 rounded-lg bg-medical-600 px-3.5 py-2 text-xs font-bold tracking-wide text-white shadow-sm transition hover:bg-medical-700"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              SIMULATE BLOOD REACTION
            </button>

            <button
              type="button"
              onClick={handlePauseResume}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isRunning ? 'Pause' : 'Resume'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* 9 Main Navigation Tabs */}
        <nav className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-medical-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-medical-50 hover:text-medical-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Live Timeline & Stage Status Bar */}
      <div className="border-b border-slate-100 bg-slate-50/70">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6">
          <div className="flex items-center gap-2">
            <span className="rounded bg-medical-100 px-2 py-0.5 font-mono text-[11px] font-bold text-medical-800">
              {hasStarted ? `STAGE ${currentPoint.stage}/5` : 'STANDBY'}
            </span>
            <span className="font-semibold text-slate-800">
              {hasStarted ? currentStageDef?.title : 'Click blood drop or SIMULATE BLOOD REACTION'}
            </span>
            <span className="hidden text-slate-500 md:inline">
              — {currentStageDef?.description}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={60}
              step={0.2}
              value={simTimeS}
              onChange={(e) => {
                setIsRunning(false);
                setHasStarted(true);
                setSimTimeS(Number(e.target.value));
              }}
              aria-label="Simulation timeline scrubber"
              className="w-36 accent-medical-600 sm:w-48"
            />
            <span className="w-14 text-right font-mono font-semibold text-medical-700">
              {simTimeS.toFixed(1)} s
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
        {activeTab === '3d-device' && (
          <div className="space-y-4">
            {/* 3D Viewport + Side Inspector / Controls */}
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="relative h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-8 lg:h-[560px]">
                {/* Viewport Overlay Controls */}
                <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExploded((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                      exploded
                        ? 'border-medical-600 bg-medical-600 text-white'
                        : 'border-slate-200 bg-white/95 text-slate-700 hover:bg-medical-50'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    {exploded ? 'Assemble Device' : 'Exploded View'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowThermalOverlay((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                      showThermalOverlay
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-slate-200 bg-white/95 text-slate-700 hover:bg-orange-50'
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    Thermal View
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLabels((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                      showLabels
                        ? 'border-medical-600 bg-medical-50 text-medical-800'
                        : 'border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    Labels
                  </button>
                </div>

                {/* Quick clickable component pills along bottom */}
                <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-1">
                  {COMPONENT_LIST.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedComponent(c.id)}
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition ${
                        selectedComponent === c.id
                          ? 'border-medical-600 bg-medical-600 text-white'
                          : 'border-slate-200 bg-white/90 text-slate-700 hover:border-medical-400'
                      }`}
                    >
                      {c.shortLabel}
                    </button>
                  ))}
                </div>

                <BiosensorScene3D
                  config={config}
                  point={currentPoint}
                  selectedId={selectedComponent}
                  onSelectComponent={setSelectedComponent}
                  exploded={exploded}
                  showThermalOverlay={showThermalOverlay}
                  showLabels={showLabels}
                  isRunning={isRunning}
                  hasStarted={hasStarted}
                />
              </div>

              {/* Right Column: Component Inspector OR Quick Control & OLED Panel */}
              <div className="lg:col-span-4 lg:h-[560px]">
                {selectedComponent ? (
                  <ComponentInspectorPanel
                    selectedId={selectedComponent}
                    onClose={() => setSelectedComponent(null)}
                    config={config}
                    onUpdateConfig={updateConfig}
                    point={currentPoint}
                    onSimulate={handleSimulateBloodReaction}
                  />
                ) : (
                  <div className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="space-y-3 overflow-y-auto">
                      <div>
                        <h2 className="text-sm font-bold text-medical-700">
                          Device Control &amp; Sample Setup
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Click any 3D component (including the blood drop) to inspect its function, or configure sample parameters below.
                        </p>
                      </div>

                      <OledEmulator
                        config={config}
                        point={currentPoint}
                        isRunning={isRunning}
                        hasStarted={hasStarted}
                        compact
                      />

                      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                        <div>
                          <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
                            <span>Blood Sample Volume</span>
                            <span className="font-mono font-bold text-medical-700">
                              {config.sampleVolumeUl} µL
                            </span>
                          </label>
                          <input
                            type="range"
                            min={5}
                            max={50}
                            step={1}
                            value={config.sampleVolumeUl}
                            onChange={(e) =>
                              updateConfig({ sampleVolumeUl: Number(e.target.value) })
                            }
                            className="w-full accent-medical-600"
                          />
                        </div>

                        {config.condition === 'WITH_ALCOHOL' && (
                          <div>
                            <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
                              <span>Hypothetical Ethanol Conc.</span>
                              <span className="font-mono font-bold text-medical-700">
                                {config.ethanolConcentrationMgDl} mg/dL
                              </span>
                            </label>
                            <input
                              type="range"
                              min={10}
                              max={300}
                              step={5}
                              value={config.ethanolConcentrationMgDl}
                              onChange={(e) =>
                                updateConfig({
                                  ethanolConcentrationMgDl: Number(e.target.value),
                                })
                              }
                              className="w-full accent-medical-600"
                            />
                          </div>
                        )}

                        <div>
                          <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
                            <span>Copper Coil Geometry</span>
                            <span className="font-mono text-copper-600">
                              {config.copperGeometry}
                            </span>
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {(['rectangular-spiral', 'serpentine', 'solid-plate'] as const).map(
                              (g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => updateConfig({ copperGeometry: g })}
                                  className={`rounded border py-1 text-[10px] font-semibold ${
                                    config.copperGeometry === g
                                      ? 'border-copper-500 bg-copper-500 text-white'
                                      : 'border-slate-200 bg-white text-slate-700'
                                  }`}
                                >
                                  {g === 'rectangular-spiral'
                                    ? 'Spiral'
                                    : g === 'serpentine'
                                      ? 'Serpentine'
                                      : 'Plate'}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedComponent('blood-drop')}
                      className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-800 hover:bg-red-100"
                    >
                      Inspect 3D Blood Sample Drop
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 12 Live Parameter Values Dashboard (Section 6) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-medical-700">
                  Live Coupled Simulation Parameters (t = {currentPoint.timeS.toFixed(1)} s)
                </h2>
                <span className="text-[11px] text-slate-500">
                  All values computed deterministically from kinetic &amp; lumped RC thermal state
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {[
                  {
                    label: 'Sample Volume',
                    val: `${config.sampleVolumeUl} µL`,
                    tag: 'Configured',
                  },
                  {
                    label: 'Ethanol Conc.',
                    val:
                      config.condition === 'WITH_ALCOHOL'
                        ? `${config.ethanolConcentrationMgDl} mg/dL`
                        : '0 mg/dL',
                    tag: 'Configured',
                  },
                  {
                    label: 'ADH Activity',
                    val: `${currentPoint.adhInstantActivityPct.toFixed(1)}% (${config.adhActivityUnits}U)`,
                    tag: 'Assumed',
                  },
                  {
                    label: 'NAD+ Availability',
                    val: `${currentPoint.nadAvailabilityPct.toFixed(1)}%`,
                    tag: 'Assumed',
                  },
                  {
                    label: 'Reaction Progress',
                    val: `${(currentPoint.reactionProgress * 100).toFixed(1)}%`,
                    tag: 'Simulated',
                  },
                  {
                    label: 'NADH Formation',
                    val: `${currentPoint.nadhNmol.toFixed(2)} nmol`,
                    tag: 'Simulated',
                  },
                  {
                    label: 'Reaction Heat Rate',
                    val: `${currentPoint.qReactionMw.toFixed(3)} mW`,
                    tag: 'Simulated',
                  },
                  {
                    label: 'Copper Coil Temp',
                    val: `${currentPoint.tempCopperCoilC.toFixed(4)} °C`,
                    tag: 'Simulated',
                  },
                  {
                    label: 'Thermal Sensor Temp',
                    val: `${currentPoint.tempThermalSensorC.toFixed(4)} °C`,
                    tag: 'Simulated',
                  },
                  {
                    label: 'Reference Sensor',
                    val: `${currentPoint.tempReferenceSensorC.toFixed(4)} °C`,
                    tag: 'Simulated',
                  },
                  {
                    label: 'ESP32 Input (ADC)',
                    val: `${currentPoint.esp32AdcCounts} cnt`,
                    tag: 'Simulated',
                  },
                  {
                    label: 'OLED Output (ΔT)',
                    val: hasStarted
                      ? `${currentPoint.esp32ProcessedMk >= 0 ? '+' : ''}${currentPoint.esp32ProcessedMk.toFixed(1)} mK`
                      : 'Standby',
                    tag: 'Simulated',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
                      <span className="truncate">{item.label}</span>
                      <span className="rounded bg-white px-1 text-[9px] font-medium text-slate-500">
                        {item.tag}
                      </span>
                    </div>
                    <div className="mt-1 truncate font-mono text-xs font-bold text-slate-900">
                      {item.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 5 Graphs right below 3D device */}
            <div className="grid gap-4 lg:grid-cols-2">
              <MultiLineChart
                title="Temperature vs Time (Active vs Reference Channel, mK)"
                subtitle="Tracks ΔT relative to isolated reference sensor"
                yLabel="ΔT (mK)"
                data={result.timeline}
                currentTimeS={currentPoint.timeS}
                height={220}
                series={[
                  {
                    label: 'Copper Coil ΔT',
                    color: '#c86d3b',
                    getValue: (p) => (p.tempCopperCoilC - p.tempReferenceSensorC) * 1000,
                  },
                  {
                    label: 'Active Thermal Sensor ΔT',
                    color: '#1e73b8',
                    getValue: (p) => p.deltaTempActiveVsRefMk,
                  },
                ]}
              />

              <MultiLineChart
                title="Heat Flow vs Time (mW)"
                subtitle="Enzymatic reaction power, background wetting/mixing, and copper conduction"
                yLabel="Heat Flow (mW)"
                data={result.timeline}
                currentTimeS={currentPoint.timeS}
                height={220}
                series={[
                  {
                    label: 'Total Input Q̇',
                    color: '#ea580c',
                    getValue: (p) => p.qTotalInputMw,
                  },
                  {
                    label: 'Reaction Q̇_rxn',
                    color: '#dc2626',
                    dashed: true,
                    getValue: (p) => p.qReactionMw,
                  },
                  {
                    label: 'Sensor Conduction Q̇',
                    color: '#1e73b8',
                    getValue: (p) => p.qToSensorMw,
                  },
                ]}
              />
            </div>
          </div>
        )}

        {activeTab === 'interactive-components' && (
          <InteractiveComponentsTab
            config={config}
            onUpdateConfig={updateConfig}
            result={result}
            compareNoAlcoholResult={compareNoAlcoholResult}
            compareWithAlcoholResult={compareWithAlcoholResult}
            point={currentPoint}
            selectedComponent={selectedComponent}
            onSelectComponent={(id) => setSelectedComponent(id)}
            isRunning={isRunning}
            hasStarted={hasStarted}
            onSimulate={handleSimulateBloodReaction}
            onSwitchTo3DWithComponent={(id) => {
              setSelectedComponent(id);
              setActiveTab('3d-device');
            }}
          />
        )}

        {activeTab === 'blood-simulation' && (
          <BloodSimulationTab
            config={config}
            onUpdateConfig={updateConfig}
            result={result}
            compareNoAlcoholResult={compareNoAlcoholResult}
            compareWithAlcoholResult={compareWithAlcoholResult}
            point={currentPoint}
            selectedComponent={selectedComponent}
            onSelectComponent={(id) => setSelectedComponent(id)}
            isRunning={isRunning}
            hasStarted={hasStarted}
            onSimulate={() => {
              handleSimulateBloodReaction();
              setActiveTab('3d-device');
            }}
            onSwitchTo3DWithComponent={(id) => {
              setSelectedComponent(id);
              setActiveTab('3d-device');
            }}
          />
        )}

        {activeTab === 'biochemical-reaction' && (
          <BiochemicalReactionTab
            config={config}
            onUpdateConfig={updateConfig}
            result={result}
            compareNoAlcoholResult={compareNoAlcoholResult}
            compareWithAlcoholResult={compareWithAlcoholResult}
            point={currentPoint}
            selectedComponent={selectedComponent}
            onSelectComponent={(id) => setSelectedComponent(id)}
            isRunning={isRunning}
            hasStarted={hasStarted}
            onSimulate={handleSimulateBloodReaction}
            onSwitchTo3DWithComponent={(id) => {
              setSelectedComponent(id);
              setActiveTab('3d-device');
            }}
          />
        )}

        {activeTab === 'thermal-simulation' && (
          <ThermalSimulationTab
            config={config}
            onUpdateConfig={updateConfig}
            result={result}
            compareNoAlcoholResult={compareNoAlcoholResult}
            compareWithAlcoholResult={compareWithAlcoholResult}
            point={currentPoint}
            selectedComponent={selectedComponent}
            onSelectComponent={(id) => setSelectedComponent(id)}
            isRunning={isRunning}
            hasStarted={hasStarted}
            onSimulate={handleSimulateBloodReaction}
            onSwitchTo3DWithComponent={(id) => {
              setSelectedComponent(id);
              setActiveTab('3d-device');
            }}
          />
        )}

        {activeTab === 'copper-coil-analysis' && (
          <CopperCoilAnalysisTab
            config={config}
            onUpdateConfig={updateConfig}
            result={result}
            compareNoAlcoholResult={compareNoAlcoholResult}
            compareWithAlcoholResult={compareWithAlcoholResult}
            point={currentPoint}
            selectedComponent={selectedComponent}
            onSelectComponent={(id) => setSelectedComponent(id)}
            isRunning={isRunning}
            hasStarted={hasStarted}
            onSimulate={handleSimulateBloodReaction}
            onSwitchTo3DWithComponent={(id) => {
              setSelectedComponent(id);
              setActiveTab('3d-device');
            }}
          />
        )}

        {activeTab === 'esp32-electronics' && (
          <Esp32ElectronicsTab
            config={config}
            onUpdateConfig={updateConfig}
            result={result}
            compareNoAlcoholResult={compareNoAlcoholResult}
            compareWithAlcoholResult={compareWithAlcoholResult}
            point={currentPoint}
            selectedComponent={selectedComponent}
            onSelectComponent={(id) => setSelectedComponent(id)}
            isRunning={isRunning}
            hasStarted={hasStarted}
            onSimulate={handleSimulateBloodReaction}
            onSwitchTo3DWithComponent={(id) => {
              setSelectedComponent(id);
              setActiveTab('3d-device');
            }}
          />
        )}

        {activeTab === 'oled-display' && (
          <OledDisplayTab
            config={config}
            onUpdateConfig={updateConfig}
            result={result}
            compareNoAlcoholResult={compareNoAlcoholResult}
            compareWithAlcoholResult={compareWithAlcoholResult}
            point={currentPoint}
            selectedComponent={selectedComponent}
            onSelectComponent={(id) => setSelectedComponent(id)}
            isRunning={isRunning}
            hasStarted={hasStarted}
            onSimulate={handleSimulateBloodReaction}
            onSwitchTo3DWithComponent={(id) => {
              setSelectedComponent(id);
              setActiveTab('3d-device');
            }}
          />
        )}

        {activeTab === 'results-comparison' && (
          <ResultsComparisonTab
            config={config}
            onUpdateConfig={updateConfig}
            result={result}
            compareNoAlcoholResult={compareNoAlcoholResult}
            compareWithAlcoholResult={compareWithAlcoholResult}
            point={currentPoint}
            selectedComponent={selectedComponent}
            onSelectComponent={(id) => setSelectedComponent(id)}
            isRunning={isRunning}
            hasStarted={hasStarted}
            onSimulate={handleSimulateBloodReaction}
            onSwitchTo3DWithComponent={(id) => {
              setSelectedComponent(id);
              setActiveTab('3d-device');
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
