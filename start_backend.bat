@echo off
cd /d "%~dp0"
.venv\Scripts\python.exe -m uvicorn api_server:app --host 127.0.0.1 --port 8003
