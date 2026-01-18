# GitHub Push Instructions

## Manual Steps to Push Your Code to GitHub

Follow these steps in your terminal/command prompt:

### Step 1: Initialize Git Repository

```bash
cd c:\Users\Joshua\OneDrive\Desktop\webpr
git init
```

### Step 2: Add All Files (Excluding .gitignore rules)

```bash
git add .
```

This will add all files except those listed in `.gitignore`

### Step 3: Create Initial Commit

```bash
git commit -m "Initial commit: Remedy Store e-commerce with M-Pesa integration"
```

### Step 4: Create a GitHub Repository

1. Go to https://github.com/new
2. Enter Repository Name: `remedy-store`
3. Add Description: "E-commerce platform with M-Pesa payment integration"
4. Choose visibility: Public or Private
5. Click "Create Repository"

### Step 5: Add Remote and Push

Copy the commands from GitHub and run them:

```bash
git remote add origin https://github.com/YOUR_USERNAME/remedy-store.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## 📋 What Gets Pushed

### ✅ Included in GitHub

```
remedy-store/
├── frontend/
│   ├── Index.html
│   ├── about.html
│   ├── blogs.html
│   ├── contacts.html
│   ├── order.html
│   ├── orders.html
│   └── style.css
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env (credentials - keep private!)
├── .gitignore
├── README.md
└── SETUP.md
```

### ❌ NOT Included (by .gitignore)

```
node_modules/          # Too large, reinstall with npm install
package-lock.json      # Regenerated on npm install
.DS_Store              # OS files
.vscode/               # IDE settings
```

## 🔒 Important Security Notes

⚠️ **CRITICAL**: Your `.env` file contains M-Pesa credentials!

Options:
1. **Keep it private** - Add `.env` to `.gitignore` (already done)
2. **Use example file** - Create `.env.example` with placeholder values:

```bash
# Create example file
cp backend/.env backend/.env.example

# Edit .env.example to remove sensitive data
# Then commit .env.example instead
```

## 📝 After First Push - Cloning Back

To download your code from GitHub later:

```bash
git clone https://github.com/YOUR_USERNAME/remedy-store.git
cd remedy-store
cd backend
npm install
npm start
```

## 🔄 Future Updates

After initial push, to save changes:

```bash
# Make your changes to files...

# Stage changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

## 📚 Common Commands

```bash
# Check git status
git status

# View commit history
git log

# View changes before committing
git diff

# Undo last commit (careful!)
git reset HEAD~1
```

## ✅ Complete Checklist

- [ ] Git installed on your system
- [ ] GitHub account created
- [ ] GitHub repository created
- [ ] `git init` executed
- [ ] Files staged with `git add .`
- [ ] Initial commit created
- [ ] Remote added with `git remote add origin`
- [ ] Code pushed with `git push -u origin main`

## 🎉 Done!

Your Remedy Store project is now on GitHub and can be:
- Shared with collaborators
- Deployed automatically
- Version controlled
- Backed up safely

---

Need help? Run these commands step by step in your PowerShell terminal!
