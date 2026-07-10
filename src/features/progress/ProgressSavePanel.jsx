import { useState } from "react";
import { ArrowLeft, Cloud, KeyRound } from "lucide-react";
import { Button } from "../../components/Button.jsx";
import { Card } from "../../components/Card.jsx";
import { createSyncCode, displayCode, loadSyncCode } from "../../lib/syncApi.js";

export function ProgressSavePanel({ progress, syncCode, onSetSyncCode, onLoadProgress }) {
  const [open, setOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function closePanel() {
    setOpen(false);
    setMessage("");
  }

  async function handleGenerateCode() {
    setBusy(true);
    setMessage("");
    try {
      const result = await createSyncCode(progress);
      onSetSyncCode(result.code);
      setMessage(result.localOnly ? "" : "Code created. Keep it somewhere safe so you can load this progress later.");
    } catch (error) {
      setMessage(`${error.message} Your progress is still saved on this device.`);
    } finally {
      setBusy(false);
    }
  }

  async function handleLoadCode() {
    if (!codeInput.trim()) {
      setMessage("Enter a code first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const loaded = await loadSyncCode(codeInput);
      onLoadProgress(loaded, codeInput);
      setMessage("Progress loaded from code.");
      setCodeInput("");
    } catch (error) {
      setMessage(`${error.message} Check the code and try again.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mm-progress-save">
      <button className="mm-progress-toggle" type="button" onClick={open ? closePanel : () => setOpen(true)}>
        <span>Save my progress</span>
      </button>

      {open && (
        <div className="mm-progress-dismiss-layer" role="presentation" onClick={closePanel}>
          <div className="mm-progress-panel-shell" onClick={(event) => event.stopPropagation()}>
            <Card className="mm-progress-panel">
              <div className="mm-progress-panel-head">
                <div>
                  <div className="mm-field-title">Progress</div>
                  <p className="mm-progress-copy">
                    Progress saves locally on this device. To play across devices or keep progress long term, create a code and save it somewhere safe.
                  </p>
                </div>
              </div>

              {syncCode && (
                <div className="mm-sync-code">
                  <span>Your code</span>
                  <strong>{displayCode(syncCode)}</strong>
                </div>
              )}

              <div className="mm-progress-actions">
                <Button variant="primary" icon={KeyRound} onClick={handleGenerateCode} disabled={busy}>
                  Generate Code
                </Button>
                <div className="mm-code-load-row">
                  <input
                    className="mm-text-input"
                    placeholder="Enter code"
                    value={codeInput}
                    onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                  />
                  <Button variant="secondary" icon={Cloud} onClick={handleLoadCode} disabled={busy}>
                    Enter Code
                  </Button>
                </div>
              </div>

              {message && (
                <div className="mm-sync-footer">
                  <div className="mm-sync-status">{message}</div>
                </div>
              )}

              <div className="mm-progress-back-row">
                <Button variant="ghost" icon={ArrowLeft} onClick={closePanel}>
                  Back
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
