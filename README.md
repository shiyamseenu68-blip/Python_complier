# Python Studio

A modern Python IDE with real code execution, built with React + Vite + Tailwind (frontend) and FastAPI + CPython (backend).

## Features

- Real Python code execution with CPython backend
- Monaco Editor with syntax highlighting and autocomplete
- Interactive terminal with stdout/stderr streaming
- Input() support for interactive programs
- Code snippets and run history with Supabase
- Export/import code as JSON
- Dark theme with customizable accents
- Responsive design for mobile and desktop
- Keyboard shortcuts (Ctrl+Enter to run, Ctrl+S to save)

## Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Monaco Editor, Framer Motion, Zustand
- **Backend:** FastAPI, CPython, WebSockets
- **Database:** Supabase (for snippets and history)

## Quick Start

```bash
npm install
npm run dev      # Starts both frontend (port 5173) and Python backend (port 8000)
npm run build    # Production build -> dist/
npm run preview  # Preview production build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |

## Deployment Limitations

**IMPORTANT:** Python code execution requires a backend server with Python runtime. 

- **Vercel:** Python execution is NOT available. Vercel only hosts static frontend. The app will show a message indicating this limitation.
- **Netlify:** Same limitation as Vercel - no Python backend support.
- **GitHub Pages:** Same limitation - static hosting only.

**For full Python execution, you must:**
1. Run locally with `npm run dev` (recommended for development)
2. Deploy the frontend to any static host (Vercel, Netlify, etc.)
3. Deploy the Python backend separately to a service that supports Python (Railway, Render, Heroku, AWS, etc.)
4. Configure the frontend to connect to your deployed backend

## Deploy Frontend to Vercel

1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root and follow the prompts
3. Set environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy with `vercel --prod`

**Note:** This will only deploy the frontend. Python execution will not work on Vercel.

## Project Structure

```
.
├── server/              # FastAPI Python backend
│   └── main.py          # WebSocket execution server
├── src/                 # Frontend React app
│   ├── components/      # UI components
│   ├── db.ts           # Supabase database functions
│   ├── runner.ts       # WebSocket client for Python execution
│   └── store.ts        # Zustand state management
├── scripts/             # Build and dev scripts
├── vercel.json         # Vercel configuration
└── package.json
```

## Local Development

The `npm run dev` command automatically:
1. Checks for Python dependencies (fastapi, uvicorn, websockets)
2. Installs them if missing
3. Starts the Python backend on port 8000
4. Starts the Vite frontend on port 5173

The frontend proxies `/run`, `/health`, and `/ws` requests to the Python backend.
