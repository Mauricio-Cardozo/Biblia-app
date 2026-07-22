import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { ThemedText } from '@/components/themed-text';
import ScreenHeader from '@/components/ui/screen-header';
import FontSizeControl from '@/components/font-size-control';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportarDatos, importarDatos } from '@/data/export-import';
import Constants from 'expo-constants';

export default function AjustesScreen() {
  const insets = useSafeAreaInsets();
  const [temaOscuro, setTemaOscuro] = useState(true);
  const [notifEvangelio, setNotifEvangelio] = useState(false);
  const [notifRachas, setNotifRachas] = useState(false);
  const [mostrarImport, setMostrarImport] = useState(false);
  const [importText, setImportText] = useState("");

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Ajustes" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        <ThemedText style={s.seccionTitulo}>APARIENCIA</ThemedText>
        <View style={s.card}>
          <View style={s.fila}>
            <ThemedText style={s.filaLabel}>Tamaño de fuente</ThemedText>
            <FontSizeControl />
          </View>
        </View>
        <View style={s.card}>
          <View style={s.fila}>
            <View>
              <ThemedText style={s.filaLabel}>Tema oscuro</ThemedText>
              <ThemedText style={s.filaSub}>Alternar entre claro y oscuro</ThemedText>
            </View>
            <Switch
              value={temaOscuro}
              onValueChange={setTemaOscuro}
              trackColor={{ false: C.muted, true: C.goldDim }}
              thumbColor={temaOscuro ? C.gold : C.text}
            />
          </View>
        </View>

        <ThemedText style={s.seccionTitulo}>NOTIFICACIONES</ThemedText>
        <View style={s.card}>
          <View style={s.fila}>
            <View>
              <ThemedText style={s.filaLabel}>Evangelio del día</ThemedText>
              <ThemedText style={s.filaSub}>Recordatorio diario de la lectura</ThemedText>
            </View>
            <Switch
              value={notifEvangelio}
              onValueChange={setNotifEvangelio}
              trackColor={{ false: C.muted, true: C.goldDim }}
              thumbColor={notifEvangelio ? C.gold : C.text}
            />
          </View>
        </View>
        <View style={s.card}>
          <View style={s.fila}>
            <View>
              <ThemedText style={s.filaLabel}>Rachas de oración</ThemedText>
              <ThemedText style={s.filaSub}>Recordatorio para mantener la racha</ThemedText>
            </View>
            <Switch
              value={notifRachas}
              onValueChange={setNotifRachas}
              trackColor={{ false: C.muted, true: C.goldDim }}
              thumbColor={notifRachas ? C.gold : C.text}
            />
          </View>
        </View>

        <ThemedText style={s.seccionTitulo}>DATOS</ThemedText>
        <View style={s.card}>
          <TouchableOpacity style={s.fila} onPress={async () => {
            const json = await exportarDatos();
            await Share.share({ message: json });
          }}>
            <ThemedText style={s.filaLabel}>Exportar datos</ThemedText>
            <ThemedText style={s.flecha}>→</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={s.card}>
          <TouchableOpacity style={s.fila} onPress={() => setMostrarImport(true)}>
            <ThemedText style={s.filaLabel}>Importar datos</ThemedText>
            <ThemedText style={s.flecha}>→</ThemedText>
          </TouchableOpacity>
        </View>
        {mostrarImport && (
          <View style={s.card}>
            <TextInput
              style={s.importInput}
              placeholder="Pegá el JSON aquí..."
              placeholderTextColor={C.muted}
              value={importText}
              onChangeText={setImportText}
              multiline
            />
            <TouchableOpacity style={s.importBtn} onPress={async () => {
              try {
                const n = await importarDatos(importText);
                Alert.alert("Importado", `${n} datos restaurados.`);
                setMostrarImport(false);
                setImportText("");
              } catch (e) {
                console.warn('[import]', e);
                Alert.alert("Error", "JSON inválido");
              }
            }}>
              <ThemedText style={s.importBtnText}>Restaurar</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        <ThemedText style={s.seccionTitulo}>INFORMACIÓN</ThemedText>
        <View style={s.card}>
          <View style={s.fila}>
            <ThemedText style={s.filaLabel}>Versión</ThemedText>
            <ThemedText style={s.filaValor}>{Constants.expoConfig?.version ?? "?"}</ThemedText>
          </View>
        </View>
        <View style={s.card}>
          <View style={s.fila}>
            <ThemedText style={s.filaLabel}>Acerca de</ThemedText>
            <ThemedText style={s.filaSub}>Iglesia Digital — App católica con Biblia,
              Catecismo, Misal Romano, Rosario y más. Desarrollada con ❤️.</ThemedText>
          </View>
        </View>
        <View style={s.card}>
          <View style={s.fila}>
            <ThemedText style={s.filaLabel}>Ayuda</ThemedText>
            <ThemedText style={s.filaSub}>Para reportar errores o sugerencias,
              escribinos a ayuda@iglesiadigital.app</ThemedText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  content: { padding: S.lg, paddingBottom: S.huge },
  seccionTitulo: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: S.sm, marginTop: S.lg, marginHorizontal: S.xs },
  card: { backgroundColor: C.navyMid, borderRadius: R.lg, padding: S.lg, marginBottom: S.sm },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filaLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  filaSub: { color: C.muted, fontSize: 12, marginTop: 2, maxWidth: 240 },
  filaValor: { color: C.muted, fontSize: 14 },
  flecha: { color: C.gold, fontSize: 18 },
  importInput: { backgroundColor: C.navyMid, color: C.text, borderRadius: R.md, padding: S.md, fontSize: 13, marginBottom: S.sm, borderWidth: 1, borderColor: C.goldDim, minHeight: 80, textAlignVertical: 'top' },
  importBtn: { backgroundColor: C.gold, borderRadius: R.md, paddingVertical: S.sm, alignItems: 'center' },
  importBtnText: { color: C.navy, fontWeight: '700', fontSize: 14 },
});
