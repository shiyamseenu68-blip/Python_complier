# Python Studio

A modern Python IDE with real code execution using Piston API, built with React + Vite + Tailwind.

## Features

- **Real Python code execution** using Piston API (server-side CPython)
- Monaco Editor with syntax highlighting and autocomplete
- Interactive terminal with stdout/stderr streaming
- Code snippets and run history with Supabase
- Export/import code as JSON
- Dark theme with customizable accents
- Responsive design for mobile and desktop
- Keyboard shortcuts (Ctrl+Enter to run, Ctrl+S to save)
- **Works on Vercel and any static hosting platform** - no backend required

## Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Monaco Editor, Framer Motion, Zustand
- **Python Runtime:** Piston API (real server-side Python execution)
- **Database:** Supabase (optional, for snippets and history)

## Quick Start

```bash
npm install
npm run dev      # Starts frontend on port 5173
npm run build    # Production build -> dist/
npm run preview  # Preview production build
```

## Environment Variables

Copy `.env.example` to `.env` and configure (optional - for Supabase features):

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | No | Supabase project URL (for snippets/history) |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key (for snippets/history) |

**Note:** The app works without Supabase - snippets and history features will be disabled gracefully.

## Deploy to Vercel

1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root and follow the prompts
3. (Optional) Set environment variables in the Vercel dashboard for Supabase:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy with `vercel --prod`

**Python execution works on Vercel** - uses Piston API for real server-side execution!

## Project Structure

```
.
├── src/                 # Frontend React app
│   ├── components/      # UI components
│   ├── db.ts           # Supabase database functions
│   ├── pistonRunner.ts # Piston API-based Python execution
│   └── store.ts        # Zustand state management
├── vercel.json         # Vercel configuration
└── package.json
```

## How It Works

Python Studio uses the **Piston API** (https://emkc.org/api/v2/piston) for real Python code execution:
- Python code is sent to Piston's execution engine
- Code runs on a server with Python 3.10.0
- Real stdout/stderr output is returned
- Supports all Python features including loops, functions, classes, exceptions, and recursion
- No local Python installation or backend server required
