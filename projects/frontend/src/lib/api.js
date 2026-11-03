import { useAuth } from '../store/auth'

const BASE = import.meta.env.VITE_API_URL || ''

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

function clean(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value)
    }
  })
  return search.toString()
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const token = useAuth.getState().token
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch (error) {
    throw new ApiError('Proforma could not reach the depot. Check your connection and retry.', 503)
  }

  if (response.status === 204) return null

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch (error) {
      data = null
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      useAuth.getState().logout()
    }
    if (response.status >= 500) {
      throw new ApiError('The Proforma depot is briefly unavailable. Please retry in a moment.', 503)
    }
    throw new ApiError(
      data?.message || `Request failed (${response.status})`,
      response.status,
      data?.fields || {}
    )
  }
  return data
}

async function upload(path, file) {
  const token = useAuth.getState().token
  const form = new FormData()
  form.append('file', file)
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form
    })
  } catch (error) {
    throw new ApiError('Upload failed. Check your connection and retry.', 503)
  }
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch (error) {
    data = null
  }
  if (!response.ok) {
    throw new ApiError(data?.message || 'Upload failed', response.status, data?.fields || {})
  }
  return data
}

export const api = {
  products: (params = {}) => request(`/api/products?${clean(params)}`),
  product: (id) => request(`/api/products/${id}`),
  featured: (limit = 8) => request(`/api/products/featured?limit=${limit}`),
  reviews: (id) => request(`/api/products/${id}/reviews`),
  addReview: (id, body) => request(`/api/products/${id}/reviews`, { method: 'POST', body }),
  categories: () => request('/api/meta/categories'),
  offers: () => request('/api/meta/offers'),
  stats: () => request('/api/meta/stats'),
  recommendationsForProduct: (id) => request(`/api/recommendations/product/${id}`),
  recommendationsForMe: () => request('/api/recommendations/me'),
  recordEvent: (productId, type) =>
    request('/api/events', { method: 'POST', body: { productId, type }, auth: false }),

  login: (body) => request('/api/auth/login', { method: 'POST', body, auth: false }),
  register: (body) => request('/api/auth/register', { method: 'POST', body, auth: false }),
  me: () => request('/api/auth/me'),

  createOrder: (body) => request('/api/orders', { method: 'POST', body }),
  myOrders: () => request('/api/orders/mine'),

  sellerOverview: () => request('/api/seller/overview'),
  sellerAnalytics: () => request('/api/seller/analytics'),
  sellerProducts: () => request('/api/seller/products'),
  sellerProduct: (id) => request(`/api/seller/products/${id}`),
  createProduct: (body) => request('/api/seller/products', { method: 'POST', body }),
  updateProduct: (id, body) =>
    request(`/api/seller/products/${id}`, { method: 'PUT', body }),
  sellerOrders: () => request('/api/seller/orders'),
  updateOrderStatus: (id, status) =>
    request(`/api/seller/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  uploadImage: (file) => upload('/api/seller/uploads', file)
}