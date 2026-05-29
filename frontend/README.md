# AI Singing Tutor Frontend

Next.js frontend using the Figma UI screens and the original backend API/service flow.

## Run Locally

From `frontend/`:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app proxies backend calls through Next.js:

- `/api/*` -> FastAPI
- `/songs/*` -> FastAPI static song files
- `/health` -> FastAPI health check

By default the proxy target is `http://localhost:8000`. Override it with:

```bash
BACKEND_INTERNAL_URL=http://localhost:8000
```

Leave `NEXT_PUBLIC_API_BASE_URL` empty to use the proxy. Set it only if the browser should call FastAPI directly.

## Checks

```bash
npm run lint
npm run build
```
