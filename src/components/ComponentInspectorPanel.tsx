import React from 'react';
import { X, AlertTriangle, Link2, Cpu, Droplets, Play } from 'lucide-react';
import { COMPONENT_SPECS, ComponentId } from '../data/componentsSpec';
import {
  SampleCondition,
  SimulationConfig,
  SimulationDataPoint,
} from '../simulation/biosensorModel';

interface ComponentInspectorPanelProps {
  selectedId: ComponentId;
  onClose: () => void;
  config: SimulationConfig;
  onUpdateConfig: (patch: Partial<SimulationConfig>) => void;
  point: SimulationDataPoint;
  onSimulate: () => void;
}

export const ComponentInspectorPanel: React.FC<ComponentInspectorPanelProps> = ({
  selectedId,
  onClose,
  config,
  onUpdateConfig,
  point,
  onSimulate,
}) => {
  const spec = COMPONENT_SPECS[selectedId];
  const isBloodDrop = selectedId === 'blood-drop';

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <span className="inline-block rounded-full bg-medical-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-medical-700">
            {spec.category}
          </span>
          <h3 className="mt-1 text-sm font-bold text-medical-800">{spec.name}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close component panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs text-slate-700">
        {/* Interactive Blood Drop Quick Controls (Feature One requirement) */}
        {isBloodDrop && (
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50/50 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-red-800">
              <Droplets className="h-4 w-4 text-red-600" />
              <span>Blood Sample Control Panel</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border border-red-100 bg-white p-2">
                <div className="text-[10px] text-slate-500">Sample Volume</div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {config.sampleVolumeUl} µL
                </div>
              </div>
              <div className="rounded border border-red-100 bg-white p-2">
                <div className="text-[10px] text-slate-500">Sample Condition</div>
                <div className="font-semibold text-slate-900">
                  {config.condition === 'WITH_ALCOHOL' ? 'With Alcohol' : 'No Alcohol'}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 flex justify-between text-[11px] font-medium text-slate-700">
                <span>Adjust Sample Volume</span>
                <span className="font-mono">{config.sampleVolumeUl} µL</span>
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
              <div className="mb-1 text-[11px] font-medium text-slate-700">
                Experimental Condition
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['WITH_ALCOHOL', 'WITHOUT_ALCOHOL'] as SampleCondition[]).map(
                  (cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => onUpdateConfig({ condition: cond })}
                      className={`rounded-md border px-2 py-1.5 text-[11px] font-semibold transition ${
                        config.condition === cond
                          ? 'border-medical-600 bg-medical-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cond === 'WITH_ALCOHOL' ? 'A: With Alcohol' : 'B: No Alcohol'}
                    </button>
                  )
                )}
              </div>
            </div>

            {config.condition === 'WITH_ALCOHOL' && (
              <div>
                <label className="mb-1 flex justify-between text-[11px] font-medium text-slate-700">
                  <span>Hypothetical Ethanol Conc.</span>
                  <span className="font-mono">
                    {config.ethanolConcentrationMgDl} mg/dL (
                    {((config.ethanolConcentrationMgDl * 0.01) / 46.068 * 1000).toFixed(1)} mM)
                  </span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={5}
                  value={config.ethanolConcentrationMgDl}
                  onChange={(e) =>
                    onUpdateConfig({ ethanolConcentrationMgDl: Number(e.target.value) })
                  }
                  className="w-full accent-medical-600"
                />
              </div>
            )}

            <button
              type="button"
              onClick={onSimulate}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-medical-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-medical-700"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              SIMULATE BLOOD REACTION
            </button>
          </div>
        )}

        {/* Scientific Function */}
        <div>
          <h4 className="mb-1 font-semibold uppercase tracking-wide text-medical-700">
            Function
          </h4>
          <p className="leading-relaxed text-slate-700">{spec.scientificFunction}</p>
        </div>

        {/* Scientific Principle */}
        <div>
          <h4 className="mb-1 font-semibold uppercase tracking-wide text-medical-700">
            Scientific Principle
          </h4>
          <p className="leading-relaxed text-slate-700">{spec.scientificPrinciple}</p>
        </div>

        {/* Important Clarification */}
        {spec.importantNote && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-900">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>Scientific Note</span>
            </div>
            <p className="leading-relaxed">{spec.importantNote}</p>
          </div>
        )}

        {/* Connections */}
        <div>
          <h4 className="mb-1.5 flex items-center gap-1 font-semibold uppercase tracking-wide text-medical-700">
            <Link2 className="h-3.5 w-3.5" />
            <span>System Connections</span>
          </h4>
          <ul className="space-y-1">
            {spec.connections.map((conn, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-medical-500" />
                <span>{conn}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Live State Snapshot for Selected Component */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-medical-700">
            <Cpu className="h-3.5 w-3.5" />
            <span>Live Simulation Telemetry ({point.timeS.toFixed(1)} s)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            {selectedId === 'copper-coil' && (
              <>
                <div>T_copper: {point.tempCopperCoilC.toFixed(4)} °C</div>
                <div>Q_to_Cu: {point.qToCopperMw.toFixed(3)} mW</div>
              </>
            )}
            {selectedId === 'thermal-sensor' && (
              <>
                <div>T_active: {point.tempThermalSensorC.toFixed(4)} °C</div>
                <div>T_ref: {point.tempReferenceSensorC.toFixed(4)} °C</div>
                <div className="col-span-2">
                  ΔT (Act−Ref): {point.deltaTempActiveVsRefMk >= 0 ? '+' : ''}
                  {point.deltaTempActiveVsRefMk.toFixed(2)} mK
                </div>
              </>
            )}
            {(selectedId === 'adh-coating' || selectedId === 'nad-coating') && (
              <>
                <div>ADH Engagement: {point.adhInstantActivityPct.toFixed(1)}%</div>
                <div>NAD+ Avail: {point.nadAvailabilityPct.toFixed(1)}%</div>
                <div className="col-span-2">
                  NADH Formed: {point.nadhNmol.toFixed(2)} nmol ({(point.reactionProgress * 100).toFixed(1)}%)
                </div>
              </>
            )}
            {selectedId === 'esp32' && (
              <>
                <div>ADC Counts: {point.esp32AdcCounts}</div>
                <div>V_in: {point.esp32VoltageMv.toFixed(3)} mV</div>
              </>
            )}
            {selectedId !== 'copper-coil' &&
              selectedId !== 'thermal-sensor' &&
              selectedId !== 'adh-coating' &&
              selectedId !== 'nad-coating' &&
              selectedId !== 'esp32' && (
                <>
                  <div>T_rxn: {point.tempReactionZoneC.toFixed(4)} °C</div>
                  <div>ΔT_sens: {point.deltaTempActiveVsRefMk.toFixed(2)} mK</div>
                </>
              )}
          </div>
        </div>

        {/* Specifications */}
        <div>
          <h4 className="mb-1.5 font-semibold uppercase tracking-wide text-medical-700">
            Specifications & Parameter Basis
          </h4>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {spec.specifications.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                <div>
                  <div className="font-medium text-slate-800">{s.label}</div>
                  <div className="text-[11px] text-slate-500">{s.value}</div>
                </div>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    s.basis === 'Configured'
                      ? 'bg-medical-50 text-medical-700'
                      : s.basis === 'Assumed'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {s.basis}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
