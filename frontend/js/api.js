// js/api.js — Centralized API client for FOSIECON frontend
// All backend calls go through this module

const API_BASE = 'http://localhost:5000/api'; // ← Change to production URL when deployed

const api = {
  // ── Core fetch wrapper ──────────────────────────────────
  async request(method, endpoint, data = null, isFormData = false) {
    const token = localStorage.getItem('fosiecon_token');
    const headers = {};

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const config = { method, headers };
    if (data) config.body = isFormData ? data : JSON.stringify(data);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      return json;
    } catch (err) {
      console.error(`[API] ${method} ${endpoint}:`, err.message);
      throw err;
    }
  },

  get:    (ep)           => api.request('GET',    ep),
  post:   (ep, data)     => api.request('POST',   ep, data),
  put:    (ep, data)     => api.request('PUT',    ep, data),
  delete: (ep)           => api.request('DELETE', ep),
  upload: (ep, formData) => api.request('POST',   ep, formData, true),
  uploadPut: (ep, fd)    => api.request('PUT',    ep, fd, true),

  // ── Auth ────────────────────────────────────────────────
  auth: {
    login:          (data) => api.post('/auth/login', data),
    logout:         ()     => api.post('/auth/logout', {}),
    me:             ()     => api.get('/auth/me'),
    register:       (data) => api.post('/auth/register', data),
    createStaff:    (data) => api.post('/auth/staff', data),
    updateUser:     (id, data) => api.put(`/auth/users/${id}`, data),
    changePassword: (data) => api.put('/auth/change-password', data),
    users:          ()     => api.get('/auth/users'),
    toggleUser:     (id)   => api.put(`/auth/users/${id}/toggle`, {}),
    unlockUser:     (id)   => api.put(`/auth/users/${id}/unlock`, {}),
    logs:           (params = '') => api.get(`/auth/logs${params}`),
    logsSummary:    ()     => api.get('/auth/logs/summary'),
    deleteLog:      (id)   => api.delete(`/auth/logs/${id}`),
    clearLogs:      (params = '') => api.delete(`/auth/logs${params}`),
  },

  // ── Settings (public) ───────────────────────────────────
  settings: {
    getPublic: () => api.get('/settings/public'),
    getAll:    () => api.get('/settings'),
    update:    (key, data) => api.put(`/settings/${key}`, data),
  },

  // ── Member-state commissions ────────────────────────────
  members: {
    getAll: () => api.get('/members'),
    getOne: (id) => api.get(`/members/${id}`),
    states: () => api.get('/members/states'),
    create: (fd) => api.upload('/members', fd),
    update: (id, fd) => api.uploadPut(`/members/${id}`, fd),
    delete: (id) => api.delete(`/members/${id}`),
  },

  // ── News / Blog ─────────────────────────────────────────
  news: {
    getPublished: (params = '') => api.get(`/news${params}`),
    getAll:       ()            => api.get('/news/all'),
    getOne:       (slug)        => api.get(`/news/${slug}`),
    getOneById:   (id)          => api.get(`/news/id/${id}`),
    create:       (fd)          => api.upload('/news', fd),
    update:       (id, fd)      => api.uploadPut(`/news/${id}`, fd),
    publish:      (id)          => api.put(`/news/${id}/publish`, {}),
    delete:       (id)          => api.delete(`/news/${id}`),
    extractLink:  (url)         => api.post('/news/extract-link', { url }),
  },

  // ── Team ────────────────────────────────────────────────
  team: {
    getAll:      (params = '') => api.get(`/team${params}`),
    getChairman: ()            => api.get('/team/chairman'),
    getOne:      (id)          => api.get(`/team/${id}`),
    create:      (fd)          => api.upload('/team', fd),
    update:      (id, fd)      => api.uploadPut(`/team/${id}`, fd),
    uploadPhoto: (id, fd)      => api.uploadPut(`/team/${id}/photo`, fd),
    delete:      (id)          => api.delete(`/team/${id}`),
  },

  // ── Events / Calendar ───────────────────────────────────
  events: {
    getAll:    (params = '') => api.get(`/events${params}`),
    upcoming:  ()            => api.get('/events?upcoming=true&status=upcoming'),
    getOne:    (id)          => api.get(`/events/${id}`),
    create:    (data)        => api.post('/events', data),
    update:    (id, data)    => api.put(`/events/${id}`, data),
    delete:    (id)          => api.delete(`/events/${id}`),
  },

  // ── Downloads ───────────────────────────────────────────
  downloads: {
    getAll:    (params = '') => api.get(`/downloads${params}`),
    create:    (fd)          => api.upload('/downloads', fd),
    update:    (id, data)    => api.put(`/downloads/${id}`, data),
    trackGet:  (id)          => api.get(`/downloads/${id}/download`),
    delete:    (id)          => api.delete(`/downloads/${id}`),
  },

  // ── Gallery ─────────────────────────────────────────────
  gallery: {
    getAll:  (params = '') => api.get(`/gallery${params}`),
    create:  (fd)          => api.upload('/gallery', fd),
    update:  (id, data)    => api.put(`/gallery/${id}`, data),
    delete:  (id)          => api.delete(`/gallery/${id}`),
  },

  // ── Inquiries (contact form) ────────────────────────────
  inquiries: {
    submit:    (data) => api.post('/inquiries', data),
    getAll:    (params = '') => api.get(`/inquiries${params}`),
    setStatus: (id, data) => api.put(`/inquiries/${id}/status`, data),
    archive:   (id, archived = true) => api.put(`/inquiries/${id}/archive`, { archived }),
    delete:    (id) => api.delete(`/inquiries/${id}`),
  },

  // ── Testimonials ────────────────────────────────────────
  testimonials: {
    getApproved: (params = '') => api.get(`/testimonials${params}`),
    getAll:      ()            => api.get('/testimonials/all'),
    submit:      (data)        => api.post('/testimonials', data),
    approve:     (id)          => api.put(`/testimonials/${id}/approve`, {}),
    delete:      (id)          => api.delete(`/testimonials/${id}`),
  },

  // ── FAQ ──────────────────────────────────────────────────
  faqs: {
    getPublished: (params = '') => api.get(`/faqs${params}`),
    getAll:       ()            => api.get('/faqs/all'),
    create:       (data)        => api.post('/faqs', data),
    update:       (id, data)    => api.put(`/faqs/${id}`, data),
    delete:       (id)          => api.delete(`/faqs/${id}`),
  },
};

window.api = api;
