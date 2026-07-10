let nextId = 0;

export function uid(prefix = "id") {
  nextId += 1;
  return `${prefix}_${nextId}_${Math.random().toString(36).slice(2, 7)}`;
}
