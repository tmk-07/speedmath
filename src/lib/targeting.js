import { computeAnalytics, statsFromList } from "./analytics.js";
import { generateProblem } from "./problems.js";

export const MIN_FOCUS_GAMES = 5;
export const FOCUS_BASELINE_GAMES = 10;

export function regularSessionsForPreset(sessions, presetId) {
  return sessions.filter((session) => session.presetId === presetId && session.mode !== "focus");
}

export function focusSessionsForPreset(sessions, presetId) {
  return sessions.filter((session) => session.presetId === presetId && session.mode === "focus");
}

export function buildFocusPlan(sessions, presetId) {
  const regularSessions = regularSessionsForPreset(sessions, presetId);
  const baselineSessions = regularSessions.slice(-FOCUS_BASELINE_GAMES);
  const attempts = baselineSessions.flatMap((session) => session.attempts);
  const areas = computeAnalytics(attempts).allWeakAreas.slice(0, 8).map((area, index) => ({
    ...area,
    rank: index + 1,
    tier: index < 3 ? "primary" : "supporting",
  }));

  return {
    eligible: regularSessions.length >= MIN_FOCUS_GAMES && areas.length > 0,
    regularGameCount: regularSessions.length,
    baselineGameCount: baselineSessions.length,
    areas,
  };
}

export function chooseFocusArea(areas, random = Math.random) {
  if (!areas.length) return null;
  const primary = areas.slice(0, Math.min(3, areas.length));
  const supporting = areas.slice(3, 8);
  const chooseFrom = (list) => list[Math.floor(random() * list.length)];

  if (supporting.length === 0 || random() < 0.8) return chooseFrom(primary);
  return chooseFrom(supporting);
}

export function generateFocusProblem(area, preset) {
  if (!area) return null;
  const settings = preset.operations[area.operation];
  let targetedSettings = settings;

  if (area.id === "addition:regrouping" || area.id === "subtraction:borrowing") {
    targetedSettings = { ...settings, regroupMode: "onlyRegrouping" };
  } else if (area.id === "addition:no-regrouping" || area.id === "subtraction:no-borrowing") {
    targetedSettings = { ...settings, regroupMode: "onlyNoRegrouping" };
  } else if (area.operation === "multiplication") {
    const factor = Number(area.id.split(":")[1]);
    targetedSettings = { ...settings, aMin: factor, aMax: factor };
  } else if (area.operation === "division") {
    const divisor = Number(area.id.split(":")[1]);
    targetedSettings = { ...settings, divisorMin: divisor, divisorMax: divisor };
  }

  return {
    ...generateProblem(area.operation, targetedSettings),
    targetAreaId: area.id,
    targetAreaLabel: area.label,
  };
}

export function buildFocusTrendSeries(sessions, areas) {
  return areas.map((area) => ({
    label: area.label,
    color: area.color,
    values: sessions.map((session) => {
      const attempts = session.attempts.filter((attempt) => attempt.targetAreaId === area.id);
      const stats = statsFromList(attempts);
      return stats.attempted ? { value: stats.avgTime / 1000, attempted: stats.attempted } : null;
    }),
  }));
}
