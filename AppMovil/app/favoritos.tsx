import { C } from "@/constants/theme";
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import ScreenHeader from "@/components/ui/screen-header";
import { router } from "expo-router";
import { getFavoritos, updateFavorito, type Favorito } from "@/data/favoritos";
import { getTags, addTag, type Tag } from "@/data/tags";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = [
  { label: 'Oro', value: '#C9A84C' },
  { label: 'Verde', value: '#4CAF50' },
  { label: 'Púrpura', value: '#7B3FAF' },
  { label: 'Azul', value: '#2196F3' },
  { label: 'Rojo', value: '#E07070' },
  { label: 'Naranja', value: '#FF9800' },
] as const;

type FlatItem =
  | { kind: 'tag'; tag: Tag; count: number }
  | { kind: 'untagged'; count: number }
  | { kind: 'fav'; fav: Favorito };

export default function FavoritosScreen() {
  const insets = useSafeAreaInsets();
  const [favs, setFavs] = useState<Favorito[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [editFav, setEditFav] = useState<Favorito | null>(null);
  const [editNotas, setEditNotas] = useState("");
  const [editTag, setEditTag] = useState<string | null>(null);
  const [editColor, setEditColor] = useState<string | undefined>(undefined);
  const [newTagLabel, setNewTagLabel] = useState("");

  useEffect(() => {
    (async () => {
      setFavs(await getFavoritos());
      setTags(await getTags());
    })();
  }, []);

  const openEdit = (f: Favorito) => {
    setEditFav(f);
    setEditNotas(f.notas ?? "");
    setEditTag(f.tags?.[0] ?? null);
    setEditColor(f.color);
  };

  const saveEdit = async () => {
    if (!editFav) return;
    try {
      const tags = editTag ? [editTag] : [];
      await updateFavorito(editFav.id, { notas: editNotas || undefined, tags, color: editColor });
      setEditFav(null);
      setFavs(await getFavoritos());
      setTags(await getTags());
    } catch (e: unknown) {
      console.warn('[fav] save edit error:', e instanceof Error ? e.message : e);
    }
  };

  const createTagAndAssign = async () => {
    const label = newTagLabel.trim();
    if (!label) return;
    try {
      const tag = await addTag(label, '#C9A84C');
      setTags(await getTags());
      setEditTag(tag.id);
      setNewTagLabel("");
    } catch (e: unknown) {
      console.warn('[tag] create error:', e instanceof Error ? e.message : e);
    }
  };

  const grouped: FlatItem[] = [];
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const tagged = new Map<string, Favorito[]>();
  const untagged: Favorito[] = [];

  for (const f of favs) {
    if (f.tags?.length && tagMap.has(f.tags[0])) {
      const t = f.tags[0];
      if (!tagged.has(t)) tagged.set(t, []);
      tagged.get(t)!.push(f);
    } else {
      untagged.push(f);
    }
  }

  for (const [tid, items] of tagged) {
    const tag = tagMap.get(tid)!;
    grouped.push({ kind: 'tag', tag, count: items.length });
    for (const f of items) grouped.push({ kind: 'fav', fav: f });
  }
  if (untagged.length > 0) {
    grouped.push({ kind: 'untagged', count: untagged.length });
    for (const f of untagged) grouped.push({ kind: 'fav', fav: f });
  }

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Favoritos" showBack onBack={() => router.back()} />

      <FlashList
        data={grouped}
        keyExtractor={(item) => item.kind === 'fav' ? `fav-${item.fav.id}` : `hdr-${item.kind === 'tag' ? item.tag.id : 'untagged'}`}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={90}
        ListEmptyComponent={
          <ThemedText style={styles.empty}>Sin favoritos todavía</ThemedText>
        }
        renderItem={({ item }) => {
          if (item.kind === 'tag') {
            return (
              <View style={styles.tagHeader}>
                <View style={[styles.tagDot, { backgroundColor: item.tag.color }]} />
                <ThemedText style={styles.tagLabel}>{item.tag.label}</ThemedText>
                <ThemedText style={styles.tagCount}>{item.count}</ThemedText>
              </View>
            );
          }
          if (item.kind === 'untagged') {
            return (
              <View style={styles.tagHeader}>
                <ThemedText style={styles.tagLabel}>Sin etiqueta</ThemedText>
                <ThemedText style={styles.tagCount}>{item.count}</ThemedText>
              </View>
            );
          }
          const f = item.fav;
          const tag = f.tags?.[0] ? tagMap.get(f.tags[0]) : null;
          return (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(f)} activeOpacity={0.7}>
              <View style={styles.cardRow}>
                {f.color ? <View style={[styles.colorBar, { backgroundColor: f.color }]} /> : null}
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <ThemedText style={styles.cardRef}>{f.referencia}</ThemedText>
                    <ThemedText style={styles.cardTipo}>{f.tipo.toUpperCase()}</ThemedText>
                  </View>
                  <ThemedText style={styles.cardPreview} numberOfLines={2}>{f.preview}</ThemedText>
                  {f.notas ? <ThemedText style={styles.cardNotas} numberOfLines={1}>📝 {f.notas}</ThemedText> : null}
                  {tag ? (
                    <View style={styles.cardTagRow}>
                      <View style={[styles.miniDot, { backgroundColor: tag.color }]} />
                      <ThemedText style={styles.cardTag}>{tag.label}</ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={!!editFav} transparent animationType="fade" onRequestClose={() => setEditFav(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditFav(null)}>
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            <ThemedText style={styles.modalTitle}>Editar favorito</ThemedText>
            <ThemedText style={styles.modalRef}>{editFav?.referencia}</ThemedText>

            <ThemedText style={styles.inputLabel}>Nota</ThemedText>
            <TextInput
              style={styles.input}
              value={editNotas}
              onChangeText={setEditNotas}
              placeholder="Agregá una nota personal…"
              placeholderTextColor={C.muted}
              multiline
            />

            <ThemedText style={styles.inputLabel}>Color</ThemedText>
            <View style={styles.colorRow}>
              <TouchableOpacity style={[styles.colorSwatch, !editColor && styles.colorActive]} onPress={() => setEditColor(undefined)}>
                <ThemedText style={styles.colorNone}>✕</ThemedText>
              </TouchableOpacity>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.colorSwatch, { backgroundColor: c.value }, editColor === c.value && styles.colorActive]}
                  onPress={() => setEditColor(c.value)}
                />
              ))}
            </View>

            <ThemedText style={styles.inputLabel}>Etiqueta</ThemedText>
            <View style={styles.tagRow}>
              {tags.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tagChip, editTag === t.id && styles.tagChipActive]}
                  onPress={() => setEditTag(editTag === t.id ? null : t.id)}
                >
                  <View style={[styles.miniDot, { backgroundColor: t.color }]} />
                  <ThemedText style={[styles.tagChipText, editTag === t.id && styles.tagChipTextActive]}>{t.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.newTagRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newTagLabel}
                onChangeText={setNewTagLabel}
                placeholder="Nueva etiqueta…"
                placeholderTextColor={C.muted}
              />
              <TouchableOpacity style={styles.addTagBtn} onPress={createTagAndAssign}>
                <ThemedText style={styles.addTagBtnText}>+</ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <ThemedText style={styles.saveBtnText}>Guardar</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: S.lg, paddingBottom: 40 },
  empty: { color: C.muted, fontSize: 14, textAlign: "center", paddingVertical: S.huge },

  tagHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: S.lg, paddingBottom: S.sm, gap: S.sm },
  tagDot: { width: 10, height: 10, borderRadius: 5 },
  tagLabel: { color: C.gold, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  tagCount: { color: C.muted, fontSize: 12, marginLeft: 'auto' },

  card: { backgroundColor: C.navyMid, borderRadius: R.lg, marginBottom: S.sm, overflow: 'hidden' },
  cardRow: { flexDirection: 'row' },
  colorBar: { width: 4 },
  cardBody: { flex: 1, padding: S.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.xs },
  cardRef: { color: C.text, fontSize: 14, fontWeight: '600', flex: 1 },
  cardTipo: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginLeft: S.sm },
  cardPreview: { color: C.muted, fontSize: 13, lineHeight: 18 },
  cardNotas: { color: C.goldLight, fontSize: 12, marginTop: S.xs, fontStyle: 'italic' },
  cardTagRow: { flexDirection: 'row', alignItems: 'center', marginTop: S.xs, gap: 4 },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  cardTag: { color: C.muted, fontSize: 11 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: S.xl },
  modal: { backgroundColor: C.navyLight, borderRadius: R.xl, padding: S.xl },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: S.xs },
  modalRef: { color: C.gold, fontSize: 13, marginBottom: S.lg },

  inputLabel: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: S.sm, marginTop: S.md },
  input: { backgroundColor: C.navyMid, color: C.text, borderRadius: R.md, padding: S.md, fontSize: 14, borderWidth: 1, borderColor: C.goldDim, minHeight: 44, textAlignVertical: 'top' },

  colorRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  colorActive: { borderColor: C.gold },
  colorNone: { color: C.muted, fontSize: 14 },

  tagRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  tagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.xxl, borderWidth: 1, borderColor: C.goldDim, gap: 4 },
  tagChipActive: { backgroundColor: C.gold, borderColor: C.gold },
  tagChipText: { color: C.text, fontSize: 13 },
  tagChipTextActive: { color: C.navy, fontWeight: '600' },

  newTagRow: { flexDirection: 'row', gap: S.sm, alignItems: 'flex-end' },
  addTagBtn: { backgroundColor: C.gold, width: 44, height: 44, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  addTagBtnText: { color: C.navy, fontSize: 22, fontWeight: '700' },

  saveBtn: { backgroundColor: C.gold, borderRadius: R.md, paddingVertical: S.md, alignItems: 'center', marginTop: S.lg },
  saveBtnText: { color: C.navy, fontWeight: '700', fontSize: 15 },
});
