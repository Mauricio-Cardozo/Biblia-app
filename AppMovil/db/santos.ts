import { type SQLiteDatabase } from "expo-sqlite";
import type { Santo, MisalSantosEntry } from "@/types";

function normalizeKey(word: string): string {
  return word
    .replace(/[áä]/g, 'a').replace(/[éë]/g, 'e').replace(/[íï]/g, 'i')
    .replace(/[óö]/g, 'o').replace(/[úü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z]/g, '')
    .replace(/([a-z])\1+/g, '$1');
}

function santoKey(nombre: string): string {
  return normalizeKey((nombre.toLowerCase().split(/\s+/)[1] || nombre));
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(prev + (a[i - 1] === b[j - 1] ? 0 : 1), dp[j] + 1, dp[j - 1] + 1);
      prev = tmp;
    }
  }
  return dp[n];
}

function sameSaint(a: Santo, b: Santo): boolean {
  const ap = a.nombre.split(/\s+/).slice(1);
  const bp = b.nombre.split(/\s+/).slice(1);
  const wa = ap.map(w => normalizeKey(w.replace(/[,.;:()'"!?¿¡]+$/g, '')));
  const wb = bp.map(w => normalizeKey(w.replace(/[,.;:()'"!?¿¡]+$/g, '')));
  const shorter = wa.length <= wb.length ? wa : wb;
  const longer = wa.length > wb.length ? wa : wb;
  const longerOrig = wa.length > wb.length ? ap : bp;
  for (let i = 0; i < longer.length; i++) {
    if (i >= shorter.length || shorter[i] !== longer[i]) {
      const extra = (longerOrig[i] || '').replace(/[,.;:()'"!?¿¡]+$/g, '');
      if (!extra) continue;
      if (extra[0] !== extra[0].toUpperCase() || extra[0] === extra[0].toLowerCase()) return true;
      if (/^[IVXLCDM]+\.?$/.test(extra)) return true;
      if (/^(De|Del|Da|Von|Van|Di|Della|Degli|Delle|Mc|Mac|Los|Las|El|La|Y|E|O)$/i.test(extra)) return true;
      return false;
    }
  }
  return true;
}

export async function getSantosDelDia(
  db: SQLiteDatabase,
  mes: number,
  dia: number,
): Promise<Santo[]> {
  const rows = await db.getAllAsync<Santo>(
    "SELECT * FROM santos WHERE mes = ? AND dia = ? ORDER BY id",
    [mes, dia],
  );
  const groups: Santo[][] = [];
  for (const s of rows) {
    const key = santoKey(s.nombre);
    let matched = false;
    for (const g of groups) {
      const gkey = santoKey(g[0].nombre);
      if ((gkey === key || levenshtein(gkey.substring(0, 8), key.substring(0, 8)) <= 2) && sameSaint(g[0], s)) {
        g.push(s);
        matched = true;
        break;
      }
    }
    if (!matched) groups.push([s]);
  }
  return groups.map(g => {
    const best = { ...g[0] };
    for (let i = 1; i < g.length; i++) {
      const s = g[i];
      if ((s.biografia?.length ?? 0) > (best.biografia?.length ?? 0)) best.biografia = s.biografia;
      if (s.titulo && !best.titulo?.includes(s.titulo)) best.titulo = best.titulo ? `${best.titulo} — ${s.titulo}` : s.titulo;
      if (!best.nombre.includes(s.nombre)) best.nombre = `${best.nombre} / ${s.nombre}`;
    }
    return best;
  });
}

export async function getMisalSantosDelDia(
  db: SQLiteDatabase,
  mes: number,
  dia: number,
): Promise<MisalSantosEntry[]> {
  return db.getAllAsync<MisalSantosEntry>(
    "SELECT * FROM misal_santos WHERE mes = ? AND dia = ? ORDER BY id",
    [mes, dia],
  );
}
