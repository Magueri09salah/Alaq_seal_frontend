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
  
  /**
   * Calculate toiture devis (preview only - doesn't save)
   * @param {Object} data - Calculation data
   * @returns {Promise}
   */
  calculateToiture: (data) => api.post('/toiture/calculate', data),
  
  /**
   * Create new toiture devis
   * @param {Object} data - Devis data
   * @returns {Promise}
   */
  createToitureDevis: (data) => api.post('/toiture/devis', data),
  
  /**
   * List toiture devis with optional filters
   * @param {Object} params - Query parameters (status, type, per_page, page)
   * @returns {Promise}
   */
  listToitureDevis: (params = {}) => api.get('/toiture/devis', { params }),
  
  /**
   * Get single toiture devis by ID
   * @param {number} id - Devis ID
   * @returns {Promise}
   */
  getToitureDevis: (id) => api.get(`/toiture/devis/${id}`),
  
  /**
   * Submit toiture devis to AlaqSeal
   * @param {number} id - Devis ID
   * @returns {Promise}
   */
  submitToitureDevis: (id) => api.post(`/toiture/devis/${id}/submit`),
  
  /**
   * Delete toiture devis
   * @param {number} id - Devis ID
   * @returns {Promise}
   */
  deleteToitureDevis: (id) => api.delete(`/toiture/devis/${id}`),
  
  /**
   * Get toiture statistics
   * @returns {Promise}
   */
  getToitureStats: () => api.get('/toiture/stats'),
  
  /**
   * Download toiture devis PDF
   * Note: This is handled manually in components with fetch() to handle blob response
   * @param {number} id - Devis ID
   * @returns {string} - URL for download
   */
  getToiturePdfUrl: (id) => `${import.meta.env.VITE_API_URL}/toiture/devis/${id}/download-pdf`,
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