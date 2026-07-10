import { pct } from "../lib/number.js";

export function Bar({ value, color }) {
  return (
    <div className="mm-bar-track">
      <div className="mm-bar-fill" style={{ width: pct(value), background: color }} />
    </div>
  );
}
