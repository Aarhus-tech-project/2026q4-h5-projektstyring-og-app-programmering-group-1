import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../../http/http';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function loadStoredUser() {
            try {
                const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
                const storedUser = await AsyncStorage.getItem(USER_KEY);

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Could not load stored user;', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadStoredUser();
    }, []);

    async function login(email, password) {
        const response = await http.post('/login', {
            email: email.trim().toLowerCase(),
            password,
        });

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

        await AsyncStorage.setItem(TOKEN_KEY, loginData.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(loginData.user));

        setToken(loginData.token);
        setUser(loginData.user);
        setCompanies(loggedInCompanies);

        return loginData;
    }

    async function logout() {

        await AsyncStorage.removeItem(TOKEN_KEY);
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
        await logout();
    }

    const value = useMemo(
        () => ({
            user,
            companies,
            isAuthenticated: Boolean(user),
            setCompanies,
            login,
            logout,
            updateProfile,
            deleteAccount,
            changePassword,
            uploadAvatar,
            avatarSource,
        }),
        [user, companies, isLoading, avatarSource]
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
