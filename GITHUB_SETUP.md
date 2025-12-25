# GitHub Setup Instructions

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the repository details:
   - **Repository name**: `vetted-cv` (or your preferred name)
   - **Description**: "Resume Intelligence Platform - ATS-optimized resume builder with AI-powered job analysis"
   - **Visibility**: Choose **Public** (for portfolio) or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these commands:

### If you haven't pushed anything yet (first time):

```bash
cd "C:\Users\steve\Downloads\vetted AI\vetted-cv"
git remote add origin https://github.com/YOUR_USERNAME/vetted-cv.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

### If you need to update the remote URL:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/vetted-cv.git
git push -u origin main
```

## Step 3: Push Your Code

```bash
git push -u origin main
```

If you're asked for credentials:
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)
  - Generate one at: https://github.com/settings/tokens
  - Select scopes: `repo` (full control of private repositories)

## Step 4: Verify

1. Go to your GitHub repository page
2. You should see all your files and the README.md displayed
3. Check that `.env` files are NOT visible (they should be ignored by .gitignore)

## Important Notes

✅ **DO NOT commit these files** (they're already in .gitignore):
- `.env` files
- `node_modules/`
- `*.db` files
- `TEST_RESULTS.md`
- `test-comprehensive.ps1`

✅ **Safe to commit**:
- All source code
- Configuration files (without secrets)
- README.md
- package.json files

## Next Steps After GitHub Setup

1. **Add a repository description** on GitHub
2. **Add topics/tags**: `resume-builder`, `ats-optimization`, `nextjs`, `typescript`, `openai`
3. **Create a LICENSE file** (MIT recommended)
4. **Add screenshots** to README.md for better portfolio presentation
5. **Set up GitHub Actions** for CI/CD (optional)

## Troubleshooting

### If you get "remote origin already exists":
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/vetted-cv.git
```

### If you get authentication errors:
- Use a Personal Access Token instead of password
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### If you need to rename the branch:
```bash
git branch -M main
git push -u origin main
```
