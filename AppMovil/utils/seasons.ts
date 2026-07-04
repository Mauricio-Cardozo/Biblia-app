export const SEASON_EMOJI: Record<string, string> = {
  adviento: "🕯️",
  navidad: "⭐",
  cuaresma: "🙏",
  pascua: "✨",
};

const ROMAN_MAP: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9,
  X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16,
  XVII: 17, XVIII: 18, XIX: 19, XX: 20, XXI: 21, XXII: 22, XXIII: 23,
  XXIV: 24, XXV: 25, XXVI: 26, XXVII: 27, XXVIII: 28, XXIX: 29,
  XXX: 30, XXXI: 31, XXXII: 32, XXXIII: 33, XXXIV: 34,
};

export function romanToInt(s: string): number {
  return ROMAN_MAP[s.toUpperCase()] ?? 0;
}

export function detectSeason(tituloMisa: string): string | null {
  const t = tituloMisa.toLowerCase();
  if (t.includes("adviento")) return "adviento";
  if (t.includes("navidad")) return "navidad";
  if (t.includes("cuaresma")) return "cuaresma";
  if (t.includes("pascua")) return "pascua";
  if (t.includes("ordinario") || t.includes("tiempo ordinario")) return "ordinario";
  return null;
}

export function parseWeekNumber(tituloMisa: string): number {
  const romanPattern = /\b([IVXLCDM]{1,6})\b/;
  const m = tituloMisa.toUpperCase().match(romanPattern);
  return m ? romanToInt(m[1]) : 0;
}

export function isSunday(tituloMisa: string): boolean {
  return /domingo/i.test(tituloMisa);
}
