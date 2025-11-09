# Cloudflare API Token Setup Guide for Wrangler

**Purpose**: Get your Cloudflare API token to authenticate Wrangler for deploying VibeSec to Cloudflare Workers.

**Time Required**: 5-10 minutes

---

## Prerequisites

- A Cloudflare account (free tier works fine)
  - Sign up at https://dash.cloudflare.com/sign-up if you don't have one
- Access to your Cloudflare dashboard

---

## Step 1: Access API Tokens Page

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Or navigate manually:
   - Log into https://dash.cloudflare.com
   - Click your profile icon (bottom left)
   - Select "Profile" from dropdown
   - Click "API Tokens" in the left sidebar

**Screenshot**: You should see a page titled "API Tokens" with existing tokens listed (if any).

---

## Step 2: Create New Token

1. Click the blue **"Create Token"** button (top right)
2. You'll see two options:
   - "Create using template" (recommended)
   - "Create custom token"

**Select**: "Create using template" (easier)

---

## Step 3: Select Template

Look for and click the **"Edit Cloudflare Workers"** template card.

**What this template includes**:

- Account Resources → Workers
- Permissions: read, edit, deploy
- Zone Resources: All zones (if needed later)

This is exactly what you need for deploying VibeSec.

---

## Step 4: Review Permissions

After clicking the template, you'll see a summary showing:

```
Permissions:
✓ Account → Workers (Read, Edit)
✓ Zone → Workers (Read, Edit)

Client IP Address Restriction: None
Token Duration: No expiration (or you can set one)
```

**Important**: Make sure you see "Workers" permissions. Leave other settings as default.

**Recommendation**: Consider setting a token duration (e.g., 90 days) for security.

Click **"Continue to Summary"** button at bottom right.

---

## Step 5: Review Token Summary

You'll see a final summary page with:

- Token name: "Edit Cloudflare Workers" (default)
- Permissions listed
- "Create Token" button

Optionally rename the token to something more specific:

- "VibeSec Deployment Token"
- "vibesec-mcp-deploy"

Then click **"Create Token"** button.

---

## Step 6: Copy Your Token

**IMPORTANT**: A token will appear on screen that looks like:

```
v1.0123456789abcdef...long_string_here...
```

**DO THESE NOW**:

1. ✅ **Click "Copy"** or select and copy the entire token
2. ✅ **Save it somewhere secure** (password manager recommended):
   - NOT in your code
   - NOT in git
   - Use a secure password manager
3. ✅ Keep this page open - you'll use the token next

**⚠️ WARNING**:

- This is the only time you'll see this token
- If you close the page, you can't retrieve it
- You'll need to create a new token if you lose it
- DO NOT share this token with anyone

---

## Step 7: Authenticate Wrangler

Now that you have your token, authenticate Wrangler. Choose ONE method:

### **Method A: Browser Login (Simplest)**

```bash
wrangler auth login
```

This will:

1. Open your browser automatically
2. Ask you to authorize Wrangler
3. Confirm "Allow" when asked
4. Return to terminal and show "✓ Authenticated"

**Use this method if you can open a browser.**

---

### **Method B: API Token (If browser doesn't work)**

```bash
wrangler auth token
```

This will prompt you to:

1. Enter your API token (paste the token from Step 6)
2. Press Enter

Wrangler will verify and store the token locally.

**Example:**

```bash
$ wrangler auth token
🔑 Enter your API token:
v1.0123456789abcdef...YOUR_TOKEN_HERE...
✓ Authentication successful
```

---

### **Method C: Manual Configuration File**

Create `~/.wrangler/config.toml` and add:

```toml
[auth]
token = "v1.0123456789abcdef...YOUR_TOKEN_HERE..."
```

Then restart your terminal.

---

## Step 8: Verify Authentication

Test that Wrangler is authenticated:

```bash
wrangler whoami
```

**Expected output** (if successful):

```
⛅️ wrangler 4.46.0
────────────────────
Getting User settings...
  ✓ Email: your-email@example.com
  ✓ Account: your-account-name
```

**If you see an error** instead:

```
You are not authenticated. Please run `wrangler login`.
```

Go back and try one of the authentication methods above.

---

## Step 9: Deploy VibeSec

Once authenticated, you're ready to deploy! Use one of these:

### **Option A: Automated Deployment Script** (Recommended)

```bash
cd /path/to/vibesec
bash scripts/deploy-cloudflare.sh
```

This script will:

- Verify everything is ready
- Build the project
- Deploy to Cloudflare
- Show you the Worker URL
- Test the connection

### **Option B: Manual Deployment**

```bash
cd /path/to/vibesec
wrangler deploy
```

### **Option C: Deploy with Environment**

```bash
wrangler deploy --env production
```

---

## Step 10: Check Deployment Status

After deployment completes, you should see output like:

```
✨ Deployed to https://vibesec-mcp.your-subdomain.workers.dev
✨ Check the Cloudflare dashboard for more details:
   https://dash.cloudflare.com/?account=YOUR_ACCOUNT_ID/workers/services/view/vibesec-mcp
```

**Save this URL** - you'll need it for MCP configuration.

---

## Step 11: Get Your Worker URL

Your Worker URL will be in format:

```
https://vibesec-mcp.YOUR-SUBDOMAIN.workers.dev
```

The subdomain is random and assigned by Cloudflare.

To find it again later:

1. Go to https://dash.cloudflare.com
2. Click "Workers" in left sidebar
3. Find "vibesec-mcp" in your Workers list
4. Copy the URL from there

---

## Step 12: Test Your Deployment

Test that your Worker is responding:

```bash
# Test the HTTP endpoint (should return 426)
curl -I https://vibesec-mcp.YOUR-SUBDOMAIN.workers.dev

# View live logs
wrangler tail --format=pretty

# See deployment history
wrangler deployments list
```

---

## Step 13: Configure MCP Client

Update `.claude/mcp.json` in your project:

```json
{
  "mcpServers": {
    "vibesec": {
      "type": "remote",
      "url": "wss://vibesec-mcp.YOUR-SUBDOMAIN.workers.dev"
    }
  }
}
```

Replace `YOUR-SUBDOMAIN` with your actual subdomain from Step 11.

---

## Troubleshooting

### "Not authenticated" error

```bash
# Make sure you authenticated first
wrangler whoami

# If it fails, try:
wrangler auth login
# or
wrangler auth token
```

### "Invalid token" error

```bash
# Token might be expired or invalid. Create a new one:
# Go to https://dash.cloudflare.com/profile/api-tokens
# Click Create Token again
# Use the new token
```

### "Token has insufficient permissions"

Make sure you used the "Edit Cloudflare Workers" template which includes:

- Account → Workers (read, edit)

If you used a custom token, check permissions include "Workers".

### "Deployment failed" error

```bash
# Check your Worker is valid
npm run build:cloudflare

# Verify wrangler config
cat wrangler.toml

# Try deployment with verbose output
wrangler deploy --verbose
```

### Can't find Worker URL after deployment

```bash
# List all your Workers
wrangler deployments list

# Or go to dashboard
# https://dash.cloudflare.com
# Click "Workers" → find "vibesec-mcp"
```

---

## Security Best Practices

### ✅ DO:

- ✓ Use "Edit Cloudflare Workers" template (least privilege)
- ✓ Store token in password manager, not in files
- ✓ Set token expiration date (90 days recommended)
- ✓ Use different tokens for different projects
- ✓ Rotate tokens periodically
- ✓ Delete unused tokens

### ❌ DON'T:

- ✗ Commit tokens to Git
- ✗ Share tokens in chat/email
- ✗ Use token in client-side code
- ✗ Set token expiration to "Never"
- ✗ Use overly permissive templates

---

## What's Next?

Once deployed, you can:

1. **Monitor logs in real-time**:

   ```bash
   wrangler tail --format=pretty
   ```

2. **View usage in dashboard**:
   - https://dash.cloudflare.com
   - Click "Workers" → "vibesec-mcp"
   - See requests, errors, performance

3. **Configure in Claude Code**:
   - Update `.claude/mcp.json` with Worker URL
   - Try using `vibesec_scan_code` tool

4. **Check deployment history**:

   ```bash
   wrangler deployments list
   ```

5. **Rollback if needed**:
   ```bash
   wrangler rollback
   ```

---

## Quick Reference Commands

```bash
# Authentication
wrangler auth login              # Browser-based auth
wrangler auth token             # Token-based auth
wrangler whoami                  # Check if authenticated

# Deployment
wrangler deploy                  # Deploy to production
wrangler deploy --env staging    # Deploy to staging
wrangler rollback                # Rollback last deploy

# Monitoring
wrangler tail                    # View live logs
wrangler deployments list        # Show deployment history
wrangler secret list             # List secrets

# Configuration
cat wrangler.toml               # View config
npm run build:cloudflare        # Build for Cloudflare
```

---

## Questions?

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **VibeSec Deployment**: See `docs/CLOUDFLARE_DEPLOYMENT.md`

---

## Checklist - Ready to Deploy?

- [ ] Created Cloudflare account
- [ ] Generated API token
- [ ] Copied and saved token securely
- [ ] Ran `wrangler whoami` successfully
- [ ] Built project: `npm run build:cloudflare`
- [ ] Read this entire guide
- [ ] Ready to run deployment script

**When all checked**: Run `bash scripts/deploy-cloudflare.sh` 🚀
