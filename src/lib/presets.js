export function makeDefaultPreset() {
  return {
    id: "preset_default",
    name: "Default",
    duration: 120,
    operations: {
      addition: { enabled: true, aMin: 2, aMax: 100, bMin: 2, bMax: 100, regroupMode: "mixed" },
      subtraction: { enabled: true, aMin: 2, aMax: 100, bMin: 2, bMax: 100, regroupMode: "mixed" },
      multiplication: { enabled: true, aMin: 2, aMax: 12, bMin: 2, bMax: 100 },
      division: { enabled: true, divisorMin: 2, divisorMax: 12, quotientMin: 2, quotientMax: 100 },
    },
  };
}

export function clonePreset(preset) {
  return JSON.parse(JSON.stringify(preset));
}
