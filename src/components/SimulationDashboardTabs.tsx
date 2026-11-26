import React from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Cpu,
  Droplets,
  Flame,
  FlaskConical,
  Layers,
  Scale,
} from 'lucide-react';
import { COMPONENT_LIST, ComponentId } from '../data/componentsSpec';
import {
  CopperGeometry,
  MODEL_PARAMETER_DOCS,
  SampleCondition,
  SimulationConfig,
  SimulationDataPoint,
  SimulationResult,
  STAGE_DEFINITIONS,
} from '../simulation/biosensorModel';
import { MultiLineChart } from './ScientificCharts';
import { OledEmulator } from './OledEmulator';

interface TabSharedProps {
  config: SimulationConfig;
  onUpdateConfig: (patch: Partial<SimulationConfig>) => void;
  result: SimulationResult;
  compareNoAlcoholResult: SimulationResult;
  compareWithAlcoholResult: SimulationResult;
  point: SimulationDataPoint;
  selectedComponent: ComponentId | null;
  onSelectComponent: (id: ComponentId) => void;
  isRunning: boolean;
  hasStarted: boolean;
  onSimulate: () => void;
  onSwitchTo3DWithComponent: (id: ComponentId) => void;
}

const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <div className="border-b border-slate-200 pb-2">
    <h2 className="text-lg font-bold text-medical-700">{title}</h2>
    {subtitle && <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>}
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  badge?: 'Assumed' | 'Configured' | 'Simulated';
}> = ({ label, value, sub, badge }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {badge && (
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            badge === 'Assumed'
              ? 'bg-amber-50 text-amber-700'
              : badge === 'Configured'
                ? 'bg-medical-50 text-medical-700'
                : 'bg-slate-100 text-slate-600'
          }`}
        >
          {badge}
        </span>
      )}
    </div>
    <div className="mt-1 font-mono text-lg font-bold text-slate-900">{value}</div>
    {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
  </div>
);

/* =========================================================================
   TAB 2: INTERACTIVE COMPONENTS
   ========================================================================= */
export const InteractiveComponentsTab: React.FC<TabSharedProps> = ({
  selectedComponent,
  onSelectComponent,
  onSwitchTo3DWithComponent,
}) => {
  return (
    <div className="space-y-5">
      <SectionHeading
        title="Interactive 3D Component Architecture"
        subtitle="Inspect every reconstructed subassembly from the reference device. Select any component to highlight and inspect it in the 3D viewport."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {COMPONENT_LIST.map((comp) => {
          const isSelected = selectedComponent === comp.id;
          return (
            <div
              key={comp.id}
              onClick={() => onSelectComponent(comp.id)}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                isSelected
                  ? 'border-medical-600 bg-medical-50/40 shadow-md'
                  : 'border-slate-200 bg-white hover:border-medical-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    {comp.category}
                  </span>
                  <h3 className="mt-1 text-sm font-bold text-medical-800">{comp.name}</h3>
                </div>
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: comp.accentColor }}
                />
              </div>

              <p className="mt-2 text-xs leading-relaxed text-slate-700">
                {comp.scientificFunction}
              </p>

              <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600">
                <strong className="text-slate-800">Principle: </strong>
                {comp.scientificPrinciple}
              </div>

              {comp.importantNote && (
                <p className="mt-2 text-[11px] font-medium text-amber-800">
                  Note: {comp.importantNote}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="text-[11px] text-slate-500">
                  {comp.connections.length} system link(s)
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSwitchTo3DWithComponent(comp.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-medical-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-medical-700"
                >
                  <Layers className="h-3 w-3" />
                  Focus in 3D
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================================================
   TAB 3: BLOOD SIMULATION
   ========================================================================= */
export const BloodSimulationTab: React.FC<TabSharedProps> = ({
  config,
  onUpdateConfig,
  point,
  result,
  onSimulate,
}) => {
  return (
    <div className="space-y-5">
      <SectionHeading
        title="Blood Sample Conditions & Animated Sequence"
        subtitle="Compare Condition A (blood with hypothetical ethanol) against Condition B (blood without added ethanol, including non-zero background thermal effects)."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Condition Selector */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-medical-700">Experimental Condition Setup</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  id: 'WITH_ALCOHOL' as SampleCondition,
                  title: 'Condition A: Blood With Alcohol',
                  desc: 'Simulated ethanol enters the ADH + NAD+ reaction zone, producing NADH + H+ and apparent reaction enthalpy alongside background wetting heat.',
                },
                {
                  id: 'WITHOUT_ALCOHOL' as SampleCondition,
                  title: 'Condition B: Blood Without Alcohol',
                  desc: 'Zero added ethanol. No ethanol-dependent ADH turnover occurs, while capillary wetting, mixing, evaporative cooling, and equilibration remain active.',
                },
              ]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onUpdateConfig({ condition: item.id })}
                className={`rounded-xl border p-3.5 text-left transition ${
                  config.condition === item.id
                    ? 'border-medical-600 bg-medical-50/70 ring-1 ring-medical-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-medical-800">{item.title}</span>
                  <Droplets
                    className={`h-4 w-4 ${
                      item.id === 'WITH_ALCOHOL' ? 'text-red-600' : 'text-sky-600'
                    }`}
                  />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
                <span>Blood Sample Volume (Default 20 µL)</span>
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
                  onUpdateConfig({ sampleVolumeUl: Number(e.target.value) })
                }
                className="w-full accent-medical-600"
              />
            </div>

            <div>
              <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
                <span>Hypothetical Ethanol Concentration</span>
                <span className="font-mono font-bold text-medical-700">
                  {config.condition === 'WITH_ALCOHOL'
                    ? `${config.ethanolConcentrationMgDl} mg/dL`
                    : '0 mg/dL (Alcohol-free)'}
                </span>
              </label>
              <input
                type="range"
                min={10}
                max={300}
                step={5}
                disabled={config.condition === 'WITHOUT_ALCOHOL'}
                value={config.ethanolConcentrationMgDl}
                onChange={(e) =>
                  onUpdateConfig({ ethanolConcentrationMgDl: Number(e.target.value) })
                }
                className="w-full accent-medical-600 disabled:opacity-40"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="text-xs text-slate-600">
              Total ethanol loaded:{' '}
              <span className="font-mono font-semibold text-slate-900">
                {result.summary.totalEthanolNmol.toFixed(1)} nmol
              </span>{' '}
              | Background heat:{' '}
              <span className="font-mono font-semibold text-slate-900">
                {result.summary.totalBackgroundHeatMj.toFixed(2)} mJ
              </span>
            </div>
            <button
              type="button"
              onClick={onSimulate}
              className="rounded-lg bg-medical-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-medical-700"
            >
              SIMULATE BLOOD REACTION
            </button>
          </div>
        </div>

        {/* Background Thermal Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-medical-700">
            Background Thermal Components (t = {point.timeS.toFixed(1)}s)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Active in both Condition A and Condition B so zero-alcohol blood never reports an artificial 0 °C delta.
          </p>
          <div className="mt-3 space-y-2.5 text-xs">
            <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Capillary Wetting & Hydration</span>
              <span className="font-mono font-semibold text-amber-700">
                +{point.qWettingMw.toFixed(3)} mW
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Sample Equilibration</span>
              <span className="font-mono font-semibold text-orange-700">
                +{point.qEquilibrationMw.toFixed(3)} mW
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Mixing & Evaporative Cooling</span>
              <span className="font-mono font-semibold text-sky-700">
                {point.qMixingEvapMw.toFixed(3)} mW
              </span>
            </div>
            <div className="flex justify-between rounded-lg border border-medical-200 bg-medical-50 px-3 py-2 font-semibold text-medical-800">
              <span>Enzymatic Reaction Heat</span>
              <span className="font-mono">+{point.qReactionMw.toFixed(3)} mW</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Stage Sequence Tracker */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-medical-700">
          5-Stage Assay Simulation Sequence
        </h3>
        <div className="grid gap-3 md:grid-cols-5">
          {STAGE_DEFINITIONS.map((st) => {
            const active = point.stage === st.id;
            const passed = point.timeS > st.endS;
            return (
              <div
                key={st.id}
                className={`rounded-lg border p-3 ${
                  active
                    ? 'border-medical-600 bg-medical-50'
                    : passed
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className={active ? 'text-medical-700' : 'text-slate-600'}>
                    STAGE {st.id}
                  </span>
                  <span className="font-mono text-slate-400">
                    {st.startS}–{st.endS}s
                  </span>
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-900">{st.title}</div>
                <p className="mt-1 text-[11px] leading-snug text-slate-600">
                  {st.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   TAB 4: BIOCHEMICAL REACTION
   ========================================================================= */
export const BiochemicalReactionTab: React.FC<TabSharedProps> = ({
  config,
  onUpdateConfig,
  result,
  point,
}) => {
  return (
    <div className="space-y-5">
      <SectionHeading
        title="ADH Enzymatic Reaction & Cofactor Stoichiometry"
        subtitle="Two-substrate Michaelis-Menten kinetic simulation distinguishing molar NADH formation from apparent biochemical heat release."
      />

      {/* Reaction Scheme Banner */}
      <div className="rounded-xl border border-medical-200 bg-medical-50/50 p-4">
        <div className="flex flex-wrap items-center justify-center gap-2 text-center font-mono text-sm font-bold text-medical-800 sm:text-base">
          <span className="rounded bg-white px-2.5 py-1 shadow-sm">Ethanol</span>
          <span>+</span>
          <span className="rounded bg-sky-100 px-2.5 py-1 text-sky-900 shadow-sm">NAD⁺</span>
          <span className="flex items-center gap-1 px-2 text-xs text-amber-700">
            ──(ADH)──▶
          </span>
          <span className="rounded bg-white px-2.5 py-1 shadow-sm">Acetaldehyde</span>
          <span>+</span>
          <span className="rounded bg-emerald-100 px-2.5 py-1 text-emerald-900 shadow-sm">
            NADH + H⁺
          </span>
        </div>
        <p className="mt-2 text-center text-xs text-slate-600">
          Condition:{' '}
          <strong>
            {config.condition === 'WITH_ALCOHOL'
              ? 'Alcohol Present — ADH catalyzes ethanol oxidation coupled to NAD+ reduction'
              : 'Alcohol Absent — No added ethanol substrate; ADH remains idle and NAD+ stays oxidized'}
          </strong>
        </p>
      </div>

      {/* Live Kinetic KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Reaction Progress"
          value={`${(point.reactionProgress * 100).toFixed(1)}%`}
          sub={`Final: ${result.summary.finalReactionProgressPct.toFixed(1)}% conversion`}
          badge="Simulated"
        />
        <StatCard
          label="NADH Formed"
          value={`${point.nadhNmol.toFixed(2)} nmol`}
          sub={`${point.nadhMm.toFixed(2)} mM in hydrated pad`}
          badge="Simulated"
        />
        <StatCard
          label="ADH Instant Engagement"
          value={`${point.adhInstantActivityPct.toFixed(1)}%`}
          sub={`Configured loading: ${config.adhActivityUnits.toFixed(1)} U`}
          badge="Assumed"
        />
        <StatCard
          label="NAD+ Remaining"
          value={`${point.nadAvailabilityPct.toFixed(1)}%`}
          sub={`${point.nadMm.toFixed(2)} mM remaining`}
          badge="Assumed"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Controls */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-medical-700">
            <FlaskConical className="h-4 w-4" />
            <span>Kinetic & Enthalpy Parameters</span>
          </h3>

          <div>
            <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
              <span>Immobilized ADH Activity (Assumed)</span>
              <span className="font-mono">{config.adhActivityUnits.toFixed(1)} U</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={6.0}
              step={0.25}
              value={config.adhActivityUnits}
              onChange={(e) =>
                onUpdateConfig({ adhActivityUnits: Number(e.target.value) })
              }
              className="w-full accent-medical-600"
            />
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
              <span>NAD+ Reservoir (Assumed)</span>
              <span className="font-mono">{config.nadInitialMmolL} mM</span>
            </label>
            <input
              type="range"
              min={5}
              max={60}
              step={1}
              value={config.nadInitialMmolL}
              onChange={(e) =>
                onUpdateConfig({ nadInitialMmolL: Number(e.target.value) })
              }
              className="w-full accent-medical-600"
            />
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
              <span>Kinetic Rate Scale</span>
              <span className="font-mono">{config.reactionRateScale.toFixed(2)}×</span>
            </label>
            <input
              type="range"
              min={0.25}
              max={2.5}
              step={0.05}
              value={config.reactionRateScale}
              onChange={(e) =>
                onUpdateConfig({ reactionRateScale: Number(e.target.value) })
              }
              className="w-full accent-medical-600"
            />
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
              <span>Apparent |ΔH_app| (Assumed, non-universal)</span>
              <span className="font-mono">{config.reactionEnthalpyKJPerMol} kJ/mol</span>
            </label>
            <input
              type="range"
              min={20}
              max={110}
              step={1}
              value={config.reactionEnthalpyKJPerMol}
              onChange={(e) =>
                onUpdateConfig({ reactionEnthalpyKJPerMol: Number(e.target.value) })
              }
              className="w-full accent-medical-600"
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
            <strong>Scientific Distinction:</strong> NADH formation (nmol) measures chemical
            redox conversion, whereas heat generation (mJ) equals{' '}
            <code className="font-mono">n_NADH × (−ΔH_app)</code> and varies with buffer
            protonation enthalpy and immobilized matrix hydration.
          </div>
        </div>

        {/* Kinetic Chart */}
        <div className="lg:col-span-2">
          <MultiLineChart
            title="Species Concentration & NADH Formation vs Time"
            subtitle="Ethanol substrate consumption, NAD+ cofactor depletion, and NADH accumulation"
            yLabel="Concentration (mM)"
            data={result.timeline}
            currentTimeS={point.timeS}
            height={270}
            series={[
              {
                label: 'Ethanol (mM)',
                color: '#dc2626',
                getValue: (p) => p.ethanolMm,
              },
              {
                label: 'NAD+ (mM)',
                color: '#0284c7',
                dashed: true,
                getValue: (p) => p.nadMm,
              },
              {
                label: 'NADH Formed (mM)',
                color: '#059669',
                getValue: (p) => p.nadhMm,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   TAB 5: THERMAL SIMULATION
   ========================================================================= */
export const ThermalSimulationTab: React.FC<TabSharedProps> = ({
  config,
  onUpdateConfig,
  result,
  point,
}) => {
  return (
    <div className="space-y-5">
      <SectionHeading
        title="Thermal Transport & Differential Sensor Simulation"
        subtitle="4-node lumped RC heat-transfer model: Reaction Zone → Strip → Copper Coil → Active Sensor vs Reference Sensor."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Reaction Zone Temp"
          value={`${point.tempReactionZoneC.toFixed(4)} °C`}
          sub={`+${((point.tempReactionZoneC - point.tempReferenceSensorC) * 1000).toFixed(2)} mK above Ref`}
        />
        <StatCard
          label="Copper Coil Temp"
          value={`${point.tempCopperCoilC.toFixed(4)} °C`}
          sub={`Peak Cu ΔT: +${result.summary.peakCopperDeltaTMk.toFixed(2)} mK`}
        />
        <StatCard
          label="Active Thermal Sensor"
          value={`${point.tempThermalSensorC.toFixed(4)} °C`}
          sub={`ΔT (Act−Ref): ${point.deltaTempActiveVsRefMk >= 0 ? '+' : ''}${point.deltaTempActiveVsRefMk.toFixed(2)} mK`}
        />
        <StatCard
          label="Reference Sensor"
          value={`${point.tempReferenceSensorC.toFixed(4)} °C`}
          sub={`Ambient: ${config.ambientTempC.toFixed(1)} °C + housing bias`}
        />
      </div>

      {/* Controls Row */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
            <span>Ambient Temperature</span>
            <span className="font-mono">{config.ambientTempC.toFixed(1)} °C</span>
          </label>
          <input
            type="range"
            min={15}
            max={35}
            step={0.5}
            value={config.ambientTempC}
            onChange={(e) => onUpdateConfig({ ambientTempC: Number(e.target.value) })}
            className="w-full accent-medical-600"
          />
        </div>
        <div>
          <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
            <span>Strip Thickness</span>
            <span className="font-mono">{config.stripThicknessMm.toFixed(2)} mm</span>
          </label>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={config.stripThicknessMm}
            onChange={(e) => onUpdateConfig({ stripThicknessMm: Number(e.target.value) })}
            className="w-full accent-medical-600"
          />
        </div>
        <div>
          <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
            <span>Insulation Effectiveness</span>
            <span className="font-mono">{Math.round(config.insulationFactor * 100)}%</span>
          </label>
          <input
            type="range"
            min={0.2}
            max={0.95}
            step={0.02}
            value={config.insulationFactor}
            onChange={(e) => onUpdateConfig({ insulationFactor: Number(e.target.value) })}
            className="w-full accent-medical-600"
          />
        </div>
        <div>
          <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
            <span>Apparent |ΔH_app|</span>
            <span className="font-mono">{config.reactionEnthalpyKJPerMol} kJ/mol</span>
          </label>
          <input
            type="range"
            min={20}
            max={110}
            step={1}
            value={config.reactionEnthalpyKJPerMol}
            onChange={(e) =>
              onUpdateConfig({ reactionEnthalpyKJPerMol: Number(e.target.value) })
            }
            className="w-full accent-medical-600"
          />
        </div>
      </div>

      {/* Temperature vs Time & Heat Flow vs Time Graphs */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MultiLineChart
          title="Temperature Response vs Time (Relative to Reference, mK)"
          subtitle="Tracks Reaction Zone, Copper Coil, and Active Sensor minus Reference channel"
          yLabel="ΔT vs Reference (mK)"
          data={result.timeline}
          currentTimeS={point.timeS}
          series={[
            {
              label: 'Reaction Zone ΔT',
              color: '#dc2626',
              getValue: (p) => (p.tempReactionZoneC - p.tempReferenceSensorC) * 1000,
            },
            {
              label: 'Copper Coil ΔT',
              color: '#c86d3b',
              getValue: (p) => (p.tempCopperCoilC - p.tempReferenceSensorC) * 1000,
            },
            {
              label: 'Active Sensor ΔT',
              color: '#1e73b8',
              getValue: (p) => p.deltaTempActiveVsRefMk,
            },
          ]}
        />

        <MultiLineChart
          title="Heat Flow vs Time (mW)"
          subtitle="Separates biochemical reaction power, conduction through copper, and housing losses"
          yLabel="Heat Flow (mW)"
          data={result.timeline}
          currentTimeS={point.timeS}
          series={[
            {
              label: 'Total Input Q̇ (Rxn + BG)',
              color: '#ea580c',
              getValue: (p) => p.qTotalInputMw,
            },
            {
              label: 'Conduction to Copper',
              color: '#c86d3b',
              getValue: (p) => p.qToCopperMw,
            },
            {
              label: 'Conduction to Sensor',
              color: '#1e73b8',
              getValue: (p) => p.qToSensorMw,
            },
            {
              label: 'Ambient/Housing Loss',
              color: '#64748b',
              dashed: true,
              getValue: (p) => p.qHeatLossMw,
            },
          ]}
        />
      </div>
    </div>
  );
};

/* =========================================================================
   TAB 6: COPPER COIL ANALYSIS
   ========================================================================= */
export const CopperCoilAnalysisTab: React.FC<TabSharedProps> = ({
  config,
  onUpdateConfig,
  result,
  point,
}) => {
  const net = result.summary.network;
  return (
    <div className="space-y-5">
      <SectionHeading
        title="Copper Thermal Transfer Element Engineering Analysis"
        subtitle="Geometry- and material-driven heat conduction analysis. Copper conducts and spreads heat passively — it never amplifies total thermal energy."
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <strong>Physics Check — No Free Signal Amplification:</strong> Copper has high
            thermal conductivity (k ≈ 398 W/(m·K)), which reduces conductive ΔT drop across
            the transfer path. However, increasing copper thickness or plate volume also raises
            thermal capacitance (<span className="font-mono">C_Cu = ρ·c·V</span>), which{' '}
            <em>lowers</em> peak temperature rise for a finite reaction energy pulse!
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Geometry & Material Controls */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-medical-700">
            <Flame className="h-4 w-4 text-copper-500" />
            <span>Copper Design Parameters</span>
          </h3>

          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-700">Coil Geometry</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'rectangular-spiral', label: 'Spiral' },
                  { id: 'serpentine', label: 'Serpentine' },
                  { id: 'solid-plate', label: 'Solid Plate' },
                ] as { id: CopperGeometry; label: string }[]
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onUpdateConfig({ copperGeometry: g.id })}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                    config.copperGeometry === g.id
                      ? 'border-copper-500 bg-copper-500 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
              <span>Copper Thickness</span>
              <span className="font-mono">{config.copperThicknessMm.toFixed(2)} mm</span>
            </label>
            <input
              type="range"
              min={0.2}
              max={2.0}
              step={0.05}
              value={config.copperThicknessMm}
              onChange={(e) => onUpdateConfig({ copperThicknessMm: Number(e.target.value) })}
              className="w-full accent-copper-500"
            />
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
              <span>Thermal Conductivity (k)</span>
              <span className="font-mono">{config.copperConductivityWmK} W/(m·K)</span>
            </label>
            <input
              type="range"
              min={50}
              max={401}
              step={5}
              value={config.copperConductivityWmK}
              onChange={(e) =>
                onUpdateConfig({ copperConductivityWmK: Number(e.target.value) })
              }
              className="w-full accent-copper-500"
            />
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs font-medium text-slate-700">
              <span>Sensor Standoff / TIM Gap</span>
              <span className="font-mono">{config.sensorOffsetMm.toFixed(2)} mm</span>
            </label>
            <input
              type="range"
              min={0.1}
              max={2.5}
              step={0.05}
              value={config.sensorOffsetMm}
              onChange={(e) => onUpdateConfig({ sensorOffsetMm: Number(e.target.value) })}
              className="w-full accent-copper-500"
            />
          </div>
        </div>

        {/* Derived Physical Network Properties */}
        <div className="space-y-3 lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Copper Mass"
              value={`${net.copperMassG.toFixed(3)} g`}
              sub={`Vol: ${net.copperVolumeMm3.toFixed(1)} mm³`}
            />
            <StatCard
              label="Thermal Capacitance (C_Cu)"
              value={`${(net.copperThermalCapacitanceJPerK * 1000).toFixed(1)} mJ/K`}
              sub="Damps peak ΔT when larger"
            />
            <StatCard
              label="RC Time Constant (τ)"
              value={`${net.thermalTimeConstantS.toFixed(2)} s`}
              sub={`Peak reached at ${result.summary.timeToPeakS.toFixed(1)} s`}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-medical-700">
              Series Thermal Resistance Breakdown (Reaction Pad → Sensor)
            </h4>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500">1. Strip Substrate</div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {net.stripThermalResistanceKPerW.toFixed(2)} K/W
                </div>
                <div className="text-[10px] text-slate-400">
                  t = {config.stripThicknessMm.toFixed(2)} mm
                </div>
              </div>
              <div className="rounded-lg bg-orange-50/60 p-3">
                <div className="text-[11px] text-copper-600">2. Copper Element</div>
                <div className="font-mono text-sm font-bold text-copper-600">
                  {net.copperThermalResistanceKPerW.toFixed(2)} K/W
                </div>
                <div className="text-[10px] text-slate-500">{net.geometryLabel}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500">3. TIM / Sensor Gap</div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {net.interfaceThermalResistanceKPerW.toFixed(2)} K/W
                </div>
                <div className="text-[10px] text-slate-400">
                  gap = {config.sensorOffsetMm.toFixed(2)} mm
                </div>
              </div>
              <div className="rounded-lg border border-medical-200 bg-medical-50 p-3">
                <div className="text-[11px] font-semibold text-medical-700">Total R_th</div>
                <div className="font-mono text-sm font-bold text-medical-800">
                  {net.totalPathResistanceKPerW.toFixed(2)} K/W
                </div>
                <div className="text-[10px] text-medical-700">
                  Peak ΔT: +{result.summary.peakSensorDeltaTMk.toFixed(2)} mK
                </div>
              </div>
            </div>
          </div>

          <MultiLineChart
            title="Copper Coil vs Active Sensor Thermal Coupling"
            subtitle="Notice lag and attenuation imposed by copper thermal capacitance & interface resistance"
            yLabel="ΔT vs Reference (mK)"
            data={result.timeline}
            currentTimeS={point.timeS}
            height={210}
            series={[
              {
                label: 'Copper Coil ΔT (mK)',
                color: '#c86d3b',
                getValue: (p) => (p.tempCopperCoilC - p.tempReferenceSensorC) * 1000,
              },
              {
                label: 'Active Sensor ΔT (mK)',
                color: '#1e73b8',
                getValue: (p) => p.deltaTempActiveVsRefMk,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   TAB 7: ESP32 ELECTRONICS
   ========================================================================= */
export const Esp32ElectronicsTab: React.FC<TabSharedProps> = ({
  config,
  point,
  isRunning,
  hasStarted,
}) => {
  const steps = [
    {
      title: '1. Thermal Sensor',
      value: `${point.tempThermalSensorC.toFixed(4)} °C`,
      sub: `Ref: ${point.tempReferenceSensorC.toFixed(4)} °C`,
      active: hasStarted && point.stage >= 3,
    },
    {
      title: '2. Signal Acquisition',
      value: `${point.esp32VoltageMv.toFixed(3)} mV`,
      sub: `16-bit ADC: ${point.esp32AdcCounts} counts`,
      active: hasStarted && point.stage >= 4,
    },
    {
      title: '3. ESP32 Processing',
      value: `${point.esp32ProcessedMk >= 0 ? '+' : ''}${point.esp32ProcessedMk.toFixed(2)} mK`,
      sub: 'EMA filter + Ref subtraction',
      active: hasStarted && point.stage >= 4,
    },
    {
      title: '4. OLED Telemetry',
      value: config.condition === 'WITH_ALCOHOL' ? 'ACTIVE' : 'BACKGROUND',
      sub: `Stage ${point.stage}/5`,
      active: hasStarted && point.stage >= 4,
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeading
        title="ESP32 Signal Acquisition & Processing Pipeline"
        subtitle="Simulated microcontroller workflow: Thermal Sensor → Signal Acquisition → ESP32 Differential Filtering → OLED Display."
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900">
        <strong>Hardware Simulation Disclaimer:</strong> All ADC counts, millivolt front-end
        values, and I2C OLED packets shown here are mathematically generated in software. No
        physical ESP32 hardware connection is claimed or required.
      </div>

      {/* Pipeline Flow */}
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((st, idx) => (
          <div key={st.title} className="relative flex items-center gap-2">
            <div
              className={`w-full rounded-xl border p-4 transition ${
                st.active
                  ? 'border-medical-600 bg-medical-50/70 shadow-sm'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-medical-700">{st.title}</span>
                <Cpu
                  className={`h-4 w-4 ${
                    st.active ? 'text-medical-600' : 'text-slate-400'
                  }`}
                />
              </div>
              <div className="mt-2 font-mono text-base font-bold text-slate-900">
                {st.value}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">{st.sub}</div>
            </div>
            {idx < steps.length - 1 && (
              <ArrowRight className="hidden h-5 w-5 shrink-0 text-medical-500 md:block" />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-medical-700">
            Live Simulated ESP32 Telemetry Registers
          </h3>
          <div className="divide-y divide-slate-100 font-mono text-xs">
            <div className="flex justify-between py-2">
              <span className="text-slate-500">CH0_ACTIVE_SENSOR_TEMP</span>
              <span className="font-semibold">{point.tempThermalSensorC.toFixed(4)} °C</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">CH1_REFERENCE_SENSOR_TEMP</span>
              <span className="font-semibold">{point.tempReferenceSensorC.toFixed(4)} °C</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">DIFF_RAW_VOLTAGE</span>
              <span className="font-semibold">{point.esp32VoltageMv.toFixed(3)} mV</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">ADC_16BIT_SIGNED</span>
              <span className="font-semibold">{point.esp32AdcCounts} LSB</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">EMA_FILTERED_DELTA_T</span>
              <span className="font-semibold text-medical-700">
                {point.esp32ProcessedMk >= 0 ? '+' : ''}
                {point.esp32ProcessedMk.toFixed(2)} mK
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-medical-700">
            Synchronized OLED Frame Output
          </h3>
          <OledEmulator
            config={config}
            point={point}
            isRunning={isRunning}
            hasStarted={hasStarted}
          />
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   TAB 8: OLED DISPLAY
   ========================================================================= */
export const OledDisplayTab: React.FC<TabSharedProps> = ({
  config,
  point,
  isRunning,
  hasStarted,
}) => {
  return (
    <div className="space-y-5">
      <SectionHeading
        title="OLED Display Live Emulator"
        subtitle="Exact live mirror of the 3D device's top OLED panel, updating in real time from the ESP32 signal processing stage."
      />

      <div className="mx-auto max-w-xl space-y-4">
        <OledEmulator
          config={config}
          point={point}
          isRunning={isRunning}
          hasStarted={hasStarted}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
          <h4 className="font-bold text-medical-700">Scientific Output Policy</h4>
          <p className="mt-1 leading-relaxed">
            In accordance with experimental transparency, the OLED readout displays the
            simulated differential thermal response (in mK) and reaction state rather than
            converting ΔT into a clinical BAC percentage without experimentally validated
            calibration curves across hematocrit, ambient temperature, and strip batch
            variance.
          </p>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   TAB 9: RESULTS COMPARISON
   ========================================================================= */
export const ResultsComparisonTab: React.FC<TabSharedProps> = ({
  config,
  compareWithAlcoholResult,
  compareNoAlcoholResult,
  point,
}) => {
  const withA = compareWithAlcoholResult;
  const noA = compareNoAlcoholResult;
  const pointA = withA.timeline[Math.min(withA.timeline.length - 1, Math.round(point.timeS / 0.1))];
  const pointB = noA.timeline[Math.min(noA.timeline.length - 1, Math.round(point.timeS / 0.1))];
  const netThermalDiffMk =
    withA.summary.peakSensorDeltaTMk - noA.summary.peakSensorDeltaTMk;

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Condition A vs Condition B Scientific Results Comparison"
        subtitle={`Side-by-side comparison at ${config.sampleVolumeUl} µL sample volume (${config.ethanolConcentrationMgDl} mg/dL hypothetical ethanol vs 0 mg/dL alcohol-free blood).`}
      />

      {/* Alert on uncalibrated BAC */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
        <div className="flex items-start gap-2">
          <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <strong>Calibration & Clinical Boundary:</strong> Subtracting Condition B
            (background blood wetting/mixing) from Condition A isolates the simulated
            ethanol-driven thermal signal (net peak separation{' '}
            <span className="font-mono font-bold">
              {netThermalDiffMk >= 0 ? '+' : ''}
              {netThermalDiffMk.toFixed(2)} mK
            </span>
            ). Real-world BAC quantification requires experimental calibration against known
            standards and cannot be claimed from simulation alone.
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-medical-800">
            <tr>
              <th className="px-4 py-3 font-bold">Parameter / Metric</th>
              <th className="px-4 py-3 font-bold">Condition A: Alcohol Present</th>
              <th className="px-4 py-3 font-bold">Condition B: Alcohol Absent</th>
              <th className="px-4 py-3 font-bold">Net Difference (A − B)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-slate-700">
                Reaction Progress (Final)
              </td>
              <td className="px-4 py-2.5 text-emerald-700">
                {withA.summary.finalReactionProgressPct.toFixed(1)}%
              </td>
              <td className="px-4 py-2.5 text-slate-600">0.0% (No added EtOH)</td>
              <td className="px-4 py-2.5 font-semibold">
                +{withA.summary.finalReactionProgressPct.toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-slate-700">
                NADH Formation (Final)
              </td>
              <td className="px-4 py-2.5 text-emerald-700">
                {withA.summary.finalNadhNmol.toFixed(2)} nmol
              </td>
              <td className="px-4 py-2.5 text-slate-600">0.00 nmol</td>
              <td className="px-4 py-2.5 font-semibold">
                +{withA.summary.finalNadhNmol.toFixed(2)} nmol
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-slate-700">
                Peak Heat Flow (mW)
              </td>
              <td className="px-4 py-2.5 text-orange-700">
                {withA.summary.peakHeatFlowMw.toFixed(3)} mW
              </td>
              <td className="px-4 py-2.5 text-sky-700">
                {noA.summary.peakHeatFlowMw.toFixed(3)} mW
              </td>
              <td className="px-4 py-2.5 font-semibold">
                +{(withA.summary.peakHeatFlowMw - noA.summary.peakHeatFlowMw).toFixed(3)} mW
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-slate-700">
                Peak Active Sensor ΔT (vs Ref)
              </td>
              <td className="px-4 py-2.5 text-medical-700">
                +{withA.summary.peakSensorDeltaTMk.toFixed(2)} mK
              </td>
              <td className="px-4 py-2.5 text-sky-700">
                +{noA.summary.peakSensorDeltaTMk.toFixed(2)} mK
              </td>
              <td className="px-4 py-2.5 font-bold text-medical-700">
                {netThermalDiffMk >= 0 ? '+' : ''}
                {netThermalDiffMk.toFixed(2)} mK
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-slate-700">
                Reference Channel (at t = {point.timeS.toFixed(1)}s)
              </td>
              <td className="px-4 py-2.5">{pointA.tempReferenceSensorC.toFixed(4)} °C</td>
              <td className="px-4 py-2.5">{pointB.tempReferenceSensorC.toFixed(4)} °C</td>
              <td className="px-4 py-2.5 text-slate-500">0.0000 °C (matched)</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-slate-700">
                ESP32 Output (at t = {point.timeS.toFixed(1)}s)
              </td>
              <td className="px-4 py-2.5">
                {pointA.esp32ProcessedMk >= 0 ? '+' : ''}
                {pointA.esp32ProcessedMk.toFixed(2)} mK ({pointA.esp32AdcCounts} cnt)
              </td>
              <td className="px-4 py-2.5">
                {pointB.esp32ProcessedMk >= 0 ? '+' : ''}
                {pointB.esp32ProcessedMk.toFixed(2)} mK ({pointB.esp32AdcCounts} cnt)
              </td>
              <td className="px-4 py-2.5 font-semibold">
                {(pointA.esp32ProcessedMk - pointB.esp32ProcessedMk).toFixed(2)} mK
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Overlay Comparison Graphs */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MultiLineChart
          title="Temperature Response Comparison (Active − Reference, mK)"
          subtitle="Solid red/blue = Condition A (Alcohol); Dashed sky = Condition B (Background only)"
          yLabel="ΔT (mK)"
          data={withA.timeline}
          secondaryData={noA.timeline}
          currentTimeS={point.timeS}
          series={[
            {
              label: 'Cond A: Active Sensor ΔT',
              color: '#dc2626',
              getValue: (p) => p.deltaTempActiveVsRefMk,
            },
          ]}
          secondarySeries={[
            {
              label: 'Cond B: Background ΔT',
              color: '#0284c7',
              dashed: true,
              getValue: (p) => p.deltaTempActiveVsRefMk,
            },
          ]}
        />

        <MultiLineChart
          title="Heat Flow & NADH Comparison"
          subtitle="Compares total heat input (mW) across both experimental conditions"
          yLabel="Heat Flow (mW)"
          data={withA.timeline}
          secondaryData={noA.timeline}
          currentTimeS={point.timeS}
          series={[
            {
              label: 'Cond A: Total Q̇ (mW)',
              color: '#ea580c',
              getValue: (p) => p.qTotalInputMw,
            },
          ]}
          secondarySeries={[
            {
              label: 'Cond B: Background Q̇ (mW)',
              color: '#0ea5e9',
              dashed: true,
              getValue: (p) => p.qTotalInputMw,
            },
          ]}
        />
      </div>

      {/* Parameter Transparency Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-medical-700">
          <Activity className="h-4 w-4" />
          <span>Model Assumptions & Parameter Provenance</span>
        </h3>
        <div className="grid gap-2 md:grid-cols-2">
          {MODEL_PARAMETER_DOCS.map((doc) => (
            <div key={doc.key} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">
                  {doc.label} ({doc.unit})
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    doc.classification === 'Assumed'
                      ? 'bg-amber-100 text-amber-800'
                      : doc.classification === 'Configured'
                        ? 'bg-medical-100 text-medical-800'
                        : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {doc.classification}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">{doc.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
