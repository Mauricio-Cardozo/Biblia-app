import type { SQLiteDatabase } from "expo-sqlite";
import { createTestDb } from "@/db/test-utils";
import { getLibros, getCapitulos, getVersiculos } from "@/db/biblia";
import { getCICPartes, getCICNumerales } from "@/db/catecismo";
import { getLecturaDelDia } from "@/db/lecturas";

let db: SQLiteDatabase;

beforeAll(async () => {
  db = (await createTestDb()) as unknown as SQLiteDatabase;
});

describe("Biblia", () => {
  it("retorna 73 libros", async () => {
    const libros = await getLibros(db);
    expect(libros).toHaveLength(73);
  });

  it("Génesis tiene 50 capítulos", async () => {
    const caps = await getCapitulos(db, "Génesis");
    expect(caps).toHaveLength(50);
  });

  it("Génesis 1,1 es 'Al principio…'", async () => {
    const vers = await getVersiculos(db, "Génesis", 1);
    expect(vers[0].texto).toMatch(/^Al principio/);
  });
});

describe("Catecismo CIC", () => {
  it("tiene 4 partes", async () => {
    const partes = await getCICPartes(db);
    expect(partes).toHaveLength(4);
  });

  it("retorna numerales de una sección", async () => {
    const nums = await getCICNumerales(db, "1. La Profesión de la Fe", "1. 'Creo' - 'Creemos'");
    expect(nums.length).toBeGreaterThan(0);
  });
});

describe("Lecturas", () => {
  it("retorna null para fecha sin datos", async () => {
    const lec = await getLecturaDelDia(db, "2000-01-01");
    expect(lec).toBeNull();
  });

  it("retorna lectura para fecha con datos", async () => {
    const lec = await getLecturaDelDia(db, "2026-07-09");
    expect(lec).not.toBeNull();
    expect(lec?.evangelio?.length).toBeGreaterThan(0);
  });
});
