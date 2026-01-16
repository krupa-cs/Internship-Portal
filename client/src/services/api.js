import axios from 'axios';

const API_URL = 'https://internship-portal-4yld.vercel.app';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getOffers = () => api.get('/offers');
export const getOfferById = (id) => api.get(`/offers/${id}`);
export const createOffer = (data) => api.post('/offers', data);
export const createApplication = (data) => api.post('/applications', data);
export const getApplicationsByOffer = (offerId) => api.get(`/applications/offer/${offerId}`);

export default api;