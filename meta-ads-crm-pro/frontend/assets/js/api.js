import { getApiBaseUrl } from './config.js';

async function request(path, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    let message = 'Falha na requisição';
    if (contentType.includes('application/json')) {
      const payload = await response.json();
      message = payload.message || message;
    }
    throw new Error(message);
  }

  if (contentType.includes('application/pdf')) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  getConfigStatus: () => request('/meta/config-status'),
  testConnection: () => request('/meta/test-connection', { method: 'POST' }),
  syncCampaigns: () => request('/meta/sync/campaigns', { method: 'POST' }),
  syncLeads: () => request('/meta/sync/leads', { method: 'POST' }),
  getDashboard: () => request('/meta/dashboard'),
  getCampaigns: () => request('/meta/campaigns'),
  getLeads: () => request('/meta/leads'),
  getSyncLogs: () => request('/meta/sync-logs'),
  getClientPdf: (clientName) => request(`/reports/client-pdf?clientName=${encodeURIComponent(clientName || 'Cliente Exemplo')}`),
  trackPixelEvent: (eventName, data) => request('/meta/track-event', { method: 'POST', body: JSON.stringify({ eventName, data }) }),
  getPixelLogs: () => request('/meta/pixel-logs')
};
