import { useEffect, useMemo, useState } from "react";
import { AnalyticsPage } from "./features/analytics/AnalyticsPage.jsx";
import { GamePage } from "./features/game/GamePage.jsx";
import { LandingPage } from "./features/landing/LandingPage.jsx";
import { ProgressSavePanel } from "./features/progress/ProgressSavePanel.jsx";
import { ResultsPage } from "./features/results/ResultsPage.jsx";
import { SettingsPage } from "./features/settings/SettingsPage.jsx";
import { uid } from "./lib/id.js";
import { loadProgress, progressPayload, saveProgress } from "./lib/progressStorage.js";
import { makeDefaultPreset, clonePreset } from "./lib/presets.js";
import { saveSyncCode } from "./lib/syncApi.js";

export default function App() {
  const [savedProgress] = useState(() => loadProgress());
  const [presets, setPresets] = useState(() => savedProgress.presets);
  const [activePresetId, setActivePresetId] = useState(savedProgress.activePresetId);
  const [view, setView] = useState("landing");
  const [sessions, setSessions] = useState(savedProgress.sessions);
  const [lastSession, setLastSession] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const [syncCode, setSyncCode] = useState(savedProgress.syncCode);
  const [syncStatus, setSyncStatus] = useState("");

  const activePreset = presets.find((preset) => preset.id === activePresetId) || presets[0];
  const allAttempts = useMemo(() => sessions.flatMap((session) => session.attempts), [sessions]);
  const currentProgress = useMemo(
    () => ({ presets, activePresetId, sessions, syncCode }),
    [activePresetId, presets, sessions, syncCode]
  );

  useEffect(() => {
    saveProgress(currentProgress);
  }, [currentProgress]);

  useEffect(() => {
    if (!syncCode) return undefined;
    const timer = setTimeout(async () => {
      try {
        const result = await saveSyncCode(syncCode, progressPayload(currentProgress));
        setSyncStatus(result.localOnly ? "Saved locally and to this browser preview code." : "Saved locally and to your code.");
      } catch {
        setSyncStatus("Saved locally. Code sync will work after the Cloudflare backend is connected.");
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [currentProgress, syncCode]);

  function loadProgressFromCode(progress, code) {
    const nextPresets = Array.isArray(progress.presets) && progress.presets.length > 0 ? progress.presets : [makeDefaultPreset()];
    const nextActivePresetId = nextPresets.some((preset) => preset.id === progress.activePresetId)
      ? progress.activePresetId
      : nextPresets[0].id;

    setPresets(nextPresets);
    setActivePresetId(nextActivePresetId);
    setSessions(Array.isArray(progress.sessions) ? progress.sessions : []);
    setLastSession(null);
    setSyncCode(code.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""));
    setView("landing");
  }

  function savePreset(updated) {
    setPresets((current) => current.map((preset) => (preset.id === updated.id ? updated : preset)));
    setActivePresetId(updated.id);
  }

  function saveAsNewPreset(name, draft) {
    const newPreset = { ...clonePreset(draft), id: uid("preset"), name };
    setPresets((current) => [...current, newPreset]);
    setActivePresetId(newPreset.id);
  }

  function deletePreset(id) {
    setPresets((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((preset) => preset.id !== id);
      if (activePresetId === id) setActivePresetId(next[0].id);
      return next;
    });
  }

  function finishGame(session) {
    setSessions((current) => [...current, session]);
    setLastSession(session);
    setView("results");
  }

  return (
    <div className="mm-app">
      <div className="mm-shell">
        {view === "landing" && (
          <LandingPage
            presets={presets}
            activePresetId={activePresetId}
            onSelectPreset={setActivePresetId}
            onStart={() => {
              setGameKey((key) => key + 1);
              setView("game");
            }}
            onGoSettings={() => setView("settings")}
            onGoAnalytics={() => setView("analytics")}
            hasHistory={allAttempts.length > 0}
          />
        )}

        {view === "settings" && (
          <SettingsPage
            presets={presets}
            activePresetId={activePresetId}
            onBack={() => setView("landing")}
            onSavePreset={savePreset}
            onSaveAsNew={saveAsNewPreset}
            onDeletePreset={deletePreset}
            onSelectPreset={setActivePresetId}
          />
        )}

        {view === "game" && <GamePage key={gameKey} preset={activePreset} onFinish={finishGame} />}

        {view === "results" && lastSession && (
          <ResultsPage
            session={lastSession}
            onPlayAgain={() => {
              setGameKey((key) => key + 1);
              setView("game");
            }}
            onChangeSettings={() => setView("settings")}
            onViewAnalytics={() => setView("analytics")}
          />
        )}

        {view === "analytics" && (
          <AnalyticsPage
            presets={presets}
            sessions={sessions}
            activePresetId={activePresetId}
            onBack={() => setView("landing")}
          />
        )}

        <ProgressSavePanel
          progress={progressPayload(currentProgress)}
          syncCode={syncCode}
          syncStatus={syncStatus}
          onSetSyncCode={setSyncCode}
          onLoadProgress={loadProgressFromCode}
        />
      </div>
    </div>
  );
}
