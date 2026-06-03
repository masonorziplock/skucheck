export function normalizeSku(input: string): string {
  const raw = String(input || "").trim().toUpperCase();
  const cleaned = raw.replace(/\s+/g, "").replace(/_/g, "-");

  const nikeLike = cleaned.match(/^([A-Z]{2}\d{4})(\d{3})$/);
  if (nikeLike) return `${nikeLike[1]}-${nikeLike[2]}`;

  return cleaned;
}

export function isLikelySku(input: string): boolean {
  const raw = String(input || "").trim();
  if (!raw) return false;

  // Preserve multi-word product searches. Only treat spaced input as a SKU
  // when it matches a real style-code shape like "hf 4198 001".
  if (/\s/.test(raw)) {
    return /^[A-Z]{2}\s*\d{4}\s*-?\s*\d{3}$/i.test(raw);
  }

  return /^[A-Z]{2}\d{4}-?\d{3}$/i.test(raw) || /^[A-Z0-9]{5,}[-_][A-Z0-9]{2,}$/i.test(raw);
}

export function normalizeSearchQuery(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "";

  // Only collapse spaces for inputs that are clearly SKU/style codes.
  // Keyword searches like "black cat 4" must stay phrase/token based.
  return isLikelySku(raw) ? normalizeSku(raw) : raw.replace(/\s+/g, " ");
}

export function tokenizeKeywordQuery(input: string): string[] {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}
