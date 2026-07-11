import { ensureBuiltInPresets, makeInitialPresets } from "./presets.js";

const STORAGE_KEY = "speedmath.progress.v1";

function defaultProgress() {
  return {
    presets: makeInitialPresets(),
    activePresetId: "preset_easy",
    sessions: [],
    syncCode: "",
    syncAccount: null,
  };
}

function normalizeProgress(value) {
  const fallback = defaultProgress();
  if (!value || typeof value !== "object") return fallback;

  const savedPresets = Array.isArray(value.presets) && value.presets.length > 0 ? value.presets : fallback.presets;
  const presets = ensureBuiltInPresets(savedPresets);
  const activePresetId = presets.some((preset) => preset.id === value.activePresetId)
    ? value.activePresetId
    : presets[0].id;

  return {
    presets,
    activePresetId,
    sessions: Array.isArray(value.sessions) ? value.sessions : [],
    syncCode: typeof value.syncCode === "string" ? value.syncCode : "",
    syncAccount: value.syncAccount && typeof value.syncAccount === "object" ? value.syncAccount : null,
  };
}

export function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeProgress(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        presets: progress.presets,
        activePresetId: progress.activePresetId,
        sessions: progress.sessions,
        syncCode: progress.syncCode || "",
        syncAccount: progress.syncAccount || null,
      })
    );
  } catch {
    // Local persistence should never interrupt gameplay.
  }
}

export function progressPayload(progress) {
  return {
    presets: progress.presets,
    activePresetId: progress.activePresetId,
    sessions: progress.sessions,
  };
}
