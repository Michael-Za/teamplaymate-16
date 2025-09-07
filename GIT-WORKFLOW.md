# Git Workflow Guide

This project now has automated git workflows set up for easy version control.

## Quick Git Operations

### Method 1: PowerShell Script (Recommended)
```powershell
# Add, commit, and push all changes in one command
.\quick-git.ps1 "Your commit message here"
```

### Method 2: Batch File
```cmd
# Alternative method using batch file
quick-git.bat "Your commit message here"
```

### Method 3: Manual Git Commands
```bash
# Using full path to git (since git is not in PATH)
& "C:\Program Files\Git\bin\git.exe" add .
& "C:\Program Files\Git\bin\git.exe" commit -m "Your commit message"
& "C:\Program Files\Git\bin\git.exe" push origin main
```

## Current Repository Status

✅ **Repository**: https://github.com/Michael-ctrl-eng/teamplaymate-16.git  
✅ **Branch**: main  
✅ **All changes committed and pushed**

## Recent Commits

- **Latest**: Add git automation scripts for easy version control
- **Previous**: Complete football management platform setup and improvements
  - Teams API with full CRUD operations
  - Redis connection handling improvements
  - Email service fixes
  - Database initialization scripts
  - Frontend component updates
  - Enhanced analytics and training services

## Usage Examples

```powershell
# After making code changes
.\quick-git.ps1 "fix: resolve authentication bug"

# After adding new features
.\quick-git.ps1 "feat: add player statistics dashboard"

# After updating documentation
.\quick-git.ps1 "docs: update API documentation"
```

## Notes

- All scripts automatically add all changes, commit with your message, and push to main branch
- Make sure to provide descriptive commit messages
- The PowerShell script includes error handling and colored output
- Git is installed but not in system PATH, so we use full path references