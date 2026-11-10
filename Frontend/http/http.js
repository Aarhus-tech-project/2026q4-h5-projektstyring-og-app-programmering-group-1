import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetTo } from '../src/navigation/navigationRef';
const SERVER_IP = process.env.EXPO_PUBLIC_SERVER_IP;

const http = axios.create({
  baseURL: SERVER_IP,
  timeout: 10000,
});

http.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

http.interceptors.response.use((response) => response, async (error) => {
  // A 401 from /login just means wrong credentials, so let LoginScreen handle it
  const isLoginRequest = error.config?.url?.includes('/login');

  if (error.response?.status === 401 && !isLoginRequest) {
    await AsyncStorage.multiRemove(['token', 'user']);
    resetTo('Login');
  }
  return Promise.reject(error);
});

// Standard-fejlbeskeder pr. HTTP-status, så brugeren aldrig ser
// tekniske tekster som "Request failed with status code 404".
const STATUS_MESSAGES = {
  400: 'De indtastede oplysninger er ikke gyldige.',
  401: 'Din session er udløbet. Log ind igen.',
  403: 'Du har ikke adgang til at gøre dette.',
  404: 'Det du leder efter blev ikke fundet. Prøv igen senere.',
  409: 'Oplysningerne findes allerede.',
  413: 'Filen er for stor.',
  415: 'Filtypen understøttes ikke.',
  429: 'For mange forsøg. Vent lidt og prøv igen.',
};

const SERVER_ERROR_MESSAGE = 'Der er en fejl på serveren. Prøv igen senere.';
const NETWORK_ERROR_MESSAGE = 'Kunne ikke forbinde til serveren. Tjek din internetforbindelse.';
const TIMEOUT_MESSAGE = 'Serveren svarede ikke i tide. Prøv igen.';
const DEFAULT_MESSAGE = 'Der opstod en uventet fejl. Prøv igen.';

/**
 * Laver en fejl fra en request om til en brugervenlig dansk besked.
 * overrides: beskeder til bestemte statuskoder for netop denne handling,
 * fx { 409: 'Emailen er allerede i brug.' }, samt evt. fallback.
 */
export function getErrorMessage(error, overrides = {}) {
  const fallback = overrides.fallback || DEFAULT_MESSAGE;

  // Ikke en request-fejl (fx en fejl i vores egen kode)
  if (!error?.isAxiosError) {
    return fallback;
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return TIMEOUT_MESSAGE;
  }

  // Requesten blev sendt, men der kom intet svar (server nede / intet net)
  if (!error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const status = error.response.status;

  if (overrides[status]) {
    return overrides[status];
  }

  if (status >= 500) {
    return SERVER_ERROR_MESSAGE;
  }

  return STATUS_MESSAGES[status] || fallback;
}

export default http;
