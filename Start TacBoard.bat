@echo off
echo Starting Soccer Tactical Board...
echo.
cd /d "%~dp0"
start "" "http://localhost:5173"
npm run dev
