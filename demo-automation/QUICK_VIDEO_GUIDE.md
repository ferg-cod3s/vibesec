# Create VibeSec Demo Video in 5 Minutes

**Goal:** Generate a professional demo video without any manual screen recording.

**Two versions available:**

- **Quick Demo** (90 sec) - Pure vulnerability showcase
- **Full Demo** (3 min) - Includes complete setup walkthrough

---

## ⚡ Super Quick (2 minutes)

We have **pre-generated demos** ready to use!

```bash
# Option 1: Quick demo (vulnerability showcase only)
asciinema upload demo-automation/vibesec-demo.cast

# Option 2: Full demo (with installation walkthrough)
asciinema upload demo-automation/vibesec-demo-full.cast

# Share the URL on Twitter/Reddit/Discord
```

**Result:** Shareable demo URL like `https://asciinema.org/a/xxxxx`

**Don't want to upload?** Just preview them:

```bash
asciinema play demo-automation/vibesec-demo.cast       # Quick (90s)
asciinema play demo-automation/vibesec-demo-full.cast  # Full (3min)
```

---

## 🎯 Which Demo Should You Use?

### Quick Demo (90 seconds) - `vibesec-demo.cast`

**Use for:**

- Twitter/X posts
- Reddit quick showcases
- GitHub README
- "What it does" content

**Shows:** Vulnerability detection only (no installation)

### Full Demo (3 minutes) - `vibesec-demo-full.cast`

**Use for:**

- YouTube tutorials
- Blog post walkthroughs
- LinkedIn professional posts
- First-time users

**Shows:** Complete installation + vulnerability detection

**See `DEMO_VERSIONS.md` for detailed comparison.**

---

## 🎬 GIF for Social Media (5 minutes)

### Requirements

```bash
# Install agg (one-time setup)
cargo install agg
```

### Create GIF

```bash
# Quick demo (for Twitter/README)
agg demo-automation/vibesec-demo.cast quick-demo.gif

# OR Full demo (for tutorials)
agg demo-automation/vibesec-demo-full.cast full-demo.gif

# Optimize size (optional)
gifsicle -O3 --colors 256 quick-demo.gif -o quick-optimized.gif
```

**Result:** Animated GIF ready for Twitter, Reddit, GitHub README

**File size:**

- Quick demo: ~3-5 MB (optimized)
- Full demo: ~8-12 MB (optimized)

---

## 📺 MP4 for YouTube/Twitter (7 minutes)

### Requirements

```bash
# Install ffmpeg (one-time setup)
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Ubuntu/Debian
```

### Create MP4

```bash
# Quick demo (for Twitter)
agg demo-automation/vibesec-demo.cast temp-quick.gif
ffmpeg -i temp-quick.gif -movflags faststart \
  -pix_fmt yuv420p -c:v libx264 -crf 22 \
  quick-demo.mp4

# Full demo (for YouTube)
agg demo-automation/vibesec-demo-full.cast temp-full.gif
ffmpeg -i temp-full.gif -movflags faststart \
  -pix_fmt yuv420p -c:v libx264 -crf 18 \
  full-demo.mp4

# Cleanup
rm temp-*.gif
```

**Result:** MP4 video ready for YouTube, Twitter, LinkedIn

**File size:**

- Quick demo: ~2-5 MB
- Full demo: ~8-15 MB

---

## 🎨 Customize the Demo

### Change Timing

Edit `demo-automation/generate-demo-video.py`:

```python
# Make pauses longer for easier reading
recorder.pause(2)  # Change from 1 to 2 seconds

# Make typing faster
recorder.type_text("command here", 0.02)  # Faster typing (was 0.04)
```

### Change Content

Comment out scenes you don't want:

```python
# In generate_vibesec_demo() function:

# Scene 1: What VibeSec Detects
# ... keep this ...

# Scene 2: List Rules Demo
# ... comment this out if you want shorter demo ...

# Scene 3: Scan Vulnerable Code
# ... keep this ...
```

### Change Terminal Size

```bash
# Wider terminal for more content
python3 demo-automation/generate-demo-video.py --width 100 --height 30

# Smaller for mobile-optimized GIF
python3 demo-automation/generate-demo-video.py --width 60 --height 20
```

---

## 📱 Platform-Specific Guides

### Twitter/X

**Specs:**

- Format: GIF or MP4
- Max size: 512 MB
- Recommended: 30-60 seconds
- Aspect ratio: 16:9 or 1:1

**Command:**

```bash
# Generate short demo
python3 demo-automation/generate-demo-video.py

# Convert to optimized GIF
agg demo-automation/vibesec-demo.cast demo-automation/twitter.gif

# Or create MP4 for better quality
ffmpeg -i demo-automation/twitter.gif \
  -t 60 \
  -c:v libx264 -preset slow -crf 22 \
  demo-automation/twitter.mp4
```

---

### YouTube

**Specs:**

- Format: MP4
- Recommended: 1920x1080
- Minimum: 1280x720

**Command:**

```bash
# Generate high-quality MP4
python3 demo-automation/generate-demo-video.py --width 100 --height 30

agg demo-automation/vibesec-demo.cast demo-automation/temp.gif

ffmpeg -i demo-automation/temp.gif \
  -c:v libx264 -preset slow -crf 18 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  demo-automation/youtube.mp4
```

---

### GitHub README

**Specs:**

- Format: GIF or SVG
- Max size: 10 MB (for fast loading)
- Recommended: 800-1000px wide

**Command:**

```bash
# Generate optimized GIF
python3 demo-automation/generate-demo-video.py

agg demo-automation/vibesec-demo.cast demo-automation/readme.gif

gifsicle -O3 --colors 128 --resize-width 800 \
  demo-automation/readme.gif -o demo-automation/vibesec-demo-readme.gif
```

**Embed in README:**

```markdown
![VibeSec Demo](./demo-automation/vibesec-demo-readme.gif)
```

---

## 🔍 Preview Before Converting

Always preview your demo before converting to video:

```bash
# Install asciinema if not already
pip install asciinema

# Preview in terminal
asciinema play demo-automation/vibesec-demo.cast

# Use arrow keys to control playback:
# - Space: pause/resume
# - . (period): step forward
# - Ctrl+C: exit
```

---

## 🐛 Troubleshooting

### "Command not found: agg"

```bash
# Install Rust first
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Then install agg
cargo install agg
```

### "Command not found: asciinema"

```bash
# Install asciinema
pip install asciinema

# Or use package manager
brew install asciinema  # macOS
sudo apt install asciinema  # Ubuntu/Debian
```

### GIF file too large

```bash
# Reduce colors
gifsicle -O3 --colors 64 input.gif -o output.gif

# Resize
gifsicle --resize-width 600 input.gif -o output.gif

# Both
gifsicle -O3 --colors 128 --resize-width 700 input.gif -o output.gif
```

### MP4 looks pixelated

```bash
# Use higher quality setting (lower CRF = higher quality)
ffmpeg -i input.gif -c:v libx264 -crf 18 output.mp4  # High quality
ffmpeg -i input.gif -c:v libx264 -crf 28 output.mp4  # Lower quality, smaller file
```

---

## 📋 Complete Workflow Checklist

- [ ] Generate demo: `python3 demo-automation/generate-demo-video.py`
- [ ] Preview: `asciinema play demo-automation/vibesec-demo.cast`
- [ ] Satisfied with content? If not, edit script and regenerate
- [ ] Convert to GIF: `agg demo-automation/vibesec-demo.cast output.gif`
- [ ] Optimize: `gifsicle -O3 output.gif -o final.gif`
- [ ] Convert to MP4 (optional): `ffmpeg -i final.gif output.mp4`
- [ ] Upload and share!

---

## 🎯 Ready-to-Use Commands

Copy-paste these for instant results:

### Quick Share (asciinema.org)

```bash
# Quick demo
asciinema upload demo-automation/vibesec-demo.cast

# Full demo with setup
asciinema upload demo-automation/vibesec-demo-full.cast
```

### Twitter GIF (Quick Demo)

```bash
agg demo-automation/vibesec-demo.cast twitter.gif && \
gifsicle -O3 --colors 256 twitter.gif -o twitter-optimized.gif
```

### GitHub README (Quick Demo)

```bash
agg demo-automation/vibesec-demo.cast readme.gif && \
gifsicle -O3 --colors 128 --resize-width 800 \
  readme.gif -o vibesec-demo.gif
```

### YouTube MP4 (Full Demo)

```bash
agg demo-automation/vibesec-demo-full.cast temp.gif && \
ffmpeg -i temp.gif -c:v libx264 -preset slow -crf 18 \
  youtube-full.mp4 && \
rm temp.gif
```

### Blog Post GIF (Full Demo)

```bash
agg demo-automation/vibesec-demo-full.cast blog.gif && \
gifsicle -O3 --colors 256 blog.gif -o blog-optimized.gif
```

---

## 🚀 Next Steps

1. **Generate your first video** using one of the commands above
2. **Preview it** to make sure it looks good
3. **Share it** on your platform of choice
4. **Iterate** - adjust timing, content, or style as needed

**Questions?** Check the full `README.md` in this directory or open an issue.

---

**Total time from zero to video: 5-10 minutes** ⚡
