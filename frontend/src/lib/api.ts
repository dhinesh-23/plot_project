import axios from 'axios';
import { Property, AuthResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const api = {
    // Auth
    register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
        apiClient.post<AuthResponse>('/auth/register', data),
    login: (email: string, password: string) =>
        apiClient.post<AuthResponse>('/auth/login', { email, password }),
    logout: () => { localStorage.clear(); window.location.href = '/login'; },
    
    // Properties
    getProperties: (params?: any) => apiClient.get<PaginatedResponse<Property>>('/properties', { params }),
    getProperty: (id: string) => apiClient.get<Property>(`/properties/${id}`),
    createProperty: (data: Partial<Property>) => apiClient.post<Property>('/properties', data),
    
    // 🔥 FIXED: Added updateProperty method
    updateProperty: (id: string, data: Partial<Property>) => 
        apiClient.put<Property>(`/properties/${id}`, data),
    
    // 🔥 FIXED: Added deleteProperty method
    deleteProperty: (id: string) => 
        apiClient.delete(`/properties/${id}`),
    
    // Inquiries
    createInquiry: (data: { property_id: string; message: string; phone?: string }) =>
        apiClient.post('/inquiries', data),
};