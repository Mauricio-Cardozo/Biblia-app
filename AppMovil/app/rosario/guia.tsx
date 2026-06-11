import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Step {
  id: string;
  title: string;
  text: string;
  subtitle?: string;
  mysteryIndex?: number;
  hailMaryIndex?: number;
}

// ─── Textos de oraciones ──────────────────────────────────────────────────────

const T = {
  senal:
    "Por la señal de la Santa Cruz,\nde nuestros enemigos,\nlíbranos Señor Dios Nuestro.\n\nEn el nombre del Padre,\ndel Hijo y del Espíritu Santo.\nAmén.",
  contricion:
    "Señor mío Jesucristo,\nDios y hombre verdadero,\nCreador, Padre y Redentor mío.\n\nPor ser Tú quién eres,\nBondad infinita,\ny porque te amo sobre todas las cosas,\nme pesa de todo corazón haberte ofendido.\n\nTambién me pesa que puedes castigarme\ncon las penas del infierno.\n\nAyudado de tu divina gracia\npropongo firmemente nunca más pecar,\nconfesarme y cumplir la penitencia\nque me fuere impuesta.\nAmén.",
  padrenuestro:
    "Padre nuestro,\nque estás en el cielo,\nsantificado sea tu Nombre;\nvenga a nosotros tu reino;\nhágase tu voluntad en la tierra\ncomo en el cielo.\n\nDanos hoy nuestro pan de cada día;\nperdona nuestras ofensas\ncomo también nosotros perdonamos\na los que nos ofenden;\nno nos dejes caer en la tentación\ny líbranos del mal.\nAmén.",
  avemaria:
    "Dios te salve, María,\nllena eres de gracia;\nel Señor es contigo,\nbendita Tú eres entre todas las mujeres\ny bendito es el fruto de tu vientre, Jesús.\n\nSanta María, Madre de Dios,\nruega por nosotros, pecadores,\nahora y en la hora de nuestra muerte.\nAmén.",
  gloria:
    "Gloria al Padre\ny al Hijo\ny al Espíritu Santo.\n\nComo era en el principio,\nahora y siempre,\npor los siglos de los siglos.\nAmén.",
  ohjesus:
    "Oh Jesús mío, perdónanos.\nLíbranos del fuego del infierno,\nlleva a todas las almas al cielo,\nespecialmente a las más necesitadas.",
  mariamadre:
    "María, Madre de gracia,\nMadre de misericordia.\nDefiéndenos de nuestros enemigos\ny ampáranos ahora\ny en la hora de nuestra muerte.\nAmén.",
  letanias:
    "Señor, ten piedad.\nCristo, ten piedad.\nSeñor, ten piedad.\n\nDios, Padre celestial,\n十 ten piedad de nosotros.\nDios, Hijo, Redentor del mundo,\n十 ten piedad de nosotros.\nDios, Espíritu Santo,\n十 ten piedad de nosotros.\nSantísima Trinidad, un solo Dios,\n十 ten piedad de nosotros.\n\nSanta María,\n十 ruega por nosotros.\nSanta Madre de Dios,\n十 ruega por nosotros.\nSanta Virgen de las vírgenes,\n十 ruega por nosotros.\nMadre de Cristo,\n十 ruega por nosotros.\nMadre de la Iglesia,\n十 ruega por nosotros.\nMadre de la Misericordia,\n十 ruega por nosotros.\nMadre de la divina gracia,\n十 ruega por nosotros.\nMadre de la esperanza,\n十 ruega por nosotros.\nMadre purísima,\n十 ruega por nosotros.\nMadre castísima,\n十 ruega por nosotros.\nMadre siempre virgen,\n十 ruega por nosotros.\nMadre inmaculada,\n十 ruega por nosotros.\nMadre del buen consejo,\n十 ruega por nosotros.\nMadre del Creador,\n十 ruega por nosotros.\nMadre del Salvador,\n十 ruega por nosotros.\nVirgen prudentísima,\n十 ruega por nosotros.\nVirgen digna de veneración,\n十 ruega por nosotros.\nVirgen digna de alabanza,\n十 ruega por nosotros.\nVirgen poderosa,\n十 ruega por nosotros.\nVirgen clemente,\n十 ruega por nosotros.\nVirgen fiel,\n十 ruega por nosotros.\nEspejo de justicia,\n十 ruega por nosotros.\nTrono de la sabiduría,\n十 ruega por nosotros.\nCausa de nuestra alegría,\n十 ruega por nosotros.\nVaso espiritual,\n十 ruega por nosotros.\nVaso digno de honor,\n十 ruega por nosotros.\nVaso insigne de devoción,\n十 ruega por nosotros.\nRosa mística,\n十 ruega por nosotros.\nTorre de David,\n十 ruega por nosotros.\nTorre de marfil,\n十 ruega por nosotros.\nCasa de oro,\n十 ruega por nosotros.\nArca de la alianza,\n十 ruega por nosotros.\nPuerta del cielo,\n十 ruega por nosotros.\nEstrella de la mañana,\n十 ruega por nosotros.\nSalud de los enfermos,\n十 ruega por nosotros.\nRefugio de los pecadores,\n十 ruega por nosotros.\nConsuelo de los migrantes,\n十 ruega por nosotros.\nConsoladora de los afligidos,\n十 ruega por nosotros.\nAuxilio de los cristianos,\n十 ruega por nosotros.\nReina de los ángeles,\n十 ruega por nosotros.\nReina de los patriarcas,\n十 ruega por nosotros.\nReina de los profetas,\n十 ruega por nosotros.\nReina de los apóstoles,\n十 ruega por nosotros.\nReina de los mártires,\n十 ruega por nosotros.\nReina de los confesores,\n十 ruega por nosotros.\nReina de las vírgenes,\n十 ruega por nosotros.\nReina de todos los santos,\n十 ruega por nosotros.\nReina concebida sin pecado original,\n十 ruega por nosotros.\nReina asunta a los cielos,\n十 ruega por nosotros.\nReina del santísimo Rosario,\n十 ruega por nosotros.\nReina de la paz,\n十 ruega por nosotros.\n\nCordero de Dios,\nque quitas el pecado del mundo,\n十 perdónanos, Señor.\nCordero de Dios,\nque quitas el pecado del mundo,\n十 escúchanos, Señor.\nCordero de Dios,\nque quitas el pecado del mundo,\n十 ten piedad de nosotros.\n\nRuega por nosotros,\nSanta Madre de Dios.\nPara que seamos dignos\nde alcanzar las promesas\nde Nuestro Señor Jesucristo.",
  oracionFinal:
    "Te ofrecemos, Señor,\nesta oración del Santo Rosario\nen honor de tu Santísima Madre,\nla Virgen María.\n\nConcédenos,\npor la intercesión de ella,\nvivir en tu amor\ny alcanzar la vida eterna.\nPor Jesucristo, nuestro Señor.\nAmén.",
  padrenuestroPapa:
    "Padre nuestro…\n\n(intenciones del Santo Padre)",
  avemariaFinal:
    "Dios te salve, María…",
  gloriaFinal:
    "Gloria al Padre…",
  salve:
    "Dios te salve, Reina y Madre de misericordia,\nvida, dulzura y esperanza nuestra;\nDios te salve.\n\nA Ti llamamos\nlos desterrados hijos de Eva;\na Ti suspiramos,\ngimiendo y llorando,\nen este valle de lágrimas.\n\nEa, pues, Señora, abogada nuestra,\nvuelve a nosotros\nesos tus ojos misericordiosos;\ny después de este destierro\nmuéstranos a Jesús,\nfruto bendito de tu vientre.\n\n¡Oh clementísima, oh piadosa,\noh dulce Virgen María!\n\nRuega por nosotros,\nSanta Madre de Dios.\nPara que seamos dignos\nde alcanzar las promesas\nde Nuestro Señor Jesucristo.\nAmén.",
  jaculatoria:
    "Ave María Purísima.\nSin pecado concebida.",
  completado:
    "🌹\n\nHas completado el Santo Rosario.\n\nQue la Virgen María\nte bendiga y te guarde\nen este día.",
};

// ─── Misterios ────────────────────────────────────────────────────────────────

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

// ─── Generación de pasos ──────────────────────────────────────────────────────

function generarPasos(): Step[] {
  const { nombre, misterios } = getMisteriosDelDia();
  const pasos: Step[] = [];

  // Apertura
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

  // Misterios
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

  // Cierre
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

  // Completado
  pasos.push({
    id: "completado",
    title: "Rosario Completado 🌹",
    text: T.completado,
  });

  return pasos;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function RosarioGuiaScreen() {
  const insets = useSafeAreaInsets();
  const pasos = useMemo(() => generarPasos(), []);

  const [stepIndex, setStepIndex] = useState(0);
  const [completado, setCompletado] = useState(false);

  const step = pasos[stepIndex];
  const total = pasos.length;

  // Progreso dentro del misterio actual
  const currentMystery = step.mysteryIndex ?? -1;
  const avesCompletadas = pasos
    .slice(0, stepIndex + 1)
    .filter((s) => s.mysteryIndex === currentMystery && (s.hailMaryIndex ?? 0) > 0).length;

  // ── Avanzar ────────────────────────────────────────────────────────────────

  const handleSiguiente = useCallback(() => {
    if (stepIndex < total - 1) {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, total]);

  // ── Guardar racha al completar ─────────────────────────────────────────────

  useEffect(() => {
    if (step.id === "completado" && !completado) {
      setCompletado(true);
      const hoy = new Date();
      const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
      AsyncStorage.setItem("racha_rosario_ultima", fecha).catch(() => {});
    }
  }, [step.id, completado]);

  // ── Calcular beads a mostrar ─────────────────────────────────────────────

  const showBeads = currentMystery >= 0 && step.id !== "completado";
  const mysteryLabel =
    showBeads && step.subtitle ? step.subtitle : "";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Header con progreso general */}
      <View style={s.header}>
        <ThemedText style={s.headerTitle}>Santo Rosario</ThemedText>
        <ThemedText style={s.headerProgreso}>
          Paso {Math.min(stepIndex + 1, total)} de {total}
        </ThemedText>
      </View>

      {/* Beads del misterio */}
      {showBeads && (
        <View style={s.beadsContainer}>
          <ThemedText style={s.beadsLabel}>{mysteryLabel}</ThemedText>
          <View style={s.beadsRow}>
            {Array.from({ length: 10 }, (_, i) => (
              <View
                key={i}
                style={[
                  s.bead,
                  i < avesCompletadas ? s.beadActivo : s.beadInactivo,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Contenido del paso */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={step.id}
          entering={FadeIn.duration(350)}
          exiting={FadeOut.duration(200)}
        >
          <View style={s.stepBadge}>
            <ThemedText style={s.stepBadgeText}>{step.title}</ThemedText>
          </View>

          {step.subtitle && !showBeads ? (
            <ThemedText style={s.subtitle}>{step.subtitle}</ThemedText>
          ) : null}

          <ThemedText style={s.prayerText}>{step.text}</ThemedText>
        </Animated.View>
      </ScrollView>

      {/* Botón Amén / Siguiente */}
      {step.id !== "completado" ? (
        <View style={s.footer}>
          <TouchableOpacity
            style={s.nextBtn}
            onPress={handleSiguiente}
            activeOpacity={0.8}
          >
            <ThemedText style={s.nextBtnText}>Amén · Siguiente</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.footer}>
          <TouchableOpacity
            style={s.nextBtn}
            onPress={() => setStepIndex(0)}
            activeOpacity={0.8}
          >
            <ThemedText style={s.nextBtnText}>Rezar de nuevo</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.goldDim,
  },
  headerTitle: {
    color: C.gold,
    fontSize: 18,
    fontWeight: "700",
  },
  headerProgreso: {
    color: C.muted,
    fontSize: 12,
  },

  // Beads
  beadsContainer: {
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.sep,
  },
  beadsLabel: {
    color: C.goldLight,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  beadsRow: {
    flexDirection: "row",
    gap: 6,
  },
  bead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  beadActivo: {
    backgroundColor: C.gold,
    borderColor: C.goldLight,
  },
  beadInactivo: {
    backgroundColor: C.navyLight,
    borderColor: C.goldDim,
  },

  // Contenido
  scroll: { flex: 1 },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  stepBadge: {
    alignSelf: "flex-start",
    backgroundColor: C.goldDim,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  stepBadgeText: {
    color: C.goldLight,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: C.muted,
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 12,
  },
  prayerText: {
    color: C.text,
    fontSize: 17,
    lineHeight: 30,
    textAlign: "center",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "android" ? 16 : 32,
    paddingTop: 12,
    backgroundColor: C.navy,
    borderTopWidth: 1,
    borderTopColor: C.goldDim,
  },
  nextBtn: {
    backgroundColor: C.goldDim,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.gold,
  },
  nextBtnText: {
    color: C.goldLight,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
