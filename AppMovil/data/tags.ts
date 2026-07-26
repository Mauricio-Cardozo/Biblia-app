import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "tags";

export interface Tag {
  id: string;
  label: string;
  color: string;
}

let _cache: Tag[] | null = null;

export async function getTags(): Promise<Tag[]> {
  if (_cache) return _cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    _cache = raw ? JSON.parse(raw) : [];
    return _cache;
  } catch {
    return [];
  }
}

export async function addTag(label: string, color: string): Promise<Tag> {
  const tags = await getTags();
  const tag: Tag = { id: `tag-${Date.now()}`, label, color };
  tags.push(tag);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    _cache = tags;
  } catch { /* storage write failed */ }
  return tag;
}

export async function removeTag(id: string): Promise<void> {
  let tags = await getTags();
  tags = tags.filter((t) => t.id !== id);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    _cache = tags;
  } catch { /* storage write failed */ }
}

export async function renameTag(id: string, label: string): Promise<void> {
  const tags = await getTags();
  const t = tags.find((x) => x.id === id);
  if (!t) return;
  t.label = label;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    _cache = tags;
  } catch { /* storage write failed */ }
}
