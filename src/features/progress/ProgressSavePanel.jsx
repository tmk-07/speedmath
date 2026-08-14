import { useState } from "react";
import { ArrowLeft, LogOut, UserPlus, LogIn, Trash2 } from "lucide-react";
import { Button } from "../../components/Button.jsx";
import { Card } from "../../components/Card.jsx";
import { deleteAccount, loginAccount, logoutAccount, registerAccount } from "../../lib/syncApi.js";

export function ProgressSavePanel({ progress, syncAccount, onSetSyncAccount, onLoadProgress, onDeleteProgress }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function closePanel() {
    setOpen(false);
    setMessage("");
    setConfirmingDelete(false);
  }

  function cleanPin(value) {
    return value.replace(/[^0-9]/g, "").slice(0, 4);
  }

  async function handleCreateAccount() {
    setBusy(true);
    setMessage("");
    try {
      const result = await registerAccount(username, pin, progress);
      onSetSyncAccount({ username: result.account.username, token: result.token });
      setMessage(result.localOnly ? "Account created for this browser preview." : "Account created. Progress will sync automatically.");
      setPin("");
    } catch (error) {
      setMessage(`${error.message} Your progress is still saved on this device.`);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn() {
    if (!username.trim() || !pin.trim()) {
      setMessage("Enter username and 4 digit PIN.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await loginAccount(username, pin);
      onLoadProgress(result.progress, { username: result.account.username, token: result.token });
      setMessage("Signed in. Progress loaded.");
      setPin("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    const account = syncAccount;
    onSetSyncAccount(null);
    setMessage("Signed out on this device. Progress is still saved locally.");
    try {
      await logoutAccount(account);
    } catch {
      // Local sign-out should still complete even if the network is unavailable.
    }
  }

  async function handleDeleteData() {
    setBusy(true);
    setMessage("");
    try {
      await deleteAccount(syncAccount);
      onDeleteProgress();
      setConfirmingDelete(false);
      setUsername("");
      setPin("");
      setMessage("Your account and saved progress have been deleted.");
    } catch (error) {
      setMessage(error.message);
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
                    Progress saves locally on this device. To play across devices or keep progress long term, create an account with a username and 4 digit PIN.
                  </p>
                </div>
              </div>

              {syncAccount?.username && (
                <div className="mm-sync-code">
                  <span>Signed in</span>
                  <strong>{syncAccount.username}</strong>
                </div>
              )}

              <div className="mm-progress-actions">
                <div className="mm-code-load-row">
                  <input
                    className="mm-text-input"
                    placeholder="Username"
                    autoCapitalize="none"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                  <input
                    className="mm-text-input mm-pin-input"
                    placeholder="PIN"
                    inputMode="numeric"
                    value={pin}
                    onChange={(event) => setPin(cleanPin(event.target.value))}
                  />
                </div>
                <div className="mm-progress-button-row">
                  <Button variant="primary" icon={UserPlus} onClick={handleCreateAccount} disabled={busy}>
                    Create Account
                  </Button>
                  <Button variant="secondary" icon={LogIn} onClick={handleSignIn} disabled={busy}>
                    Sign In
                  </Button>
                </div>
                {syncAccount?.username && (
                  <>
                    <Button variant="ghost" icon={LogOut} onClick={handleSignOut} disabled={busy}>
                      Sign Out
                    </Button>
                    {!confirmingDelete ? (
                      <Button variant="danger-ghost" icon={Trash2} onClick={() => setConfirmingDelete(true)} disabled={busy}>
                        Delete My Data
                      </Button>
                    ) : (
                      <div className="mm-delete-confirm" role="alert">
                        <p>This permanently deletes your account and all saved progress. This cannot be undone.</p>
                        <div className="mm-progress-button-row">
                          <Button variant="ghost" onClick={() => setConfirmingDelete(false)} disabled={busy}>
                            Cancel
                          </Button>
                          <Button variant="danger" icon={Trash2} onClick={handleDeleteData} disabled={busy}>
                            Yes, Delete My Data
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
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
