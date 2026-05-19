# AI Singing Tutor

A full-stack application that uses AI to provide real-time feedback on singing performances. Get pitch-perfect with personalized analysis and recommendations.

## 🎯 Features

- **Real-time Pitch Detection** — Analyze vocal pitch with AI
- **Instant Feedback** — Get accuracy scores and recommendations
- **Song Library** — Practice with your favorite songs
- **Performance Metrics** — Track pitch and timing accuracy
- **Beautiful UI** — Modern, responsive interface with animations
- **Song Upload & Processing** — Add songs with audio and lyrics analysis (Sprint 2)
- **Reference Generation** — Automatic metadata extraction, beat detection, melody extraction (Sprint 2)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)
- Docker & Docker Compose (optional)

### Without Docker

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Backend runs on: http://localhost:8000

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

### With Docker

```bash
docker-compose up
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

## 📚 Documentation

- [Sprint 2 Architecture](./docs/SPRINT2_ARCHITECTURE.md) — Song reference processing engine
- [Sprint 2 Implementation Guide](./docs/SPRINT2_IMPLEMENTATION.md) — Setup and deployment
- [Sprint 2 Testing Guide](./docs/SPRINT2_TESTING.md) — Testing procedures and examples
- [API Contract](./docs/api-contract.md) — Complete API specification
- [Architecture](./docs/architecture.md) — System design and components
- [Sprint 0 Summary](./docs/sprint-0.md) — Project roadmap and status

## 🏗️ Project Structure

```
ai-singing-tutor/
├── frontend/              # React + TypeScript application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API and WebSocket services
│   │   └── types/        # TypeScript interfaces
│   └── package.json
│
├── backend/              # FastAPI Python application
│   ├── app/
│   │   ├── api/         # REST endpoints
│   │   ├── services/    # Business logic
│   │   ├── schemas/     # Data validation
│   │   └── websocket/   # Real-time connections
│   └── requirements.txt
│
└── docs/                 # Documentation
    ├── api-contract.md
    ├── architecture.md
    └── sprint-0.md
```

## 🛠️ Tech Stack

### Frontend
- **React** 18.2 — UI library
- **TypeScript** 5.2 — Type safety
- **Vite** 5.0 — Fast build tool
- **Tailwind CSS** 3.3 — Styling
- **Framer Motion** 10.16 — Animations
- **React Router** 6.20 — Navigation
- **Axios** 1.6 — HTTP client

### Backend
- **FastAPI** 0.104 — Web framework
- **Uvicorn** 0.24 — ASGI server
- **Pydantic** 2.5 — Data validation
- **Librosa** 0.10 — Audio analysis (ready for Sprint 1)
- **CREPE** — Pitch detection (ready for Sprint 1)
- **WhisperX** — Speech recognition (ready for Sprint 1)

## 📖 API Endpoints

### Songs (Sprint 2)
- `POST /api/songs/upload` — Upload song audio and lyrics
- `POST /api/songs/{song_id}/process` — Start processing pipeline
- `GET /api/songs/{song_id}/status` — Check processing status
- `GET /api/songs/{song_id}/reference` — Get complete reference JSON
- `GET /api/songs/{song_id}/preview` — Get lightweight preview
- `DELETE /api/songs/{song_id}` — Delete song and files

### Analysis (Sprint 3)
- `POST /api/recordings/{song_id}/analyze` — Analyze user recording
- `GET /api/recordings/{recording_id}/results` — Get analysis results

### Real-time
- `WS /ws/pitch/{recording_id}` — Stream pitch data

See [API Contract](./docs/api-contract.md) for complete specifications.

## 🎬 How It Works

1. **Select a Song** — Browse available songs
2. **Start Recording** — Begin recording your performance
3. **See Real-time Feedback** — Visualize your pitch in real-time
4. **Get Analysis** — View detailed performance metrics
5. **Improve** — Follow recommendations and try again

## 🔄 Development Workflow

```bash
# Terminal 1: Backend
cd backend
python run.py

# Terminal 2: Frontend
cd frontend
npm run dev

# Visit http://localhost:3000
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

## 📦 Building for Production

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
pip install -r requirements.txt
# Configure production settings
```

## 🚀 Deployment

### Docker
```bash
docker-compose -f docker-compose.yml up -d
```

### Manual
See deployment documentation (coming in Sprint 1).

## 📝 API Examples

### Get Songs
```bash
curl http://localhost:8000/api/songs
```

### Analyze Recording
```bash
curl -X POST http://localhost:8000/api/recordings/song_001/analyze?recording_id=rec_123
```

### WebSocket Stream
```bash
wscat -c ws://localhost:8000/ws/pitch/rec_123
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.ts (frontend) or run.py (backend)
```

### Module Not Found
```bash
# Backend
python -m pip install --upgrade pip
pip install -r requirements.txt

# Frontend
npm install
npm ci
```

### WebSocket Connection Failed
- Ensure backend is running on port 8000
- Check CORS settings if using different domain
- Verify proxy settings in vite.config.ts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit with clear messages
5. Push to your branch
6. Open a pull request

## 📋 Roadmap

### Sprint 0 ✅
- [x] Foundation & architecture
- [x] Mock API endpoints
- [x] Frontend framework
- [x] WebSocket infrastructure

### Sprint 1 🎯
- [ ] Real CREPE pitch detection
- [ ] Audio file upload
- [ ] User authentication
- [ ] Recording persistence

### Sprint 2 📅
- [ ] Database integration
- [ ] Advanced analysis
- [ ] Performance optimization
- [ ] Deployment pipeline

## 📄 License

MIT License - feel free to use this project for learning and development.

## 👥 Team

- **AI Team** — Audio processing and pitch detection
- **Development Team** — Frontend and backend development

## 📞 Support

For issues and questions:
1. Check the [API Contract](./docs/api-contract.md)
2. Review the [Architecture](./docs/architecture.md)
3. See [Sprint 0 Summary](./docs/sprint-0.md)
4. Open an issue on GitHub

---

**Status:** Sprint 0 Complete ✅  
**Version:** 0.1.0  
**Last Updated:** Sprint 0

Happy singing! 🎤
