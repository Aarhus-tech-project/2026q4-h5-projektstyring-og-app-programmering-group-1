import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


const AuthContext = createContext(null);

const TOKEN_KEY = '@lagerklar_token';
const USER_KEY = '@lagerklar_user';
const COMPANIES_KEY = '@lagerklar_companies';

const API_BASE_URL = 'http://172.31.0.151:8080/v1';

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function restoreAuthentication() {
            try {
                const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
                const storedUser =await AsyncStorage.getItem(USER_KEY);
                const storedCompanies = await AsyncStorage.getItem(COMPANIES_KEY);

                if (storedToken) {
                    setToken(storedToken);
                }

                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                if (storedCompanies) {
                    setCompanies(JSON.parse(storedCompanies));
                }
            } catch (error) {
                console.error('Could not restore authentication: ', error);
            } finally {
                setIsLoading(false);
            }
        }

        restoreAuthentication();
    }, []);

    async function login(email, password) {
        const reponse = await fetch('${API_BASE_URL}/login', {
            methid: 'POST',
            headers: {
                'Content_type': 'application/json',
            },
            body: JSON.stringify({
                email: email.trim().toLowerCase(),
                password,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || 'Kunne ikke logge ind.'
            );
        }
    }



}