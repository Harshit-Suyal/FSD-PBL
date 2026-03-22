import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL });

const getAuthToken = () => {
    const direct = localStorage.getItem('token');
    if (direct && direct !== 'undefined' && direct !== 'null') return direct;

    try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const fallback = storedUser?.token || storedUser?.accessToken;
        if (fallback && fallback !== 'undefined' && fallback !== 'null') return fallback;
    } catch {
    }

    return null;
};

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    else if (config.headers?.Authorization) delete config.headers.Authorization;
    return config;
});

// ── Auth ──
export const registerUser = (data) => api.post('/users/register', data);
export const loginUser = (data) => api.post('/users/login', data);
export const getMyProfile = () => api.get('/users/profile');
export const updateProfile = (data) => api.put('/users/profile', data);
export const getUserById = (id) => api.get(`/users/${id}`);
export const getAllUsers = () => api.get('/users');
export const toggleStatus = (id) => api.put(`/users/${id}/toggle-status`);

// ── Gigs ──
export const getGigs = (params) => api.get('/gigs', { params });
export const getGigCategories = () => api.get('/gigs/categories');
export const getGigById = (id) => api.get(`/gigs/${id}`);
export const createGig = (data) => api.post('/gigs', data);
export const updateGig = (id, data) => api.put(`/gigs/${id}`, data);
export const deleteGig = (id) => api.delete(`/gigs/${id}`);
export const getMyGigs = () => api.get('/gigs/user/my-gigs');
export const markGigPaymentDone = (id) => api.put(`/gigs/${id}/payment`);
export const completeGig = (id) => api.put(`/gigs/${id}/complete`);
export const getGigInvoice = (id) => api.get(`/gigs/${id}/invoice`);

// ── Applications ──
export const applyForGig = (gigId, data) => api.post(`/applications/${gigId}`, data);
export const getGigApplications = (gigId) => api.get(`/applications/gig/${gigId}`);
export const getMyApplications = () => api.get('/applications/my-applications');
export const updateAppStatus = (id, payload) => api.put(`/applications/${id}/status`, payload);
export const getAllApplications = () => api.get('/applications');

// ── Reviews ──
export const addReview = (gigId, data) => api.post(`/reviews/${gigId}`, data);
export const getUserReviews = (userId) => api.get(`/reviews/user/${userId}`);
export const getGigReviews = (gigId) => api.get(`/reviews/gig/${gigId}`);

// ── Admin ──
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminGigs = () => api.get('/admin/gigs');
export const adminDeleteGig = (id) => api.delete(`/admin/gigs/${id}`);

// ── Chat ──
export const getGigMessages = (gigId) => api.get(`/chat/${gigId}`);
export const sendGigMessage = (gigId, data) => api.post(`/chat/${gigId}`, data);

export default api;
