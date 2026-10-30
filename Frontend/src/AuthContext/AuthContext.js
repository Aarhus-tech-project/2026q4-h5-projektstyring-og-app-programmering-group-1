import { createContext, useContext, useMemo, useState } from 'react';
import http, {
    clearAccessToken,
    setAccessToken,
} from '../../http/http';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [companies, setCompanies] = useState([]);

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

        setAccessToken(loginData.token);
        setToken(loginData.token);
        setUser(loginData.user);
        setCompanies(loggedInCompanies);

        return loginData;
    }

    function logout() {
        clearAccessToken();
        setToken(null);
        setUser(null);
        setCompanies([]);
    }

    const value = useMemo(
        () => ({
            token,
            user,
            companies,
            isAuthenticated: Boolean(token),
            login,
            logout,
        }),
        [token, user, companies]
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
