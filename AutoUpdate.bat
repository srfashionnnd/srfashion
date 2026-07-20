@echo off

set LOGFILE=C:\Users\ASUS\Desktop\srfashionndclaude\scheduler.log

echo ==================================================>> "%LOGFILE%"
echo [%date% %time%] Task Scheduler Started>> "%LOGFILE%"

cd /d "C:\Users\ASUS\Desktop\srfashionndclaude"

echo Working Directory: %CD%>> "%LOGFILE%"
echo.>> "%LOGFILE%"

"C:\Users\ASUS\AppData\Local\Python\pythoncore-3.14-64\python.exe" auto_update.py >> "%LOGFILE%" 2>&1

echo.>> "%LOGFILE%"
echo [%date% %time%] Task Finished>> "%LOGFILE%"
echo ==================================================>> "%LOGFILE%"
echo.>> "%LOGFILE%"