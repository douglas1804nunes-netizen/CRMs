export function getApiBaseUrl() {
  const stored = localStorage.getItem('metaAdsCrmApiBaseUrl');
  if (stored) return stored.replace(/\/$/, '');

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }

  return 'https://SEU-BACKEND.com/api';
}

export function saveApiBaseUrl(url) {
  localStorage.setItem('metaAdsCrmApiBaseUrl', url.replace(/\/$/, ''));
}

export function formatMoney(value, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency
  }).format(Number(value || 0));
}

export function badgeClass(status = '') {
  const normalized = status.toLowerCase();
  if (normalized.includes('active') || normalized.includes('convertido')) return 'success';
  if (normalized.includes('paused') || normalized.includes('perdido')) return 'warning';
  return 'info';
}
