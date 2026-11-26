import React from 'react';
import { SimulationDataPoint } from '../simulation/biosensorModel';

export interface ChartSeries {
  label: string;
  color: string;
  dashed?: boolean;
  getValue: (p: SimulationDataPoint) => number;
}

interface MultiLineChartProps {
  title: string;
  subtitle?: string;
  yLabel: string;
  data: SimulationDataPoint[];
  series: ChartSeries[];
  currentTimeS?: number;
  height?: number;
  secondaryData?: SimulationDataPoint[];
  secondarySeries?: ChartSeries[];
}

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  title,
  subtitle,
  yLabel,
  data,
  series,
  currentTimeS,
  height = 240,
  secondaryData,
  secondarySeries,
}) => {
  const width = 640;
  const padLeft = 56;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const allValues: number[] = [];
  for (const s of series) {
    for (const d of data) {
      allValues.push(s.getValue(d));
    }
  }
  if (secondaryData && secondarySeries) {
    for (const s of secondarySeries) {
      for (const d of secondaryData) {
        allValues.push(s.getValue(d));
      }
    }
  }

  let minY = allValues.length ? Math.min(...allValues) : 0;
  let maxY = allValues.length ? Math.max(...allValues) : 1;
  if (Math.abs(maxY - minY) < 1e-6) {
    minY -= 0.5;
    maxY += 0.5;
  } else {
    const margin = (maxY - minY) * 0.12;
    minY -= margin;
    maxY += margin;
  }

  const maxT = data.length ? data[data.length - 1].timeS : 60;
  const xScale = (t: number) => padLeft + (t / maxT) * plotW;
  const yScale = (v: number) => padTop + ((maxY - v) / (maxY - minY)) * plotH;

  const buildPath = (pts: SimulationDataPoint[], fn: (p: SimulationDataPoint) => number) => {
    // Sample every 2nd point for crisp SVG performance while keeping full fidelity
    const sampled = pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1);
    return sampled
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xScale(p.timeS).toFixed(1)} ${yScale(fn(p)).toFixed(1)}`)
      .join(' ');
  };

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => minY + ((maxY - minY) * i) / yTicks);
  const xTickValues = [0, 10, 20, 30, 40, 50, 60];

  const formatY = (v: number) => {
    if (Math.abs(maxY - minY) < 0.1) return v.toFixed(3);
    if (Math.abs(maxY - minY) < 5) return v.toFixed(2);
    return v.toFixed(1);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-medical-700">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-700">
              <span
                className="inline-block h-2.5 w-4 rounded-sm"
                style={{
                  backgroundColor: s.dashed ? 'transparent' : s.color,
                  borderTop: s.dashed ? `2px dashed ${s.color}` : undefined,
                }}
              />
              <span>{s.label}</span>
            </div>
          ))}
          {secondarySeries?.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-700">
              <span
                className="inline-block h-2.5 w-4 rounded-sm"
                style={{
                  backgroundColor: s.dashed ? 'transparent' : s.color,
                  borderTop: s.dashed ? `2px dashed ${s.color}` : undefined,
                }}
              />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        {/* Horizontal Gridlines */}
        {yTickValues.map((val, idx) => {
          const y = yScale(val);
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-500 font-mono text-[10px]"
              >
                {formatY(val)}
              </text>
            </g>
          );
        })}

        {/* Vertical Gridlines */}
        {xTickValues.map((t) => {
          const x = xScale(t);
          return (
            <g key={t}>
              <line
                x1={x}
                y1={padTop}
                x2={x}
                y2={height - padBottom}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={x}
                y={height - padBottom + 14}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[10px]"
              >
                {t}s
              </text>
            </g>
          );
        })}

        {/* Zero line if inside range */}
        {minY < 0 && maxY > 0 && (
          <line
            x1={padLeft}
            y1={yScale(0)}
            x2={width - padRight}
            y2={yScale(0)}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
        )}

        {/* Axes */}
        <line
          x1={padLeft}
          y1={padTop}
          x2={padLeft}
          y2={height - padBottom}
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />
        <line
          x1={padLeft}
          y1={height - padBottom}
          x2={width - padRight}
          y2={height - padBottom}
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />

        {/* Y axis label */}
        <text
          x={14}
          y={padTop + plotH / 2}
          transform={`rotate(-90 14 ${padTop + plotH / 2})`}
          textAnchor="middle"
          className="fill-slate-600 text-[10px] font-medium"
        >
          {yLabel}
        </text>

        {/* Primary curves */}
        {series.map((s) => (
          <path
            key={s.label}
            d={buildPath(data, s.getValue)}
            fill="none"
            stroke={s.color}
            strokeWidth="2.2"
            strokeDasharray={s.dashed ? '6 4' : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Secondary curves (for comparison tab) */}
        {secondaryData &&
          secondarySeries?.map((s) => (
            <path
              key={s.label}
              d={buildPath(secondaryData, s.getValue)}
              fill="none"
              stroke={s.color}
              strokeWidth="2.0"
              strokeDasharray={s.dashed ? '6 4' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

        {/* Current Simulation Time Marker */}
        {typeof currentTimeS === 'number' && (
          <g>
            <line
              x1={xScale(currentTimeS)}
              y1={padTop}
              x2={xScale(currentTimeS)}
              y2={height - padBottom}
              stroke="#1e73b8"
              strokeWidth="1.6"
              strokeDasharray="4 2"
            />
            {series.map((s) => {
              const idx = Math.min(
                data.length - 1,
                Math.max(0, Math.round(currentTimeS / 0.1))
              );
              const pt = data[idx];
              if (!pt) return null;
              return (
                <circle
                  key={`dot-${s.label}`}
                  cx={xScale(pt.timeS)}
                  cy={yScale(s.getValue(pt))}
                  r="3.8"
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth="1.4"
                />
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};
