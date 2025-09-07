@echo off
title Git Setup for Statsor Platform
color 0A

echo ====================================================
echo     Git Repository Setup for Statsor Platform
echo ====================================================
echo.

cd /d "c:\Users\JOE\Downloads\mm"

echo Current directory: %cd%
echo.

echo Checking if Git is accessible...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Git is accessible
    echo.
    
    echo Initializing Git repository...
    git init
    if %errorlevel% neq 0 (
        echo ✗ Error initializing Git repository
        goto error
    )
    echo ✓ Git repository initialized
    echo.
    
    echo Configuring Git user...
    git config user.name "Statsor Developer"
    git config user.email "developer@statsor.com"
    echo ✓ Git user configured
    echo.
    
    echo Adding all files to repository...
    git add .
    if %errorlevel% neq 0 (
        echo ✗ Error adding files
        goto error
    )
    echo ✓ All files added
    echo.
    
    echo Making initial commit...
    git commit -m "Initial commit: Statsor football management platform with fixed API integrations"
    if %errorlevel% neq 0 (
        echo ✗ Error making commit
        goto error
    )
    echo ✓ Initial commit created
    echo.
    
    echo Adding remote origin...
    git remote add origin https://github.com/Michael-ctrl-eng/teamplaymate-16.git
    if %errorlevel% neq 0 (
        echo ✗ Error adding remote origin
        goto error
    )
    echo ✓ Remote origin added
    echo.
    
    echo ====================================================
    echo     Git Setup Complete!
    echo ====================================================
    echo.
    echo Next steps:
    echo 1. To push to GitHub, run:
    echo    git push -u origin main
    echo.
    echo 2. If you get authentication errors:
    echo    - Create a Personal Access Token on GitHub
    echo    - Use it as your password when prompted
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 0
    
) else (
    echo ✗ Git is not accessible from this terminal
    echo.
    echo Please ensure Git is installed and added to your PATH
    echo Download Git from: https://git-scm.com/downloads
    echo.
    echo After installation, run this script again
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:error
echo.
echo An error occurred during setup
echo Please check the error messages above
echo.
echo Press any key to exit...
pause >nul
exit /b 1