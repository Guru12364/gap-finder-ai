@echo off
cd /d "%~dp0"
echo ====================================================
echo Starting GapFinder AI Development Server...
echo ====================================================
echo Environment: Groq API Key Configured
echo Port: http://localhost:3000
echo ====================================================
call npm run dev
pause
