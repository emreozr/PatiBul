import config from '../config';

const API_URL = config.API_URL;

export const ERROR_TYPES = {
  NETWORK: 'NETWORK',       // İnternet yok veya sunucuya ulaşılamıyor
  SERVER: 'SERVER',          // 500+ sunucu hatası
  CLIENT: 'CLIENT',          // 4xx kullanıcı hatası
  TIMEOUT: 'TIMEOUT',        // İstek zaman aşımı
  UNKNOWN: 'UNKNOWN',        // Bilinmeyen hata
};

export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    title: 'Bağlantı Hatası',
    message: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
    icon: '📡',
  },
  [ERROR_TYPES.SERVER]: {
    title: 'Sunucu Hatası',
    message: 'Sunucuda bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
    icon: '🔧',
  },
  [ERROR_TYPES.TIMEOUT]: {
    title: 'Zaman Aşımı',
    message: 'İstek zaman aşımına uğradı. Bağlantınızı kontrol edin.',
    icon: '⏱️',
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: 'Bir Hata Oluştu',
    message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
    icon: '⚠️',
  },
};

export function classifyError(error) {
  if (error instanceof TypeError && error.message === 'Network request failed') {
    return ERROR_TYPES.NETWORK;
  }

  if (error.name === 'AbortError') {
    return ERROR_TYPES.TIMEOUT;
  }

  if (error.status >= 500) {
    return ERROR_TYPES.SERVER;
  }

  if (error.status >= 400) {
    return ERROR_TYPES.CLIENT;
  }

  return ERROR_TYPES.NETWORK;
}

export class ApiError extends Error {
  constructor(type, message, status = null, data = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT = 15000;

export async function apiFetch(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    token = null,
    timeout = DEFAULT_TIMEOUT,
    isFormData = false,
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchHeaders = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  try {
    const response = await fetch(url, {
      method,
      headers: fetchHeaders,
      body: isFormData ? body : body ? JSON.stringify(body) : null,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status >= 500) {
      throw new ApiError(
        ERROR_TYPES.SERVER,
        ERROR_MESSAGES[ERROR_TYPES.SERVER].message,
        response.status,
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new ApiError(
        ERROR_TYPES.CLIENT,
        data?.error || data?.message || 'İşlem başarısız.',
        response.status,
        data,
      );
    }

    return { data, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }
    const errorType = classifyError(error);
    throw new ApiError(
      errorType,
      ERROR_MESSAGES[errorType]?.message || error.message,
    );
  }
}

export const api = {
  get: (endpoint, token) =>
    apiFetch(endpoint, { method: 'GET', token }),

  post: (endpoint, body, token) =>
    apiFetch(endpoint, { method: 'POST', body, token }),

  put: (endpoint, body, token) =>
    apiFetch(endpoint, { method: 'PUT', body, token }),

  delete: (endpoint, token) =>
    apiFetch(endpoint, { method: 'DELETE', token }),

  upload: (endpoint, formData, token) =>
    apiFetch(endpoint, {
      method: 'POST',
      body: formData,
      token,
      isFormData: true,
      timeout: 30000,
    }),
};

export default api;
