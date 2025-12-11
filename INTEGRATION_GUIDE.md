# Frontend-Backend Integration Guide

## 🎯 Overview

The frontend (React Native app) is now fully integrated with the FastAPI backend. This guide will help you start both services and test the complete application.

---

## 📋 Prerequisites

Before starting, ensure you have:

### Backend Requirements:
- **Python 3.8+** installed
- **pip** (Python package manager)
- Model files:
  - `lgb_model_20251211_093754.pkl`
  - `scaler_20251211_093754.pkl`

### Frontend Requirements:
- **Node.js 16+** and **npm** installed
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (Mac) or **Android Emulator** (or physical device)

---

## 🚀 Quick Start

### 1. Start the Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Backend will run on:** `http://localhost:8000`

**API Documentation:** `http://localhost:8000/docs`

### 2. Start the Frontend (React Native + Expo)

```bash
# Navigate to project root
cd ..

# Install dependencies (first time only)
npm install

# Start Expo development server
npm start
```

This will open Expo Dev Tools in your browser.

### 3. Run on Device/Emulator

Choose one:
- Press `i` for iOS Simulator (Mac only)
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

---

## 🔧 Configuration for Physical Devices

If testing on a physical device, you need to update the API URL:

### Method 1: Using .env file (Recommended)

1. Copy the example env file:
```bash
cp .env.example .env
```

2. Edit `.env` and replace with your machine's IP:
```bash
# Find your IP address:
# Mac: ifconfig | grep "inet " | grep -v 127.0.0.1
# Windows: ipconfig | findstr IPv4
# Linux: hostname -I

EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:8000/api/v1
# Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api/v1
```

3. Restart Expo server

### Method 2: Direct Configuration

Edit `src/config/api.config.js`:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://YOUR_MACHINE_IP:8000/api/v1',
  // Example: 'http://192.168.1.100:8000/api/v1'
  // ...
};
```

---

## 📱 Features & Endpoints

### Authentication
- **Login**: `POST /api/v1/auth/login`
- **Signup**: `POST /api/v1/auth/signup`
- **Get Profile**: `GET /api/v1/auth/me`

### Predictions
- **Upload CSV for Prediction**: `POST /api/v1/model/predict-csv`
- **Get Required Features**: `GET /api/v1/model/required-features`
- **Get Sample Data**: `GET /api/v1/model/sample-data`

### Biomarkers
- **Get Feature Importance**: `GET /api/v1/features/importance?top_n=50`
- **Get Biomarker Details**: `GET /api/v1/features/biomarkers`

---

## 🧪 Testing the Integration

### 1. Test Authentication
1. Open the app
2. Click "Demo Mode" to skip login, or
3. Register a new account
4. Login with your credentials

### 2. Test Prediction
1. Navigate to "Upload Proteomics"
2. Upload a CSV file with 50 protein biomarker columns (seq_*)
3. Wait for analysis to complete
4. View results showing:
   - Number of patients analyzed
   - PD positive/negative counts
   - Individual patient predictions
   - Top biomarkers

### 3. Test Biomarkers Screen
1. Navigate to "Biomarkers" from the home screen
2. View real biomarker data loaded from backend
3. See feature importance rankings

---

## 📂 Project Structure

```
parkinsons-proteomics-ai/
├── backend/                    # FastAPI backend
│   ├── api/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── config.py          # Configuration settings
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.py        # Authentication routes
│   │   │   ├── prediction.py  # Prediction routes
│   │   │   └── feature_importance.py
│   │   ├── services/          # Business logic
│   │   │   └── model_service.py
│   │   └── data/
│   │       └── feature_protein_mapping.csv
│   └── requirements.txt
│
├── src/                       # React Native frontend
│   ├── config/
│   │   └── api.config.js     # API configuration
│   ├── services/             # API clients
│   │   ├── apiClient.js      # Main API client
│   │   ├── authService.js    # Auth service
│   │   ├── modelService.js   # Model/prediction service
│   │   └── featureService.js # Feature importance service
│   ├── screens/              # App screens
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── UploadScreen.js   # CSV upload & prediction
│   │   ├── ResultScreen.js
│   │   └── BiomarkersScreen.js
│   └── components/           # Reusable components
│
├── App.js                    # App entry point
├── package.json
├── .env.example             # Environment config example
└── README.md
```

---

## 🔍 Troubleshooting

### Backend Issues

**Problem:** Model files not found
```
FileNotFoundError: Model not found at: ...
```
**Solution:** Ensure model files (`lgb_model_*.pkl` and `scaler_*.pkl`) are in the project root directory.

---

**Problem:** Port 8000 already in use
```
ERROR:    [Errno 48] Address already in use
```
**Solution:** Change the port in backend startup command:
```bash
python -m uvicorn api.main:app --port 8001 --reload
```
Then update frontend config to use port 8001.

---

### Frontend Issues

**Problem:** Network request failed / Cannot connect to backend
**Solution:**
1. Check backend is running: Visit `http://localhost:8000/health`
2. For physical device: Use your machine's IP instead of localhost
3. Check firewall settings - allow connections on port 8000

---

**Problem:** "Could not analyze the file" error
**Solution:**
- Ensure CSV has exactly 50 columns with protein biomarker data
- Column names should be `seq_*` format (e.g., seq_1, seq_2, ...)
- Check CSV is properly formatted (no missing values in protein columns)

---

## 📊 CSV File Format

Your CSV file should have:
- **Rows**: Each row = one patient
- **Columns**: 50 protein biomarker columns (seq_1, seq_2, ..., seq_50)
- **Values**: Numeric protein expression levels

Example:
```csv
seq_1,seq_2,seq_3,...,seq_50
1.234,0.567,2.345,...,1.890
0.987,1.234,0.456,...,2.123
...
```

---

## 🎨 Key Changes Made

1. **API Configuration**
   - Created centralized config in `src/config/api.config.js`
   - Environment variable support via `.env`

2. **API Client Updates**
   - Removed Django endpoints (using FastAPI only)
   - Updated all endpoints to match FastAPI structure
   - Proper error handling and token management

3. **Upload Screen**
   - Real CSV upload to FastAPI backend
   - Actual prediction results from LightGBM model
   - Loading states and error handling

4. **Biomarkers Screen**
   - Fetches real biomarker data from backend
   - Fallback to default data if backend unavailable
   - Dynamic rendering based on API response

5. **Authentication**
   - JWT token-based auth with FastAPI
   - Proper token storage and management

---

## 🔐 Security Notes

- The `SECRET_KEY` in `backend/api/config.py` should be changed in production
- User passwords are hashed using bcrypt
- JWT tokens expire after 24 hours (configurable)

---

## 🚢 Deployment

### Backend Deployment
See `backend/DEPLOYMENT.md` for deployment instructions using:
- Render
- Heroku
- AWS
- Docker

### Frontend Deployment
- Build standalone app: `expo build:ios` or `expo build:android`
- Or deploy web version: `expo build:web`

---

## 📞 Support

If you encounter issues:
1. Check backend logs in terminal where uvicorn is running
2. Check frontend logs in Expo Dev Tools
3. Verify API is accessible: `curl http://localhost:8000/health`

---

## ✅ Next Steps

- [ ] Test all features end-to-end
- [ ] Add more error handling and validation
- [ ] Implement offline support
- [ ] Add user prediction history
- [ ] Deploy to production

---

**Made by:** Manav Rai
**Updated:** December 12, 2025
