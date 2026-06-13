import AsyncStorage from "@react-native-async-storage/async-storage";

type NotificationsModule = typeof import("expo-notifications");

let Notifications: NotificationsModule | null = null;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (Notifications) return Notifications;
  try {
    Notifications = await import("expo-notifications");
    return Notifications;
  } catch {
    console.warn("expo-notifications not available (Expo Go)");
    return null;
  }
}

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
  const n = await getNotifications();
  if (!n) return false;
  const { status } = await n.requestPermissionsAsync();
  return status === "granted";
}

async function scheduleDaily() {
  const n = await getNotifications();
  if (!n) return;
  await n.cancelAllScheduledNotificationsAsync();
  await n.scheduleNotificationAsync({
    content: {
      title: "Iglesia Digital",
      body: "No olvides la oración de hoy",
      sound: true,
    },
    trigger: {
      type: n.SchedulableTriggerInputTypes.DAILY,
      hour: HOUR,
      minute: MINUTE,
    },
  });
}

async function cancelAll() {
  const n = await getNotifications();
  if (!n) return;
  await n.cancelAllScheduledNotificationsAsync();
}

export async function setupNotifications() {
  const n = await getNotifications();
  if (!n) return;
  n.setNotificationHandler({
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
