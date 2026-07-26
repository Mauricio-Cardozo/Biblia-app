import type { SQLiteDatabase } from "expo-sqlite";
import { createTestDb } from "@/db/test-utils";
import { getLibros, getCapitulos, getVersiculos, searchBiblia } from "@/db/biblia";
import { getYoucatPartes, getYoucatPreguntas, searchYoucat } from "@/db/catecismo";
import { getLecturaDelDia } from "@/db/lecturas";
import {
  getMisalTemporadas, getMisalPropio, getMisalOrdinarioSecciones,
  getMisalPrefacios, getMisalPlegarias,
  getMisalPropioDetalle, getMisalOrdinarioPorSeccion, getMisalPropioPorSemana,
} from "@/db/misal";
import { getSantosDelDia, getMisalSantosDelDia, getMisalSantos } from "@/db/santos";

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

  it("searchBiblia ejecuta búsqueda en la Biblia", async () => {
    const res = await searchBiblia(db, '"Dios"');
    expect(Array.isArray(res)).toBe(true);
  });
});

describe("YOUCAT", () => {
  it("tiene 4 partes", async () => {
    const partes = await getYoucatPartes(db);
    expect(partes).toHaveLength(4);
  });

  it("retorna preguntas de la primera parte", async () => {
    const preguntas = await getYoucatPreguntas(db, 1);
    expect(preguntas.length).toBeGreaterThan(0);
  });

  it("searchYoucat busca preguntas por término", async () => {
    const res = await searchYoucat(db, "Dios");
    expect(res.length).toBeGreaterThan(0);
    expect(res[0]).toHaveProperty("pregunta");
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

describe("Misal", () => {
  it("retorna temporadas del propio", async () => {
    const temps = await getMisalTemporadas(db);
    expect(temps.length).toBeGreaterThanOrEqual(5);
    expect(temps[0]).toHaveProperty("temporada");
    expect(temps[0]).toHaveProperty("count");
  });

  it("retorna propios de adviento", async () => {
    const propios = await getMisalPropio(db, "adviento");
    expect(propios.length).toBeGreaterThan(0);
    expect(propios[0].colecta?.length).toBeGreaterThan(0);
  });

  it("retorna secciones del ordinario", async () => {
    const secs = await getMisalOrdinarioSecciones(db);
    expect(secs.length).toBeGreaterThan(0);
  });

  it("retorna prefacios", async () => {
    const prefacios = await getMisalPrefacios(db);
    expect(prefacios.length).toBeGreaterThanOrEqual(60);
  });

  it("retorna plegarias", async () => {
    const plegarias = await getMisalPlegarias(db);
    expect(plegarias.length).toBeGreaterThanOrEqual(4);
  });

  it("retorna detalle de propio", async () => {
    const propios = await getMisalPropio(db, "adviento");
    const detalle = await getMisalPropioDetalle(db, propios[0].id);
    expect(detalle).not.toBeNull();
    expect(detalle).toHaveProperty("colecta");
  });

  it("retorna ordinario por sección", async () => {
    const blocks = await getMisalOrdinarioPorSeccion(db, "Ritos Iniciales");
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0]).toHaveProperty("texto");
  });

  it("getMisalPropioPorSemana retorna propio por semana del tiempo ordinario", async () => {
    const res = await getMisalPropioPorSemana(db, "ordinario", 1);
    expect(res).not.toBeNull();
    expect(res?.temporada).toBe("ordinario");
  });
});

describe("Santos", () => {
  it("retorna santos del 1 de enero", async () => {
    const santos = await getSantosDelDia(db, 1, 1);
    expect(santos.length).toBeGreaterThan(0);
  });

  it("retorna misal_santos del 2 de enero", async () => {
    const entries = await getMisalSantosDelDia(db, 1, 2);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]).toHaveProperty("colecta");
  });

  it("getMisalSantos retorna todos los misal_santos", async () => {
    const entries = await getMisalSantos(db);
    expect(entries.length).toBeGreaterThan(200);
    expect(entries[0]).toHaveProperty("nombre");
  });
});
