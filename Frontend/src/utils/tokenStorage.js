import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The login token (JWT) is stored encrypted: Keychain on iOS, Keystore on Android.
// expo-secure-store does not work on web, so the web build falls back to AsyncStorage.
const TOKEN_KEY = 'token';
const isWeb = Platform.OS === 'web';

export async function getToken() {
    if (isWeb) {
        return AsyncStorage.getItem(TOKEN_KEY);
    }

    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
        return token;
    }

    // Older app versions saved the token unencrypted in AsyncStorage.
    // Move it into SecureStore once, so users who are already logged in stay logged in.
    const oldToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (oldToken) {
        await SecureStore.setItemAsync(TOKEN_KEY, oldToken);
        await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return oldToken;
}

export async function saveToken(token) {
    if (isWeb) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken() {
    // Also clears any old unencrypted copy left in AsyncStorage
    await AsyncStorage.removeItem(TOKEN_KEY);
    if (!isWeb) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
}
