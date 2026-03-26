@echo off
set "ROOT=%~dp0"
start "SAPFix AI Backend" cmd /k "cd /d ""%ROOT%"" && .venv\Scripts\python.exe -m uvicorn api_server:app --host 127.0.0.1 --port 8003"
start "SAPFix AI Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev -- --host 127.0.0.1 --port 4175"
