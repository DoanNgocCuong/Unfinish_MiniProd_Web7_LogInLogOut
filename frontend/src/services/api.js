import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Create axios instance with interceptor to add Google token
const api = axios.create({
    baseURL: API_BASE_URL
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('googleToken'); // Get stored Google token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const apiService = {
    // Get welcome message
    getWelcomeMessage: async (lang = 'en') => {
        try {
            const response = await api.get('/test', {
                params: { lang }
            });
            return response.data.message;
        } catch (error) {
            console.error('Error getting welcome message:', error);
            throw error;
        }
    },

    // Get users with language parameter
    getUsers: async (lang = 'en') => {
        try {
            const response = await api.get('/users', {
                params: { lang }
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Get department tools
    getDepartments: async (lang = 'vi') => {
        try {
            const response = await api.get('/departments', {
                params: { lang }
            });
            return response.data || {};
        } catch (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
    }
};

export default apiService; 