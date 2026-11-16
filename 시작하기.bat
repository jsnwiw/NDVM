@echo off
chcp 65001 >nul
cd /d "%~dp0"
if exist "C:\ProgramData\miniconda3\python.exe" (
    "C:\ProgramData\miniconda3\python.exe" run_ndvm.py
    pause
    exit /b
)
py -3 run_ndvm.py
if errorlevel 1 python run_ndvm.py
pause
