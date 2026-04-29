# 🛡️ Git & GitHub Setup Guide

Follow these steps to ensure your project is never lost and always backed up.

## 1. Install Git
- Download from: [git-scm.com](https://git-scm.com/download/win)
- Install with all default settings.

## 2. Verify Installation
Open your terminal (PowerShell or Command Prompt) and type:
```bash
git --version
```
If you see a version number (e.g., `git version 2.x.x`), you are ready!

## 3. Configure Your Identity
Tell Git who you are (use the same email as your GitHub account):
```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
```

## 4. Initialize Your Project
Go to your project folder (`c:\finsight wesite`) in the terminal and run:
```bash
git init
```

## 5. First Backup (Commit)
Run these commands to save your current perfectly working state:
```bash
git add .
git commit -m "Initial commit: perfectly aligned invoice system"
```

## 6. Connect to GitHub
1. Go to [GitHub.com](https://github.com) and click **"New Repository"**.
2. Name it `finsight-logistics`.
3. Keep it **Private** if you don't want others to see your code.
4. Click **"Create Repository"**.
5. Copy the URL of your new repo (e.g., `https://github.com/username/finsight-logistics.git`).
6. Run these in your terminal:
```bash
git remote add origin YOUR_REPOSITORY_URL_HERE
git branch -M main
git push -u origin main
```

---

### ✅ Done!
Your code is now safe on GitHub. If you ever make a mistake or lose files, you can "pull" them back from the cloud instantly.
