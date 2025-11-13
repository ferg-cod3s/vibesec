# VibeSec Demo Versions

We have **two demo versions** to choose from, depending on your audience and use case.

---

## 📋 Available Demos

### 1. **Quick Demo** (`vibesec-demo.cast`) - 90 seconds

**Best for:** Social media, quick showcases, experienced developers

**Content:**

- Brief introduction
- List security rules
- Scan hardcoded secrets (7 findings)
- Scan SQL injection (with fix)
- Summary and call to action

**Duration:** ~90 seconds
**File size:** 16 KB
**Focus:** Pure vulnerability detection showcase

**Use when:**

- Posting on Twitter/X (30-60 second clips)
- Quick Reddit posts
- GitHub README embed
- You want to show "what it does" not "how to install"

---

### 2. **Full Demo with Setup** (`vibesec-demo-full.cast`) - 3 minutes

**Best for:** YouTube tutorials, comprehensive guides, new users

**Content:**

- **Part 1: Installation & Setup (60 seconds)**
  - Clone repository
  - Install dependencies (bun install)
  - Configure MCP in ~/.claude/mcp.json
  - Restart Claude Code
  - Verify installation

- **Part 2: VibeSec in Action (120 seconds)**
  - What VibeSec detects
  - List security rules
  - Scan hardcoded secrets (7 findings)
  - Scan SQL injection (with fix)
  - Complete summary with setup time

**Duration:** ~3 minutes
**File size:** 25 KB
**Focus:** Complete end-to-end experience

**Use when:**

- YouTube tutorials
- Blog posts with walkthroughs
- Documentation with full examples
- First-time users need complete guide
- LinkedIn professional posts
- You want to show "everything from scratch"

---

## 🎯 Which Demo Should You Use?

### Use Quick Demo If:

- ✅ Audience already knows how to install tools
- ✅ You want fast, punchy content
- ✅ Platform has short attention span (Twitter, TikTok)
- ✅ You're embedding in README or docs
- ✅ Focus is on "what problems it solves"

### Use Full Demo If:

- ✅ Audience is new to MCP or VibeSec
- ✅ You want educational content
- ✅ Platform supports longer content (YouTube, blog)
- ✅ You're creating a tutorial
- ✅ Focus is on "how to get started"

---

## 🎬 Generating Both Versions

### Quick Demo (current default)

```bash
# Generate quick demo (no setup walkthrough)
python3 demo-automation/generate-demo-video.py \
  --output demo-automation/vibesec-demo.cast
```

### Full Demo with Setup

```bash
# Generate full demo (includes setup)
python3 demo-automation/generate-demo-video.py \
  --output demo-automation/vibesec-demo-full.cast
```

**Note:** Currently both commands generate the full version. To get the quick version, use the pre-generated `vibesec-demo.cast` file or comment out the setup sections in the Python script.

---

## 📊 Comparison Table

| Aspect              | Quick Demo       | Full Demo     |
| ------------------- | ---------------- | ------------- |
| **Duration**        | 90 seconds       | 3 minutes     |
| **File Size**       | 16 KB            | 25 KB         |
| **Setup Included**  | ❌ No            | ✅ Yes        |
| **Best For**        | Social media     | Tutorials     |
| **Target Audience** | Experienced devs | New users     |
| **Focus**           | What it does     | How to use it |
| **Platforms**       | Twitter, Reddit  | YouTube, Blog |

---

## 🚀 Converting to Different Formats

Both demos can be converted to any format:

### Animated GIF

```bash
# Quick demo (smaller file)
agg demo-automation/vibesec-demo.cast quick-demo.gif

# Full demo (larger file)
agg demo-automation/vibesec-demo-full.cast full-demo.gif
```

### MP4 Video

```bash
# Quick demo for Twitter
agg demo-automation/vibesec-demo.cast temp.gif
ffmpeg -i temp.gif -c:v libx264 -crf 22 quick-demo.mp4

# Full demo for YouTube
agg demo-automation/vibesec-demo-full.cast temp.gif
ffmpeg -i temp.gif -c:v libx264 -crf 18 full-demo.mp4
```

### Upload to Asciinema

```bash
# Quick demo
asciinema upload demo-automation/vibesec-demo.cast

# Full demo
asciinema upload demo-automation/vibesec-demo-full.cast
```

---

## 💡 Platform-Specific Recommendations

### Twitter/X

**Use:** Quick Demo
**Format:** GIF or 30-second MP4 clip
**Why:** Fast-paced platform, attention span is short

```bash
agg demo-automation/vibesec-demo.cast twitter.gif
gifsicle -O3 --colors 256 twitter.gif -o twitter-optimized.gif
```

---

### YouTube

**Use:** Full Demo with Setup
**Format:** HD MP4 (1080p)
**Why:** Educational platform, viewers expect thorough content

```bash
agg demo-automation/vibesec-demo-full.cast temp.gif
ffmpeg -i temp.gif -c:v libx264 -preset slow -crf 18 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease" \
  youtube-full.mp4
```

---

### GitHub README

**Use:** Quick Demo
**Format:** Optimized GIF (under 5 MB)
**Why:** Fast page load, viewers want quick overview

```bash
agg demo-automation/vibesec-demo.cast readme.gif
gifsicle -O3 --resize-width 800 --colors 128 \
  readme.gif -o vibesec-demo-readme.gif
```

---

### Blog Post (Dev.to, Medium)

**Use:** Full Demo with Setup
**Format:** Asciinema embed or GIF
**Why:** Readers want complete walkthrough

```bash
# Option 1: Asciinema embed (interactive)
asciinema upload demo-automation/vibesec-demo-full.cast
# Copy embed code

# Option 2: GIF (static)
agg demo-automation/vibesec-demo-full.cast blog-demo.gif
```

---

### LinkedIn

**Use:** Full Demo with Setup
**Format:** MP4 (professional quality)
**Why:** Professional audience, expect complete picture

```bash
agg demo-automation/vibesec-demo-full.cast temp.gif
ffmpeg -i temp.gif -c:v libx264 -crf 20 linkedin.mp4
```

---

### Reddit r/programming or r/ClaudeAI

**Use:** Either (depends on post type)
**Format:** GIF or Asciinema link

**For showcase posts:** Quick Demo

```bash
agg demo-automation/vibesec-demo.cast reddit-quick.gif
```

**For "how I built this" posts:** Full Demo

```bash
asciinema upload demo-automation/vibesec-demo-full.cast
```

---

## 🎨 Customizing Demo Content

### Creating a Custom Quick Demo

Edit `generate-demo-video.py` and comment out the setup sections:

```python
# Comment out these sections:
# - Setup Section (lines 113-193)
# - Verification (lines 195-211)
# - Transition to demo (lines 213-218)

# Keep these sections:
# - Title screen
# - Introduction
# - What VibeSec Detects
# - Demo 1: List Rules
# - Demo 2: Scan Secrets
# - Demo 3: SQL Injection
# - Summary
# - End screen
```

### Creating Platform-Specific Variants

**30-second Twitter clip:**

```python
# Keep only:
- Title (5 sec)
- Demo 2: Scan Secrets (20 sec)
- End screen (5 sec)
```

**60-second LinkedIn:**

```python
# Keep only:
- Title (5 sec)
- Setup summary (15 sec)
- Demo 2: Scan Secrets (25 sec)
- Summary (15 sec)
```

---

## 📏 Timing Breakdown

### Quick Demo (90 seconds)

```
0:00-0:10   Title & Introduction
0:10-0:25   List Security Rules
0:25-0:50   Scan Hardcoded Secrets
0:50-1:15   Scan SQL Injection
1:15-1:30   Summary & CTA
```

### Full Demo (3 minutes)

```
0:00-0:10   Title & Introduction
0:10-0:30   Setup Step 1: Clone repo
0:30-0:50   Setup Step 2: Install dependencies
0:50-1:10   Setup Step 3: Configure MCP
1:10-1:20   Setup Step 4: Restart & Verify
1:20-1:35   What VibeSec Detects
1:35-1:50   List Security Rules
1:50-2:15   Scan Hardcoded Secrets
2:15-2:40   Scan SQL Injection
2:40-3:00   Summary & CTA
```

---

## 🔄 Updating Demos

When VibeSec features change, update both demos:

```bash
# 1. Edit generate-demo-video.py
nano demo-automation/generate-demo-video.py

# 2. Regenerate both versions
python3 demo-automation/generate-demo-video.py \
  --output demo-automation/vibesec-demo-full.cast

# 3. Create quick version (manual - comment out setup)
# Or use pre-generated quick demo

# 4. Convert to your needed formats
agg demo-automation/vibesec-demo.cast quick.gif
agg demo-automation/vibesec-demo-full.cast full.gif
```

---

## 📦 Pre-Generated Demos

Both demo files are included in the repository:

```
demo-automation/
├── vibesec-demo.cast           # Quick demo (16 KB)
├── vibesec-demo-full.cast      # Full demo with setup (25 KB)
└── ...
```

**You can use them immediately without regenerating!**

```bash
# Preview quick demo
asciinema play demo-automation/vibesec-demo.cast

# Preview full demo
asciinema play demo-automation/vibesec-demo-full.cast

# Upload either one
asciinema upload demo-automation/vibesec-demo.cast
asciinema upload demo-automation/vibesec-demo-full.cast
```

---

## 🎯 Quick Reference

**Quick Demo:**

- Use for: Social media, quick showcases
- Duration: 90 seconds
- File: `vibesec-demo.cast` (16 KB)

**Full Demo:**

- Use for: Tutorials, first-time users
- Duration: 3 minutes
- File: `vibesec-demo-full.cast` (25 KB)

**Both are ready to use right now!**

```bash
# View them
asciinema play demo-automation/vibesec-demo.cast
asciinema play demo-automation/vibesec-demo-full.cast

# Share them
asciinema upload demo-automation/vibesec-demo.cast
asciinema upload demo-automation/vibesec-demo-full.cast

# Convert them
agg demo-automation/vibesec-demo.cast quick.gif
agg demo-automation/vibesec-demo-full.cast full.gif
```

---

**Choose the right demo for your audience and platform!** 🎬
