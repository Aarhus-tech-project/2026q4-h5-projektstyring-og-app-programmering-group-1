import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import http from "../../http/http";
import { Platform } from 'react-native';


// The single place that decides how notifications behave while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
    let token = null;

    if (Platform.OS === 'android') {
      // Native side creates the channel first and can then throw while serializing the result
      // (NullPointerException on null fields), so a failure here must not block getting the token.
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          description: 'General notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (e) {
        console.warn(`Failed to set notification channel: ${e}`);
      }
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return null;
      }
      // Learn more about projectId:
      // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
      // EAS projectId is used here.
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId //replace you Project ID here
          })
        ).data;
      } catch (e) {
        // Previously the error text was sent to the server as if it were a push token.
        console.error(`Failed to get Expo push token: ${e}`);
        return null;
      }
    } else {
      console.error('Must use physical device for Push Notifications');
    }

    return token;
  }


// Registering and uploading the token once per signed-in user per app session is enough;
// Home mounts many times during a session.
let savedTokenForUser = null;
let saveInFlight = null;
// The token this device registered, so it can be removed again on logout
let savedToken = null;

/**
 * Registers for push and uploads the token. Resolves true when a token was saved (or already saved this session).
 * `force` retries after an earlier attempt, e.g. from the streak notification settings.
 */
async function SaveExpoToken(userID, { force = false } = {}) {
  if (!userID) return false;
  if (savedTokenForUser === userID && !force) return true;
  if (saveInFlight) return saveInFlight;

  saveInFlight = (async () => {
    try{
      const token = await registerForPushNotificationsAsync();
      if(token){
        const res = await http.post(`/expo-push-token`,{
          user_id: userID,
          token: token,
          platform: Platform.OS
        });
        if(res.data.success){
          savedTokenForUser = userID;
          savedToken = token;
          console.debug(res.data.message);
          return true;
        }
      };
      return false;
    }
    catch(e){
      return false;
    }
    finally{
      saveInFlight = null;
    }
  })();
  return saveInFlight;
}

// The device's push token without asking for permission (used on logout).
// Returns null when notifications are not allowed or the token cannot be read.
async function getExistingExpoToken() {
  if (savedToken) return savedToken;
  if (!Device.isDevice) return null;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) return null;

    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }
}

/**
 * Removes this device's push token from the logged-in user, so the device stops receiving their
 * notifications after logout. Must run while the user is still logged in (the request needs the token).
 * Never throws: logging out must work even without internet.
 */
async function RemoveExpoToken() {
  const token = await getExistingExpoToken();

  // Forget it locally either way, so the next user on this device registers again
  savedToken = null;
  savedTokenForUser = null;

  if (!token) return;

  try {
    await http.delete('/expo-push-token', { data: { token }, timeout: 5000 });
  } catch (error) {
    console.warn('Could not remove push token on logout:', error?.message);
  }
}

/** "granted" | "denied" | "undetermined" | "unavailable" (simulators and emulators can't receive pushes). */
async function getNotificationPermission() {
  if (!Device.isDevice) return "unavailable";
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted" || status === "denied" ? status : "undetermined";
  } catch {
    return "undetermined";
  }
}

export {
    registerForPushNotificationsAsync,
    SaveExpoToken,
    RemoveExpoToken,
    getNotificationPermission
}
