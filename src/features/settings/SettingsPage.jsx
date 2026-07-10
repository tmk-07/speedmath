import { useEffect, useState } from "react";
import { ArrowLeft, Check, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "../../components/Button.jsx";
import { Card } from "../../components/Card.jsx";
import { Eyebrow } from "../../components/Eyebrow.jsx";
import { OP_META, OP_ORDER } from "../../lib/constants.js";
import { clampNum } from "../../lib/number.js";
import { clonePreset } from "../../lib/presets.js";
import { OperationCard } from "./OperationCard.jsx";

export function SettingsPage({ presets, activePresetId, onBack, onSavePreset, onSaveAsNew, onDeletePreset, onSelectPreset }) {
  const activePreset = presets.find((preset) => preset.id === activePresetId) || presets[0];
  const [draft, setDraft] = useState(() => clonePreset(activePreset));
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDraft(clonePreset(activePreset));
    setError("");
  }, [activePreset, activePresetId]);

  function updateOp(opKey, newSettings) {
    setDraft((current) => ({ ...current, operations: { ...current.operations, [opKey]: newSettings } }));
  }

  function validate(preset) {
    if (!preset.duration || preset.duration < 5) return "Duration must be at least 5 seconds.";
    const anyEnabled = OP_ORDER.some((op) => preset.operations[op].enabled);
    if (!anyEnabled) return "Enable at least one operation.";
    for (const op of OP_ORDER) {
      const settings = preset.operations[op];
      if (!settings.enabled) continue;
      if (op === "division") {
        if (settings.divisorMin > settings.divisorMax) return "Division: first factor min must be \u2264 max.";
        if (settings.quotientMin > settings.quotientMax) return "Division: second factor min must be \u2264 max.";
      } else {
        if (settings.aMin > settings.aMax) return `${OP_META[op].label}: first number min must be \u2264 max.`;
        if (settings.bMin > settings.bMax) return `${OP_META[op].label}: second number min must be \u2264 max.`;
      }
    }
    return "";
  }

  function handleSave() {
    const validationError = validate(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    onSavePreset(draft);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  function handleSaveAsNew() {
    const validationError = validate(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!newName.trim()) {
      setError("Give the new preset a name.");
      return;
    }
    setError("");
    onSaveAsNew(newName.trim(), draft);
    setNewName("");
  }

  return (
    <div className="mm-page">
      <div className="mm-page-header">
        <button className="mm-iconbtn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <Eyebrow>Settings</Eyebrow>
      </div>

      <Card>
        <div className="mm-preset-manager">
          <label className="mm-preset-label">
            <span>Editing preset</span>
            <select value={activePresetId} onChange={(event) => onSelectPreset(event.target.value)}>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="danger-ghost"
            icon={Trash2}
            onClick={() => onDeletePreset(activePresetId)}
            disabled={presets.length <= 1}
          >
            Delete
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mm-duration-row">
          <span className="mm-field-title">Game duration</span>
          <div className="mm-duration-chips">
            {[30, 60, 90, 120].map((duration) => (
              <button
                key={duration}
                type="button"
                className={`mm-segbtn${draft.duration === duration ? " mm-segbtn-active" : ""}`}
                onClick={() => setDraft((current) => ({ ...current, duration }))}
              >
                {duration}s
              </button>
            ))}
            <input
              type="number"
              className="mm-duration-custom"
              value={draft.duration}
              min={5}
              onChange={(event) =>
                setDraft((current) => ({ ...current, duration: clampNum(event.target.value, current.duration) }))
              }
            />
          </div>
        </div>
      </Card>

      <div className="mm-opcard-grid">
        {OP_ORDER.map((op) => (
          <OperationCard key={op} opKey={op} settings={draft.operations[op]} onChange={(settings) => updateOp(op, settings)} />
        ))}
      </div>

      {error && <div className="mm-warning mm-warning-error">{error}</div>}

      <Card>
        <div className="mm-field-title">Presets</div>
        <div className="mm-save-row">
          <Button variant="primary" icon={savedFlash ? Check : Save} onClick={handleSave}>
            {savedFlash ? "Saved" : "Save Changes"}
          </Button>
        </div>
        <div className="mm-save-row mm-save-row-new">
          <input
            className="mm-text-input"
            placeholder="New preset name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <Button variant="secondary" icon={Plus} onClick={handleSaveAsNew}>
            Save As New
          </Button>
        </div>
      </Card>

      <Button variant="ghost" onClick={onBack} full>
        Back to Menu
      </Button>
    </div>
  );
}
