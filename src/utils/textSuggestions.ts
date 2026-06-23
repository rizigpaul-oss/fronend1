import { stripDisplayMarkup } from "./plainText";

export type TextSuggestion = { text: string; count: number };

const USAGE_KEY = "ksl_text_usage_v1";
const DEVICE_ID_KEY = "ksl_device_id";

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function lastWordPrefix(text: string): string {
  const match = text.trimEnd().match(/(\S+)$/);
  return match ? match[1].toLowerCase() : "";
}

/** Replace the word being typed, or append if the field ends with whitespace. */
export function applySuggestionToText(current: string, suggestion: string): string {
  const clean = stripDisplayMarkup(suggestion);
  const prefix = lastWordPrefix(current);
  if (!prefix) {
    const base = current.trimEnd();
    return base ? `${base} ${clean}` : clean;
  }
  const trimmed = current.trimEnd();
  const withoutLast = trimmed.slice(0, trimmed.length - prefix.length);
  return `${withoutLast}${clean}`;
}

function readLocalUsage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalUsage(map: Record<string, number>) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(map));
}

export function recordLocalTextUsage(text: string) {
  const stripped = stripDisplayMarkup(text).trim();
  if (!stripped) return;
  const words = stripped.split(/\s+/).filter(Boolean);
  const tokens = new Set<string>(words.map((w) => w.toLowerCase()));
  if (words.length > 1) tokens.add(stripped.toLowerCase());
  const map = readLocalUsage();
  for (const token of tokens) {
    map[token] = (map[token] ?? 0) + 1;
  }
  writeLocalUsage(map);
}

export function getLocalTextSuggestions(
  prefix: string,
  limit: number
): TextSuggestion[] {
  const map = readLocalUsage();
  const q = prefix.toLowerCase();
  const items = Object.entries(map)
    .filter(([token]) => !q || token.startsWith(q))
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
  return items.slice(0, limit);
}

export function mergeSuggestions(
  a: TextSuggestion[],
  b: TextSuggestion[],
  limit: number
): TextSuggestion[] {
  const byText = new Map<string, number>();
  for (const list of [a, b]) {
    for (const { text, count } of list) {
      const key = text.toLowerCase();
      byText.set(key, Math.max(byText.get(key) ?? 0, count));
    }
  }
  return [...byText.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((x, y) => y.count - x.count || x.text.localeCompare(y.text))
    .slice(0, limit);
}
