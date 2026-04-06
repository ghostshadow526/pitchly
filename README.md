# Pitchly

Pitchly is a small full-stack web app that helps founders generate personalized cold outreach email variants using the Groq API.

## Stack

- Frontend: React (Vite) + Tailwind CSS (`/client`)
- Backend: Node.js + Express (`/server`)
- AI: Groq API – model `llama-3.3-70b-versatile`

## Getting started

1. Copy the example env file and add your Groq API key:

```bash
cp .env.example .env
# then edit .env and set GROQ_API_KEY
```

2. Install dependencies for the root, client, and server:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

3. Run both dev servers from the repo root:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

The Vite dev server proxies `/api` requests to the Express backend.

## Usage limits

The client tracks free usage in `localStorage` under `pitchly_generations_used` and allows 5 generations before showing an upgrade message.

## Notes

- Do not commit your actual `.env` file.
- The backend exposes `POST /api/generate` which calls Groq and returns 3 email variants.
