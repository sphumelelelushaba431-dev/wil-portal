const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function req(method, path, body, isFile = false) {
  const opts = {
    method,
    credentials: 'include',
    headers: isFile ? {} : { 'Content-Type': 'application/json' },
    body: isFile ? body : body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Public
  getPublicStats: () => req('GET', '/api/public/stats'),
  getPublicOpportunities: () => req('GET', '/api/public/opportunities'),

  // Auth
  login: (email, password) => req('POST', '/api/auth/login', { email, password }),
  register: (email, password, full_name) =>
    req('POST', '/api/auth/register', { email, password, full_name }),
  logout: () => req('POST', '/api/auth/logout'),
  me: () => req('GET', '/api/auth/me'),

  // Manage Students (admin only)
  getStudents: () => req('GET', '/api/students'),
  promoteStudent: (id) => req('PUT', `/api/students/${id}/promote`),
  deleteStudent: (id) => req('DELETE', `/api/students/${id}`),

  // Companies
  getCompanies: () => req('GET', '/api/companies'),
  createCompany: (data) => req('POST', '/api/companies', data),
  updateCompany: (id, data) => req('PUT', `/api/companies/${id}`, data),
  deleteCompany: (id) => req('DELETE', `/api/companies/${id}`),

  // Opportunities
  getOpportunities: (status) => req('GET', `/api/opportunities${status ? `?status=${status}` : ''}`),
  getOpportunity: (id) => req('GET', `/api/opportunities/${id}`),
  createOpportunity: (data) => req('POST', '/api/opportunities', data),
  updateOpportunity: (id, data) => req('PUT', `/api/opportunities/${id}`, data),
  deleteOpportunity: (id) => req('DELETE', `/api/opportunities/${id}`),

  // Saved Opportunities
  getSavedOpportunities: () => req('GET', '/api/saved-opportunities'),
  saveOpportunity: (opportunity_id) => req('POST', '/api/saved-opportunities', { opportunity_id }),
  unsaveOpportunity: (opportunity_id) => req('DELETE', `/api/saved-opportunities/${opportunity_id}`),

  // Applications
  getApplications: () => req('GET', '/api/applications'),
  createApplication: (data) => req('POST', '/api/applications', data),
  updateApplication: (id, data) => req('PUT', `/api/applications/${id}`, data),

  // Documents
  getDocuments: (user_email) => req('GET', `/api/documents${user_email ? `?user_email=${user_email}` : ''}`),
  createDocument: (data) => req('POST', '/api/documents', data),
  deleteDocument: (id) => req('DELETE', `/api/documents/${id}`),
  uploadFile: (file) => {
    const form = new FormData();
    form.append('file', file);
    return req('POST', '/api/upload', form, true);
  },

  // Notifications
  getNotifications: () => req('GET', '/api/notifications'),
  updateNotification: (id, data) => req('PUT', `/api/notifications/${id}`, data),
  markAllRead: () => req('POST', '/api/notifications/mark-all-read'),

  // Stats
  getStats: () => req('GET', '/api/stats'),

  // Profile
  getProfile: () => req('GET', '/api/profile'),
  upsertProfile: (data) => req('PUT', '/api/profile', data),
};
