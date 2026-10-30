const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

export function storedCredentials() {
  return sessionStorage.getItem('fms_credentials');
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const credentials = storedCredentials();
  if (credentials) headers.set('Authorization', `Basic ${credentials}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'omit'
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message || data?.error;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return data;
}

export function jsonBody(value) {
  return JSON.stringify(value);
}

export function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}
