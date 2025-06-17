import axios from 'axios';

const API_URL = '/api';
const getToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Request:', config.method.toUpperCase(), config.url, config.data);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

const calculatePeriodData = (data, period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0);
  }

  return data.filter(item => new Date(item.created_at) >= startDate);
};

export default {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password }, {
        skipAuth: true,
      });
      console.log('Login Success:', response.data);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Login failed' };
      // Extract non_field_errors or message
      const errorMessage = errorData.non_field_errors?.[0] || errorData.message || 'Login failed';
      console.error('Login Error:', errorData);
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout/');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
    }
  },

  getRevenue: async (period = 'daily') => {
    try {
      const response = await api.get('/payments/orders/', { params: { status: 'paid' } });
      const orders = response.data.results || [];
      const filteredOrders = calculatePeriodData(orders, period);
      const total = filteredOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
      return { [period]: total.toFixed(2) };
    } catch (error) {
      console.error('Error fetching revenue:', error);
      return { [period]: 0 };
    }
  },

  getPsychologistsRegistered: async (period = 'daily') => {
    try {
      const response = await api.get('/psychologists/manage/');
      const psychologists = response.data.results || [];
      const filteredPsychologists = calculatePeriodData(psychologists, period);
      return { [period]: filteredPsychologists.length };
    } catch (error) {
      console.error('Error fetching psychologists:', error);
      return { [period]: 0 };
    }
  },

  getParentsBookings: async (period = 'daily') => {
    try {
      const response = await api.get('/appointments/');
      const appointments = response.data.results || [];
      const filteredAppointments = calculatePeriodData(appointments, period);
      return { [period]: filteredAppointments.length };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return { [period]: 0 };
    }
  },

  getTopPsychologists: async (period = 'daily') => {
    try {
      const response = await api.get('/appointments/analytics/psychologist_stats/', {
        params: { date_from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0] }
      });
      const stats = Array.isArray(response.data) ? response.data : [response.data];
      return stats.map(psych => ({
        id: psych.psychologist_id,
        name: psych.psychologist_name,
        rating: 4.5,
        bookings: { [period]: psych.total_appointments || 0 }
      })).sort((a, b) => b.bookings[period] - a.bookings[period]).slice(0, 5);
    } catch (error) {
      console.error('Error fetching top psychologists:', error);
      return [];
    }
  },

  getAllPsychologists: async (page = 1, filters = {}) => {
    try {
      const response = await api.post('/psychologists/manage/search/', filters, { params: { page } });
      return response.data;
    } catch (error) {
      console.error('Error fetching all psychologists:', error);
      return { count: 0, results: [] };
    }
  },

  getAllParents: async (page = 1, filters = {}) => {
    try {
      const response = await api.post('/parents/manage/search/', filters, { params: { page } });
      return response.data;
    } catch (error) {
      console.error('Error fetching all parents:', error);
      return { count: 0, results: [] };
    }
  },
};