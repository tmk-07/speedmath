import { Bar } from "../../components/Bar.jsx";
import { speedColor } from "../../lib/analytics.js";
import { formatMs } from "../../lib/number.js";

export function FactorGrid({ map, symbol }) {
  const entries = Object.entries(map);
  if (entries.length === 0) return <div className="mm-empty">No attempts yet.</div>;

  return (
    <div className="mm-factor-grid">
      {entries.map(([k, stats]) => (
        <div className="mm-factor-cell" key={k}>
          <div className="mm-factor-head">
            {symbol}
            {k}
          </div>
          <Bar value={stats.attempted ? 1 : 0} color={speedColor(stats.avgTime)} />
          <div className="mm-factor-meta">
            <span>{formatMs(stats.avgTime)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
