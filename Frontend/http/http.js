import axios from 'axios';

const SERVER_IP = 'http://172.31.0.151:8080/v1';

let accessToken = null;

const http = axios.create({
    baseURL: SERVER_IP,
});

export function setAccessToken(token) {
    accessToken = token;
}

export function clearAccessToken() {
    accessToken = null;
}

http.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default http;
