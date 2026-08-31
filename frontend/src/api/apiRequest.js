import { interceptedRequest } from "../utils/requestInterceptor";
import { NPJ_CONFIG } from "../config/npjConfig";

const API_BASE_URL = NPJ_CONFIG.API.BASE_URL;

const requestCache = new Map();
const CACHE_DURATION = NPJ_CONFIG.CACHE.DEFAULT_TTL;

export async function apiRequest(url, options = {}) {
  const {
    token,
    method = "GET",
    body,
    headers = {},
    ...fetchOptions
  } = options;

  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const requestOptions = {
    method,
    headers: requestHeaders,
    body: body && method !== "GET" ? JSON.stringify(body) : undefined,
    ...fetchOptions,
  };

  try {
    const data = await interceptedRequest(url, requestOptions);
    return data;
  } catch (error) {
    throw error;
  }
}

export async function uploadFile(url, file, options = {}) {
  const { token, onProgress, ...fetchOptions } = options;

  const formData = new FormData();
  formData.append("file", file);

  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestOptions = {
    method: "POST",
    headers,
    body: formData,
    ...fetchOptions,
  };

  try {
    const data = await interceptedRequest(url, requestOptions);
    return data;
  } catch (error) {
    throw error;
  }
}

export function clearApiCache() {
  requestCache.clear();
}

export async function batchRequest(requests) {
  const promises = requests.map(({ url, options }) =>
    apiRequest(url, options).catch((error) => ({ error, url })),
  );

  return await Promise.all(promises);
}

export const api = {
  get: (url, token) => apiRequest(url, { method: "GET", token }),
  post: (url, body, token) => apiRequest(url, { method: "POST", body, token }),
  put: (url, body, token) => apiRequest(url, { method: "PUT", body, token }),
  delete: (url, token) => apiRequest(url, { method: "DELETE", token }),
  patch: (url, body, token) =>
    apiRequest(url, { method: "PATCH", body, token }),
};

export default apiRequest;
