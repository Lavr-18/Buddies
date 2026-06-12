const BASE = '/api'

function getInitData() {
  const tg = window.Telegram?.WebApp
  return tg?.initData || ''
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `tma ${getInitData()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  register: (data) => request('POST', '/auth/register', data),
  getMe: () => request('GET', '/auth/me'),

  getFeed: (goal, limit = 20, offset = 0) =>
    request('GET', `/requests?limit=${limit}&offset=${offset}${goal ? `&goal=${goal}` : ''}`),
  createRequest: (data) => request('POST', '/requests', data),
  getMyRequests: (status) =>
    request('GET', `/requests/my${status ? `?status=${status}` : ''}`),
  deleteRequest: (id) => request('DELETE', `/requests/${id}`),

  getResponses: (requestId) => request('GET', `/requests/${requestId}/responses`),
  respond: (requestId) => request('POST', `/requests/${requestId}/respond`),
  acceptResponse: (responseId) => request('POST', `/responses/${responseId}/accept`),
  rejectResponse: (responseId) => request('POST', `/responses/${responseId}/reject`),
  getMyResponses: () => request('GET', '/responses/my'),

  getMyMatches: () => request('GET', '/matches/my'),
}
