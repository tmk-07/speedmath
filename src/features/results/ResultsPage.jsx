import { useMemo } from "react";
import { BarChart2, RefreshCcw, Settings as SettingsIcon } from "lucide-react";
import { Bar } from "../../components/Bar.jsx";
import { Button } from "../../components/Button.jsx";
import { Card } from "../../components/Card.jsx";
import { Eyebrow } from "../../components/Eyebrow.jsx";
import { computeAnalytics, statsFromList } from "../../lib/analytics.js";
import { OP_META, OP_ORDER } from "../../lib/constants.js";
import { formatMs } from "../../lib/number.js";

export function ResultsPage({ session, onPlayAgain, onChangeSettings, onViewAnalytics }) {
  const analytics = useMemo(() => computeAnalytics(session.attempts), [session]);
  const overall = statsFromList(session.attempts);

  return (
    <div className="mm-page">
      <Card className="mm-results-hero">
        <Eyebrow>Session Complete</Eyebrow>
        <div className="mm-results-score">{session.score}</div>
        <div className="mm-results-sub">correct answers in {session.duration}s</div>
        <div className="mm-results-grid">
          <div>
            <span className="mm-hud-label">Avg. response</span>
            <div className="mm-results-metric">{formatMs(overall.avgTime)}</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mm-field-title">By operation</div>
        {OP_ORDER.filter((op) => analytics.byOperation[op].attempted > 0).map((op) => {
          const stats = analytics.byOperation[op];
          return (
            <div className="mm-op-row" key={op}>
              <span className="mm-op-row-label" style={{ color: OP_META[op].color }}>
                {OP_META[op].symbol} {OP_META[op].label}
              </span>
              <Bar value={1} color={OP_META[op].color} />
              <span className="mm-op-row-meta">{formatMs(stats.avgTime)}</span>
            </div>
          );
        })}
      </Card>

      <div className="mm-landing-actions">
        <Button variant="primary" icon={RefreshCcw} onClick={onPlayAgain} full>
          Play Again
        </Button>
        <Button variant="secondary" icon={SettingsIcon} onClick={onChangeSettings} full>
          Change Settings
        </Button>
        <Button variant="ghost" icon={BarChart2} onClick={onViewAnalytics} full>
          View Full Analytics
        </Button>
      </div>
    </div>
  );
}
