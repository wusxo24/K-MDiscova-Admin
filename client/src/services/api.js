import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Try different token formats
      config.headers.Authorization = `Token ${token}`;  // Changed from Bearer to Token
      console.log('Request headers:', config.headers);
    }
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      token: token ? 'present' : 'missing'
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    // Return the data directly since we're using response.data in our service methods
    return response.data;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      headers: error.response?.headers
    });

    if (error.response?.status === 401) {
      console.log('Unauthorized access, clearing token and redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
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

export const apiService = {
  login: async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post('/auth/login/', { email, password });
      
      if (!response) {
        throw new Error('No response received from server');
      }
      
      // The response is already processed by the interceptor, so we get the data directly
      if (!response.token) {
        console.error('Login response:', response);
        throw new Error('No access token in response');
      }
      
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      console.error('Login Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      const errorData = error.response?.data || { message: 'Login failed' };
      const errorMessage = errorData.non_field_errors?.[0] || 
                          errorData.message || 
                          error.message || 
                          'Login failed';
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
      const response = await api.get('/payments/orders/', { 
        params: { 
          status: 'paid',
          period: period
        } 
      });
      
      const orders = response.results || [];
      const total = orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
      
      return { 
        [period]: { 
          total: total.toFixed(2), 
          count: orders.length 
        } 
      };
    } catch (error) {
      console.error('Error fetching revenue:', error);
      return { [period]: { total: 0, count: 0 } };
    }
  },

  getPsychologistsRegistered: async (period = 'daily') => {
    try {
      const response = await api.get('/psychologists/manage/', {
        params: { period: period }
      });
      
      const psychologists = response.results || [];
      const verified = psychologists.filter(p => p.is_verified).length;
      
      return { 
        [period]: { 
          total: psychologists.length,
          verified: verified
        } 
      };
    } catch (error) {
      console.error('Error fetching psychologists:', error);
      return { [period]: { total: 0, verified: 0 } };
    }
  },

  getParentsBookings: async (period = 'daily') => {
    try {
      const response = await api.get('/appointments/', {
        params: { period: period }
      });
      
      const appointments = response.results || [];
      const uniqueParents = new Set(appointments.map(a => a.parent_id)).size;
      
      // Calculate booking types
      const online = appointments.filter(a => a.type === 'online').length;
      const initial = appointments.filter(a => a.type === 'initial').length;
      
      // Calculate status distribution
      const status = {
        completed: appointments.filter(a => a.status === 'completed').length,
        scheduled: appointments.filter(a => a.status === 'scheduled').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        no_show: appointments.filter(a => a.status === 'no_show').length
      };
      
      // Calculate weekly trend
      const trend = {
        monday: appointments.filter(a => new Date(a.created_at).getDay() === 1).length,
        tuesday: appointments.filter(a => new Date(a.created_at).getDay() === 2).length,
        wednesday: appointments.filter(a => new Date(a.created_at).getDay() === 3).length,
        thursday: appointments.filter(a => new Date(a.created_at).getDay() === 4).length,
        friday: appointments.filter(a => new Date(a.created_at).getDay() === 5).length,
        saturday: appointments.filter(a => new Date(a.created_at).getDay() === 6).length,
        sunday: appointments.filter(a => new Date(a.created_at).getDay() === 0).length
      };
      
      return { 
        [period]: { 
          total: appointments.length,
          unique_parents: uniqueParents,
          online,
          initial,
          status,
          trend
        } 
      };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return { 
        [period]: { 
          total: 0, 
          unique_parents: 0,
          online: 0,
          initial: 0,
          status: { completed: 0, scheduled: 0, cancelled: 0, no_show: 0 },
          trend: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
        } 
      };
    }
  },

  getTopPsychologists: async (period = 'daily') => {
    try {
      // Calculate date range based on period
      const now = new Date();
      let dateFrom;
      switch (period) {
        case 'daily':
          dateFrom = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'monthly':
          dateFrom = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'yearly':
          dateFrom = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          dateFrom = new Date(now.setDate(now.getDate() - 30)); // Default to last 30 days
      }

      const response = await api.get('/psychologists/manage/', {
        params: {
          ordering: '-total_appointments',
          limit: 5
        }
      });

      // Transform the data to match the expected format
      return (response.results || []).map(psych => ({
        id: psych.id,
        first_name: psych.first_name,
        last_name: psych.last_name,
        rating: psych.rating || 4.5,
        total_bookings: psych.total_appointments || 0,
        completion_rate: psych.completion_rate || 0,
        avg_session_duration: psych.avg_session_duration || 0
      }));
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

export { api };
export default apiService;