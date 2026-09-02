

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Erreur API');
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  users: (params = '') => request(`/auth/users${params}`),
  createUser: (payload) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id, payload) =>
    request(`/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  tickets: (query = '') => request(`/tickets${query}`),
  ticket: (id) => request(`/tickets/${id}`),
  stats: () => request('/tickets/stats'),
  createTicket: (payload) =>
    request('/tickets', { method: 'POST', body: JSON.stringify(payload) }),
  updateTicket: (id, payload) =>
    request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  comment: (id, contenu) =>
    request(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ contenu }) }),
  deleteTicket: (id) => request(`/tickets/${id}`, { method: 'DELETE' }),
  importTickets: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/tickets/import', { method: 'POST', body: form });
  },
};
