@echo off
chcp 65001 >nul 2>&1
title Sales CRM v6 — 一键部署

echo.
echo   ========================================
echo     Sales CRM v6 — 阿里云一键部署
echo   ========================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [错误] 未安装 Node.js
    echo   请先安装: https://nodejs.org
    pause
    exit /b 1
)

:: 检查 Python
where py >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [错误] 未安装 Python
    echo   请先安装: https://python.org
    pause
    exit /b 1
)

:: 检查 OSS SDK
py -c "import oss2" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   正在安装阿里云 OSS SDK...
    py -m pip install oss2 -q
)

:: 执行部署
py "%~dp0deploy.py"

pause
