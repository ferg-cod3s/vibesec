# VibeSec Demo Video Automation

Automated tools to create video demonstrations of VibeSec without manual typing or screen recording.

## 🎬 Quick Start

### Option 1: Automated Terminal Recording (Easiest)

```bash
# Run the automated demo script (watchable in terminal)
./demo-automation/record-demo.sh

# Record with asciinema (convertible to video/GIF)
asciinema rec -c "./demo-automation/record-demo.sh" vibesec-demo.cast

# Upload to asciinema.org for sharing
asciinema upload vibesec-demo.cast
```

### Option 2: Programmatic Generation (Most Flexible)

```bash
# Generate asciinema recording programmatically
python3 demo-automation/generate-demo-video.py --output vibesec-demo.cast

# View the recording
asciinema play vibesec-demo.cast

# Convert to animated GIF
agg vibesec-demo.cast vibesec-demo.gif

# Convert to SVG
svg-term --in vibesec-demo.cast --out vibesec-demo.svg
```

---

## 📦 Installation

### Required Tools

```bash
# Asciinema (terminal recording)
pip install asciinema

# OR on macOS
brew install asciinema

# OR on Ubuntu/Debian
sudo apt-add-repository ppa:zanchey/asciinema
sudo apt-get update
sudo apt-get install asciinema
```

### Optional (for video conversion)

```bash
# agg - Asciinema to GIF converter (Rust-based, fast)
cargo install agg

# svg-term - Convert to SVG
npm install -g svg-term-cli

# ImageMagick - For GIF optimization
brew install imagemagick  # macOS
sudo apt install imagemagick  # Ubuntu/Debian
```

---

## 🎥 Creating Videos

### Method 1: Asciinema → GIF (Recommended)

**Best for:** Social media, GitHub README, embedding

```bash
# 1. Generate recording
python3 demo-automation/generate-demo-video.py

# 2. Convert to GIF with agg (best quality)
agg vibesec-demo.cast vibesec-demo.gif

# 3. Optimize GIF size
gifsicle -O3 --colors 256 vibesec-demo.gif -o vibesec-demo-optimized.gif
```

**Output:** High-quality animated GIF (~2-5 MB)

---

### Method 2: Asciinema → SVG

**Best for:** Web pages, documentation sites

```bash
# Generate SVG animation
svg-term --in vibesec-demo.cast --out vibesec-demo.svg \
  --window --width 80 --height 24

# Or with custom theme
svg-term --in vibesec-demo.cast --out vibesec-demo.svg \
  --profile ./demo-automation/terminal-theme.json
```

**Output:** Scalable SVG animation (works in browsers)

---

### Method 3: Asciinema → MP4 Video

**Best for:** YouTube, Twitter video, LinkedIn

```bash
# Option A: Using asciinema-gif (via Docker)
docker run --rm -v $PWD:/data asciinema/asciicast2gif \
  vibesec-demo.cast vibesec-demo.gif

# Convert GIF to MP4
ffmpeg -i vibesec-demo.gif -movflags faststart \
  -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  vibesec-demo.mp4

# Option B: Using terminalizer (if installed)
terminalizer render vibesec-demo.cast -o vibesec-demo.gif
ffmpeg -i vibesec-demo.gif vibesec-demo.mp4
```

**Output:** MP4 video file suitable for all platforms

---

### Method 4: Screen Recording (Manual but Polished)

If you want more control over the final video:

```bash
# 1. Run the automated demo in a nice terminal
./demo-automation/record-demo.sh

# 2. While it runs, record your screen with:
#    - OBS Studio (free, cross-platform)
#    - QuickTime (macOS)
#    - SimpleScreenRecorder (Linux)

# 3. Edit if needed with:
#    - DaVinci Resolve (free)
#    - iMovie (macOS)
#    - OpenShot (cross-platform)
```

---

## 🎨 Customization

### Terminal Theme

Create a custom color scheme in `terminal-theme.json`:

```json
{
  "black": "#282828",
  "red": "#cc241d",
  "green": "#98971a",
  "yellow": "#d79921",
  "blue": "#458588",
  "magenta": "#b16286",
  "cyan": "#689d6a",
  "white": "#a89984",
  "brightBlack": "#928374",
  "brightRed": "#fb4934",
  "brightGreen": "#b8bb26",
  "brightYellow": "#fabd2f",
  "brightBlue": "#83a598",
  "brightMagenta": "#d3869b",
  "brightCyan": "#8ec07c",
  "brightWhite": "#ebdbb2",
  "background": "#282828",
  "foreground": "#ebdbb2"
}
```

### Modify Demo Script

Edit `record-demo.sh` or `generate-demo-video.py` to customize:
- Timing (pause durations)
- Content (which demos to show)
- Colors and formatting
- Terminal size

---

## 📏 Recommended Settings

### For Social Media

**Twitter/X:**
- Format: GIF or MP4
- Max size: 512 MB (GIF), 512 MB (video)
- Aspect ratio: 1:1 (square) or 16:9
- Duration: 30-60 seconds max
- Resolution: 1280x720 or 1920x1080

**LinkedIn:**
- Format: MP4
- Max size: 200 MB
- Aspect ratio: 16:9 or 1:1
- Duration: 60-90 seconds
- Resolution: 1920x1080

**Reddit:**
- Format: GIF or MP4
- Max size: 100 MB (GIF), 1 GB (video)
- Duration: 60-120 seconds
- Resolution: 1920x1080

### For Documentation

**GitHub README:**
- Format: GIF or SVG
- Max size: 10 MB (for fast loading)
- Width: 800-1000px
- Duration: 30-60 seconds

**Website/Blog:**
- Format: SVG (best) or optimized GIF
- Max size: 5 MB
- Responsive sizing
- Loop: Infinite or 3x

---

## 🎯 Demo Variants

### 30-Second Quick Demo

Focus on one key feature:

```bash
# Edit record-demo.sh and comment out scenes 3-6
# Keep only: Title + One vulnerability scan + End screen

./demo-automation/record-demo.sh
```

**Best for:** Twitter, quick social posts

---

### 90-Second Full Demo

Complete demonstration:

```bash
# Use full script as-is
python3 demo-automation/generate-demo-video.py
```

**Best for:** YouTube, LinkedIn, blog posts

---

### 3-Minute Tutorial

Add more explanation and slower pacing:

```bash
# Edit generate-demo-video.py
# Increase pause() durations
# Add more explanation text

python3 demo-automation/generate-demo-video.py
```

**Best for:** YouTube tutorials, documentation

---

## 🔧 Troubleshooting

### Issue: Asciinema not found

```bash
# Install asciinema
pip install asciinema

# Or use package manager
brew install asciinema  # macOS
apt install asciinema   # Ubuntu/Debian
```

### Issue: GIF conversion fails

```bash
# Install agg (recommended)
cargo install agg

# Or use Docker method
docker pull asciinema/asciicast2gif
```

### Issue: Colors not showing

```bash
# Ensure TERM is set correctly
export TERM=xterm-256color

# Verify in asciinema
asciinema rec --env=TERM test.cast
```

### Issue: File too large

```bash
# Optimize GIF with gifsicle
gifsicle -O3 --colors 128 input.gif -o output.gif

# Or reduce frame rate
agg --speed 1.5 input.cast output.gif

# Or reduce terminal size
python3 generate-demo-video.py --width 60 --height 20
```

---

## 📋 Complete Workflow Example

Here's a complete workflow from generation to publishing:

```bash
# 1. Generate the recording
python3 demo-automation/generate-demo-video.py \
  --output vibesec-demo.cast

# 2. Preview it
asciinema play vibesec-demo.cast

# 3. Convert to GIF for GitHub
agg vibesec-demo.cast vibesec-demo.gif

# 4. Optimize GIF
gifsicle -O3 --colors 256 vibesec-demo.gif \
  -o vibesec-demo-optimized.gif

# 5. Convert to MP4 for Twitter
ffmpeg -i vibesec-demo.gif -movflags faststart \
  -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  vibesec-demo.mp4

# 6. Generate SVG for website
svg-term --in vibesec-demo.cast --out vibesec-demo.svg \
  --window

# 7. Upload asciinema for sharing
asciinema upload vibesec-demo.cast
```

**Result:**
- `vibesec-demo.gif` - For GitHub README (5-10 MB)
- `vibesec-demo.mp4` - For Twitter/YouTube (2-5 MB)
- `vibesec-demo.svg` - For website embedding (1-2 MB)
- Asciinema URL - For easy sharing

---

## 🎬 Video Hosting Options

### Asciinema.org (Recommended for technical audiences)

**Pros:**
- Free hosting
- Perfect quality
- Easy sharing
- Embeddable player
- Supports copy-paste from recording

**How to use:**
```bash
asciinema upload vibesec-demo.cast
# Returns shareable URL
```

**Embed in README:**
```markdown
[![asciicast](https://asciinema.org/a/xxx.svg)](https://asciinema.org/a/xxx)
```

---

### YouTube (Best for reach)

**Pros:**
- Massive reach
- SEO benefits
- Comments and engagement
- Analytics

**How to prepare:**
```bash
# Convert to MP4 with high quality
ffmpeg -i vibesec-demo.gif -c:v libx264 -preset slow \
  -crf 22 -pix_fmt yuv420p vibesec-demo-hq.mp4

# Add title card and outro in video editor
# Upload to YouTube
```

---

### Twitter/X

**Pros:**
- Viral potential
- Immediate engagement
- Easy sharing

**How to prepare:**
```bash
# Keep under 512 MB
# 30-60 seconds max
# Use MP4 or GIF
ffmpeg -i input.gif -t 60 vibesec-twitter.mp4
```

---

### GitHub README

**Pros:**
- Always visible
- No external dependencies
- Loads with README

**How to embed:**
```markdown
![VibeSec Demo](./demo-automation/vibesec-demo.gif)

<!-- Or use SVG for better quality -->
![VibeSec Demo](./demo-automation/vibesec-demo.svg)
```

---

## 🎨 Advanced: Custom Animations

### Add Annotations

Use `termtosvg` with custom templates:

```bash
# Install termtosvg
pip install termtosvg

# Record with custom template
termtosvg record -t window_frame vibesec-demo.svg
```

### Add Subtitles

Create SRT file and overlay with ffmpeg:

```bash
# subtitles.srt
1
00:00:00,000 --> 00:00:03,000
VibeSec catches vulnerabilities AI misses

2
00:00:03,000 --> 00:00:06,000
Watch it detect hardcoded secrets...

# Add to video
ffmpeg -i vibesec-demo.mp4 -vf subtitles=subtitles.srt \
  vibesec-demo-subtitled.mp4
```

---

## 📊 File Size Comparison

Typical sizes for 60-second demo:

| Format | Size | Best For |
|--------|------|----------|
| .cast (source) | 50 KB | Sharing, archiving |
| .svg | 500 KB - 2 MB | Web embedding |
| .gif (optimized) | 3-8 MB | GitHub, social |
| .mp4 (720p) | 2-5 MB | Twitter, YouTube |
| .mp4 (1080p) | 5-15 MB | YouTube, LinkedIn |

---

## 🚀 Quick Reference

```bash
# Generate demo
python3 demo-automation/generate-demo-video.py

# Preview
asciinema play vibesec-demo.cast

# Convert to GIF
agg vibesec-demo.cast vibesec-demo.gif

# Convert to MP4
ffmpeg -i vibesec-demo.gif vibesec-demo.mp4

# Upload & share
asciinema upload vibesec-demo.cast
```

---

## 📝 Tips for Best Results

1. **Keep it short** - 60 seconds or less for social media
2. **High contrast** - Use dark background, bright text
3. **Readable font size** - Terminal should be easily readable
4. **Optimize file size** - Use appropriate quality settings
5. **Test on mobile** - Ensure text is readable on small screens
6. **Add context** - Include title/description when sharing
7. **Loop appropriately** - 3x for demos, infinite for README

---

## 🎯 Next Steps

1. **Generate your first demo:**
   ```bash
   python3 demo-automation/generate-demo-video.py
   ```

2. **Convert to your preferred format** (see workflows above)

3. **Share it:**
   - Add to README
   - Post on Twitter
   - Upload to YouTube
   - Share on Reddit

4. **Iterate based on feedback** - Adjust timing, content, style

---

**Need help?** Open an issue or check the main README.md for more information.
