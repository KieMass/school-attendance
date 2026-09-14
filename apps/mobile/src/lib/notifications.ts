import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Requests permission, obtains an Expo push token, and registers it with
 * the backend (`POST /notifications/device-token`) so the leave-request /
 * approval / exit / return / overdue events described in the spec reach
 * this device. Expo push tokens are exchanged for native FCM/APNs delivery
 * by Expo's push service — the backend only needs to know about this one
 * token format. */
export async function registerForPushNotifications() {
  if (!Device.isDevice) return; // simulators/emulators can't receive push

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  const token = tokenResponse.data;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  await api.post('/notifications/device-token', {
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });
}
