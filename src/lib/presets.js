export function makeEasyPreset() {
  return {
    id: "preset_easy",
    name: "Easy",
    duration: 120,
    operations: {
      addition: { enabled: true, aMin: 2, aMax: 10, bMin: 2, bMax: 20, regroupMode: "mixed" },
      subtraction: { enabled: true, aMin: 2, aMax: 10, bMin: 2, bMax: 20, regroupMode: "mixed" },
      multiplication: { enabled: true, aMin: 2, aMax: 12, bMin: 2, bMax: 12 },
      division: { enabled: true, divisorMin: 2, divisorMax: 12, quotientMin: 2, quotientMax: 12 },
    },
  };
}

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

export function makeInitialPresets() {
  return [makeEasyPreset(), makeDefaultPreset()];
}

export function ensureBuiltInPresets(presets) {
  return presets.some((preset) => preset.id === "preset_easy") ? presets : [makeEasyPreset(), ...presets];
}

export function clonePreset(preset) {
  return JSON.parse(JSON.stringify(preset));
}
