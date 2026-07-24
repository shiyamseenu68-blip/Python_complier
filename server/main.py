"""
Python Studio — FastAPI execution backend.
Executes real CPython code in a subprocess per request.
Never returns HTTP 500 for user code errors.
"""
import asyncio
import json
import os
import sys
import tempfile
import traceback
import uuid

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# session_id -> source code
_sessions: dict[str, str] = {}


class RunReq(BaseModel):
    code: str
    stdin: str = ""


@app.post("/run")
async def create_session(req: RunReq):
    try:
        sid = str(uuid.uuid4())
        _sessions[sid] = {"code": req.code, "stdin": req.stdin}
        return {"session_id": sid}
    except Exception as exc:
        # Never 500 — always return something the client can handle
        return JSONResponse(status_code=200, content={"error": str(exc)})


@app.websocket("/ws/{sid}")
async def run_ws(ws: WebSocket, sid: str):
    await ws.accept()
    session = _sessions.pop(sid, None)
    if session is None:
        await _send(ws, {"type": "stderr", "data": f"Session not found: {sid}\n"})
        await _send(ws, {"type": "exit", "code": 1})
        try:
            await ws.close()
        except Exception:
            pass
        return

    code = session.get("code", "")
    stdin_data = session.get("stdin", "")

    path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        ) as f:
            f.write(code)
            path = f.name

        await _execute(ws, path, stdin_data)

    except Exception:
        tb = traceback.format_exc()
        await _send(ws, {"type": "stderr", "data": f"[server error]\n{tb}"})
        await _send(ws, {"type": "exit", "code": 1})
    finally:
        if path:
            try:
                os.unlink(path)
            except Exception:
                pass
        try:
            await ws.close()
        except Exception:
            pass


async def _send(ws: WebSocket, obj: dict) -> None:
    try:
        await ws.send_text(json.dumps(obj))
    except Exception:
        pass


async def _execute(ws: WebSocket, path: str, stdin_data: str = "") -> None:
    """
    Run `python3 -u <path>` with piped stdio.
    Stream stdout/stderr to ws in real time.
    Feed stdin from pre-provided data or ws messages (for input()).
    """
    proc = await asyncio.create_subprocess_exec(
        sys.executable,
        "-u",       # UNBUFFERED — required for real-time output + input() prompts
        path,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    done = asyncio.Event()
    stdin_lines = stdin_data.split('\n') if stdin_data else []
    stdin_index = 0
    used_preloaded_stdin = False

    async def stream_pipe(reader: asyncio.StreamReader, msg_type: str) -> None:
        while True:
            try:
                chunk = await asyncio.wait_for(reader.read(512), timeout=0.03)
            except asyncio.TimeoutError:
                if done.is_set():
                    # Drain remaining bytes after process exits
                    try:
                        rest = await asyncio.wait_for(reader.read(), timeout=0.5)
                        if rest:
                            await _send(ws, {
                                "type": msg_type,
                                "data": rest.decode("utf-8", errors="replace"),
                            })
                    except Exception:
                        pass
                    return
                continue
            if not chunk:
                return
            await _send(ws, {
                "type": msg_type,
                "data": chunk.decode("utf-8", errors="replace"),
            })

    async def stdin_feeder() -> None:
        nonlocal stdin_index, used_preloaded_stdin
        
        while not done.is_set():
            try:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=0.1)
            except asyncio.TimeoutError:
                # If we have preloaded stdin, feed it
                if not used_preloaded_stdin and stdin_index < len(stdin_lines):
                    line = stdin_lines[stdin_index] + "\n"
                    stdin_index += 1
                    try:
                        if proc.stdin and not proc.stdin.is_closing():
                            proc.stdin.write(line.encode("utf-8"))
                            await proc.stdin.drain()
                    except (BrokenPipeError, ConnectionResetError, Exception):
                        return
                    continue
                # If we've used all preloaded stdin, continue waiting for ws messages
                continue
            except (WebSocketDisconnect, Exception):
                try:
                    proc.kill()
                except Exception:
                    pass
                return

            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if msg.get("type") == "kill":
                try:
                    proc.kill()
                except Exception:
                    pass
                return

            if msg.get("type") == "stdin":
                used_preloaded_stdin = True  # Switch to interactive mode
                line = str(msg.get("data", "")) + "\n"
                try:
                    if proc.stdin and not proc.stdin.is_closing():
                        proc.stdin.write(line.encode("utf-8"))
                        await proc.stdin.drain()
                except (BrokenPipeError, ConnectionResetError, Exception):
                    return

    async def wait_proc() -> None:
        await proc.wait()
        done.set()

    await asyncio.gather(
        stream_pipe(proc.stdout, "stdout"),
        stream_pipe(proc.stderr, "stderr"),
        stdin_feeder(),
        wait_proc(),
    )

    if proc.returncode is None:
        try:
            proc.kill()
            await asyncio.wait_for(proc.wait(), timeout=3.0)
        except Exception:
            pass

    await _send(ws, {
        "type": "exit",
        "code": proc.returncode if proc.returncode is not None else 1,
    })


@app.get("/")
async def root():
    return {"status": "ok", "service": "python-studio-backend", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"ok": True, "python": sys.version, "pid": os.getpid()}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PYTHON_STUDIO_PORT", "8000"))
    print(f"[python-studio] Starting on :{port}  Python {sys.version.split()[0]}", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
