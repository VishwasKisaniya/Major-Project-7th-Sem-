/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

// Get API URL from environment or use default
const getApiUrl = () => {
  // Check for Expo environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Default to localhost for development
  return 'http://localhost:8000/api/v1';
};

export const API_CONFIG = {
  // Base URL for FastAPI backend
  BASE_URL: getApiUrl(),
  
  // Timeout for API requests (30 seconds)
  TIMEOUT: 30000,
  
  // Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      SIGNUP: '/auth/signup',
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
    },
    
    // Model/Prediction endpoints
    MODEL: {
      PREDICT_CSV: '/model/predict-csv',
      REQUIRED_FEATURES: '/model/required-features',
      SAMPLE_DATA: '/model/sample-data',
    },
    
    // Feature importance endpoints
    FEATURES: {
      IMPORTANCE: '/features/importance',
      BIOMARKERS: '/features/biomarkers',
      CATEGORIES: '/features/categories',
    },
  },
};

// Helper to construct full URLs
export const getFullUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export for easy access
export default API_CONFIG;
