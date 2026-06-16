import AsyncStorage from "@react-native-async-storage/async-storage";

export async function calcularRacha(key: string): Promise<number> {
  try {
    const ultima = await AsyncStorage.getItem(key);
    if (!ultima) return 0;

    const countKey = key.replace("_ultima", "_count");
    const count = parseInt((await AsyncStorage.getItem(countKey)) || "1", 10);

    const ultimaFecha = new Date(ultima + "T00:00:00");
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const diff = Math.floor((hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));

    if (diff > 1) return 0;
    return count;
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
