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

## Deploy to Vercel

**Important:** Python code execution requires a backend server. Vercel only hosts the frontend.

1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root and follow the prompts
3. Set environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy with `vercel --prod`

**Note:** Python execution is not available on Vercel deployments. The app will show a message indicating this limitation. For full Python execution, run locally with `npm run dev`.

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
