import { NumField } from "../../components/NumField.jsx";
import { OP_META } from "../../lib/constants.js";

export function OperationCard({ opKey, settings, onChange }) {
  const meta = OP_META[opKey];
  const isAddSub = opKey === "addition" || opKey === "subtraction";
  const isDivision = opKey === "division";

  function set(field, value) {
    onChange({ ...settings, [field]: value });
  }

  return (
    <div className={`mm-opcard${settings.enabled ? "" : " mm-opcard-off"}`} style={{ "--op-color": meta.color }}>
      <div className="mm-opcard-head">
        <label className="mm-switch">
          <input type="checkbox" checked={settings.enabled} onChange={(event) => set("enabled", event.target.checked)} />
          <span className="mm-switch-track">
            <span className="mm-switch-thumb" />
          </span>
        </label>
        <span className="mm-opcard-symbol">{meta.symbol}</span>
        <span className="mm-opcard-title">{meta.label}</span>
      </div>

      {settings.enabled && (
        <div className="mm-opcard-body">
          {!isDivision && (
            <div className="mm-range-grid">
              <NumField label="First number min" value={settings.aMin} onChange={(value) => set("aMin", value)} />
              <NumField label="First number max" value={settings.aMax} onChange={(value) => set("aMax", value)} />
              <NumField label="Second number min" value={settings.bMin} onChange={(value) => set("bMin", value)} />
              <NumField label="Second number max" value={settings.bMax} onChange={(value) => set("bMax", value)} />
            </div>
          )}
          {isDivision && (
            <div className="mm-range-grid">
              <NumField label="First factor min" value={settings.divisorMin} onChange={(value) => set("divisorMin", value)} />
              <NumField label="First factor max" value={settings.divisorMax} onChange={(value) => set("divisorMax", value)} />
              <NumField label="Second factor min" value={settings.quotientMin} onChange={(value) => set("quotientMin", value)} />
              <NumField label="Second factor max" value={settings.quotientMax} onChange={(value) => set("quotientMax", value)} />
            </div>
          )}
          {isAddSub && (
            <div className="mm-regroup-select">
              <span>Problem type</span>
              <div className="mm-segmented">
                {[
                  ["mixed", "Mixed"],
                  ["onlyNoRegrouping", opKey === "addition" ? "No regrouping" : "No borrowing"],
                  ["onlyRegrouping", opKey === "addition" ? "Regrouping only" : "Borrowing only"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`mm-segbtn${settings.regroupMode === value ? " mm-segbtn-active" : ""}`}
                    onClick={() => set("regroupMode", value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
