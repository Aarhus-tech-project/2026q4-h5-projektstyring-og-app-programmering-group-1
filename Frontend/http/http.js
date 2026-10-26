import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_IP } from "@env";

const http = axios.create({
  baseURL: SERVER_IP,
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


export default http;
