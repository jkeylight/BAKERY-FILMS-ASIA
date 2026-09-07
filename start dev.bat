@echo off
title BAKERY FILMS / AI — dev server
echo.
echo  ╔══════════════════════════════════════╗
echo  ║  BAKERY FILMS / AI  (DEV)            ║
echo  ║  We make films that never happened.  ║
echo  ╚══════════════════════════════════════╝
echo.
echo  Starting dev server...
echo  http://localhost:5173/?motion=1
echo.
echo  Press Ctrl+C to stop.
echo.

start "" "http://localhost:5173/?motion=1" 2>nul

call npm run dev
pause
