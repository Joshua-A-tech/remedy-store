#!/usr/bin/env pwsh

# Remedy Store - GitHub Repository Setup
# This script sets up your repository locally

Write-Host "`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        REMEDY STORE - GITHUB REPOSITORY SETUP                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Configure Git
Write-Host "[1/5] Configuring Git..." -ForegroundColor Yellow
git config --global user.name "Joshua"
git config --global user.email "joshua@remedystore.com"
Write-Host "✓ Git configured" -ForegroundColor Green

# Step 2: Initialize Repository
Write-Host "`n[2/5] Initializing Git Repository..." -ForegroundColor Yellow
git init
Write-Host "✓ Repository initialized" -ForegroundColor Green

# Step 3: Add all files
Write-Host "`n[3/5] Adding all files..." -ForegroundColor Yellow
git add .
Write-Host "✓ Files staged" -ForegroundColor Green

# Step 4: Create initial commit
Write-Host "`n[4/5] Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Remedy Store e-commerce with M-Pesa integration"
Write-Host "✓ Initial commit created" -ForegroundColor Green

# Step 5: Display next steps
Write-Host "`n`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    NEXT STEPS - READ CAREFULLY                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n✓ Repository initialized locally" -ForegroundColor Green
Write-Host "✓ All files committed" -ForegroundColor Green

Write-Host "`nNOW YOU NEED TO:" -ForegroundColor Yellow
Write-Host "`n1. Go to " -NoNewline
Write-Host "https://github.com/new" -ForegroundColor Cyan
Write-Host "2. Create a repository named: " -NoNewline
Write-Host "remedy-store" -ForegroundColor Cyan
Write-Host "3. Click " -NoNewline
Write-Host '"Create Repository"' -ForegroundColor Cyan
Write-Host "4. Copy the HTTPS URL (looks like: " -NoNewline
Write-Host "https://github.com/YOUR_USERNAME/remedy-store.git" -ForegroundColor Cyan
Write-Host ")"
Write-Host "5. Come back to PowerShell and run these commands:" -ForegroundColor Yellow

Write-Host "`n   " -NoNewline
Write-Host "git remote add origin YOUR_GITHUB_URL" -ForegroundColor Magenta
Write-Host "   " -NoNewline
Write-Host "git branch -M main" -ForegroundColor Magenta
Write-Host "   " -NoNewline
Write-Host "git push -u origin main" -ForegroundColor Magenta

Write-Host "`n6. Enter your GitHub credentials when prompted" -ForegroundColor Yellow

Write-Host "`nThat's it! Your code will be on GitHub! " -ForegroundColor Green -NoNewline
Write-Host "🎉" -ForegroundColor Yellow

Write-Host "`n`nExample of complete command with your URL:" -ForegroundColor Yellow
Write-Host "`ngit remote add origin https://github.com/YOUR_USERNAME/remedy-store.git`ngit branch -M main`ngit push -u origin main`n" -ForegroundColor Magenta

Write-Host "Press Enter to finish..." -ForegroundColor Cyan
Read-Host
