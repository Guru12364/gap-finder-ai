@echo off
cd /d "%~dp0"
echo ====================================================
echo Initializing and Verifying Supabase Database Schema
echo ====================================================
call npm run db:setup
pause
