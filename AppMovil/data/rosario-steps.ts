import { T, type Step } from "./prayers";

const MISTERIOS_GOZOSOS = [
  "La Encarnación del Hijo de Dios",
  "La Visitación de Nuestra Señora a su prima Santa Isabel",
  "El Nacimiento del Hijo de Dios",
  "La Presentación de Jesús en el templo",
  "El Niño Jesús perdido y hallado en el templo",
];

const MISTERIOS_DOLOROSOS = [
  "La Oración de Jesús en el huerto",
  "La Flagelación del Señor",
  "La Coronación de espinas",
  "Jesús con la Cruz a cuestas, camino del Calvario",
  "La Crucifixión y Muerte de nuestro Señor",
];

const MISTERIOS_GLORIOSOS = [
  "La Resurrección del Hijo de Dios",
  "La Ascensión del Señor a los Cielos",
  "La Venida del Espíritu Santo sobre los Apóstoles",
  "La Asunción de Nuestra Señora a los Cielos",
  "La Coronación de la Santísima Virgen como Reina de Cielos y Tierra",
];

const MISTERIOS_LUMINOSOS = [
  "El Bautismo de Jesús en el Jordán",
  "La autorrevelación de Jesús en las bodas de Caná",
  "El anuncio del Reino de Dios invitando a la conversión",
  "La Transfiguración",
  "La Institución de la Eucaristía",
];

function getMisteriosDelDia(): {
  nombre: string;
  misterios: string[];
} {
  const dia = new Date().getDay();
  if (dia === 1 || dia === 6)
    return { nombre: "Gozosos", misterios: MISTERIOS_GOZOSOS };
  if (dia === 2 || dia === 5)
    return { nombre: "Dolorosos", misterios: MISTERIOS_DOLOROSOS };
  if (dia === 0 || dia === 3)
    return { nombre: "Gloriosos", misterios: MISTERIOS_GLORIOSOS };
  return { nombre: "Luminosos", misterios: MISTERIOS_LUMINOSOS };
}

export function generarPasosRosario(): Step[] {
  const { nombre, misterios } = getMisteriosDelDia();
  const pasos: Step[] = [];

  pasos.push({
    id: "senal",
    title: "Señal de la Cruz",
    text: T.senal,
  });
  pasos.push({
    id: "contricion",
    title: "Acto de Contrición",
    text: T.contricion,
  });
  pasos.push({
    id: "padrenuestro-inicial",
    title: "Padrenuestro",
    text: T.padrenuestro,
    subtitle: "Por las intenciones del Santo Padre",
  });

  for (let i = 1; i <= 3; i++) {
    pasos.push({
      id: `avemaria-inicial-${i}`,
      title: `${i}ª Avemaría`,
      text: T.avemaria,
    });
  }

  pasos.push({
    id: "gloria-inicial",
    title: "Gloria",
    text: T.gloria,
  });

  for (let m = 0; m < 5; m++) {
    pasos.push({
      id: `misterio-${m}`,
      title: `${m + 1}er Misterio ${nombre}`,
      text: misterios[m],
      subtitle: `Misterio ${m + 1} de 5 · ${nombre}`,
      mysteryIndex: m,
    });

    pasos.push({
      id: `padrenuestro-${m}`,
      title: "Padrenuestro",
      text: T.padrenuestro,
      mysteryIndex: m,
    });

    for (let a = 1; a <= 10; a++) {
      pasos.push({
        id: `avemaria-${m}-${a}`,
        title: `${a}ª Avemaría`,
        text: T.avemaria,
        mysteryIndex: m,
        hailMaryIndex: a,
      });
    }

    pasos.push({
      id: `gloria-${m}`,
      title: "Gloria",
      text: T.gloria,
      mysteryIndex: m,
    });

    pasos.push({
      id: `ohjesus-${m}`,
      title: "Oh Jesús Mío",
      text: T.ohjesus,
      mysteryIndex: m,
    });

    pasos.push({
      id: `mariamadre-${m}`,
      title: "María, Madre de Gracia",
      text: T.mariamadre,
      mysteryIndex: m,
    });
  }

  pasos.push({
    id: "letanias",
    title: "Letanías de la Santísima Virgen",
    text: T.letanias,
  });
  pasos.push({
    id: "oracion-final",
    title: "Oración Final",
    text: T.oracionFinal,
  });
  pasos.push({
    id: "padrenuestro-papa",
    title: "Padrenuestro",
    text: T.padrenuestroPapa,
    subtitle: "Por las intenciones del Santo Padre",
  });
  pasos.push({
    id: "avemaria-final",
    title: "Avemaría",
    text: T.avemariaFinal,
  });
  pasos.push({
    id: "gloria-final",
    title: "Gloria",
    text: T.gloriaFinal,
  });
  pasos.push({
    id: "salve",
    title: "Salve",
    text: T.salve,
  });
  pasos.push({
    id: "jaculatoria",
    title: "Jaculatoria Final",
    text: T.jaculatoria,
  });

  pasos.push({
    id: "completado",
    title: "Rosario Completado 🌹",
    text: T.completado,
  });

  return pasos;
}
