# Deployment Guide

## Backend Deployment (Render)

### Prerequisites
- GitHub account
- Render account (sign up at https://render.com)
- Code pushed to GitHub

### Deploy Backend to Render

#### Option 1: Using Blueprint (render.yaml) - RECOMMENDED
1. Go to https://render.com/
2. Click "New" → "Blueprint"
3. Connect your GitHub repository: `VishwasKisaniya/Major-Project-7th-Sem-`
4. Render will automatically detect `backend/render.yaml`
5. This will create TWO services:
   - **parkinsons-fastapi** (ML predictions) - will be on a URL like `https://parkinsons-fastapi.onrender.com`
   - **parkinsons-django** (Authentication) - will be on a URL like `https://parkinsons-django.onrender.com`
6. Click "Apply" to deploy both services

#### Option 2: Manual Deployment (Deploy separately)

**Deploy FastAPI:**
1. Go to Render Dashboard → "New" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name**: parkinsons-fastapi
   - **Root Directory**: backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `PYTHON_VERSION` = 3.11
     - `CORS_ORIGINS` = *
4. Click "Create Web Service"

**Deploy Django:**
1. Go to Render Dashboard → "New" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name**: parkinsons-django
   - **Root Directory**: backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `python manage.py migrate && gunicorn django_app.wsgi:application --bind 0.0.0.0:$PORT`
   - **Environment Variables**:
     - `PYTHON_VERSION` = 3.11
     - `DJANGO_SECRET_KEY` = (Generate)
     - `DEBUG` = False
     - `ALLOWED_HOSTS` = *
4. Click "Create Web Service"

### After Deployment
You'll get two URLs:
- FastAPI: `https://parkinsons-fastapi.onrender.com`
- Django: `https://parkinsons-django.onrender.com`

**Update frontend API URLs** (see Frontend Deployment section below)

---

## Frontend Deployment

Your React Native/Expo app supports both **mobile** and **web**. Here's how to deploy both:

### Web Deployment (Netlify/Vercel)

#### Using Netlify (Recommended for Expo Web)

1. **Build for web:**
   ```bash
   cd /Users/vishwaskisaniya/Documents/My\ College\ /Sem\ 7/MProject/parkinsons-proteomics-ai
   npx expo export:web
   ```

2. **Deploy to Netlify:**
   - Install Netlify CLI: `npm install -g netlify-cli`
   - Login: `netlify login`
   - Deploy:
     ```bash
     netlify deploy --prod --dir=web-build
     ```
   - Or push to GitHub and connect via Netlify Dashboard

3. **Configure Environment Variables on Netlify:**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add:
     - `EXPO_PUBLIC_FASTAPI_URL` = `https://parkinsons-fastapi.onrender.com/api/v1`
     - `EXPO_PUBLIC_DJANGO_URL` = `https://parkinsons-django.onrender.com`

#### Using Vercel

1. **Build for web:**
   ```bash
   npx expo export:web
   ```

2. **Deploy:**
   - Install Vercel CLI: `npm install -g vercel`
   - Run: `vercel --prod`
   - Or connect via Vercel Dashboard

### Mobile Deployment (iOS & Android)

#### Using Expo EAS (Expo Application Services) - RECOMMENDED

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   eas build:configure
   ```

4. **Build for Android:**
   ```bash
   eas build --platform android
   ```

5. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```

6. **Submit to App Stores:**
   ```bash
   # For Google Play Store
   eas submit --platform android
   
   # For Apple App Store
   eas submit --platform ios
   ```

#### Alternative: Expo Go (Development/Testing)

1. Publish your app:
   ```bash
   npx expo publish
   ```

2. Users can scan QR code with Expo Go app to test

---

## Update Frontend API Configuration

Before deploying frontend, update the API URLs:

1. Create `.env` file in root:
   ```env
   EXPO_PUBLIC_FASTAPI_URL=https://parkinsons-fastapi.onrender.com/api/v1
   EXPO_PUBLIC_DJANGO_URL=https://parkinsons-django.onrender.com
   ```

2. Update `src/config/api.config.js`:
   ```javascript
   const getApiUrl = () => {
     if (process.env.EXPO_PUBLIC_FASTAPI_URL) {
       return process.env.EXPO_PUBLIC_FASTAPI_URL;
     }
     return 'https://parkinsons-fastapi.onrender.com/api/v1';
   };
   
   const getDjangoUrl = () => {
     if (process.env.EXPO_PUBLIC_DJANGO_URL) {
       return process.env.EXPO_PUBLIC_DJANGO_URL;
     }
     return 'https://parkinsons-django.onrender.com';
   };
   ```

3. Update `src/services/apiClient.js`:
   ```javascript
   // Django backend for authentication (deployed on Render)
   const DJANGO_URL = getDjangoUrl();
   
   // FastAPI backend for ML predictions (deployed on Render)
   const FASTAPI_URL = API_CONFIG.BASE_URL;
   ```

---

## Deployment Summary

| Component | Platform | URL |
|-----------|----------|-----|
| FastAPI (ML) | Render | `https://parkinsons-fastapi.onrender.com` |
| Django (Auth) | Render | `https://parkinsons-django.onrender.com` |
| Web App | Netlify/Vercel | `https://your-app.netlify.app` |
| iOS App | App Store | Via Expo EAS |
| Android App | Play Store | Via Expo EAS |

---

## Important Notes

1. **Free Tier Limitations (Render):**
   - Services spin down after 15 mins of inactivity
   - First request after spin-down takes 30-50 seconds
   - Upgrade to paid plan for always-on services

2. **Model Files:**
   - Upload `lgb_model_20251211_093754.pkl` and `scaler_20251211_093754.pkl` to backend directory
   - These files need to be in the root of the backend folder for FastAPI to load them

3. **Database:**
   - Current setup uses SQLite (file-based)
   - For production, consider PostgreSQL (Render offers free PostgreSQL)

4. **CORS:**
   - Update CORS settings to allow your frontend URL
   - In Django `settings.py` and FastAPI `main.py`

---

## Testing Deployment

1. **Test FastAPI:**
   ```bash
   curl https://parkinsons-fastapi.onrender.com/health
   ```

2. **Test Django:**
   ```bash
   curl https://parkinsons-django.onrender.com/api/v1/django/auth/
   ```

3. **Test Frontend:**
   - Open web URL in browser
   - Try login/signup
   - Upload CSV for prediction

---

## Troubleshooting

### Backend not starting
- Check Render logs for errors
- Verify all environment variables are set
- Check that model files are in correct location

### Frontend can't connect to backend
- Check API URLs in frontend config
- Verify CORS settings in backend
- Check browser console for errors

### Build failures
- Check Python version (should be 3.11)
- Verify all dependencies in requirements.txt
- Check disk space on Render (free tier has limits)
