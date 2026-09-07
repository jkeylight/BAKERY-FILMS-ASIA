@echo off
title BAKERY FILMS / AI — production server
echo.
echo  ╔══════════════════════════════════════╗
echo  ║  BAKERY FILMS / AI                   ║
echo  ║  We make films that never happened.  ║
echo  ╚══════════════════════════════════════╝
echo.

:: Check if node_modules exist
if not exist "node_modules\" (
  echo  [!] Installing dependencies...
  call npm install
  echo.
)

:: Build for production
echo  [1/2] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
  echo  [X] Build failed. Check errors above.
  pause
  exit /b 1
)
echo  [OK] Build complete.
echo.

:: Start the production server
echo  [2/2] Starting production server...
echo.
echo  ════════════════════════════════════════
echo   http://localhost:3000
echo   http://localhost:3000/?motion=1
echo  ════════════════════════════════════════
echo.
echo  Commission API: POST http://localhost:3000/api/commission
echo  Briefs stored:  data/briefs.json
echo.
echo  Press Ctrl+C to stop.
echo.

:: Try to open the browser
start "" "http://localhost:3000/?motion=1" 2>nul

:: Run the server (tsx compiles TypeScript on-the-fly)
npx tsx src/server.ts

pause
