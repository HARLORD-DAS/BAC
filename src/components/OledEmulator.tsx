import React from 'react';
import {
  SimulationConfig,
  SimulationDataPoint,
  STAGE_DEFINITIONS,
} from '../simulation/biosensorModel';

interface OledEmulatorProps {
  config: SimulationConfig;
  point: SimulationDataPoint;
  isRunning: boolean;
  hasStarted: boolean;
  compact?: boolean;
}

export function getOledDisplayStrings(
  config: SimulationConfig,
  point: SimulationDataPoint,
  isRunning: boolean,
  hasStarted: boolean
) {
  const reactionMode =
    config.condition === 'WITH_ALCOHOL' ? 'ACTIVE' : 'BACKGROUND';

  const deltaMk = point.esp32ProcessedMk;
  const thermalResponseText = !hasStarted
    ? '-- mK (standby)'
    : `${deltaMk >= 0 ? '+' : ''}${deltaMk.toFixed(1)} mK`;

  const stageInfo = STAGE_DEFINITIONS.find((s) => s.id === point.stage);
  const sensorStatus = !hasStarted
    ? 'READY (Ref balanced)'
    : isRunning
      ? `S${point.stage}: ${stageInfo?.title ?? 'Sampling'}`
      : point.timeS >= 59.5
        ? 'COMPLETE (ΔT held)'
        : 'PAUSED';

  let resultLine = 'Awaiting sample';
  if (hasStarted) {
    if (point.stage < 5 && point.timeS < 52) {
      resultLine =
        config.condition === 'WITH_ALCOHOL'
          ? `Acquiring (${(point.reactionProgress * 100).toFixed(0)}% rxn)`
          : 'Acquiring BG baseline';
    } else if (config.condition === 'WITH_ALCOHOL') {
      resultLine = `ΔT=${deltaMk >= 0 ? '+' : ''}${deltaMk.toFixed(1)}mK | Uncalibrated`;
    } else {
      resultLine = `BG ΔT=${deltaMk >= 0 ? '+' : ''}${deltaMk.toFixed(1)}mK | No EtOH`;
    }
  }

  return {
    title: 'BLOOD ALCOHOL SENSOR',
    sampleLine: `Sample: ${config.sampleVolumeUl} µL`,
    reactionLine: `Reaction: ${reactionMode}`,
    thermalLine: `Thermal response: ${thermalResponseText}`,
    statusLine: `Sensor status: ${sensorStatus}`,
    resultLine: `Result: ${resultLine}`,
  };
}

export const OledEmulator: React.FC<OledEmulatorProps> = ({
  config,
  point,
  isRunning,
  hasStarted,
  compact = false,
}) => {
  const lines = getOledDisplayStrings(config, point, isRunning, hasStarted);

  return (
    <div
      className={`rounded-2xl border-4 border-slate-800 bg-slate-950 text-sky-300 shadow-lg ${
        compact ? 'p-3' : 'p-5'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Droplet icon matching reference image */}
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 ring-1 ring-sky-400/30">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-sky-400">
            <path d="M12 2.5C12 2.5 5.5 10.2 5.5 14.5C5.5 18.09 8.41 21 12 21C15.59 21 18.5 18.09 18.5 14.5C18.5 10.2 12 2.5 12 2.5Z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1 font-mono">
          <div className="flex items-center justify-between border-b border-sky-500/30 pb-1 text-[11px] font-bold tracking-wider text-sky-200">
            <span>{lines.title}</span>
            <span className="text-[10px] text-sky-400">
              {hasStarted ? `${point.timeS.toFixed(1)}s` : 'IDLE'}
            </span>
          </div>

          <div className="mt-2 space-y-1 text-xs leading-tight">
            <div className="flex justify-between gap-2 text-sky-100">
              <span>{lines.sampleLine}</span>
              <span
                className={
                  config.condition === 'WITH_ALCOHOL'
                    ? 'font-semibold text-amber-300'
                    : 'font-semibold text-cyan-300'
                }
              >
                {lines.reactionLine}
              </span>
            </div>
            <div className="text-sky-300">{lines.thermalLine}</div>
            <div className="truncate text-sky-400">{lines.statusLine}</div>
            <div className="rounded bg-sky-500/10 px-1.5 py-1 text-[11px] text-sky-200 ring-1 ring-sky-400/20">
              {lines.resultLine}
            </div>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-400">
          <span>Active: {point.tempThermalSensorC.toFixed(3)} °C</span>
          <span>Ref: {point.tempReferenceSensorC.toFixed(3)} °C</span>
          <span>Sim ADC: {point.esp32AdcCounts} cnt</span>
        </div>
      )}
    </div>
  );
};
