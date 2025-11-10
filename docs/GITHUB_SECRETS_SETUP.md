# GitHub Secrets Setup for Automated Releases

This guide explains what GitHub Secrets you need to configure **manually** for the automated release workflow to work.

## Quick Summary

You need to add **4 secrets** to your GitHub repository:

1. `NPM_TOKEN` - For publishing to npm
2. `DOCKERHUB_USERNAME` - Your Docker Hub username
3. `DOCKERHUB_TOKEN` - For pushing Docker images
4. `CLOUDFLARE_API_TOKEN` - For deploying to Cloudflare Workers

## How to Add Secrets

Go to your repository on GitHub:
1. Click **Settings** tab
2. Go to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

---

## 1. NPM_TOKEN

**What it does:** Publishes your package to npm registry

**How to create:**
1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Click your profile → **Access Tokens**
3. Click **Generate New Token** → **Automation**
4. Name it: `vibesec-github-actions`
5. Copy the token

**Add to GitHub:**
- Name: `NPM_TOKEN`
- Value: Paste the token from npm

---

## 2. DOCKERHUB_USERNAME

**What it does:** Authenticates to Docker Hub for pushing images

**How to get:**
- This is just your Docker Hub username (e.g., `johnsmith`)

**Add to GitHub:**
- Name: `DOCKERHUB_USERNAME`
- Value: Your Docker Hub username

---

## 3. DOCKERHUB_TOKEN

**What it does:** Authenticates to Docker Hub with access token

**How to create:**
1. Go to [hub.docker.com](https://hub.docker.com) and log in
2. Click your profile → **Account Settings** → **Security**
3. Click **New Access Token**
4. Name it: `vibesec-github-actions`
5. Set permissions: **Read, Write, Delete**
6. Copy the token (save it - you can't see it again!)

**Add to GitHub:**
- Name: `DOCKERHUB_TOKEN`
- Value: Paste the token from Docker Hub

---

## 4. CLOUDFLARE_API_TOKEN

**What it does:** Deploys your Worker to Cloudflare

**How to create:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click your profile icon → **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **"Edit Cloudflare Workers"** template
   - Or create custom with: Account > Cloudflare Workers Scripts > Edit
5. Select your account in **Account Resources**
6. Click **Continue to summary** → **Create Token**
7. Copy the token (save it!)

**Add to GitHub:**
- Name: `CLOUDFLARE_API_TOKEN`
- Value: Paste the token from Cloudflare

**Note:** The Cloudflare account ID is already in `wrangler.toml`, so you don't need to add it as a secret.

---

## Verify Setup

After adding all 4 secrets:

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. You should see:
   - ✅ NPM_TOKEN
   - ✅ DOCKERHUB_USERNAME
   - ✅ DOCKERHUB_TOKEN
   - ✅ CLOUDFLARE_API_TOKEN

---

## Testing the Workflow

Once secrets are configured:

1. Create a test branch: `git checkout -b test/release-workflow`
2. Make a small change (e.g., update README)
3. Commit and push
4. Create a PR with label `patch`
5. Merge the PR
6. Watch the magic happen! 🚀

The workflow will:
- Bump version (e.g., 0.1.0 → 0.1.1)
- Create git tag `v0.1.1`
- Publish to npm
- Push to Docker Hub
- Deploy to Cloudflare Workers
- Create GitHub Release

---

## Troubleshooting

### "Error: npm token is invalid"
- Regenerate `NPM_TOKEN` at npmjs.com (choose **Automation** type)

### "Error: unauthorized Docker Hub"
- Make sure `DOCKERHUB_USERNAME` matches exactly
- Regenerate `DOCKERHUB_TOKEN` with Read/Write/Delete permissions

### "Error: Cloudflare authentication failed"
- Check `CLOUDFLARE_API_TOKEN` has "Edit Cloudflare Workers" permission
- Verify token isn't expired
- Make sure account resources include your account

### Workflow doesn't trigger
- Ensure PR has a version label (`major`, `minor`, `patch`, `feature`, `fix`, or `breaking`)
- Check GitHub Actions are enabled in repository settings

---

## Security Notes

- ✅ These secrets are encrypted by GitHub
- ✅ They're only accessible to GitHub Actions workflows
- ✅ They're never exposed in logs
- ⚠️ Rotate tokens every 90 days for security
- ⚠️ Only give minimum required permissions

---

## Need Help?

See detailed documentation:
- [VERSIONING.md](./VERSIONING.md) - Full workflow explanation
- [GitHub Secrets Docs](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [npm Token Docs](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [Docker Hub Token Docs](https://docs.docker.com/docker-hub/access-tokens/)
- [Cloudflare API Token Docs](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
