import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "favoritos";

export interface Favorito {
  id: string;
  tipo: "biblia" | "cic" | "evangelio";
  referencia: string;
  preview: string;
  timestamp: number;
}

export async function getFavoritos(): Promise<Favorito[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addFavorito(f: Favorito): Promise<void> {
  const favs = await getFavoritos();
  if (favs.some((x) => x.id === f.id)) return;
  favs.unshift(f);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

export async function removeFavorito(id: string): Promise<void> {
  const favs = await getFavoritos();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favs.filter((x) => x.id !== id)));
}

export async function isFavorito(id: string): Promise<boolean> {
  const favs = await getFavoritos();
  return favs.some((x) => x.id === id);
}
