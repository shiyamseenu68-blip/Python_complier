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

## Deployment Options

**CRITICAL LIMITATION:** Python code execution requires a backend server with Python runtime. 
**Vercel is a static hosting platform and cannot execute Python code directly.**

### Why Python Execution Won't Work on Vercel Alone

Vercel only hosts static files (HTML, CSS, JavaScript). It cannot:
- Run Python code
- Execute server-side Python
- Provide Python runtime environment

All attempts to run Python in the browser (Skulpt, Brython, Pyodide) fail on Vercel due to:
- CDN loading restrictions
- WebAssembly module import errors
- Browser security policies

All external Python execution APIs (Piston, Rextester, Judge0) require:
- API keys/authentication
- Rate limiting
- Paid plans for production use

### Option 1: Local Development (Recommended)
Run locally with `npm run dev` for full Python execution with local backend.

### Option 2: Deploy Backend to Render + Frontend to Vercel

**Step 1: Deploy Backend to Render (Free)**
1. Create a Render account at render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Deploy the backend (free tier, spins down after 15 min inactivity)
6. Copy the backend URL (e.g., `https://python-studio-backend.onrender.com`)

**Step 2: Deploy Frontend to Vercel**
1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root and follow the prompts
3. Set environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BACKEND_URL` (your Render backend URL from Step 1)
4. Deploy with `vercel --prod`

**Note:** With this setup, Python execution works on Vercel by connecting to your Render backend.

### Option 3: Deploy Both to Render
You can also deploy both frontend and backend to Render using the same account.

### Option 4: Use a Paid Python Execution API
If you don't want to deploy a backend, you can use a paid Python execution API service:
- Judge0 Cloud (paid)
- CodeRunner API (paid)
- Custom backend deployment

**There is no free, authentication-free Python execution API that works reliably on Vercel.**

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
