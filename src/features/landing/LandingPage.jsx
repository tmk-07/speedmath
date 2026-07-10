import { BarChart2, Play, Settings as SettingsIcon } from "lucide-react";
import { Button } from "../../components/Button.jsx";
import { Card } from "../../components/Card.jsx";
import { Eyebrow } from "../../components/Eyebrow.jsx";
import { OP_META, OP_ORDER } from "../../lib/constants.js";
import { enabledOps } from "../../lib/problems.js";

export function LandingPage({ presets, activePresetId, onSelectPreset, onStart, onGoSettings, onGoAnalytics, hasHistory }) {
  const activePreset = presets.find((preset) => preset.id === activePresetId) || presets[0];
  const nOps = enabledOps(activePreset).length;

  return (
    <div className="mm-landing">
      <Card className="mm-landing-card">
        <Eyebrow>Mental Math Drill</Eyebrow>
        <h1 className="mm-title">
          SYN<span className="mm-title-accent">APSE</span>
        </h1>
        <p className="mm-subtitle">
          Answer as many problems as you can before the clock runs out. Configure operations,
          ranges, and regrouping in Settings, then go.
        </p>

        <div className="mm-preset-row">
          <label className="mm-preset-label">
            <span>Preset</span>
            <select value={activePresetId} onChange={(event) => onSelectPreset(event.target.value)}>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
          <div className="mm-preset-info">
            <span>{activePreset.duration}s</span>
            <span className="mm-dot" />
            <span>
              {nOps} operation{nOps !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="mm-op-chip-row">
          {OP_ORDER.map((op) => (
            <span
              key={op}
              className={`mm-op-chip${activePreset.operations[op].enabled ? " mm-op-chip-on" : ""}`}
              style={{ "--op-color": OP_META[op].color }}
            >
              {OP_META[op].symbol}
            </span>
          ))}
        </div>

        {nOps === 0 && <div className="mm-warning">Enable at least one operation in Settings to play.</div>}

        <div className="mm-landing-actions">
          <Button variant="primary" icon={Play} onClick={onStart} disabled={nOps === 0} full>
            Start Game
          </Button>
          <Button variant="secondary" icon={SettingsIcon} onClick={onGoSettings} full>
            Settings
          </Button>
          <Button variant="ghost" icon={BarChart2} onClick={onGoAnalytics} full disabled={!hasHistory}>
            {hasHistory ? "View Analytics" : "Analytics (play a game first)"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
