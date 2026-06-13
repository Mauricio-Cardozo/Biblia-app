import AsyncStorage from "@react-native-async-storage/async-storage";

export async function calcularRacha(key: string): Promise<number> {
  try {
    const ultima = await AsyncStorage.getItem(key);
    if (!ultima) return 0;

    const ultimaFecha = new Date(ultima + "T00:00:00");
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const diff = Math.floor((hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));

    // Si la última vez fue hoy, racha está intacta (diff=0)
    // Si fue ayer (diff=1), la racha también está intacta
    if (diff > 1) return 0; // se rompió

    // Ahora contamos hacia atrás desde hoy
    let racha = 0;
    const fechaCursor = new Date(hoy);
    while (true) {
      const key = fechaCursor.toISOString().split("T")[0];
      if (key === ultima) {
        racha++;
        break; // llegamos a la última fecha registrada
      }
      const existe = await AsyncStorage.getItem(key);
      if (!existe) {
        // Si es hoy, contamos 1 día aunque no esté registrado (ya que completó hoy)
        if (fechaCursor.getTime() === hoy.getTime() && diff === 0) {
          racha++;
          break;
        }
        break;
      }
      racha++;
      fechaCursor.setDate(fechaCursor.getDate() - 1);
    }

    return racha;
  } catch {
    return 0;
  }
}

export async function obtenerStats(): Promise<{
  rosario_ultima: string | null;
  rosario_total: number;
  coronilla_ultima: string | null;
  coronilla_total: number;
}> {
  const [rosario_ultima, rosario_total, coronilla_ultima, coronilla_total] = await Promise.all([
    AsyncStorage.getItem("racha_rosario_ultima"),
    AsyncStorage.getItem("stats_rosario_total"),
    AsyncStorage.getItem("racha_coronilla_ultima"),
    AsyncStorage.getItem("stats_coronilla_total"),
  ]);

  return {
    rosario_ultima,
    rosario_total: rosario_total ? parseInt(rosario_total, 10) : 0,
    coronilla_ultima,
    coronilla_total: coronilla_total ? parseInt(coronilla_total, 10) : 0,
  };
}
