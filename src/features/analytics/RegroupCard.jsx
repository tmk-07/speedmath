import { Bar } from "../../components/Bar.jsx";
import { Card } from "../../components/Card.jsx";
import { formatMs } from "../../lib/number.js";

export function RegroupCard({ title, data, color }) {
  return (
    <Card>
      <div className="mm-field-title" style={{ color }}>
        {title}
      </div>
      {["regrouping", "noRegrouping"].map((key) => {
        const stats = data[key];
        return (
          <div className="mm-op-row" key={key}>
            <span className="mm-op-row-label">{key === "regrouping" ? "With regrouping" : "No regrouping"}</span>
            <Bar value={stats.attempted ? 1 : 0} color={color} />
            <span className="mm-op-row-meta">
              {stats.attempted ? formatMs(stats.avgTime) : "No data"}
            </span>
          </div>
        );
      })}
    </Card>
  );
}
