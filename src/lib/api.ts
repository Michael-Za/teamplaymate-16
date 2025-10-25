/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import type { AxiosRequestHeaders } from 'axios';

const isProduction =
  import.meta.env.MODE === 'production' ||
  import.meta.env['VITE_NODE_ENV'] === 'production';

export const API_BASE_URL =
  import.meta.env['VITE_API_URL'] ||
  (isProduction ? 'https://api.statsor.com' : 'http://localhost:3000');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إرسال الـ token تلقائيًا
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    } as AxiosRequestHeaders;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
    }
    return Promise.reject(err);
  }
);

export const api = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    validateToken: '/api/auth/validate-token',
    logout: '/api/auth/logout',
  },
};

// TypeScript types محسنة
interface RegisterData {
  name: string;
  email: string;
  password: string;
  location: string;
}

interface RegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  message: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  message: string;
}

// دالة مساعدة للتعامل مع الأخطاء
const handleRequest = async <T>(fn: () => Promise<T>) => {
  try {
    return await fn();
  } catch (err: any) {
    console.error('API Error:', err.response?.data || err.message);
    throw err;
  }
};

// Auth API محسنة
export const authAPI = {
  register: (data: RegisterData) =>
    handleRequest(() =>
      axiosInstance.post<RegisterResponse>(api.auth.register, {
        ...data,
        passwordConfirm: data.password,
      })
    ),

  login: (data: LoginData) =>
    handleRequest(async () => {
      console.log(data);
      
      const res = await axiosInstance.post<LoginResponse>(api.auth.login, data);
      console.log(res);
      if (res.data.token) {
        localStorage.setItem('access_token', res.data.token);
      }
      return res.data;
    }),

  logout: () =>
    handleRequest(async () => {
      localStorage.removeItem('access_token');
      return { success: true };
    }),

  validateToken: () =>
    handleRequest(async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return { valid: false };
      const res = await axiosInstance.post(api.auth.validateToken, { token });
      return { valid: !!res.data?.success };
    }),
};
