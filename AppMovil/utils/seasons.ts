export const SEASON_EMOJI: Record<string, string> = {
  adviento: "🕯️",
  navidad: "⭐",
  cuaresma: "🙏",
  pascua: "✨",
};

export function detectSeason(tituloMisa: string): string | null {
  const t = tituloMisa.toLowerCase();
  if (t.includes("adviento")) return "adviento";
  if (t.includes("navidad")) return "navidad";
  if (t.includes("cuaresma")) return "cuaresma";
  if (t.includes("pascua")) return "pascua";
  if (t.includes("ordinario") || t.includes("tiempo ordinario")) return "ordinario";
  return null;
}
