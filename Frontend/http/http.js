import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const SERVER_IP = "http://172.31.0.151:8080/v1"

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
