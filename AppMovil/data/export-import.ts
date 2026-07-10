import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = [
  "font_size_multiplier",
  "favoritos",
  "racha_rosario_ultima", "racha_rosario_count", "stats_rosario_total",
  "racha_coronilla_ultima", "racha_coronilla_count", "stats_coronilla_total",
];

export async function exportarDatos(): Promise<string> {
  const entries = await Promise.all(KEYS.map((k) => AsyncStorage.getItem(k).then((v) => [k, v])));
  return JSON.stringify(Object.fromEntries(entries), null, 2);
}

export async function importarDatos(json: string): Promise<number> {
  const data = JSON.parse(json);
  let count = 0;
  for (const k of KEYS) {
    if (k in data) {
      await AsyncStorage.setItem(k, String(data[k]));
      count++;
    }
  }
  return count;
}
