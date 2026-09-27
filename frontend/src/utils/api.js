import axios from 'axios';
import { BRANDING } from './branding';

const API_URL = BRANDING.apiUrl;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const servicesAPI = {
  getAll: () => api.get('/services'),
  getById: (id) => api.get(`/services/${id}`),
};

export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  quick: (data) => api.post('/bookings/quick', data),
  getById: (id) => api.get(`/bookings/${id}`),
  getByEmail: (email) => api.get(`/bookings?email=${email}`),
  getByPhone: (phone) => api.get(`/bookings?phone=${phone}`),
  getAvailableSlots: (date) => api.get(`/bookings/available-slots?date=${date}`),
};

export const paymentsAPI = {
  createOrder: (bookingId) => api.post('/payments/create-order', { booking_id: bookingId }),
  createRazorpayOrder: (bookingId) => api.post('/payments/create-razorpay-order', { booking_id: bookingId }),
  verifyRazorpayPayment: (data) => api.post('/payments/verify-razorpay-payment', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getUpiDetails: (bookingId) => api.post('/payments/upi-details', { booking_id: bookingId }),
};

export const authAPI = {
  // One login for customers and admins; the server answers with type: 'admin' | 'customer'.
  login: (credentials) => api.post('/auth/login', credentials),
};

export const analyticsAPI = {
  get: (days) => api.get('/admin/analytics', { params: { days } }),
};

export const adminAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  getMe: () => api.get('/admin/me'),
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  updateBookingStatus: (id, data) => api.put(`/admin/bookings/${id}/status`, data),
  confirmPayment: (id) => api.put(`/admin/bookings/${id}/confirm-payment`),
  rescheduleBooking: (id, data) => api.put(`/admin/bookings/${id}/reschedule`, data),
  sendEmail: (id, data) => api.post(`/admin/bookings/${id}/email`, data),
  updateBookingProgress: (id, data) => api.put(`/admin/bookings/${id}/progress`, data),
  getServices: () => api.get('/admin/services'),
  createService: (data) => api.post('/admin/services', data),
  updateService: (id, data) => api.put(`/admin/services/${id}`, data),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
  getSubAdmins: () => api.get('/admin/subadmins'),
  createSubAdmin: (data) => api.post('/admin/subadmins', data),
  updateSubAdmin: (id, data) => api.put(`/admin/subadmins/${id}`, data),
  deleteSubAdmin: (id) => api.delete(`/admin/subadmins/${id}`),
  getCustomers: () => api.get('/admin/customers'),
  getCustomerBookings: (customerId) => api.get(`/admin/customers/${customerId}/bookings`),
  // Transactions
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  getTransactionsSummary: () => api.get('/admin/transactions/summary'),
  getTransactionLog: (bookingId) => api.get(`/admin/transactions/${bookingId}/log`),
};

export const whatsappAPI = {
  getConversations: () => api.get('/whatsapp/conversations'),
  getMessages: (phone) => api.get(`/whatsapp/messages/${phone}`),
  startConversation: (phone) => api.post('/whatsapp/start-conversation', { phone }),
  getQuickReplies: () => api.get('/whatsapp/quick-replies'),
  addQuickReply: (data) => api.post('/whatsapp/quick-replies', data),
  deleteQuickReply: (id) => api.delete(`/whatsapp/quick-replies/${id}`),
};

// Customer API (unauthenticated)
export const customerAPI = {
  register: (data) => axios.post(`${API_URL}/customer/register`, data),
  login: (data) => axios.post(`${API_URL}/customer/login`, data),
  resetPassword: (data) => axios.post(`${API_URL}/customer/reset-password`, data),
  getProfile: (token) => axios.get(`${API_URL}/customer/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProfile: (data, token) => axios.put(`${API_URL}/customer/profile`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getBookings: (token) => axios.get(`${API_URL}/customer/bookings`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getBooking: (bookingId, token) => axios.get(`${API_URL}/customer/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  changePassword: (data, token) => axios.put(`${API_URL}/customer/change-password`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

export const uploadAPI = {
  // Any admin content image: Cloudinary if set up, otherwise stored on the server (/uploads/...)
  uploadImage: (image, folder) => api.post('/upload/image', { image, folder }),
  // Upload from Google Drive URL
  uploadFromDrive: (data) => api.post('/upload/cloudinary/upload-from-drive', data),
  // Upload from base64
  uploadBase64: (data) => api.post('/upload/cloudinary/upload-base64', data),
  // Upload from URL
  uploadUrl: (data) => api.post('/upload/cloudinary/upload-url', data),
  // Delete from Cloudinary
  deleteFromCloudinary: (publicId) => api.delete('/upload/cloudinary/delete', { data: { publicId } }),
  // List images from Cloudinary
  listCloudinaryImages: (params) => api.get('/upload/cloudinary/list', { params }),
  // Legacy methods
  saveImageUrl: (data) => api.post('/upload/save-image-url', data),
  deleteServiceImage: (data) => api.delete('/upload/delete-service-image', { data }),
  
  // Image Mappings (Google Drive to Cloudinary sync)
  getImageMappings: () => api.get('/upload/image-mappings'),
  createImageMapping: (data) => api.post('/upload/image-mappings', data),
  updateImageMapping: (id, data) => api.put(`/upload/image-mappings/${id}`, data),
  deleteImageMapping: (id) => api.delete(`/upload/image-mappings/${id}`),
  syncFromDrive: (mappingId) => api.post(`/upload/sync-from-drive${mappingId ? `?mapping_id=${mappingId}` : ''}`),
};

export default api;
export const leadsAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getPipeline: () => api.get('/leads/pipeline'),
  getById: (id) => api.get('/leads/' + id),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put('/leads/' + id, data),
  updateStage: (id, stage) => api.put('/leads/' + id + '/stage', { stage }),
  addNote: (id, note) => api.post('/leads/' + id + '/notes', { note }),
  delete: (id) => api.delete('/leads/' + id),
};

export const testimonialsAPI = {
  getAll: (adminMode) => api.get('/testimonials' + (adminMode ? '?all=true' : '')),
  create: (data) => api.post('/testimonials', data),
  update: (id, data) => api.put('/testimonials/' + id, data),
  delete: (id) => api.delete('/testimonials/' + id),
};

export const youtubeAPI = {
  getPublic: () => api.get('/youtube'),
  getAdmin: () => api.get('/youtube/admin'),
  refresh: () => api.post('/youtube/refresh'),
};

export const emailAdminAPI = {
  get: () => api.get('/admin/email'),
  saveSettings: (settings) => api.put('/admin/email/settings', settings),
  saveSmtp: (smtp) => api.put('/admin/email/smtp', smtp),
  clearSmtp: () => api.delete('/admin/email/smtp'),
  verify: () => api.post('/admin/email/verify'),
  test: (to) => api.post('/admin/email/test', { to }),
};

export const siteSettingsAPI = {
  getAll: () => api.get('/site-settings'),
  update: (key, value) => api.put('/site-settings/' + key, { value }),
};

export const projectsAPI = {
  getAll: (featured) => api.get('/projects' + (featured ? '?featured=true' : '')),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put('/projects/' + id, data),
  delete: (id) => api.delete('/projects/' + id),
};

export const catalogAPI = {
  getAll: (category) => api.get('/catalog' + (category ? '?category=' + encodeURIComponent(category) : '')),
  getCategories: () => api.get('/catalog/categories'),
  create: (data) => api.post('/catalog', data),
  update: (id, data) => api.put('/catalog/' + id, data),
  delete: (id) => api.delete('/catalog/' + id),
};

export const productOrdersAPI = {
  submit: (data) => api.post('/product-orders', data),
  getAll: () => api.get('/product-orders'),
  updateStatus: (id, status) => api.put('/product-orders/' + id + '/status', { status }),
};
