export function normalizeSku(input: string): string {
  const raw = String(input || "").trim().toUpperCase();
  const cleaned = raw.replace(/\s+/g, "").replace(/_/g, "-");

  const nikeLike = cleaned.match(/^([A-Z]{2}\d{4})(\d{3})$/);
  if (nikeLike) return `${nikeLike[1]}-${nikeLike[2]}`;

  return cleaned;
}

export function isLikelySku(input: string): boolean {
  const raw = String(input || "").trim();
  const compact = raw.replace(/\s+/g, "");
  return /^[A-Z]{2}\d{4}-?\d{3}$/i.test(compact) || /^[A-Z0-9]{5,}[-_]?[A-Z0-9]{2,}$/i.test(compact);
}

export function normalizeSearchQuery(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  return isLikelySku(raw) ? normalizeSku(raw) : raw.replace(/\s+/g, " ");
}
