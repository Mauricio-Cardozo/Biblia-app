import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getLecturaDelDia } from '@/db/db';
import { hoy } from '@/utils/date';

const PREF_EVANGELIO = 'notif_evangelio';
const PREF_RACHAS = 'notif_rachas';

export function initNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e: unknown) {
    console.warn('[notif] permission error:', e instanceof Error ? e.message : e);
    return false;
  }
}

export async function scheduleBibleNotifications(db: SQLiteDatabase): Promise<boolean> {
  try {
    const granted = await requestPermission();
    if (!granted) return false;

    await Notifications.cancelScheduledNotificationAsync('evangelio-7am').catch(() => {});
    await Notifications.cancelScheduledNotificationAsync('versiculo-12pm').catch(() => {});

    const lectura = await getLecturaDelDia(db, hoy());
    const body = lectura?.evangelio_ref
      ? `${lectura.evangelio} — ${lectura.evangelio_ref}`
      : (lectura?.evangelio ?? 'Lee el Evangelio de hoy');

    await Notifications.scheduleNotificationAsync({
      identifier: 'evangelio-7am',
      content: { title: 'Evangelio del día', body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 7, minute: 0 },
    });

    const verse = await db.getFirstAsync<{ texto: string; libro: string; capitulo: number; versiculo: number }>(
      'SELECT texto, libro, capitulo, versiculo FROM biblia_pueblo_dios ORDER BY RANDOM() LIMIT 1'
    );
    if (verse) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'versiculo-12pm',
        content: {
          title: 'Versículo del día',
          body: `${verse.texto.substring(0, 120)} — ${verse.libro} ${verse.capitulo}:${verse.versiculo}`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 12, minute: 0 },
      });
    }

    return true;
  } catch (e: unknown) {
    console.warn('[notif] schedule bible error:', e instanceof Error ? e.message : e);
    return false;
  }
}

export async function cancelBibleNotifications(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('evangelio-7am').catch(() => {});
    await Notifications.cancelScheduledNotificationAsync('versiculo-12pm').catch(() => {});
  } catch (e: unknown) {
    console.warn('[notif] cancel bible error:', e instanceof Error ? e.message : e);
  }
}

export async function scheduleStreakNotification(): Promise<boolean> {
  try {
    const granted = await requestPermission();
    if (!granted) return false;

    await Notifications.cancelScheduledNotificationAsync('rachas-8pm').catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier: 'rachas-8pm',
      content: {
        title: 'Rachas de oración',
        body: 'Rezá el Rosario o la Coronilla para mantener tu racha diaria',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
    });

    return true;
  } catch (e: unknown) {
    console.warn('[notif] schedule streak error:', e instanceof Error ? e.message : e);
    return false;
  }
}

export async function cancelStreakNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('rachas-8pm').catch(() => {});
  } catch (e: unknown) {
    console.warn('[notif] cancel streak error:', e instanceof Error ? e.message : e);
  }
}

export async function getPrefEvangelio(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(PREF_EVANGELIO)) === 'true'; }
  catch { return false; }
}

export async function setPrefEvangelio(v: boolean): Promise<void> {
  await AsyncStorage.setItem(PREF_EVANGELIO, JSON.stringify(v));
}

export async function getPrefRachas(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(PREF_RACHAS)) === 'true'; }
  catch { return false; }
}

export async function setPrefRachas(v: boolean): Promise<void> {
  await AsyncStorage.setItem(PREF_RACHAS, JSON.stringify(v));
}
