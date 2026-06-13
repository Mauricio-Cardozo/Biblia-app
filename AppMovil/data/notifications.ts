import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const ENABLED_KEY = "notifications_enabled";
const HOUR = 20;
const MINUTE = 0;

export async function isEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === "true";
}

export async function setEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, String(enabled));
  if (enabled) {
    const granted = await requestPermission();
    if (granted) {
      await scheduleDaily();
    }
  } else {
    await cancelAll();
  }
}

async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function scheduleDaily() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Iglesia Digital",
      body: "📖 No olvides la oración de hoy",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: HOUR,
      minute: MINUTE,
    },
  });
}

async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function setupNotifications() {
  if (Platform.OS === "web") return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  const enabled = await isEnabled();
  if (enabled) {
    const granted = await requestPermission();
    if (granted) {
      await scheduleDaily();
    }
  }
}
