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

**CRITICAL REQUIREMENT:** Python code execution requires a backend server with Python runtime. 
**Vercel is a static hosting platform and cannot execute Python code directly.**

### Why Python Execution Requires a Backend

Real Python execution with proper `input()` handling requires:
- CPython interpreter (cannot run in browser)
- Synchronous input/output streaming
- Full Python standard library support

Browser-based Python interpreters (Skulpt, Brython, Pyodide) cannot:
- Provide real Python execution
- Handle `input()` properly (async vs sync issue)
- Support full Python syntax and libraries

External Python execution APIs (Piston, Rextester, Judge0) require:
- API keys/authentication
- Rate limiting
- Paid plans for production use

### Option 1: Local Development (Recommended for Testing)
Run locally with `npm run dev` for full Python execution with local backend.

```bash
npm run dev
```

This starts:
- Frontend on http://localhost:5173
- Python backend on http://localhost:8000

### Option 2: Deploy Backend to Render + Frontend to Vercel (Production)

This is the **recommended production setup** for Vercel deployment.

**Step 1: Deploy Backend to Render (Free)**

1. Create a Render account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (this repository)
4. Render will automatically detect the `render.yaml` file
5. Configure the service:
   - Name: `python-studio-backend` (or any name you prefer)
   - Region: Choose the closest region to your users
   - Plan: Free (spins down after 15 min inactivity)
6. Click "Create Web Service"
7. Wait for deployment to complete (2-3 minutes)
8. Copy the backend URL from the dashboard (e.g., `https://python-studio-backend.onrender.com`)

**Step 2: Deploy Frontend to Vercel**

1. Install the Vercel CLI:
```bash
npm i -g vercel
```

2. Run Vercel in the project root:
```bash
vercel
```
Follow the prompts to deploy.

3. Set environment variables in the Vercel dashboard:
   - Go to your Vercel project → Settings → Environment Variables
   - Add the following variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `VITE_BACKEND_URL`: Your Render backend URL from Step 1 (e.g., `https://python-studio-backend.onrender.com`)

4. Deploy to production:
```bash
vercel --prod
```

**How it works:**
- Frontend runs on Vercel (static hosting)
- Backend runs on Render (Python runtime)
- Frontend connects to backend via WebSocket for Python execution
- `input()` works properly because the backend uses real CPython

**Note:** The free Render tier spins down after 15 minutes of inactivity. The first request after spin-up may take 30-60 seconds. For production use, consider upgrading to a paid plan.

### Option 3: Deploy Both to Render
You can also deploy both frontend and backend to Render using the same account. This avoids the spin-up delay of the free tier.

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
