import { useMemo, useState } from "react";
import { ArrowLeft, Crosshair, TrendingUp } from "lucide-react";
import { Bar } from "../../components/Bar.jsx";
import { Button } from "../../components/Button.jsx";
import { Card } from "../../components/Card.jsx";
import { Eyebrow } from "../../components/Eyebrow.jsx";
import { computeAnalytics } from "../../lib/analytics.js";
import { OP_META, OP_ORDER } from "../../lib/constants.js";
import { formatMs } from "../../lib/number.js";
import {
  buildFocusPlan,
  buildFocusTrendSeries,
  focusSessionsForPreset,
  MIN_FOCUS_GAMES,
  regularSessionsForPreset,
} from "../../lib/targeting.js";
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

const GAME_LIMITS = [
  ["all", "All"],
  ["3", "Last 3"],
  ["5", "Last 5"],
  ["10", "Last 10"],
];

const VIEW_MODES = ["summary", "trends", "focus"];
const VIEW_LABELS = { summary: "Summary", trends: "Trends", focus: "Focus" };

export function AnalyticsPage({ presets, sessions, activePresetId, onBack, onStartFocus }) {
  const [viewMode, setViewMode] = useState("summary");
  const [gameLimit, setGameLimit] = useState("all");
  const [selectedPresetId, setSelectedPresetId] = useState(activePresetId);
  const sessionCountsByPreset = useMemo(
    () =>
      sessions.reduce((counts, session) => {
        if (session.mode !== "focus") counts[session.presetId] = (counts[session.presetId] || 0) + 1;
        return counts;
      }, {}),
    [sessions]
  );
  const filteredSessions = useMemo(
    () => regularSessionsForPreset(sessions, selectedPresetId),
    [selectedPresetId, sessions]
  );
  const focusSessions = useMemo(
    () => focusSessionsForPreset(sessions, selectedPresetId),
    [selectedPresetId, sessions]
  );
  const focusPlan = useMemo(() => buildFocusPlan(sessions, selectedPresetId), [selectedPresetId, sessions]);
  const visibleSessions = useMemo(() => recentSessions(filteredSessions, gameLimit), [filteredSessions, gameLimit]);
  const filteredAttempts = useMemo(() => visibleSessions.flatMap((session) => session.attempts), [visibleSessions]);
  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId) || presets[0];
  const analytics = useMemo(() => computeAnalytics(filteredAttempts), [filteredAttempts]);
  const focusSeries = useMemo(
    () => buildFocusTrendSeries(focusSessions, focusPlan.areas),
    [focusPlan.areas, focusSessions]
  );
  const nextViewMode = VIEW_MODES[(VIEW_MODES.indexOf(viewMode) + 1) % VIEW_MODES.length];
  const presetLabel = (preset) => {
    const count = sessionCountsByPreset[preset.id] || 0;
    return `${preset.name} (${count} game${count === 1 ? "" : "s"})`;
  };
  const trendCharts = useMemo(
    () => [
      { title: "Score", metric: "score", series: scoreTrendSeries(visibleSessions) },
      { title: "By operation", metric: "seconds", series: buildTrendSeries(visibleSessions, operationTrendDefinitions()) },
      { title: "Addition breakdown", metric: "seconds", series: buildTrendSeries(visibleSessions, regroupTrendDefinitions("addition")) },
      { title: "Subtraction breakdown", metric: "seconds", series: buildTrendSeries(visibleSessions, regroupTrendDefinitions("subtraction")) },
      { title: "Multiplication by factor", metric: "seconds", series: buildTrendSeries(visibleSessions, factorTrendDefinitions("multiplication")) },
      { title: "Division by divisor", metric: "seconds", series: buildTrendSeries(visibleSessions, factorTrendDefinitions("division")) },
    ],
    [visibleSessions]
  );

  if (sessions.length === 0) {
    return (
      <div className="mm-page">
        <div className="mm-page-header mm-page-header-between">
          <div className="mm-page-header-left">
            <button className="mm-iconbtn" onClick={onBack} aria-label="Back"><ArrowLeft size={18} /></button>
            <Eyebrow>Analytics</Eyebrow>
          </div>
        </div>
        <Card><div className="mm-empty">Play a game to start collecting stats.</div></Card>
      </div>
    );
  }

  return (
    <div className="mm-page">
      <div className="mm-page-header mm-page-header-between mm-analytics-header">
        <div className="mm-page-header-left">
          <button className="mm-iconbtn" onClick={onBack} aria-label="Back"><ArrowLeft size={18} /></button>
          <Eyebrow>Analytics</Eyebrow>
        </div>
        <label className="mm-header-preset">
          <span aria-hidden="true">{presetLabel(selectedPreset)}</span>
          <select aria-label="Analytics preset" value={selectedPresetId} onChange={(event) => setSelectedPresetId(event.target.value)}>
            {presets.map((preset) => <option key={preset.id} value={preset.id}>{presetLabel(preset)}</option>)}
          </select>
        </label>
        <Button variant={viewMode === "summary" ? "secondary" : "primary"} icon={TrendingUp} onClick={() => setViewMode(nextViewMode)}>
          {VIEW_LABELS[nextViewMode]}
        </Button>
      </div>

      {viewMode !== "focus" && filteredSessions.length === 0 && (
        <Card><div className="mm-empty">No regular games played with {selectedPreset?.name || "this preset"} yet.</div></Card>
      )}

      {viewMode !== "focus" && filteredSessions.length > 0 && (
        <Card>
          <div className="mm-trend-controls">
            <span className="mm-field-title">Games included</span>
            <div className="mm-segmented">
              {GAME_LIMITS.map(([value, label]) => (
                <button key={value} type="button" className={`mm-segbtn${gameLimit === value ? " mm-segbtn-active" : ""}`} onClick={() => setGameLimit(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {filteredAttempts.length > 0 && viewMode === "trends" && trendCharts.map((chart) => (
        <TrendChart key={chart.title} title={chart.title} sessions={visibleSessions} series={chart.series} metric={chart.metric} />
      ))}

      {viewMode !== "focus" && filteredSessions.length > 0 && filteredAttempts.length === 0 && (
        <Card><div className="mm-empty">No attempts were recorded in the selected games.</div></Card>
      )}

      {filteredAttempts.length > 0 && viewMode === "summary" && (
        <>
          <Card>
            <div className="mm-field-title">By operation</div>
            {OP_ORDER.map((op) => {
              const stats = analytics.byOperation[op];
              return (
                <div className="mm-op-row" key={op}>
                  <span className="mm-op-row-label" style={{ color: OP_META[op].color }}>{OP_META[op].symbol} {OP_META[op].label}</span>
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
            <div className="mm-field-title" style={{ color: OP_META.multiplication.color }}>Multiplication by factor</div>
            <FactorGrid map={analytics.multiplication} symbol={OP_META.multiplication.symbol} />
          </Card>

          <Card>
            <div className="mm-field-title" style={{ color: OP_META.division.color }}>Division by divisor</div>
            <FactorGrid map={analytics.division} symbol={OP_META.division.symbol} />
          </Card>

          <Card>
            <div className="mm-field-title">Slowest areas</div>
            {analytics.weakAreas.length === 0 && <div className="mm-empty">Not enough attempts yet to identify slow areas.</div>}
            {analytics.weakAreas.map((weakArea) => (
              <div className="mm-weak-row" key={weakArea.id}>
                <div className="mm-weak-line">
                  <span className="mm-weak-time">{formatMs(weakArea.stats.avgTime)}</span>
                  <span className="mm-weak-label" style={{ color: weakArea.color }}>{weakArea.label}</span>
                </div>
                <Bar value={1} color={weakArea.color} />
              </div>
            ))}
            <div className="mm-focus-action">
              <Button variant="primary" icon={Crosshair} onClick={() => onStartFocus(selectedPresetId)} disabled={!focusPlan.eligible} full>
                {focusPlan.eligible ? "Target Weaknesses" : `Target Weaknesses (${focusPlan.regularGameCount}/${MIN_FOCUS_GAMES} games)`}
              </Button>
            </div>
          </Card>
        </>
      )}

      {viewMode === "focus" && (
        <>
          <Card>
            <div className="mm-field-title">Target Weaknesses</div>
            <p className="mm-focus-copy">Based on your last {focusPlan.baselineGameCount || 0} regular games. 80% of problems come from the three slowest areas; ranks 4–8 share the remaining 20%.</p>
            {!focusPlan.eligible ? (
              <div className="mm-empty">Play {Math.max(0, MIN_FOCUS_GAMES - focusPlan.regularGameCount)} more regular game{MIN_FOCUS_GAMES - focusPlan.regularGameCount === 1 ? "" : "s"} with this preset to unlock Target Weaknesses.</div>
            ) : (
              <>
                <div className="mm-focus-area-list">
                  {focusPlan.areas.map((area) => (
                    <div className="mm-focus-area" key={area.id}>
                      <span className="mm-focus-rank">#{area.rank}</span>
                      <span style={{ color: area.color }}>{area.label}</span>
                      <span className="mm-focus-tier">{area.tier === "primary" ? "80% group" : "20% group"}</span>
                      <span>{formatMs(area.stats.avgTime)}</span>
                    </div>
                  ))}
                </div>
                <div className="mm-focus-action">
                  <Button variant="primary" icon={Crosshair} onClick={() => onStartFocus(selectedPresetId)} full>Start Targeted Game</Button>
                </div>
              </>
            )}
          </Card>

          {focusPlan.eligible && focusSessions.length > 0 && (
            <TrendChart title="Targeted area progress" sessions={focusSessions} series={focusSeries} metric="seconds" />
          )}

          {focusPlan.eligible && focusSessions.length === 0 && (
            <Card><div className="mm-empty">Complete a targeted game to begin the focus trend chart.</div></Card>
          )}
        </>
      )}
    </div>
  );
}
