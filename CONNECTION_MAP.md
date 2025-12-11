# 🔗 Frontend-Backend Connection Map

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                     REACT NATIVE FRONTEND                            │
│                     (Expo Mobile App)                                │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📱 SCREENS                           🔧 SERVICES                   │
│  ├── LoginScreen.js ─────────────────→ authService.js              │
│  ├── RegisterScreen.js ───────────────→     │                       │
│  ├── UploadScreen.js ─────────────────→ modelService.js            │
│  ├── ResultScreen.js                        │                       │
│  └── BiomarkersScreen.js ─────────────→ featureService.js          │
│                                             │                        │
│                                             ↓                        │
│                                       apiClient.js ←──── api.config.js
│                                             │                        │
└─────────────────────────────────────────────┼────────────────────────┘
                                              │
                                              │ HTTP Requests
                                              │ (with JWT tokens)
                                              │
                                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                     FASTAPI BACKEND                                  │
│                     (Python + Uvicorn)                              │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🚪 ENTRY POINT                       📡 ROUTES                     │
│  main.py                              ├── auth.py                   │
│     ↓                                 ├── prediction.py             │
│  config.py (settings)                 └── feature_importance.py     │
│     ↓                                        ↓                       │
│  CORS enabled                          🧠 SERVICES                  │
│  JWT configured                        model_service.py             │
│                                             ↓                        │
│                                        📊 ML MODEL                   │
│                                        ├── lgb_model.pkl             │
│                                        ├── scaler.pkl                │
│                                        └── feature_mapping.csv       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints Connection

### 1️⃣ Authentication Flow

```
LoginScreen.js
    ↓ calls login()
authService.js
    ↓ calls apiClient.login()
apiClient.js
    ↓ POST request
http://localhost:8000/api/v1/auth/login
    ↓ handled by
backend/api/routes/auth.py → login()
    ↓ returns
{ access_token: "...", user: {...} }
    ↓ saved by
apiClient.setAuthToken(token)
```

### 2️⃣ CSV Upload & Prediction Flow

```
UploadScreen.js
    ↓ user picks CSV file
    ↓ calls predictCSV()
modelService.js
    ↓ calls apiClient.predictFromCSV()
apiClient.js
    ↓ POST multipart/form-data
http://localhost:8000/api/v1/model/predict-csv
    ↓ handled by
backend/api/routes/prediction.py → predict_from_csv()
    ↓ uses
backend/api/services/model_service.py
    ├── Load LightGBM model
    ├── Load StandardScaler
    ├── Process CSV data
    ├── Scale features
    └── Make predictions
    ↓ returns
{
  success: true,
  summary: { total_patients, pd_positive, pd_negative },
  patients: [...],
  top_biomarkers: [...]
}
    ↓ displayed in
ResultScreen.js
```

### 3️⃣ Biomarkers Fetch Flow

```
BiomarkersScreen.js
    ↓ useEffect() on mount
    ↓ calls fetchBiomarkers()
featureService.js
    ↓ calls apiClient.getBiomarkers()
apiClient.js
    ↓ GET request
http://localhost:8000/api/v1/features/biomarkers
    ↓ handled by
backend/api/routes/feature_importance.py → get_biomarkers()
    ↓ uses
backend/api/services/model_service.py
    └── Get feature importance from model
    ↓ returns
{
  count: 20,
  biomarkers: [
    { id, name, symbol, importance, category, ... }
  ]
}
    ↓ rendered in
BiomarkersScreen.js (with charts & cards)
```

---

## 🔑 Configuration Chain

```
.env file (optional)
    ↓
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
    ↓
src/config/api.config.js
    ↓
exports API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL,
  ENDPOINTS: { AUTH: {...}, MODEL: {...}, FEATURES: {...} }
}
    ↓
src/services/apiClient.js
    ↓
Uses API_CONFIG.BASE_URL for all requests
```

---

## 📦 Data Models

### User Model (Frontend ↔️ Backend)

```javascript
// Frontend sends
{ name: "John", email: "john@example.com", password: "pass123" }

// Backend returns
{
  access_token: "eyJhbGc...",
  token_type: "bearer",
  user: {
    id: 1,
    name: "John",
    email: "john@example.com",
    created_at: "2025-12-12T..."
  }
}
```

### Prediction Model (Frontend ↔️ Backend)

```javascript
// Frontend sends (multipart/form-data)
FormData {
  file: { uri: "file://...", name: "data.csv", type: "text/csv" }
}

// Backend returns
{
  success: true,
  message: "Analyzed 5 patients",
  summary: {
    total_patients: 5,
    pd_positive: 2,
    pd_negative: 3,
    positive_rate: 40.0,
    average_probability: 45.23
  },
  patients: [
    {
      patient_id: 1,
      prediction: 1,        // 0=Healthy, 1=PD
      probability: 78.5,    // Confidence %
      risk_level: "High",   // Low/Moderate/High/Very High
      interpretation: "Parkinson's Disease",
      top_contributors: [...]  // Top 5 features
    }
  ],
  top_biomarkers: [...]
}
```

### Biomarker Model (Frontend ↔️ Backend)

```javascript
// Frontend requests
GET /api/v1/features/biomarkers

// Backend returns
{
  count: 20,
  biomarkers: [
    {
      id: 1,
      name: "Alpha-synuclein",
      symbol: "SNCA",
      importance: 0.0234,
      category: "Protein Aggregation",
      description: "...",
      direction: "elevated",
      confidence: 0.89
    }
  ],
  model_accuracy: 0.89
}
```

---

## 🎯 Request Headers

### Without Authentication
```http
Content-Type: application/json
Accept: application/json
```

### With Authentication
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### File Upload
```http
Content-Type: multipart/form-data
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔄 State Management

```javascript
// Token Management (in memory)
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
  // Future: Also save to AsyncStorage for persistence
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}

// Used in all API requests
const headers = {
  'Content-Type': 'application/json',
  ...(authToken && { 'Authorization': `Bearer ${authToken}` })
};
```

---

## 🚦 Error Handling Flow

```
Frontend makes request
    ↓
apiClient.js wraps in try/catch
    ↓
if (response.ok) → return data
    ↓
if (!response.ok) → throw Error(data.detail || data.error)
    ↓
Screen catches error
    ↓
Alert.alert() shows error to user
```

---

## 📱 Complete User Journey

```
1. User opens app
   ↓
2. SplashScreen → LoginScreen
   ↓
3. User clicks "Demo Mode" or logs in
   ↓
4. Navigate to HomeScreen
   ↓
5. User navigates to UploadScreen
   ↓
6. User picks CSV file
   ↓
7. Frontend uploads to POST /model/predict-csv
   ↓
8. Backend processes with ML model
   ↓
9. Backend returns predictions
   ↓
10. Frontend shows loading → ResultScreen
    ↓
11. User sees prediction results
    ↓
12. User can view detailed biomarkers
    ↓
13. User navigates to BiomarkersScreen
    ↓
14. Frontend fetches from GET /features/biomarkers
    ↓
15. Backend returns feature importance
    ↓
16. Frontend renders interactive charts
```

---

## 🎨 Visual Summary

```
┌─────────────┐
│   USER      │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────┐
│  React Native Frontend      │
│  ├── Screens (UI)           │
│  ├── Services (API calls)   │
│  └── Config (Settings)      │
└──────────┬──────────────────┘
           │
           │ HTTP/HTTPS
           │ JSON + JWT
           │
           ↓
┌─────────────────────────────┐
│  FastAPI Backend            │
│  ├── Routes (Endpoints)     │
│  ├── Services (Logic)       │
│  └── Models (ML)            │
└──────────┬──────────────────┘
           │
           ↓
┌─────────────────────────────┐
│  LightGBM + StandardScaler  │
│  50 Protein Biomarkers      │
│  Parkinson's Prediction     │
└─────────────────────────────┘
```

---

## ✅ Integration Points Checklist

- [x] API configuration centralized
- [x] Environment variables supported
- [x] CORS configured on backend
- [x] JWT authentication working
- [x] File upload working (multipart/form-data)
- [x] JSON responses properly parsed
- [x] Error handling on both sides
- [x] Loading states in UI
- [x] Success feedback to user
- [x] Token management implemented

---

**This connection map shows exactly how data flows from the mobile app to the backend and back!**
