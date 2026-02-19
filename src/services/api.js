import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register : (data) => api.post('/auth/register', data),
  login    : (data) => api.post('/auth/login', data),
  logout   : ()     => api.post('/auth/logout'),
  me       : ()     => api.get('/auth/me'),
};

// ── Estimator / Catalog (public) ──────────────────────────────────────────────
export const estimatorAPI = {
  /** GET /services */
  getServices: () => api.get('/services'),

  /**
   * GET /services/{id}/products
   * @param {number} serviceId
   * @param {object} params  — { subcategory: 'graphique' | 'mur' | ... }
   */
  getServiceProducts: (serviceId, params = {}) =>
    api.get(`/services/${serviceId}/products`, { params }),

  /**
   * GET /pricing-factors
   * Returns { height: [...], condition: [...], complexity: [...], region: [...] }
   */
  getPricingFactors: () => api.get('/pricing-factors'),

  /**
   * POST /devis/calculate
   * Preview — does NOT save
   */
  calculateDevis: (data) => api.post('/devis/calculate', data),

  /**
   * POST /devis
   * Create and save
   */
  createDevis: (data) => api.post('/devis', data),
};

// ── Devis ─────────────────────────────────────────────────────────────────────
export const devisAPI = {
  /** GET /devis?status=draft&per_page=10 */
  list    : (params = {}) => api.get('/devis', { params }),

  /** GET /devis/stats */
  stats   : ()            => api.get('/devis/stats'),

  /** GET /devis/{id} */
  show    : (id)          => api.get(`/devis/${id}`),

  /** POST /devis/{id}/submit */
  submit  : (id)          => api.post(`/devis/${id}/submit`),

  /** DELETE /devis/{id} */
  delete  : (id)          => api.delete(`/devis/${id}`),
};

export default api;