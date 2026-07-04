import { C } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import ScreenHeader from '@/components/ui/screen-header';
import FontSizeControl from '@/components/font-size-control';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AjustesScreen() {
  const insets = useSafeAreaInsets();
  const [temaOscuro, setTemaOscuro] = useState(true);
  const [notifEvangelio, setNotifEvangelio] = useState(false);
  const [notifRachas, setNotifRachas] = useState(false);

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

        <ThemedText style={s.seccionTitulo}>INFORMACIÓN</ThemedText>
        <View style={s.card}>
          <View style={s.fila}>
            <ThemedText style={s.filaLabel}>Versión</ThemedText>
            <ThemedText style={s.filaValor}>1.0.0</ThemedText>
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
  content: { padding: 16, paddingBottom: 40 },
  seccionTitulo: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 16, marginHorizontal: 4 },
  card: { backgroundColor: C.navyMid, borderRadius: 12, padding: 16, marginBottom: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filaLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  filaSub: { color: C.muted, fontSize: 12, marginTop: 2, maxWidth: 240 },
  filaValor: { color: C.muted, fontSize: 14 },
});
