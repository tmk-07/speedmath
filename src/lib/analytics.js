import { OP_META, OP_ORDER } from "./constants.js";

export function statsFromList(list) {
  const attempted = list.length;
  const correct = list.filter((attempt) => attempt.correct).length;
  const accuracy = attempted ? correct / attempted : 0;
  const avgTime = attempted ? list.reduce((sum, attempt) => sum + attempt.responseTimeMs, 0) / attempted : 0;
  return { attempted, correct, accuracy, avgTime };
}

export function speedColor(avgTime) {
  if (!avgTime) return "#262F3D";
  const seconds = avgTime / 1000;
  if (seconds <= 1) return "#45E0B0";
  if (seconds <= 2) return "#D8E35F";
  if (seconds <= 3.5) return "#F2A93B";
  return "#F2555A";
}

export function computeAnalytics(attempts) {
  const byOperation = {};
  OP_ORDER.forEach((op) => {
    byOperation[op] = statsFromList(attempts.filter((attempt) => attempt.operation === op));
  });

  function regroupBreakdown(op) {
    const list = attempts.filter((attempt) => attempt.operation === op);
    return {
      regrouping: statsFromList(list.filter((attempt) => attempt.regrouping === true)),
      noRegrouping: statsFromList(list.filter((attempt) => attempt.regrouping === false)),
    };
  }

  function factorMap(op, key) {
    const list = attempts.filter((attempt) => attempt.operation === op);
    const map = {};
    list.forEach((attempt) => {
      const keys = key === "smallFactor" ? [Math.min(attempt.a, attempt.b)] : [attempt.b];
      keys.forEach((k) => {
        if (!map[k]) map[k] = [];
        map[k].push(attempt);
      });
    });
    const out = {};
    Object.keys(map)
      .map(Number)
      .sort((x, y) => x - y)
      .forEach((k) => {
        out[k] = statsFromList(map[k]);
      });
    return out;
  }

  const addition = regroupBreakdown("addition");
  const subtraction = regroupBreakdown("subtraction");
  const multiplication = factorMap("multiplication", "smallFactor");
  const division = factorMap("division", "divisor");

  const weakAreas = [];
  const minAttempts = 1;

  [
    ["addition", "regrouping", "Addition w/ regrouping"],
    ["addition", "noRegrouping", "Addition, no regrouping"],
    ["subtraction", "regrouping", "Subtraction w/ borrowing"],
    ["subtraction", "noRegrouping", "Subtraction, no borrowing"],
  ].forEach(([op, key, label]) => {
    const source = op === "addition" ? addition : subtraction;
    if (source[key].attempted >= minAttempts) {
      weakAreas.push({ label, stats: source[key], color: OP_META[op].color });
    }
  });

  Object.entries(multiplication).forEach(([k, stats]) => {
    const factor = Number(k);
    if (factor >= 1 && factor <= 12 && stats.attempted >= minAttempts) {
      weakAreas.push({ label: `\u00D7${k}`, stats, color: OP_META.multiplication.color });
    }
  });

  Object.entries(division).forEach(([k, stats]) => {
    const divisor = Number(k);
    if (divisor >= 1 && divisor <= 12 && stats.attempted >= minAttempts) {
      weakAreas.push({ label: `\u00F7${k}`, stats, color: OP_META.division.color });
    }
  });

  weakAreas.sort((x, y) => y.stats.avgTime - x.stats.avgTime);

  return {
    byOperation,
    addition,
    subtraction,
    multiplication,
    division,
    weakAreas: weakAreas.slice(0, 6),
    totalAttempted: attempts.length,
  };
}
