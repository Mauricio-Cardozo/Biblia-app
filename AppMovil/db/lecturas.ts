import { type SQLiteDatabase } from "expo-sqlite";
import type { Lectura } from "@/types";
import { detectSeason, parseWeekNumber, isSunday } from "@/utils/seasons";

export async function getLecturaDelDia(
  db: SQLiteDatabase,
  fecha: string,
): Promise<Lectura | null> {
  return db.getFirstAsync<Lectura>(
    "SELECT * FROM lecturas WHERE fecha = ?",
    [fecha],
  );
}

export async function getSeasonFromNearestLectura(
  db: SQLiteDatabase,
  fecha: string,
): Promise<{ season: string; week: number; isSunday: boolean } | null> {
  const prev = await db.getFirstAsync<{ titulo_misa: string }>(
    "SELECT titulo_misa FROM lecturas WHERE titulo_misa IS NOT NULL AND fecha < ? ORDER BY fecha DESC LIMIT 1",
    [fecha],
  );
  const next = await db.getFirstAsync<{ titulo_misa: string }>(
    "SELECT titulo_misa FROM lecturas WHERE titulo_misa IS NOT NULL AND fecha > ? ORDER BY fecha LIMIT 1",
    [fecha],
  );
  for (const row of [prev, next]) {
    if (row?.titulo_misa) {
      const s = detectSeason(row.titulo_misa);
      if (s) return { season: s, week: parseWeekNumber(row.titulo_misa), isSunday: isSunday(row.titulo_misa) };
    }
  }
  return null;
}
