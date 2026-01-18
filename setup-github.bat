@echo off
REM Remedy Store - GitHub Repository Setup Script
REM This script initializes and pushes your project to GitHub

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║        REMEDY STORE - GITHUB REPOSITORY SETUP                     ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Configure Git
echo [1/5] Configuring Git...
git config --global user.name "Joshua"
git config --global user.email "joshua@remedystore.com"
echo ✓ Git configured

REM Initialize Repository
echo.
echo [2/5] Initializing Git Repository...
git init
echo ✓ Repository initialized

REM Add all files
echo.
echo [3/5] Adding all files...
git add .
echo ✓ Files staged

REM Create initial commit
echo.
echo [4/5] Creating initial commit...
git commit -m "Initial commit: Remedy Store e-commerce with M-Pesa integration"
echo ✓ Initial commit created

REM Display next steps
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                    NEXT STEPS - READ CAREFULLY                     ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo ✓ Repository initialized locally
echo ✓ All files committed
echo.
echo NOW YOU NEED TO:
echo.
echo 1. Go to https://github.com/new
echo 2. Create a repository named: remedy-store
echo 3. Click "Create Repository"
echo 4. Copy the HTTPS URL (looks like: https://github.com/YOUR_USERNAME/remedy-store.git)
echo 5. Come back to PowerShell and run this command:
echo.
echo    git remote add origin YOUR_GITHUB_URL
echo    git branch -M main
echo    git push -u origin main
echo.
echo 6. Enter your GitHub credentials when prompted
echo.
echo That's it! Your code will be on GitHub! 🎉
echo.
pause
