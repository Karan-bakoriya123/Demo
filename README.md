# 🌱 FarmSense

A full-stack AI-powered Precision Agriculture web application that helps farmers monitor crop health and get smart irrigation recommendations using real-time weather data, soil inputs, and an AI assistant.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite + Tailwind CSS v3 |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |
| Weather | OpenWeatherMap API (with mock fallback) |
| AI | Rule-based assistant (expandable to Gemini/OpenAI) |

---

## 📁 Project Structure

```
project01/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── config/db.js
│   ├── models/            (User, Farm, SoilData, Recommendation)
│   ├── routes/            (auth, farm, soil, weather, assistant, admin, recommendation)
│   ├── controllers/       (all business logic)
│   ├── middleware/        (authMiddleware, adminMiddleware)
│   └── utils/             (recommendationEngine, assistantEngine, seedAdmin)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/    (Navbar, Sidebar, Card, ProtectedRoute)
        └── pages/         (11 pages)
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas URI

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values (see below)
npm install
npm run dev
```

The backend runs on **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **http://localhost:5173**

---

## 🔐 Environment Variables (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart_agri
JWT_SECRET=your_super_secret_key_change_this
WEATHER_API_KEY=your_openweathermap_key_here  # Optional: mock data used if empty
FRONTEND_URL=http://localhost:5173
```

> Get a **free** OpenWeatherMap API key at: https://openweathermap.org/api  
> The app works without it using mock weather data.

---

## 👤 Default Admin Credentials

Auto-seeded when the backend starts for the first time:

| Field | Value |
|---|---|
| Email | admin@smartagri.com |
| Password | admin123 |

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Farmer registration |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/profile` | Farmer | Get profile |
| PUT | `/api/auth/profile` | Farmer | Update profile |
| POST | `/api/farms` | Farmer | Add farm |
| GET | `/api/farms` | Farmer | List my farms |
| GET/PUT/DELETE | `/api/farms/:id` | Farmer | Farm CRUD |
| POST | `/api/soil` | Farmer | Submit soil data |
| GET | `/api/soil/:farmId` | Farmer | Get soil data |
| GET | `/api/weather?location=X` | Farmer | Weather data |
| POST | `/api/assistant/analyze` | Farmer | AI analysis |
| POST | `/api/recommendations/generate` | Farmer | Generate recommendation |
| GET | `/api/recommendations` | Farmer | All recommendations |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/users` | Admin | All farmers |
| GET | `/api/admin/farms` | Admin | All farms |
| GET | `/api/admin/recommendations` | Admin | All recommendations |

---

## 🤖 AI Assistant Logic

Rule-based engine in `backend/utils/assistantEngine.js`:

| Condition | Action |
|---|---|
| Soil Moisture < 30% AND Rain < 40% | Irrigation required |
| Rain Chance > 60% | No irrigation (rain expected) |
| Soil Moisture 30–60% | Monitor moisture |
| Soil Moisture > 70% | Avoid irrigation |
| Soil pH < 6 | Warn: Acidic soil |
| Soil pH > 8 | Warn: Alkaline soil |
| Temperature > 35°C | Irrigate in evening/morning |
| Humidity < 30% | Warn: Faster water loss |

---

## 🗺️ Pages

| Page | Route | Access |
|---|---|---|
| Landing | `/` | Public |
| Login | `/login` | Public |
| Register | `/register` | Public |
| Dashboard | `/dashboard` | Farmer |
| Add Farm | `/add-farm` | Farmer |
| Soil Input | `/soil-input` | Farmer |
| Weather | `/weather` | Farmer |
| AI Assistant | `/assistant` | Farmer |
| Recommendation History | `/history` | Farmer |
| Profile | `/profile` | Farmer |
| Admin Dashboard | `/admin` | Admin only |

---

## 🔮 Future Enhancements

- IoT soil sensor integration (real-time data)
- Gemini / OpenAI API powered assistant
- Satellite crop imaging
- Automated irrigation control
- SMS alerts for farmers
- Multi-language support (Hindi, Telugu, etc.)

---

## 📸 Demo Scenario

1. Register as a farmer → Login
2. Add farm with crop type, soil type, and location
3. Enter soil data (moisture, pH, NPK)
4. System fetches weather data for the location
5. AI generates irrigation recommendation + assistant message
6. View everything on the Dashboard
7. Check Recommendation History for past records

---

Built with ❤️ for Indian farmers.

hello how are you i thing your are greate