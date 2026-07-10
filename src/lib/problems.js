import { OP_META, OP_ORDER } from "./constants.js";
import { uid } from "./id.js";
import { randInt } from "./number.js";

function hasCarry(a, b) {
  const as = String(a);
  const bs = String(b);
  const len = Math.max(as.length, bs.length);
  const ap = as.padStart(len, "0");
  const bp = bs.padStart(len, "0");
  for (let i = len - 1; i >= 0; i--) {
    if (Number(ap[i]) + Number(bp[i]) >= 10) return true;
  }
  return false;
}

function hasBorrow(a, b) {
  const as = String(a);
  const bs = String(b);
  const len = Math.max(as.length, bs.length);
  const ap = as.padStart(len, "0");
  const bp = bs.padStart(len, "0");
  for (let i = len - 1; i >= 0; i--) {
    if (Number(ap[i]) < Number(bp[i])) return true;
  }
  return false;
}

function maybeSwap(a, b) {
  return randInt(0, 1) === 0 ? [a, b] : [b, a];
}

export function generateProblem(operation, settings) {
  if (operation === "addition") {
    let a = 0;
    let b = 0;
    let regroup = false;
    for (let i = 0; i < 60; i++) {
      a = randInt(settings.aMin, settings.aMax);
      b = randInt(settings.bMin, settings.bMax);
      regroup = hasCarry(a, b);
      if (settings.regroupMode === "mixed") break;
      if (settings.regroupMode === "onlyRegrouping" && regroup) break;
      if (settings.regroupMode === "onlyNoRegrouping" && !regroup) break;
    }
    return { id: uid("p"), operation, a, b, answer: a + b, regrouping: regroup };
  }

  if (operation === "subtraction") {
    let a = 0;
    let b = 0;
    let regroup = false;
    for (let i = 0; i < 60; i++) {
      const x = randInt(settings.aMin, settings.aMax);
      const y = randInt(settings.bMin, settings.bMax);
      a = Math.max(x, y);
      b = Math.min(x, y);
      regroup = hasBorrow(a, b);
      if (settings.regroupMode === "mixed") break;
      if (settings.regroupMode === "onlyRegrouping" && regroup) break;
      if (settings.regroupMode === "onlyNoRegrouping" && !regroup) break;
    }
    return { id: uid("p"), operation, a, b, answer: a - b, regrouping: regroup };
  }

  if (operation === "multiplication") {
    const [a, b] = maybeSwap(randInt(settings.aMin, settings.aMax), randInt(settings.bMin, settings.bMax));
    return { id: uid("p"), operation, a, b, answer: a * b, regrouping: null };
  }

  if (operation === "division") {
    const firstFactor = randInt(settings.divisorMin, settings.divisorMax);
    const secondFactor = randInt(settings.quotientMin, settings.quotientMax);
    const divisor = Math.min(firstFactor, secondFactor);
    const quotient = Math.max(firstFactor, secondFactor);
    return { id: uid("p"), operation, a: divisor * quotient, b: divisor, answer: quotient, regrouping: null };
  }

  return null;
}

export function problemText(problem) {
  const symbol = OP_META[problem.operation].symbol;
  return `${problem.a} ${symbol} ${problem.b}`;
}

export function enabledOps(preset) {
  return OP_ORDER.filter((op) => preset.operations[op].enabled);
}
