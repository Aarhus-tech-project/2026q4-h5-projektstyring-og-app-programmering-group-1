import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../../http/http';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function loadStoredUser() {
            try {
                const storedUser = await AsyncStorage.getItem(USER_KEY);

                if (storedToken && storedUser) {
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

        setUser(loginData.user);
        setCompanies(loggedInCompanies);

        return loginData;
    }

    async function logout() {

        await AsyncStorage.removeItem('TOKEN_KEY');
        await AsyncStorage.removeItem('USER_KEY');
        
        setUser(null);
        setCompanies([]);
    }

    const value = useMemo(
        () => ({
            user,
            companies,
            isAuthenticated: Boolean(user),
            login,
            logout,
        }),
        [user, companies, isLoading]
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
