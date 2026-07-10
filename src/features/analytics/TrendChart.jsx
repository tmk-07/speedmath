import { useMemo, useState } from "react";
import { Card } from "../../components/Card.jsx";

function formatSecondsAxis(value) {
  return `${value.toFixed(value < 10 && value % 1 !== 0 ? 1 : 0)}s`;
}

function formatScoreAxis(value) {
  return String(Math.round(value));
}

function chartMax(series) {
  const maxValue = Math.max(
    0,
    ...series.flatMap((item) => item.values.filter(Boolean).map((point) => point.value))
  );
  if (maxValue <= 1) return 1;
  if (maxValue <= 5) return Math.ceil(maxValue * 2) / 2;
  return Math.ceil(maxValue);
}

function valuePoint(value, index, count, maxValue) {
  const chart = { left: 38, right: 12, top: 14, bottom: 30, width: 640, height: 220 };
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const x = count <= 1 ? chart.left + plotWidth / 2 : chart.left + (index / (count - 1)) * plotWidth;
  const y = chart.top + (1 - value / maxValue) * plotHeight;
  return { x, y };
}

function linePath(values, maxValue) {
  let openSegment = false;
  return values
    .map((point, index) => {
      if (!point) {
        openSegment = false;
        return "";
      }
      const next = valuePoint(point.value, index, values.length, maxValue);
      const command = openSegment ? "L" : "M";
      openSegment = true;
      return `${command} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");
}

function xLabelIndexes(count) {
  if (count <= 1) return [0];
  if (count <= 8) return Array.from({ length: count }, (_, index) => index);
  const step = Math.ceil((count - 1) / 4);
  const indexes = new Set([0, count - 1]);
  for (let index = step; index < count - 1; index += step) indexes.add(index);
  return [...indexes].sort((a, b) => a - b);
}

export function TrendChart({ title, sessions, series, metric = "seconds" }) {
  const [hiddenLabels, setHiddenLabels] = useState([]);
  const hiddenSet = useMemo(() => new Set(hiddenLabels), [hiddenLabels]);
  const visibleSeries = series.filter((item) => item.values.some(Boolean) && !hiddenSet.has(item.label));
  const xIndexes = xLabelIndexes(sessions.length);
  const maxValue = chartMax(visibleSeries);
  const yTicks = [maxValue, maxValue / 2, 0];

  function toggleSeries(label) {
    setHiddenLabels((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));
  }

  return (
    <Card>
      <div className="mm-trend-card-head">
        <div className="mm-field-title">{title}</div>
        <span className="mm-trend-count">
          {sessions.length} game{sessions.length === 1 ? "" : "s"}
        </span>
      </div>

      {series.length > 0 && (
        <div className="mm-trend-legend">
          {series.map((item) => (
            <button
              className={`mm-trend-label${hiddenSet.has(item.label) ? " mm-trend-label-off" : ""}${item.values.some(Boolean) ? "" : " mm-trend-label-empty-data"}`}
              key={item.label}
              style={{ "--series-color": item.color }}
              type="button"
              onClick={() => toggleSeries(item.label)}
              title={`${hiddenSet.has(item.label) ? "Show" : "Hide"} ${item.label}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <svg className="mm-trend-chart" viewBox="0 0 640 220" role="img" aria-label={`${title} trend chart`}>
        {yTicks.map((tick) => {
          const y = valuePoint(tick, 0, 1, maxValue).y;
          return (
            <g key={tick}>
              <line x1="38" x2="628" y1={y} y2={y} className="mm-trend-grid" />
              <text x="0" y={y + 4} className="mm-trend-axis">
                {metric === "score" ? formatScoreAxis(tick) : formatSecondsAxis(tick)}
              </text>
            </g>
          );
        })}

        {xIndexes.map((index) => {
          const point = valuePoint(0, index, sessions.length, maxValue);
          return (
            <text key={index} x={point.x} y="214" className="mm-trend-axis mm-trend-axis-x">
              G{index + 1}
            </text>
          );
        })}

        {visibleSeries.length === 0 && (
          <text x="333" y="112" className="mm-trend-empty">
            No data for this trend yet
          </text>
        )}

        {visibleSeries.map((item) => (
          <g key={item.label}>
            <path d={linePath(item.values, maxValue)} className="mm-trend-line" style={{ stroke: item.color }} />
            {item.values.map((point, index) => {
              if (!point) return null;
              const coords = valuePoint(point.value, index, item.values.length, maxValue);
              return <circle key={index} cx={coords.x} cy={coords.y} r="3.5" className="mm-trend-dot" style={{ fill: item.color }} />;
            })}
          </g>
        ))}
      </svg>
    </Card>
  );
}
