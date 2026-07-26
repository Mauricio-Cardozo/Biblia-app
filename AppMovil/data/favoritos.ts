import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "favoritos";

export interface Favorito {
  id: string;
  tipo: "biblia" | "cic" | "evangelio" | "youcat";
  referencia: string;
  preview: string;
  timestamp: number;
  notas?: string;
  tags?: string[];
  color?: string;
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
  try {
    const favs = await getFavoritos();
    if (favs.some((x) => x.id === f.id)) return;
    favs.unshift(f);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  } catch (e: unknown) {
    console.warn('[fav] add error:', e instanceof Error ? e.message : e);
  }
}

export async function removeFavorito(id: string): Promise<void> {
  try {
    const favs = await getFavoritos();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favs.filter((x) => x.id !== id)));
  } catch (e: unknown) {
    console.warn('[fav] remove error:', e instanceof Error ? e.message : e);
  }
}

export async function isFavorito(id: string): Promise<boolean> {
  try {
    const favs = await getFavoritos();
    return favs.some((x) => x.id === id);
  } catch {
    return false;
  }
}

export async function updateFavorito(id: string, changes: Partial<Pick<Favorito, "notas" | "tags" | "color">>): Promise<void> {
  try {
    const favs = await getFavoritos();
    const idx = favs.findIndex((x) => x.id === id);
    if (idx === -1) return;
    favs[idx] = { ...favs[idx], ...changes };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  } catch (e: unknown) {
    console.warn('[fav] update error:', e instanceof Error ? e.message : e);
  }
}
