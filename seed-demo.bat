@echo off
cd /d "%~dp0"
echo ====================================================
echo Seeding GapFinder AI Demo Account...
echo ====================================================
call npm run seed:demo
pause
