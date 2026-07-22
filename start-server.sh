#!/bin/bash
# Start the Python execution backend
cd "$(dirname "$0")/server"
~/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --log-level warning
