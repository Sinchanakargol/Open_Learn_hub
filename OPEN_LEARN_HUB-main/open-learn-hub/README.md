# Open Learn Hub

A full-stack AI-powered MOOC platform delivering personalized, interactive, and gamified learning with real-time collaboration.

## Stack
- Frontend: React (Vite), TailwindCSS, Framer Motion, Redux Toolkit, Axios, Recharts, React Router, Monaco Editor, Socket.io client
- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth with roles, Socket.io, Redis, Axios
- AI Service: FastAPI (Python), TensorFlow, Scikit-learn, TextBlob, Transformers (BERT)
- Realtime: Socket.io, WebRTC/Firebase (pluggable)
- Tests: Jest (frontend), Mocha (backend)

## Monorepo
open-learn-hub/
- frontend/
- backend/
- ai-service/

## Quickstart

### 1) Backend Setup
```bash
cd open-learn-hub/backend
npm install
cp .env.example .env  # Windows: copy .env.example .env
# Edit .env and set your MongoDB URI, JWT_SECRET, etc.
npm run seed  # Seed database with test data
npm run dev   # Start backend on port 5000
```

### 2) AI Service Setup
```bash
cd open-learn-hub/ai-service
python -m venv .venv
.venv\Scripts\activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

### 3) Frontend Setup
```bash
cd open-learn-hub/frontend
npm install
cp .env.example .env  # Windows: copy .env.example .env
npm run dev  # Start frontend on port 5173
```

### Test Credentials
After running `npm run seed` in backend:
- **Student**: student@test.com / password123
- **Instructor**: instructor@test.com / password123
- **Admin**: admin@test.com / password123

## Environment Variables

### Backend (.env)
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/open_learn_hub
JWT_SECRET=your_secret_key_here
REDIS_URL=redis://localhost:6379  # Optional, comment out if not using Redis
AI_SERVICE_URL=http://localhost:8001
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

**Note**: Redis is optional for development. If not running Redis, comment out or remove `REDIS_URL` from backend `.env`.

## Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run Jest tests

### Backend
- `npm run dev` - Start with nodemon (auto-reload)
- `npm start` - Start production server
- `npm run seed` - Seed database with test data
- `npm test` - Run Mocha tests

### AI Service
- `uvicorn app:app --reload --port 8001` - Start with auto-reload
- `python eval.py` - Run model evaluation script

## Deployment
- Frontend: Vercel (build: npm run build, output: dist)
- Backend: Render (Node), connect to MongoDB Atlas
- AI: Hugging Face Spaces or Google Cloud Run

