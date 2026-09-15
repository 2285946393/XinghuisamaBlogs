@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo [调试] 脚本所在目录：%~dp0
echo [调试] 开始检测 Python 环境...

set "PYEXE="
set "PYMAJOR="
set "PYMINOR="

:: 1. 优先使用 PATH 里的 python
python --version >nul 2>&1
if %errorlevel% equ 0 set "PYEXE=python"
if defined PYEXE goto checkver

:: 2. 退而求其次，尝试 py 启动器（3.10 → 任意 3.x）
py -3.10 --version >nul 2>&1
if %errorlevel% equ 0 set "PYEXE=py -3.10"
if defined PYEXE goto checkver

py -3 --version >nul 2>&1
if %errorlevel% equ 0 set "PYEXE=py -3"
if defined PYEXE goto checkver

goto nopy

:checkver
for /f "tokens=2 delims=. " %%a in ('%PYEXE% --version 2^>^&1') do set "PYMAJOR=%%a"
for /f "tokens=3 delims=. " %%a in ('%PYEXE% --version 2^>^&1') do set "PYMINOR=%%a"

if not defined PYMAJOR goto nopy
if %PYMAJOR% lss 3 goto badver
if %PYMAJOR% equ 3 if %PYMINOR% lss 10 goto badver

echo [状态] 使用 %PYEXE% 启动控制台...
%PYEXE% run_me.py
if errorlevel 1 (
    echo.
    echo ❌ run_me.py 执行失败，请把上面的报错截图发给我。
    pause
    exit /b 1
)
goto end

:badver
echo ❌ 需要 Python 3.10 及以上，当前版本：
python --version
pause
exit /b 1

:nopy
echo ❌ 未找到 Python，请安装 3.10+ 并勾选 "Add Python to PATH"。
pause
exit /b 1

:end
echo ✅ 程序执行完成
exit /b 0
