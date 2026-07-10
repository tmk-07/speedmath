import { clampNum } from "../lib/number.js";

export function NumField({ label, value, onChange, min = 0, max = 100000 }) {
  return (
    <label className="mm-numfield">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(clampNum(event.target.value, value))}
      />
    </label>
  );
}
