import { useMemo, useState } from "react";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Bar } from "../../components/Bar.jsx";
import { Button } from "../../components/Button.jsx";
import { Card } from "../../components/Card.jsx";
import { Eyebrow } from "../../components/Eyebrow.jsx";
import { computeAnalytics } from "../../lib/analytics.js";
import { OP_META, OP_ORDER } from "../../lib/constants.js";
import { formatMs } from "../../lib/number.js";
import {
  buildTrendSeries,
  factorTrendDefinitions,
  operationTrendDefinitions,
  recentSessions,
  regroupTrendDefinitions,
  scoreTrendSeries,
} from "../../lib/trends.js";
import { FactorGrid } from "./FactorGrid.jsx";
import { RegroupCard } from "./RegroupCard.jsx";
import { TrendChart } from "./TrendChart.jsx";

const TREND_LIMITS = [
  ["all", "All"],
  ["3", "Last 3"],
  ["5", "Last 5"],
  ["10", "Last 10"],
];

export function AnalyticsPage({ presets, sessions, activePresetId, onBack }) {
  const [viewMode, setViewMode] = useState("summary");
  const [trendLimit, setTrendLimit] = useState("all");
  const [selectedPresetId, setSelectedPresetId] = useState(activePresetId);
  const sessionCountsByPreset = useMemo(
    () =>
      sessions.reduce((counts, session) => {
        counts[session.presetId] = (counts[session.presetId] || 0) + 1;
        return counts;
      }, {}),
    [sessions]
  );
  const filteredSessions = useMemo(
    () => sessions.filter((session) => session.presetId === selectedPresetId),
    [selectedPresetId, sessions]
  );
  const filteredAttempts = useMemo(() => filteredSessions.flatMap((session) => session.attempts), [filteredSessions]);
  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId) || presets[0];
  const presetLabel = (preset) => {
    const count = sessionCountsByPreset[preset.id] || 0;
    return `${preset.name} (${count} game${count === 1 ? "" : "s"})`;
  };
  const analytics = useMemo(() => computeAnalytics(filteredAttempts), [filteredAttempts]);
  const trendSessions = useMemo(() => recentSessions(filteredSessions, trendLimit), [filteredSessions, trendLimit]);
  const trendCharts = useMemo(
    () => [
      {
        title: "Score",
        metric: "score",
        series: scoreTrendSeries(trendSessions),
      },
      {
        title: "By operation",
        metric: "seconds",
        series: buildTrendSeries(trendSessions, operationTrendDefinitions()),
      },
      {
        title: "Addition breakdown",
        metric: "seconds",
        series: buildTrendSeries(trendSessions, regroupTrendDefinitions("addition")),
      },
      {
        title: "Subtraction breakdown",
        metric: "seconds",
        series: buildTrendSeries(trendSessions, regroupTrendDefinitions("subtraction")),
      },
      {
        title: "Multiplication by factor",
        metric: "seconds",
        series: buildTrendSeries(trendSessions, factorTrendDefinitions("multiplication")),
      },
      {
        title: "Division by divisor",
        metric: "seconds",
        series: buildTrendSeries(trendSessions, factorTrendDefinitions("division")),
      },
    ],
    [trendSessions]
  );

  if (sessions.length === 0) {
    return (
      <div className="mm-page">
        <div className="mm-page-header mm-page-header-between">
          <div className="mm-page-header-left">
            <button className="mm-iconbtn" onClick={onBack} aria-label="Back">
              <ArrowLeft size={18} />
            </button>
            <Eyebrow>Analytics</Eyebrow>
          </div>
        </div>
        <Card>
          <div className="mm-empty">Play a game to start collecting stats.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mm-page">
      <div className="mm-page-header mm-page-header-between mm-analytics-header">
        <div className="mm-page-header-left">
          <button className="mm-iconbtn" onClick={onBack} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <Eyebrow>Analytics</Eyebrow>
        </div>
        <label className="mm-header-preset">
          <span aria-hidden="true">{presetLabel(selectedPreset)}</span>
          <select aria-label="Analytics preset" value={selectedPresetId} onChange={(event) => setSelectedPresetId(event.target.value)}>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {presetLabel(preset)}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant={viewMode === "trends" ? "primary" : "secondary"}
          icon={TrendingUp}
          onClick={() => setViewMode((current) => (current === "trends" ? "summary" : "trends"))}
        >
          {viewMode === "trends" ? "Summary" : "Trends"}
        </Button>
      </div>

      {filteredAttempts.length === 0 && (
        <Card>
          <div className="mm-empty">No games played with {selectedPreset?.name || "this preset"} yet.</div>
        </Card>
      )}

      {filteredAttempts.length > 0 && viewMode === "trends" && (
        <>
          <Card>
            <div className="mm-trend-controls">
              <span className="mm-field-title">Last games</span>
              <div className="mm-segmented">
                {TREND_LIMITS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`mm-segbtn${trendLimit === value ? " mm-segbtn-active" : ""}`}
                    onClick={() => setTrendLimit(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {trendCharts.map((chart) => (
            <TrendChart key={chart.title} title={chart.title} sessions={trendSessions} series={chart.series} metric={chart.metric} />
          ))}
        </>
      )}

      {filteredAttempts.length > 0 && viewMode === "summary" && (
        <>
          <Card>
            <div className="mm-field-title">By operation</div>
            {OP_ORDER.map((op) => {
              const stats = analytics.byOperation[op];
              return (
                <div className="mm-op-row" key={op}>
                  <span className="mm-op-row-label" style={{ color: OP_META[op].color }}>
                    {OP_META[op].symbol} {OP_META[op].label}
                  </span>
                  <Bar value={stats.attempted ? 1 : 0} color={OP_META[op].color} />
                  <span className="mm-op-row-meta">{stats.attempted ? formatMs(stats.avgTime) : "No data"}</span>
                </div>
              );
            })}
          </Card>

          <div className="mm-two-col">
            <RegroupCard title="Addition breakdown" data={analytics.addition} color={OP_META.addition.color} />
            <RegroupCard title="Subtraction breakdown" data={analytics.subtraction} color={OP_META.subtraction.color} />
          </div>

          <Card>
            <div className="mm-field-title" style={{ color: OP_META.multiplication.color }}>
              Multiplication by factor
            </div>
            <FactorGrid map={analytics.multiplication} symbol={OP_META.multiplication.symbol} />
          </Card>

          <Card>
            <div className="mm-field-title" style={{ color: OP_META.division.color }}>
              Division by divisor
            </div>
            <FactorGrid map={analytics.division} symbol={OP_META.division.symbol} />
          </Card>

          <Card>
            <div className="mm-field-title">Slowest areas</div>
            {analytics.weakAreas.length === 0 && <div className="mm-empty">Not enough attempts yet to identify slow areas.</div>}
            {analytics.weakAreas.map((weakArea, index) => (
              <div className="mm-weak-row" key={index}>
                <div className="mm-weak-line">
                  <span className="mm-weak-time">{formatMs(weakArea.stats.avgTime)}</span>
                  <span className="mm-weak-label" style={{ color: weakArea.color }}>
                    {weakArea.label}
                  </span>
                </div>
                <Bar value={1} color={weakArea.color} />
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
