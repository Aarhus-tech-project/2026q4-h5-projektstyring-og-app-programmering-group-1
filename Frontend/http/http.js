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


export default http;
