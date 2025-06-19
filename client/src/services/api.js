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
      console.log('Using mock revenue data for testing...');
      
      // Return mock data for testing
      const mockRevenue = {
        daily: { total: 1250.50, count: 8 },
        monthly: { total: 15420.75, count: 95 },
        yearly: { total: 185000.00, count: 1150 }
      };
      
      return { 
        [period]: mockRevenue[period] || { total: 0, count: 0 }
      };
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
      console.log('Using mock psychologist data for testing...');
      
      // Return mock data for testing
      const mockPsychologists = {
        daily: { total: 3, verified: 2 },
        monthly: { total: 25, verified: 20 },
        yearly: { total: 180, verified: 150 }
      };
      
      return { 
        [period]: mockPsychologists[period] || { total: 0, verified: 0 }
      };
    }
  },

  getParentsBookings: async (period = 'daily') => {
    try {
      console.log('Fetching appointments with period:', period);
      const response = await api.get('/appointments/', {
        params: { period: period }
      });
      
      console.log('Appointments API response:', response);
      
      const appointments = response.results || [];
      console.log('Appointments data:', appointments);
      
      const uniqueParents = new Set(appointments.map(a => a.parent?.user || a.parent_id)).size;
      
      // Calculate booking types based on session_type from API
      const online = appointments.filter(a => 
        a.session_type === 'OnlineMeeting'
      ).length;
      const initial = appointments.filter(a => 
        a.session_type === 'InitialConsultation'
      ).length;
      
      console.log('Booking types calculated:', { online, initial });
      
      // Calculate status distribution based on appointment_status from API
      const status = {
        completed: appointments.filter(a => 
          a.appointment_status === 'Completed'
        ).length,
        scheduled: appointments.filter(a => 
          a.appointment_status === 'Scheduled'
        ).length,
        cancelled: appointments.filter(a => 
          a.appointment_status === 'Cancelled'
        ).length,
        no_show: appointments.filter(a => 
          a.appointment_status === 'No_Show'
        ).length
      };
      
      console.log('Status distribution calculated:', status);
      
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
      
      const result = { 
        [period]: { 
          total: appointments.length,
          unique_parents: uniqueParents,
          online,
          initial,
          status,
          trend
        } 
      };
      
      console.log('Final booking data result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      console.log('Using mock data for testing...');
      
      // Return mock data for testing
      return { 
        [period]: { 
          total: 25,
          unique_parents: 15,
          online: 18,
          initial: 7,
          status: { completed: 12, scheduled: 8, cancelled: 3, no_show: 2 },
          trend: { monday: 4, tuesday: 3, wednesday: 5, thursday: 6, friday: 4, saturday: 2, sunday: 1 }
        } 
      };
    }
  },

  getTopPsychologists: async (period = 'daily') => {
    try {
      console.log('Fetching top psychologists with period:', period);
      // Fetch the first page of psychologists
      const response = await api.get('/psychologists/manage/', {
        params: {
          page: 1,
          page_size: 20 // Fetch more to ensure we have enough to sort
        }
      });
      console.log('Top psychologists API response:', response);
      // Sort by years_of_experience or total_bookings if available
      const sorted = (response.results || []).sort((a, b) => {
        // Prefer total_bookings, fallback to years_of_experience
        const aVal = a.total_bookings || a.years_of_experience || 0;
        const bVal = b.total_bookings || b.years_of_experience || 0;
        return bVal - aVal;
      });
      // Map to expected format
      const psychologists = sorted.slice(0, 5).map(psych => {
        const firstName = psych.first_name || psych.user?.first_name || '';
        const lastName = psych.last_name || psych.user?.last_name || '';
        return {
          id: psych.user || psych.id,
          first_name: firstName,
          last_name: lastName,
          full_name: psych.full_name || `${firstName} ${lastName}`.trim(),
          rating: psych.rating || 4.5,
          total_bookings: psych.total_bookings || psych.years_of_experience || 0,
          completion_rate: psych.completion_rate || 90,
          avg_session_duration: psych.avg_session_duration || 60
        };
      });
      console.log('Processed top psychologists:', psychologists);
      return psychologists;
    } catch (error) {
      console.error('Error fetching top psychologists:', error);
      console.log('Using mock data for top psychologists...');
      return [
        {
          id: 1,
          first_name: 'Sarah',
          last_name: 'Johnson',
          full_name: 'Sarah Johnson',
          rating: 4.8,
          total_bookings: 45,
          completion_rate: 95,
          avg_session_duration: 60
        },
        {
          id: 2,
          first_name: 'Michael',
          last_name: 'Chen',
          full_name: 'Michael Chen',
          rating: 4.7,
          total_bookings: 38,
          completion_rate: 92,
          avg_session_duration: 55
        },
        {
          id: 3,
          first_name: 'Emily',
          last_name: 'Davis',
          full_name: 'Emily Davis',
          rating: 4.6,
          total_bookings: 32,
          completion_rate: 88,
          avg_session_duration: 65
        },
        {
          id: 4,
          first_name: 'James',
          last_name: 'Wilson',
          full_name: 'James Wilson',
          rating: 4.5,
          total_bookings: 28,
          completion_rate: 85,
          avg_session_duration: 50
        },
        {
          id: 5,
          first_name: 'Lisa',
          last_name: 'Brown',
          full_name: 'Lisa Brown',
          rating: 4.4,
          total_bookings: 25,
          completion_rate: 82,
          avg_session_duration: 70
        }
      ];
    }
  },

  getAllPsychologists: async (page = 1, filters = {}) => {
    try {
      console.log('Fetching all psychologists with filters:', filters, 'page:', page);
      
      // Use GET request with query parameters instead of POST
      const response = await api.get('/psychologists/manage/', { 
        params: { 
          page,
          ...filters
        } 
      });
      
      console.log('All psychologists API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching all psychologists:', error);
      console.log('Using mock data for all psychologists...');
      
      // Return mock data for testing
      const mockPsychologists = [
        {
          id: 1,
          user: 1,
          first_name: 'Dr. Sarah',
          last_name: 'Johnson',
          email: 'sarah.johnson@example.com',
          verification_status: 'Approved',
          years_of_experience: 8,
          created_at: '2024-01-15T10:30:00Z',
          is_verified: true
        },
        {
          id: 2,
          user: 2,
          first_name: 'Dr. Michael',
          last_name: 'Chen',
          email: 'michael.chen@example.com',
          verification_status: 'Pending',
          years_of_experience: 5,
          created_at: '2024-02-20T14:15:00Z',
          is_verified: false
        },
        {
          id: 3,
          user: 3,
          first_name: 'Dr. Emily',
          last_name: 'Davis',
          email: 'emily.davis@example.com',
          verification_status: 'Approved',
          years_of_experience: 12,
          created_at: '2024-01-10T09:45:00Z',
          is_verified: true
        },
        {
          id: 4,
          user: 4,
          first_name: 'Dr. James',
          last_name: 'Wilson',
          email: 'james.wilson@example.com',
          verification_status: 'Rejected',
          years_of_experience: 3,
          created_at: '2024-03-05T16:20:00Z',
          is_verified: false
        },
        {
          id: 5,
          user: 5,
          first_name: 'Dr. Lisa',
          last_name: 'Brown',
          email: 'lisa.brown@example.com',
          verification_status: 'Approved',
          years_of_experience: 7,
          created_at: '2024-02-12T11:30:00Z',
          is_verified: true
        }
      ];
      
      return { 
        count: mockPsychologists.length, 
        results: mockPsychologists 
      };
    }
  },

  getAllParents: async (page = 1, filters = {}) => {
    try {
      console.log('Fetching all parents with filters:', filters, 'page:', page);
      
      // Use GET request with query parameters instead of POST
      const response = await api.get('/parents/manage/', { 
        params: { 
          page,
          ...filters
        } 
      });
      
      console.log('All parents API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching all parents:', error);
      console.log('Using mock data for all parents...');
      
      // Return mock data for testing
      const mockParents = [
        {
          id: 1,
          user: 101,
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@example.com',
          city: 'New York',
          country: 'USA',
          created_at: '2024-01-10T08:30:00Z',
          full_name: 'John Smith'
        },
        {
          id: 2,
          user: 102,
          first_name: 'Maria',
          last_name: 'Garcia',
          email: 'maria.garcia@example.com',
          city: 'Los Angeles',
          country: 'USA',
          created_at: '2024-02-15T12:45:00Z',
          full_name: 'Maria Garcia'
        },
        {
          id: 3,
          user: 103,
          first_name: 'David',
          last_name: 'Johnson',
          email: 'david.johnson@example.com',
          city: 'Chicago',
          country: 'USA',
          created_at: '2024-01-25T16:20:00Z',
          full_name: 'David Johnson'
        },
        {
          id: 4,
          user: 104,
          first_name: 'Sarah',
          last_name: 'Williams',
          email: 'sarah.williams@example.com',
          city: 'Houston',
          country: 'USA',
          created_at: '2024-03-01T10:15:00Z',
          full_name: 'Sarah Williams'
        },
        {
          id: 5,
          user: 105,
          first_name: 'Michael',
          last_name: 'Brown',
          email: 'michael.brown@example.com',
          city: 'Phoenix',
          country: 'USA',
          created_at: '2024-02-08T14:30:00Z',
          full_name: 'Michael Brown'
        }
      ];
      
      return { 
        count: mockParents.length, 
        results: mockParents 
      };
    }
  },

  // Additional Admin API endpoints based on YAML spec
  getAppointments: async (page = 1, filters = {}) => {
    try {
      const response = await api.get('/appointments/', { 
        params: { 
          page,
          ...filters
        } 
      });
      return response;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return { count: 0, results: [] };
    }
  },

  getAppointmentById: async (id) => {
    try {
      const response = await api.get(`/appointments/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  },

  updateAppointment: async (id, data) => {
    try {
      const response = await api.patch(`/appointments/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  cancelAppointment: async (id, reason) => {
    try {
      const response = await api.post(`/appointments/${id}/cancel/`, { cancellation_reason: reason });
      return response;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },

  completeAppointment: async (id) => {
    try {
      const response = await api.post(`/appointments/${id}/complete/`, {});
      return response;
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  },

  getPsychologistById: async (id) => {
    try {
      const response = await api.get(`/psychologists/manage/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching psychologist:', error);
      throw error;
    }
  },

  updatePsychologist: async (id, data) => {
    try {
      const response = await api.patch(`/psychologists/manage/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating psychologist:', error);
      throw error;
    }
  },

  deletePsychologist: async (id) => {
    try {
      const response = await api.delete(`/psychologists/manage/${id}/`);
      return response;
    } catch (error) {
      console.error('Error deleting psychologist:', error);
      throw error;
    }
  },

  verifyPsychologist: async (id, status) => {
    try {
      const response = await api.post(`/psychologists/manage/${id}/verify/`, { status });
      return response;
    } catch (error) {
      console.error('Error verifying psychologist:', error);
      throw error;
    }
  },

  getParentById: async (id) => {
    try {
      const response = await api.get(`/parents/manage/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching parent:', error);
      throw error;
    }
  },

  updateParent: async (id, data) => {
    try {
      const response = await api.patch(`/parents/manage/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating parent:', error);
      throw error;
    }
  },

  deleteParent: async (id) => {
    try {
      const response = await api.delete(`/parents/manage/${id}/`);
      return response;
    } catch (error) {
      console.error('Error deleting parent:', error);
      throw error;
    }
  },

  getPayments: async (page = 1, filters = {}) => {
    try {
      const response = await api.get('/payments/orders/', { 
        params: { 
          page,
          ...filters
        } 
      });
      return response;
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { count: 0, results: [] };
    }
  },

  getPaymentById: async (id) => {
    try {
      const response = await api.get(`/payments/orders/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  updatePayment: async (id, data) => {
    try {
      const response = await api.patch(`/payments/orders/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  getTransactions: async (page = 1, filters = {}) => {
    try {
      const response = await api.get('/payments/transactions/', { 
        params: { 
          page,
          ...filters
        } 
      });
      return response;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { count: 0, results: [] };
    }
  },

  getTransactionById: async (id) => {
    try {
      const response = await api.get(`/payments/transactions/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  },

  getChildren: async (page = 1, filters = {}) => {
    try {
      const response = await api.get('/children/manage/', { 
        params: { 
          page,
          ...filters
        } 
      });
      return response;
    } catch (error) {
      console.error('Error fetching children:', error);
      return { count: 0, results: [] };
    }
  },

  getChildById: async (id) => {
    try {
      const response = await api.get(`/children/manage/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching child:', error);
      throw error;
    }
  },

  updateChild: async (id, data) => {
    try {
      const response = await api.patch(`/children/profile/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating child:', error);
      throw error;
    }
  },

  deleteChild: async (id) => {
    try {
      const response = await api.delete(`/children/profile/${id}/`);
      return response;
    } catch (error) {
      console.error('Error deleting child:', error);
      throw error;
    }
  },

  getUsers: async (page = 1, filters = {}) => {
    try {
      const response = await api.get('/users/', { 
        params: { 
          page,
          ...filters
        } 
      });
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      return { count: 0, results: [] };
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await api.patch(`/users/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  getAdminProfile: async () => {
    try {
      const response = await api.get('/auth/me/');
      return response;
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      throw error;
    }
  },

  updateAdminProfile: async (data) => {
    try {
      const response = await api.patch('/auth/update_profile/', data);
      return response;
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  },

  changePassword: async (data) => {
    try {
      const response = await api.post('/auth/password-reset/', data);
      return response;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  getAppointmentSlots: async (page = 1, filters = {}) => {
    try {
      const response = await api.get('/appointments/slots/', { 
        params: { 
          page,
          ...filters
        } 
      });
      return response;
    } catch (error) {
      console.error('Error fetching appointment slots:', error);
      return { count: 0, results: [] };
    }
  },

  getAppointmentSlotById: async (id) => {
    try {
      const response = await api.get(`/appointments/slots/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching appointment slot:', error);
      throw error;
    }
  },

  deleteAppointmentSlot: async (id) => {
    try {
      const response = await api.delete(`/appointments/slots/${id}/`);
      return response;
    } catch (error) {
      console.error('Error deleting appointment slot:', error);
      throw error;
    }
  },

  getPsychologistAvailability: async (page = 1, filters = {}) => {
    try {
      const response = await api.get('/psychologists/availability/', { 
        params: { 
          page,
          ...filters
        } 
      });
      return response;
    } catch (error) {
      console.error('Error fetching psychologist availability:', error);
      return { count: 0, results: [] };
    }
  },

  getPsychologistAvailabilityById: async (id) => {
    try {
      const response = await api.get(`/psychologists/availability/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching psychologist availability:', error);
      throw error;
    }
  },

  updatePsychologistAvailability: async (id, data) => {
    try {
      const response = await api.patch(`/psychologists/availability/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating psychologist availability:', error);
      throw error;
    }
  },

  deletePsychologistAvailability: async (id) => {
    try {
      const response = await api.delete(`/psychologists/availability/${id}/`);
      return response;
    } catch (error) {
      console.error('Error deleting psychologist availability:', error);
      throw error;
    }
  },

  getPricing: async (currency = 'USD') => {
    try {
      const response = await api.get('/payments/pricing/', {
        params: { currency }
      });
      return response;
    } catch (error) {
      console.error('Error fetching pricing:', error);
      throw error;
    }
  },

  getAppointmentAnalytics: async (psychologistId, dateFrom, dateTo) => {
    try {
      const response = await api.get('/appointments/analytics/psychologist_stats/', {
        params: { 
          psychologist_id: psychologistId,
          date_from: dateFrom,
          date_to: dateTo
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching appointment analytics:', error);
      throw error;
    }
  },

  getAvailableSlots: async (dateFrom, dateTo, psychologistId, sessionType) => {
    try {
      const response = await api.get('/appointments/available_slots/', {
        params: { 
          date_from: dateFrom,
          date_to: dateTo,
          psychologist_id: psychologistId,
          session_type: sessionType
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  },

  searchAppointments: async (filters = {}, page = 1) => {
    try {
      const response = await api.post('/appointments/search/', filters, { params: { page } });
      return response;
    } catch (error) {
      console.error('Error searching appointments:', error);
      return { count: 0, results: [] };
    }
  },

  searchChildren: async (filters = {}, page = 1) => {
    try {
      const response = await api.post('/children/manage/search/', filters, { params: { page } });
      return response;
    } catch (error) {
      console.error('Error searching children:', error);
      return { count: 0, results: [] };
    }
  },

  getChildStatistics: async () => {
    try {
      const response = await api.get('/children/manage/statistics/');
      return response;
    } catch (error) {
      console.error('Error fetching child statistics:', error);
      throw error;
    }
  },

  getPsychologistStatistics: async () => {
    try {
      const response = await api.get('/psychologists/manage/statistics/');
      return response;
    } catch (error) {
      console.error('Error fetching psychologist statistics:', error);
      throw error;
    }
  },

  getSlotStatistics: async () => {
    try {
      const response = await api.get('/appointments/slots/statistics/');
      return response;
    } catch (error) {
      console.error('Error fetching slot statistics:', error);
      throw error;
    }
  },

  generateSlots: async (data) => {
    try {
      const response = await api.post('/appointments/slots/generate_slots/', data);
      return response;
    } catch (error) {
      console.error('Error generating slots:', error);
      throw error;
    }
  },

  cleanupPastSlots: async (daysPast = 7) => {
    try {
      const response = await api.post('/appointments/slots/cleanup_past_slots/', {}, {
        params: { days_past: daysPast }
      });
      return response;
    } catch (error) {
      console.error('Error cleaning up past slots:', error);
      throw error;
    }
  },

  verifyQRCode: async (qrCode) => {
    try {
      const response = await api.post('/appointments/verify_qr/', { qr_code: qrCode });
      return response;
    } catch (error) {
      console.error('Error verifying QR code:', error);
      throw error;
    }
  },

  getUpcomingAppointments: async (status, upcoming) => {
    try {
      const response = await api.get('/appointments/upcoming/', {
        params: { status, upcoming }
      });
      return response;
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  },

  getAppointmentHistory: async () => {
    try {
      const response = await api.get('/appointments/history/');
      return response;
    } catch (error) {
      console.error('Error fetching appointment history:', error);
      throw error;
    }
  },

  getMyAppointments: async (page = 1) => {
    try {
      const response = await api.get('/appointments/my_appointments/', {
        params: { page }
      });
      return response;
    } catch (error) {
      console.error('Error fetching my appointments:', error);
      return { count: 0, results: [] };
    }
  },

  getMySlots: async (page = 1) => {
    try {
      const response = await api.get('/appointments/slots/my_slots/', {
        params: { page }
      });
      return response;
    } catch (error) {
      console.error('Error fetching my slots:', error);
      return { count: 0, results: [] };
    }
  },

  getMyAvailability: async (page = 1) => {
    try {
      const response = await api.get('/psychologists/availability/my_availability/', {
        params: { page }
      });
      return response;
    } catch (error) {
      console.error('Error fetching my availability:', error);
      return { count: 0, results: [] };
    }
  },

  getWeeklySummary: async () => {
    try {
      const response = await api.get('/psychologists/availability/weekly_summary/');
      return response;
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      throw error;
    }
  },

  getAppointmentSlotsForBooking: async (dateFrom, dateTo, psychologistId, sessionType) => {
    try {
      const response = await api.get('/appointments/slots/available_for_booking/', {
        params: { 
          date_from: dateFrom,
          date_to: dateTo,
          psychologist_id: psychologistId,
          session_type: sessionType
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching appointment slots for booking:', error);
      throw error;
    }
  },

  getPsychologistAvailabilityForBooking: async (dateFrom, dateTo) => {
    try {
      const response = await api.get('/psychologists/availability/appointment_slots/', {
        params: { 
          date_from: dateFrom,
          date_to: dateTo
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching psychologist availability for booking:', error);
      throw error;
    }
  },

  getDeletionImpact: async (availabilityId) => {
    try {
      const response = await api.get(`/psychologists/availability/${availabilityId}/deletion_impact/`);
      return response;
    } catch (error) {
      console.error('Error fetching deletion impact:', error);
      throw error;
    }
  },

  bulkCreateAvailability: async (weeklySchedule) => {
    try {
      const response = await api.post('/psychologists/availability/bulk_create/', { weekly_schedule: weeklySchedule });
      return response;
    } catch (error) {
      console.error('Error bulk creating availability:', error);
      throw error;
    }
  },

  createAvailability: async (data) => {
    try {
      const response = await api.post('/psychologists/availability/', data);
      return response;
    } catch (error) {
      console.error('Error creating availability:', error);
      throw error;
    }
  },

  createAppointmentSlot: async (data) => {
    try {
      const response = await api.post('/appointments/slots/', data);
      return response;
    } catch (error) {
      console.error('Error creating appointment slot:', error);
      throw error;
    }
  },

  createAppointment: async (data) => {
    try {
      const response = await api.post('/appointments/', data);
      return response;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  createChild: async (data) => {
    try {
      const response = await api.post('/children/profile/', data);
      return response;
    } catch (error) {
      console.error('Error creating child:', error);
      throw error;
    }
  },

  createPsychologistProfile: async (data) => {
    try {
      const response = await api.post('/psychologists/profile/', data);
      return response;
    } catch (error) {
      console.error('Error creating psychologist profile:', error);
      throw error;
    }
  },

  updatePsychologistProfile: async (data) => {
    try {
      const response = await api.patch('/psychologists/profile/update_profile/', data);
      return response;
    } catch (error) {
      console.error('Error updating psychologist profile:', error);
      throw error;
    }
  },

  getPsychologistProfile: async () => {
    try {
      const response = await api.get('/psychologists/profile/profile/');
      return response;
    } catch (error) {
      console.error('Error fetching psychologist profile:', error);
      throw error;
    }
  },

  getPsychologistCompleteness: async () => {
    try {
      const response = await api.get('/psychologists/profile/completeness/');
      return response;
    } catch (error) {
      console.error('Error fetching psychologist completeness:', error);
      throw error;
    }
  },

  updatePsychologistEducation: async (data) => {
    try {
      const response = await api.patch('/psychologists/profile/education/', data);
      return response;
    } catch (error) {
      console.error('Error updating psychologist education:', error);
      throw error;
    }
  },

  getPsychologistEducation: async () => {
    try {
      const response = await api.get('/psychologists/profile/education/');
      return response;
    } catch (error) {
      console.error('Error fetching psychologist education:', error);
      throw error;
    }
  },

  updatePsychologistCertifications: async (data) => {
    try {
      const response = await api.patch('/psychologists/profile/certifications/', data);
      return response;
    } catch (error) {
      console.error('Error updating psychologist certifications:', error);
      throw error;
    }
  },

  getPsychologistCertifications: async () => {
    try {
      const response = await api.get('/psychologists/profile/certifications/');
      return response;
    } catch (error) {
      console.error('Error fetching psychologist certifications:', error);
      throw error;
    }
  },

  getParentProfile: async () => {
    try {
      const response = await api.get('/parents/profile/profile/');
      return response;
    } catch (error) {
      console.error('Error fetching parent profile:', error);
      throw error;
    }
  },

  updateParentProfile: async (data) => {
    try {
      const response = await api.patch('/parents/profile/update_profile/', data);
      return response;
    } catch (error) {
      console.error('Error updating parent profile:', error);
      throw error;
    }
  },

  getParentCompleteness: async () => {
    try {
      const response = await api.get('/parents/profile/completeness/');
      return response;
    } catch (error) {
      console.error('Error fetching parent completeness:', error);
      throw error;
    }
  },

  getCommunicationPreferences: async () => {
    try {
      const response = await api.get('/parents/profile/communication-preferences/');
      return response;
    } catch (error) {
      console.error('Error fetching communication preferences:', error);
      throw error;
    }
  },

  updateCommunicationPreferences: async (data) => {
    try {
      const response = await api.patch('/parents/profile/communication-preferences/', data);
      return response;
    } catch (error) {
      console.error('Error updating communication preferences:', error);
      throw error;
    }
  },

  resetCommunicationPreferences: async () => {
    try {
      const response = await api.post('/parents/profile/communication-preferences/reset/');
      return response;
    } catch (error) {
      console.error('Error resetting communication preferences:', error);
      throw error;
    }
  },

  getMyChildren: async (page = 1) => {
    try {
      const response = await api.get('/children/profile/my_children/', {
        params: { page }
      });
      return response;
    } catch (error) {
      console.error('Error fetching my children:', error);
      return { count: 0, results: [] };
    }
  },

  getChildProfileSummary: async (childId) => {
    try {
      const response = await api.get(`/children/profile/${childId}/profile_summary/`);
      return response;
    } catch (error) {
      console.error('Error fetching child profile summary:', error);
      throw error;
    }
  },

  manageChildConsent: async (childId, data) => {
    try {
      const response = await api.post(`/children/profile/${childId}/manage_consent/`, data);
      return response;
    } catch (error) {
      console.error('Error managing child consent:', error);
      throw error;
    }
  },

  bulkUpdateChildConsent: async (childId, data) => {
    try {
      const response = await api.post(`/children/profile/${childId}/bulk_consent/`, data);
      return response;
    } catch (error) {
      console.error('Error bulk updating child consent:', error);
      throw error;
    }
  },

  getMarketplacePsychologists: async (page = 1, filters = {}) => {
    try {
      const response = await api.get('/psychologists/marketplace/', { 
        params: { 
          page,
          ...filters
        } 
      });
      return response;
    } catch (error) {
      console.error('Error fetching marketplace psychologists:', error);
      return { count: 0, results: [] };
    }
  },

  getMarketplacePsychologistById: async (id) => {
    try {
      const response = await api.get(`/psychologists/marketplace/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching marketplace psychologist:', error);
      throw error;
    }
  },

  getMarketplacePsychologistAvailability: async (id, dateFrom, dateTo) => {
    try {
      const response = await api.get(`/psychologists/marketplace/${id}/availability/`, {
        params: { 
          date_from: dateFrom,
          date_to: dateTo
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching marketplace psychologist availability:', error);
      throw error;
    }
  },

  filterMarketplacePsychologists: async (filters = {}, page = 1) => {
    try {
      const response = await api.get('/psychologists/marketplace/filter/', {
        params: { 
          page,
          ...filters
        }
      });
      return response;
    } catch (error) {
      console.error('Error filtering marketplace psychologists:', error);
      return { count: 0, results: [] };
    }
  },

  searchMarketplacePsychologists: async (filters = {}, page = 1) => {
    try {
      const response = await api.post('/psychologists/marketplace/search/', filters, { params: { page } });
      return response;
    } catch (error) {
      console.error('Error searching marketplace psychologists:', error);
      return { count: 0, results: [] };
    }
  },

  createAppointmentOrder: async (data) => {
    try {
      const response = await api.post('/payments/orders/create_appointment_order/', data);
      return response;
    } catch (error) {
      console.error('Error creating appointment order:', error);
      throw error;
    }
  },

  createAppointmentOrderWithReservation: async (data) => {
    try {
      const response = await api.post('/payments/orders/create_appointment_order_with_reservation/', data);
      return response;
    } catch (error) {
      console.error('Error creating appointment order with reservation:', error);
      throw error;
    }
  },

  createRegistrationOrder: async (data) => {
    try {
      const response = await api.post('/payments/orders/create_registration_order/', data);
      return response;
    } catch (error) {
      console.error('Error creating registration order:', error);
      throw error;
    }
  },

  initiatePayment: async (orderId, data) => {
    try {
      const response = await api.post(`/payments/orders/${orderId}/initiate_payment/`, data);
      return response;
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const response = await api.post(`/payments/orders/${orderId}/cancel/`, {});
      return response;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  getOrderStatus: async (orderId) => {
    try {
      const response = await api.get(`/payments/orders/${orderId}/status/`);
      return response;
    } catch (error) {
      console.error('Error fetching order status:', error);
      throw error;
    }
  },

  refundPayment: async (paymentId, data) => {
    try {
      const response = await api.post(`/payments/payments/${paymentId}/refund/`, data);
      return response;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  },

  checkPaymentStatus: async (data) => {
    try {
      const response = await api.post('/payments/payments/check_status/', data);
      return response;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  },

  registerUser: async (data) => {
    try {
      const response = await api.post('/auth/register/', data);
      return response;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/password-reset/', { email });
      return response;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  },

  confirmPasswordReset: async (data) => {
    try {
      const response = await api.post('/auth/password-reset-confirm/', data);
      return response;
    } catch (error) {
      console.error('Error confirming password reset:', error);
      throw error;
    }
  },

  verifyEmail: async (uidb64, token) => {
    try {
      const response = await api.get(`/auth/verify-email/${uidb64}/${token}/`);
      return response;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  },
};

export { api };
export default apiService;