import { T, type Step } from "./prayers";

export function generarPasosCoronilla(): Step[] {
  const pasos: Step[] = [];

  pasos.push({
    id: "senal",
    title: "Señal de la Cruz",
    text: T.senal,
  });
  pasos.push({
    id: "padrenuestro-inicial",
    title: "Padre Nuestro",
    text: T.padrenuestro,
  });
  pasos.push({
    id: "avemaria-inicial",
    title: "Ave María",
    text: T.avemaria,
  });
  pasos.push({
    id: "credo",
    title: "Credo",
    text: T.credo,
  });

  for (let d = 0; d < 5; d++) {
    pasos.push({
      id: `padre-eterno-${d}`,
      title: "Padre Eterno",
      text: T.padreEterno,
      subtitle: `Decena ${d + 1} de 5 · Coronilla`,
      mysteryIndex: d,
    });

    for (let p = 1; p <= 10; p++) {
      pasos.push({
        id: `por-pasion-${d}-${p}`,
        title: `${p}ª Por Su dolorosa Pasión`,
        text: T.porPasion,
        mysteryIndex: d,
        hailMaryIndex: p,
      });
    }
  }

  for (let i = 1; i <= 3; i++) {
    pasos.push({
      id: `santo-dios-${i}`,
      title: `Santo Dios (${i})`,
      text: T.santoDios,
    });
  }

  pasos.push({
    id: "oracion-final",
    title: "Oración Final",
    text: T.coronillaFinal,
  });

  pasos.push({
    id: "completado",
    title: "Coronilla Completada 🌿",
    text: T.coronillaCompletado,
  });

  return pasos;
}
