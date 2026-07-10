import { OP_META, OP_ORDER } from "./constants.js";
import { statsFromList } from "./analytics.js";

const SERIES_COLORS = [
  "#45E0B0",
  "#F2A93B",
  "#5FC1FF",
  "#C792F2",
  "#F2555A",
  "#D8E35F",
  "#FF8CC6",
  "#7DE0FF",
  "#B6F28B",
  "#FFA45F",
];

export function colorForSeries(index) {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

export function recentSessions(sessions, limit) {
  if (limit === "all") return sessions;
  return sessions.slice(-Number(limit));
}

export function buildTrendSeries(sessions, definitions) {
  return definitions.map((definition) => ({
    label: definition.label,
    color: definition.color,
    values: sessions.map((session) => {
      const stats = statsFromList(session.attempts.filter(definition.filter));
      return stats.attempted ? { value: stats.avgTime / 1000, attempted: stats.attempted } : null;
    }),
  }));
}

export function scoreTrendSeries(sessions) {
  return [
    {
      label: "Score",
      color: "#45E0B0",
      values: sessions.map((session) => ({ value: session.score || 0, attempted: 1 })),
    },
  ];
}

export function operationTrendDefinitions() {
  return OP_ORDER.map((op) => ({
    label: OP_META[op].label,
    color: OP_META[op].color,
    filter: (attempt) => attempt.operation === op,
  }));
}

export function regroupTrendDefinitions(op) {
  const labels =
    op === "addition"
      ? { trueLabel: "With regrouping", falseLabel: "No regrouping" }
      : { trueLabel: "With borrowing", falseLabel: "No borrowing" };

  return [
    {
      label: labels.trueLabel,
      color: OP_META[op].color,
      filter: (attempt) => attempt.operation === op && attempt.regrouping === true,
    },
    {
      label: labels.falseLabel,
      color: "#7C8798",
      filter: (attempt) => attempt.operation === op && attempt.regrouping === false,
    },
  ];
}

export function factorTrendDefinitions(op) {
  return Array.from({ length: 12 }, (_, index) => index + 1)
    .map((factor, index) => ({
      label: `${OP_META[op].symbol}${factor}`,
      color: colorForSeries(index),
      filter: (attempt) =>
        op === "multiplication"
          ? attempt.operation === op && Math.min(attempt.a, attempt.b) === factor
          : attempt.operation === op && attempt.b === factor,
    }));
}
