# 🚀 Quick Reference - Frontend-Backend Integration

## Start Services

### Option 1: Use Startup Script (Recommended)
```bash
./start.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
npm start
```

---

## API Endpoints Summary

| Feature | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| **Auth** |
| Signup | POST | `/api/v1/auth/signup` | Register new user |
| Login | POST | `/api/v1/auth/login` | Authenticate user |
| Get Profile | GET | `/api/v1/auth/me` | Get current user |
| **Prediction** |
| Upload CSV | POST | `/api/v1/model/predict-csv` | Predict from CSV file |
| Required Features | GET | `/api/v1/model/required-features` | Get 50 feature names |
| Sample Data | GET | `/api/v1/model/sample-data` | Get sample format |
| **Biomarkers** |
| Feature Importance | GET | `/api/v1/features/importance` | Get top biomarkers |
| Biomarker Details | GET | `/api/v1/features/biomarkers` | Get biomarker info |

---

## Configuration

### For Physical Device Testing

**Find your IP:**
```bash
# Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4

# Linux
hostname -I
```

**Update .env:**
```bash
cp .env.example .env
# Edit .env with your IP
EXPO_PUBLIC_API_URL=http://YOUR_IP:8000/api/v1
```

---

## CSV Format Required

```csv
seq_1,seq_2,seq_3,...,seq_50
1.234,0.567,2.345,...,1.890
0.987,1.234,0.456,...,2.123
```

- **50 columns**: seq_1 through seq_50
- **Numeric values**: Protein expression levels
- **Each row**: One patient

---

## Testing Checklist

- [ ] Backend health check: http://localhost:8000/health
- [ ] API docs accessible: http://localhost:8000/docs
- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can upload CSV file
- [ ] Prediction results display correctly
- [ ] Biomarkers screen shows data from backend

---

## Common Issues & Fixes

**Backend not starting:**
- Check Python version: `python3 --version` (need 3.8+)
- Install requirements: `pip install -r backend/requirements.txt`
- Check model files exist in project root

**Frontend can't connect:**
- Verify backend is running: `curl http://localhost:8000/health`
- For physical device, use machine IP not localhost
- Check .env file configuration

**CSV upload fails:**
- Verify CSV has exactly 50 columns
- Column names must be seq_1, seq_2, ..., seq_50
- All values must be numeric

---

## File Structure

```
parkinsons-proteomics-ai/
├── backend/
│   ├── api/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Settings
│   │   ├── routes/              # API endpoints
│   │   └── services/            # Business logic
│   └── requirements.txt
├── src/
│   ├── config/
│   │   └── api.config.js        # ⭐ API configuration
│   ├── services/
│   │   ├── apiClient.js         # ⭐ Main API client
│   │   ├── authService.js
│   │   ├── modelService.js
│   │   └── featureService.js
│   └── screens/
│       ├── LoginScreen.js
│       ├── UploadScreen.js      # ⭐ CSV upload
│       └── BiomarkersScreen.js  # ⭐ Biomarkers
├── .env.example                 # ⭐ Environment config
├── .env                         # Your local config
├── start.sh                     # ⭐ Startup script
└── INTEGRATION_GUIDE.md         # Full guide

⭐ = Modified/Created for integration
```

---

## URLs

- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Frontend**: Expo Dev Tools (opens automatically)

---

## Important Notes

1. **Backend must be running** before starting frontend
2. **Use localhost** for emulator/simulator
3. **Use machine IP** for physical device
4. **Model files** must be in project root
5. **Port 8000** must be available for backend

---

## Quick Commands

```bash
# Check backend health
curl http://localhost:8000/health

# Test login endpoint
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get biomarkers
curl http://localhost:8000/api/v1/features/biomarkers

# Stop all services
# Press Ctrl+C in both terminal windows
```

---

**Last Updated:** December 12, 2025
