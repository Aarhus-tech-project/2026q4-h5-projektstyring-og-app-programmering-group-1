import { createContext, useContext, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../../http/http';
import { RemoveExpoToken } from '../utils/notificationUtils';
import { getToken, saveToken, removeToken } from '../utils/tokenStorage';
const SERVER_IP = process.env.EXPO_PUBLIC_SERVER_IP;

// The token lives encrypted in SecureStore (see tokenStorage.js). The user object is not secret.
const USER_KEY = 'user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [token, setToken] = useState(null);
    // Called by SplashScreen. The backend checks the saved token's signature and expiry via GET /me.
    // Returns:
    //   'authenticated' - token is valid, user and companies are loaded
    //   'missing'       - no saved token, no request was made
    //   'invalid'       - token expired or rejected (401), the saved session is cleared
    //   'unreachable'   - no answer from the server, the saved token is kept for next start
    async function restoreSession() {
        let storedToken = null;
        let storedUser = null;
        try {
            storedToken = await getToken();
            storedUser = JSON.parse(await AsyncStorage.getItem(USER_KEY) ?? 'null');
        } catch (error) {
            console.error('Could not load stored session;', error);
        }

        if (!storedToken || storedToken === 'null' || storedToken === 'undefined') {
            return 'missing';
        }

        let meData;
        try {
            const response = await http.get('/me', { skipAuthRedirect: true });
            meData = response.data?.data;
        } catch (error) {
            if (error.response?.status === 401) {
                await removeToken();
                await AsyncStorage.removeItem(USER_KEY);
                return 'invalid';
            }
            return 'unreachable';
        }

        if (!meData?.user) {
            return 'unreachable';
        }

        // Keep local-only fields such as avatar_version, but trust the server for the rest
        const restoredUser = { ...(storedUser ?? {}), ...meData.user };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(restoredUser));

        setToken(storedToken);
        setUser(restoredUser);
        setCompanies(meData.companies || []);

        return 'authenticated';
    }

    async function login(email, password) {
        const response = await http.post('/login', {
            email: email.trim().toLowerCase(),
            password,
        });

        console.log(SERVER_IP, 'Login response:', response.data);

        const result = response.data;
        const loginData = result.data;

        if (
            !loginData ||
            !loginData.token ||
            !loginData.user
        ) {
            throw new Error(
                'Login mislykkedes. Ugyldige data modtaget fra serveren.'
            );
        }

        const loggedInCompanies = loginData.companies || [];

        await saveToken(loginData.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(loginData.user));

        setToken(loginData.token);
        setUser(loginData.user);
        setCompanies(loggedInCompanies);

        return loginData;
    }

    // removePushToken: stop this device from getting the user's notifications. Skipped after the
    // account is deleted, because the database already removed its push tokens then.
    async function logout({ removePushToken = true } = {}) {
        // Must happen before the login token is cleared, the request needs it. Never throws.
        if (removePushToken) {
            await RemoveExpoToken();
        }

        await removeToken();
        await AsyncStorage.removeItem(USER_KEY);
        
        setToken(null);
        setUser(null);
        setCompanies([]);
    }

    async function updateProfile(updates) {
        if (!user?.id) {
            throw new Error('Ingen bruger er logget ind.');
        }

        const response = await http.put(`/user/${user.id}`, updates);

        // Brug serverens svar hvis det indeholder brugeren, ellers flet ændringerne ind lokalt
        const updatedUser = { ...user, ...updates, ...(response.data?.data?.user ?? {}) };

        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);

        return updatedUser;
    }

    // asset kommer fra expo-image-picker. Billedet sendes som multipart og gemmes som blob i databasen.
    async function uploadAvatar(asset) {
        if (!user?.id) {
            throw new Error('Ingen bruger er logget ind.');
        }

        const mimeType = asset.mimeType || 'image/jpeg';
        const extension = mimeType.split('/')[1] || 'jpg';

        const formData = new FormData();
        formData.append('avatar', {
            uri: asset.uri,
            name: asset.fileName || `avatar.${extension}`,
            type: mimeType,
        });

        await http.put(`/user/${user.id}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000,
        });

        // avatar_version skifter ved hver upload, så billedet hentes på ny
        const updatedUser = {
            ...user,
            avatar_url: `/user/${user.id}/avatar`,
            avatar_version: Date.now(),
        };

        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);

        return updatedUser;
    }

    // Image-source til brugerens profilbillede, eller null hvis brugeren ikke har et.
    // ?v= skifter ved hver upload, så det gamle billede ikke vises fra cachen.
    const avatarSource = useMemo(() => {
        // avatar_url fra login er en sti som "/user/<id>/avatar", eller null uden billede
        if (!user?.avatar_url || !token) {
            return null;
        }

        return {
            uri: `${http.defaults.baseURL}${user.avatar_url}?v=${user.avatar_version ?? 0}`,
            headers: { Authorization: `Bearer ${token}` },
        };
    }, [user?.avatar_url, user?.avatar_version, token]);

    async function changePassword({ currentPassword, newPassword, confirmPassword }) {
        if (!user?.id) {
            throw new Error('Ingen bruger er logget ind.');
        }

        await http.put(`/user/${user.id}/password`, {
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
        });
    }

    async function deleteAccount() {
        if (!user?.id) {
            throw new Error('Ingen bruger er logget ind.');
        }

        await http.delete(`/user/${user.id}`);
        // Deleting the user also deleted its push tokens (ON DELETE CASCADE)
        await logout({ removePushToken: false });
    }

    const value = useMemo(
        () => ({
            user,
            companies,
            isAuthenticated: Boolean(user),
            setCompanies,
            restoreSession,
            login,
            logout,
            updateProfile,
            deleteAccount,
            changePassword,
            uploadAvatar,
            avatarSource,
            // Needed for images that are loaded straight from the API (they require the Authorization header)
            token,
        }),
        [user, companies, avatarSource, token]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be inside AuthProvider.');
    }

    return context;
}
