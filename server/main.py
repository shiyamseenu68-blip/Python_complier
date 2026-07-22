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


@app.post("/run")
async def create_session(req: RunReq):
    try:
        sid = str(uuid.uuid4())
        _sessions[sid] = req.code
        return {"session_id": sid}
    except Exception as exc:
        # Never 500 — always return something the client can handle
        return JSONResponse(status_code=200, content={"error": str(exc)})


@app.websocket("/ws/{sid}")
async def run_ws(ws: WebSocket, sid: str):
    await ws.accept()
    code = _sessions.pop(sid, None)
    if code is None:
        await _send(ws, {"type": "stderr", "data": f"Session not found: {sid}\n"})
        await _send(ws, {"type": "exit", "code": 1})
        try:
            await ws.close()
        except Exception:
            pass
        return

    path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        ) as f:
            f.write(code)
            path = f.name

        await _execute(ws, path)

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


async def _execute(ws: WebSocket, path: str) -> None:
    """
    Run `python3 -u <path>` with piped stdio.
    Stream stdout/stderr to ws in real time.
    Feed stdin from ws messages (for input()).
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
        while not done.is_set():
            try:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=1.0)
            except asyncio.TimeoutError:
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


@app.get("/health")
async def health():
    return {"ok": True, "python": sys.version, "pid": os.getpid()}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PYTHON_STUDIO_PORT", "8000"))
    print(f"[python-studio] Starting on :{port}  Python {sys.version.split()[0]}", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
