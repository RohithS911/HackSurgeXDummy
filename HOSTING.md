# Self-Hosting Guide — Farmer Soil Analyzer

## Project Structure

```
HackSurgeX/
├── src/                  # React frontend
├── server/               # Express backend
├── public/               # Static assets
├── .env                  # Environment variables (root)
├── package.json          # Frontend deps
├── server/package.json   # Backend deps
└── vite.config.js
```

---

## Prerequisites

- Node.js v18+
- npm v9+
- Python 3.9+ (for the ML soil classification model)
- ngrok (optional, for exposing ML model externally)

---

## Step 1 — Clone & Install Dependencies

```bash
# Install frontend dependencies (from project root)
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

---

## Step 2 — Configure Environment Variables

Copy and fill in your `.env` at the project root:

```bash
cp .env.example .env
```

Edit `.env` with your actual keys:

```env
PORT=3001

SARVAM_API_KEY=your_sarvam_key
VITE_SARVAM_API_KEY=your_sarvam_key

VITE_PORCUPINE_ACCESS_KEY=your_porcupine_key   # optional

SOIL_CLASSIFY_API_URL=http://localhost:8000/predict

OPENCAGE_API_KEY=your_opencage_key
WEATHER_API_KEY=your_weatherapi_key
GOV_INDIA_API_KEY=your_data_gov_in_key

PLANET_API_KEY=your_planet_key                 # optional
PINECONE_API_KEY=your_pinecone_key             # optional
```

> **Note:** `VITE_` prefix is required for any key used in the frontend (React). Keys used only in the backend do not need it.

---

## Step 3 — Start the ML Model

Your soil classification model must be running locally on port `8000` before starting the backend.

```bash
# Example (FastAPI)
cd your-ml-model-folder
uvicorn main:app --host 0.0.0.0 --port 8000
```

Verify it's working:
```
http://localhost:8000/docs
```

---

## Step 4 — Start the Backend Server

```bash
cd server
node index.js
```

Server runs at: `http://localhost:3001`

To keep it running in background:
```bash
# Using npx (no install needed)
npx pm2 start index.js --name soil-server
```

---

## Step 5 — Start the Frontend (Dev Mode)

Open a new terminal at the project root:

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Step 6 — Production Build (Optional)

To build and serve the frontend as static files:

```bash
# Build
npm run build

# Preview the build locally
npm run preview
```

The built files will be in the `dist/` folder. You can serve them with any static host (Netlify, Vercel, Nginx, etc.).

---

## Running Both Together (Quick Start)

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server && node index.js
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## API Keys — Where to Get Them

| Key | Service | URL |
|-----|---------|-----|
| `SARVAM_API_KEY` | Voice STT/TTS | https://sarvam.ai |
| `OPENCAGE_API_KEY` | GPS Geocoding | https://opencagedata.com |
| `WEATHER_API_KEY` | Weather data | https://weatherapi.com |
| `GOV_INDIA_API_KEY` | AGMARKNET crop prices | https://data.gov.in/user/register |
| `VITE_PORCUPINE_ACCESS_KEY` | Wake word (optional) | https://console.picovoice.ai |

---

## Ports Summary

| Service | Port |
|---------|------|
| Frontend (Vite) | 5173 |
| Backend (Express) | 3001 |
| ML Model (FastAPI) | 8000 |
