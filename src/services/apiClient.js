/**
 * API Client for Parkinson's Proteomics AI
 * Connects to Django backend for auth and FastAPI backend for ML predictions
 */
import { API_CONFIG, getFullUrl } from '../config/api.config';

// Django backend for authentication (port 8001)
const DJANGO_URL = 'http://localhost:8001';

// FastAPI backend for ML predictions (port 8000)
const FASTAPI_URL = API_CONFIG.BASE_URL;

// Token storage
let authToken = null;

/**
 * Set the authentication token
 */
export function setAuthToken(token) {
  authToken = token;
}

/**
 * Get the current auth token
 */
export function getAuthToken() {
  return authToken;
}

/**
 * Clear the auth token (logout)
 */
export function clearAuthToken() {
  authToken = null;
}

/**
 * Make API request with error handling
 */
async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Upload file (multipart/form-data)
 * Handles both web and React Native file uploads
 */
async function uploadFile(url, file, fieldName = 'file') {
  const formData = new FormData();
  
  // Check if running on web (file.uri starts with blob: or data:)
  const isWeb = typeof window !== 'undefined' && 
    (file.uri?.startsWith('blob:') || file.uri?.startsWith('data:') || !file.uri?.startsWith('file:'));
  
  if (isWeb && file.uri) {
    // Web: Fetch the blob and append it properly
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      formData.append(fieldName, blob, file.name || 'upload.csv');
    } catch (e) {
      // Fallback: try direct append
      formData.append(fieldName, {
        uri: file.uri,
        type: file.mimeType || 'text/csv',
        name: file.name || 'upload.csv',
      });
    }
  } else {
    // React Native: Use the standard format
    formData.append(fieldName, {
      uri: file.uri,
      type: file.mimeType || 'text/csv',
      name: file.name || 'upload.csv',
    });
  }

  // Don't set Content-Type - let browser/RN set it with boundary
  const headers = {};
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
}

// =============================================================================
// AUTHENTICATION APIs (Django)
// =============================================================================

/**
 * Register a new user
 */
export async function signup({ name, email, password }) {
  const data = await request(`${DJANGO_URL}/api/v1/django/auth/signup/`, {
    method: 'POST',
    body: { 
      name, 
      email, 
      password,
      password_confirm: password  // Django expects password confirmation
    },
  });
  
  // Django returns tokens.access, not just access
  if (data.tokens && data.tokens.access) {
    setAuthToken(data.tokens.access);
  }
  
  return data;
}

/**
 * Login user
 */
export async function login({ email, password }) {
  const data = await request(`${DJANGO_URL}/api/v1/django/auth/login/`, {
    method: 'POST',
    body: { email, password },
  });
  
  // Django returns tokens.access, not just access
  if (data.tokens && data.tokens.access) {
    setAuthToken(data.tokens.access);
  }
  
  return data;
}

/**
 * Logout user
 */
export async function logout() {
  try {
    await request(`${DJANGO_URL}/api/v1/django/auth/logout/`, {
      method: 'POST',
    });
  } catch (error) {
    // Logout might fail if token is invalid, that's ok
    console.log('Logout error:', error);
  }
  clearAuthToken();
  return { message: 'Logged out successfully' };
}

/**
 * Get current user profile
 */
export async function getProfile() {
  return request(`${DJANGO_URL}/api/v1/django/auth/profile/`);
}

// =============================================================================
// PREDICTION APIs (FastAPI)
// =============================================================================

/**
 * Upload CSV file for prediction
 */
export async function predictFromCSV(file) {
  return uploadFile(`${FASTAPI_URL}/model/predict-csv`, file);
}

/**
 * Get required features for prediction
 */
export async function getRequiredFeatures() {
  return request(`${FASTAPI_URL}/model/required-features`);
}

/**
 * Get sample data format
 */
export async function getSampleData() {
  return request(`${FASTAPI_URL}/model/sample-data`);
}

// =============================================================================
// FEATURE IMPORTANCE APIs (FastAPI)
// =============================================================================

/**
 * Get feature importance
 */
export async function getFeatureImportance(topN = 50) {
  return request(`${FASTAPI_URL}/features/importance?top_n=${topN}`);
}

/**
 * Get biomarker details
 */
export async function getBiomarkers() {
  return request(`${FASTAPI_URL}/features/biomarkers`);
}

/**
 * Get protein categories
 */
export async function getCategories() {
  return request(`${FASTAPI_URL}/features/categories`);
}

// =============================================================================
// DEFAULT EXPORT (for compatibility with existing code)
// =============================================================================

const api = {
  request: (path, options) => {
    // By default use Django for auth endpoints, FastAPI for others
    const baseUrl = path.includes('/auth/') ? DJANGO_URL : FASTAPI_URL;
    return request(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      body: options.body,
      headers: options.headers,
    });
  },
};

export default api;
