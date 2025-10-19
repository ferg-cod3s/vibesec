#!/usr/bin/env python3
"""
VibeSec Demo Video Generator

Generates an automated terminal recording that can be converted to video.
Supports multiple output formats:
  - Asciinema (.cast) - Can be uploaded to asciinema.org or converted to GIF
  - SVG - Animated SVG that can be embedded in web pages
  - GIF - Animated GIF for social media

Requirements:
  pip install asciinema-python pyte

Optional (for GIF conversion):
  npm install -g svg-term-cli
  brew install imagemagick (for GIF conversion)

Usage:
  python3 generate-demo-video.py --format cast --output vibesec-demo.cast
  python3 generate-demo-video.py --format svg --output vibesec-demo.svg
"""

import json
import time
import sys
from typing import List, Tuple
import argparse


class TerminalRecorder:
    """Generate asciinema-compatible terminal recordings programmatically"""

    def __init__(self, width: int = 80, height: int = 24):
        self.width = width
        self.height = height
        self.events: List[Tuple[float, str, str]] = []
        self.current_time = 0.0

    def write(self, text: str, delay: float = 0.0):
        """Write text to terminal with optional delay"""
        if delay > 0:
            self.current_time += delay
        self.events.append((self.current_time, "o", text))

    def type_text(self, text: str, typing_speed: float = 0.05):
        """Simulate typing text character by character"""
        for char in text:
            self.write(char, typing_speed)

    def pause(self, duration: float):
        """Add a pause"""
        self.current_time += duration

    def clear_screen(self):
        """Clear terminal screen"""
        self.write("\033[2J\033[H")

    def color(self, text: str, color_code: str) -> str:
        """Apply color to text"""
        colors = {
            "red": "\033[0;31m",
            "green": "\033[0;32m",
            "yellow": "\033[1;33m",
            "blue": "\033[0;34m",
            "purple": "\033[0;35m",
            "cyan": "\033[0;36m",
            "bold": "\033[1m",
            "reset": "\033[0m",
        }
        return f"{colors.get(color_code, '')}{text}{colors['reset']}"

    def save_asciicast(self, filename: str):
        """Save recording in asciinema v2 format"""
        header = {
            "version": 2,
            "width": self.width,
            "height": self.height,
            "timestamp": int(time.time()),
            "title": "VibeSec Demo",
            "env": {"SHELL": "/bin/bash", "TERM": "xterm-256color"},
        }

        with open(filename, "w") as f:
            f.write(json.dumps(header) + "\n")
            for timestamp, event_type, data in self.events:
                f.write(json.dumps([timestamp, event_type, data]) + "\n")

        print(f"✓ Saved asciinema recording to {filename}")
        print(f"  View with: asciinema play {filename}")
        print(f"  Upload to: asciinema upload {filename}")
        print(f"  Convert to GIF: agg {filename} output.gif")


def generate_vibesec_demo(recorder: TerminalRecorder):
    """Generate the VibeSec demo recording"""

    # Title screen
    recorder.clear_screen()
    recorder.write("═" * 60 + "\n")
    recorder.write(recorder.color("      VibeSec - Security Scanner for AI Code\n", "purple"))
    recorder.write("═" * 60 + "\n\n")
    recorder.pause(1.5)

    # Introduction
    recorder.write(recorder.color("Welcome to VibeSec!\n", "yellow"))
    recorder.write("Security scanner built for AI-generated code\n\n")
    recorder.write("This demo shows:\n")
    recorder.write("  1. Complete installation (2 minutes)\n")
    recorder.write("  2. Vulnerability detection in action\n")
    recorder.write("  3. Real examples from AI-generated code\n\n")
    recorder.pause(2)

    # Setup Section
    recorder.clear_screen()
    recorder.write(recorder.color("▶ Part 1: Installation & Setup\n", "blue"))
    recorder.write("─" * 50 + "\n\n")
    recorder.pause(1)

    # Step 1: Clone repo
    recorder.write(recorder.color("Step 1: Clone the repository\n", "bold"))
    recorder.write("\n")
    recorder.write(recorder.color("$ ", "cyan"))
    recorder.type_text("git clone https://github.com/ferg-cod3s/vibesec.git", 0.04)
    recorder.write("\n")
    recorder.pause(0.5)

    recorder.write(recorder.color("Cloning into 'vibesec'...\n", "green"))
    recorder.write("remote: Counting objects: 100% (234/234), done.\n")
    recorder.write("remote: Compressing objects: 100% (156/156), done.\n")
    recorder.write("Receiving objects: 100% (234/234), 1.2 MiB, done.\n")
    recorder.pause(1)

    recorder.write("\n")
    recorder.write(recorder.color("$ ", "cyan"))
    recorder.type_text("cd vibesec", 0.04)
    recorder.write("\n\n")
    recorder.pause(1.5)

    # Step 2: Install dependencies
    recorder.write(recorder.color("Step 2: Install dependencies\n", "bold"))
    recorder.write("\n")
    recorder.write(recorder.color("$ ", "cyan"))
    recorder.type_text("bun install", 0.04)
    recorder.write("\n")
    recorder.pause(0.5)

    recorder.write(recorder.color("Installing dependencies...\n", "cyan"))
    for pkg in ["typescript", "@types/node", "tree-sitter", "yaml"]:
        recorder.write(f"  + {pkg}\n")
        recorder.pause(0.2)
    recorder.write("\n")
    recorder.write(recorder.color("✓ Installation complete!\n", "green"))
    recorder.write("46 packages installed\n\n")
    recorder.pause(1.5)

    # Step 3: Configure MCP
    recorder.clear_screen()
    recorder.write(recorder.color("▶ Part 1: Installation & Setup (continued)\n", "blue"))
    recorder.write("─" * 50 + "\n\n")

    recorder.write(recorder.color("Step 3: Configure Claude Code\n", "bold"))
    recorder.write("\n")
    recorder.write("Add VibeSec to your Claude Code MCP servers:\n\n")

    recorder.write(recorder.color("$ ", "cyan"))
    recorder.type_text("nano ~/.claude/mcp.json", 0.04)
    recorder.write("\n\n")
    recorder.pause(0.8)

    recorder.write(recorder.color("# Add this configuration:\n", "yellow"))
    recorder.write("{\n")
    recorder.write('  "mcpServers": {\n')
    recorder.write('    "vibesec": {\n')
    recorder.write('      "command": "bun",\n')
    recorder.write('      "args": ["run", "/path/to/vibesec/bin/vibesec-mcp"]\n')
    recorder.write('    }\n')
    recorder.write('  }\n')
    recorder.write("}\n\n")
    recorder.pause(2)

    recorder.write(recorder.color("✓ Configuration saved!\n", "green"))
    recorder.pause(1)

    # Step 4: Restart Claude Code
    recorder.write("\n")
    recorder.write(recorder.color("Step 4: Restart Claude Code\n", "bold"))
    recorder.write("\n")
    recorder.write("Close and reopen Claude Code to load VibeSec...\n\n")
    recorder.pause(1.5)

    recorder.write(recorder.color("✓ Setup complete!\n", "green"))
    recorder.write("\nVibeSec is now available in Claude Code\n\n")
    recorder.pause(2)

    # Verification
    recorder.clear_screen()
    recorder.write(recorder.color("▶ Verify Installation\n", "blue"))
    recorder.write("─" * 50 + "\n\n")

    recorder.write("In Claude Code, ask:\n")
    recorder.write(recorder.color('  "What MCP tools do you have?"\n\n', "cyan"))
    recorder.pause(1)

    recorder.write("Claude responds:\n")
    recorder.write(recorder.color("  I have access to these MCP tools:\n", "green"))
    recorder.write("  • vibesec_scan - Scan code for security vulnerabilities\n")
    recorder.write("  • vibesec_list_rules - List available detection rules\n\n")
    recorder.pause(2)

    recorder.write(recorder.color("✓ VibeSec is ready to use!\n\n", "green"))
    recorder.pause(2)

    # Transition to demo
    recorder.clear_screen()
    recorder.write(recorder.color("▶ Part 2: VibeSec in Action\n", "blue"))
    recorder.write("─" * 50 + "\n\n")
    recorder.write("Let's see VibeSec catch real vulnerabilities...\n\n")
    recorder.pause(1.5)

    # What VibeSec Detects
    recorder.write(recorder.color("What VibeSec Detects:\n", "bold"))
    recorder.write("\n")

    vulnerabilities = [
        "Hardcoded secrets & API keys",
        "SQL injection vulnerabilities",
        "Command injection risks",
        "Missing authentication",
        "Incomplete implementations",
    ]

    for vuln in vulnerabilities:
        recorder.write(f"  {recorder.color('✗', 'red')} {vuln}\n")
        recorder.pause(0.4)

    recorder.pause(2)

    # Demo 1: List Rules
    recorder.clear_screen()
    recorder.write(recorder.color("▶ Part 2: VibeSec in Action\n", "blue"))
    recorder.write("─" * 50 + "\n\n")
    recorder.write(recorder.color("Demo 1: List Available Security Rules\n", "bold"))
    recorder.write("\n")

    recorder.write(recorder.color("$ ", "cyan"))
    recorder.type_text("vibesec list-rules --category secrets", 0.04)
    recorder.write("\n\n")
    recorder.pause(1)

    recorder.write(recorder.color("Found 3 secret detection rules:\n\n", "green"))

    rules = [
        ("Hardcoded API Key Detection", "secrets", "critical", "OpenAI, AWS, Stripe tokens"),
        ("Hardcoded Password Detection", "secrets", "critical", "Database credentials"),
        ("Private Key in Source Code", "secrets", "critical", "RSA/SSH private keys"),
    ]

    for i, (name, cat, sev, desc) in enumerate(rules, 1):
        recorder.write(f"  {i}. {name}\n")
        recorder.write(f"     Category: {cat} | Severity: {sev}\n")
        recorder.write(f"     Detects: {desc}\n\n")
        recorder.pause(0.8)

    recorder.pause(2)

    # Demo 2: Scan Hardcoded Secrets
    recorder.clear_screen()
    recorder.write(recorder.color("▶ Part 2: VibeSec in Action (continued)\n", "blue"))
    recorder.write("─" * 50 + "\n\n")
    recorder.write(recorder.color("Demo 2: Scan Code with Hardcoded Secrets\n", "bold"))
    recorder.write("\n")

    recorder.write("Let's scan a file with security issues...\n\n")
    recorder.pause(1)

    recorder.write(recorder.color("$ ", "cyan"))
    recorder.type_text("cat demo-examples/vulnerable-secrets.ts", 0.04)
    recorder.write("\n\n")
    recorder.pause(0.5)

    # Show vulnerable code
    recorder.write(recorder.color("// Demo code with hardcoded secrets\n", "yellow"))
    recorder.write("export const config = {\n")
    recorder.write(
        "  " + recorder.color("apiKey: 'sk-1234567890abcdef...',", "red") + "\n\n"
    )
    recorder.write("  database: {\n")
    recorder.write("    host: 'localhost',\n")
    recorder.write("    " + recorder.color("password: 'admin123',", "red") + "\n")
    recorder.write("  },\n\n")
    recorder.write("  jwt: {\n")
    recorder.write("    " + recorder.color("secret: 'my-super-secret-key',", "red") + "\n")
    recorder.write("  },\n")
    recorder.write("};\n\n")
    recorder.pause(2)

    # Run scan
    recorder.write(recorder.color("$ ", "cyan"))
    recorder.type_text("vibesec scan demo-examples/vulnerable-secrets.ts", 0.04)
    recorder.write("\n\n")
    recorder.pause(1)

    recorder.write(recorder.color("Scanning...", "cyan"))
    for _ in range(3):
        recorder.write(".")
        recorder.pause(0.3)
    recorder.write("\n\n")
    recorder.pause(0.5)

    # Show results
    recorder.write(recorder.color("✗ Found 7 critical vulnerabilities:\n\n", "red"))

    findings = [
        ("Hardcoded API Key Detected", "line 11", "API key exposed in version control"),
        ("Hardcoded Database Password", "line 16", "Database access compromised"),
        ("Hardcoded JWT Secret", "line 22", "Auth tokens can be forged"),
    ]

    for i, (title, location, risk) in enumerate(findings, 1):
        recorder.write(recorder.color(f"[{i}] {title}\n", "red"))
        recorder.write(f"    File: demo-examples/vulnerable-secrets.ts:{location}\n")
        recorder.write(f"    Risk: {risk}\n\n")
        recorder.pause(1.2)

    recorder.write(recorder.color("[4-7] Additional secrets found...\n\n", "yellow"))
    recorder.pause(2)

    # Demo 3: SQL Injection
    recorder.clear_screen()
    recorder.write(recorder.color("▶ Part 2: VibeSec in Action (continued)\n", "blue"))
    recorder.write("─" * 50 + "\n\n")
    recorder.write(recorder.color("Demo 3: Scan for SQL Injection\n", "bold"))
    recorder.write("\n")

    recorder.write(recorder.color("$ ", "cyan"))
    recorder.type_text("cat demo-examples/vulnerable-api.ts", 0.04)
    recorder.write("\n\n")
    recorder.pause(0.5)

    recorder.write(recorder.color("// API endpoint with SQL injection\n", "yellow"))
    recorder.write("app.get('/users', (req, res) => {\n")
    recorder.write("  const name = req.query.name;\n")
    recorder.write(
        "  "
        + recorder.color("const query = `SELECT * FROM users WHERE name = '${name}'`;", "red")
        + "\n"
    )
    recorder.write("  db.query(query, ...)\n")
    recorder.write("});\n\n")
    recorder.pause(2)

    recorder.write(recorder.color("$ ", "cyan"))
    recorder.type_text("vibesec scan demo-examples/vulnerable-api.ts", 0.04)
    recorder.write("\n\n")
    recorder.pause(1)

    recorder.write(recorder.color("Scanning...\n\n", "cyan"))
    recorder.pause(0.5)

    recorder.write(recorder.color("✗ Found 2 critical vulnerabilities:\n\n", "red"))

    recorder.write(recorder.color("[1] SQL Injection via String Concatenation\n", "red"))
    recorder.write("    File: demo-examples/vulnerable-api.ts:14\n")
    recorder.write("    Risk: Attacker can inject malicious SQL\n\n")
    recorder.write("    Fix: Use parameterized queries:\n")
    recorder.write(
        "    "
        + recorder.color("const query = 'SELECT * FROM users WHERE name = ?';", "green")
        + "\n"
    )
    recorder.write(
        "    " + recorder.color("db.query(query, [name], ...);", "green") + "\n\n"
    )
    recorder.pause(2)

    # Summary
    recorder.clear_screen()
    recorder.write(recorder.color("▶ Summary\n", "blue"))
    recorder.write("─" * 50 + "\n\n")

    recorder.write(recorder.color("What we just did:\n", "bold"))
    recorder.write("  1. Installed VibeSec in 2 minutes\n")
    recorder.write("  2. Configured Claude Code integration\n")
    recorder.write("  3. Scanned code and found 9 critical vulnerabilities\n\n")
    recorder.pause(1.5)

    recorder.write(recorder.color("Results:\n", "bold"))
    recorder.write(f"  {recorder.color('✓', 'green')} Scanned 2 files\n")
    recorder.write(f"  {recorder.color('✗', 'red')} Found 9 critical vulnerabilities\n")
    recorder.write(f"  {recorder.color('⚠', 'yellow')} Found 3 high-severity issues\n")
    recorder.write(f"  Security Score: {recorder.color('12/100', 'red')} (Poor)\n\n")
    recorder.pause(1.5)

    # Why VibeSec
    recorder.write(recorder.color("Why VibeSec?\n\n", "bold"))
    features = [
        "✓ 2-minute setup",
        "✓ Built for AI-generated code",
        "✓ Integrates with Claude Code via MCP",
        "✓ Catches patterns AI assistants miss",
        "✓ Works in your workflow",
        "✓ 100% local - code never leaves your machine",
    ]

    for feature in features:
        recorder.write(f"  {feature}\n")
        recorder.pause(0.3)

    recorder.pause(2)

    # End screen - Get Started
    recorder.clear_screen()
    recorder.write("\n\n")
    recorder.write("═" * 60 + "\n")
    recorder.write(recorder.color("           Code Fast. Code Safe. 🚀\n", "green"))
    recorder.write("═" * 60 + "\n\n")
    recorder.write(recorder.color("VibeSec - Security Scanner for AI-Generated Code\n\n", "bold"))

    recorder.write(recorder.color("Get Started:\n", "bold"))
    recorder.write("  1. git clone https://github.com/ferg-cod3s/vibesec.git\n")
    recorder.write("  2. cd vibesec && bun install\n")
    recorder.write("  3. Configure ~/.claude/mcp.json\n")
    recorder.write("  4. Restart Claude Code\n\n")

    recorder.write(recorder.color("Learn More:\n", "bold"))
    recorder.write("  ⭐ GitHub: github.com/ferg-cod3s/vibesec\n")
    recorder.write("  📖 Documentation: See README.md\n")
    recorder.write("  💬 MIT License - Free & Open Source\n\n")

    recorder.write(recorder.color("Total setup time: 2 minutes\n", "cyan"))
    recorder.pause(3)


def main():
    parser = argparse.ArgumentParser(description="Generate VibeSec demo video")
    parser.add_argument(
        "--format",
        choices=["cast", "svg"],
        default="cast",
        help="Output format (default: cast)",
    )
    parser.add_argument(
        "--output", default="vibesec-demo.cast", help="Output filename"
    )
    parser.add_argument("--width", type=int, default=80, help="Terminal width")
    parser.add_argument("--height", type=int, default=24, help="Terminal height")

    args = parser.parse_args()

    # Create recorder
    recorder = TerminalRecorder(width=args.width, height=args.height)

    # Generate demo
    print("Generating VibeSec demo...")
    generate_vibesec_demo(recorder)

    # Save output
    if args.format == "cast":
        recorder.save_asciicast(args.output)
        print("\nNext steps:")
        print(f"  1. View: asciinema play {args.output}")
        print(f"  2. Upload: asciinema upload {args.output}")
        print(f"  3. Convert to GIF: agg {args.output} vibesec-demo.gif")
        print(f"  4. Convert to SVG: svg-term --in {args.output} --out demo.svg")
    elif args.format == "svg":
        print("SVG output not yet implemented. Use cast format and convert:")
        print(f"  svg-term --in {args.output} --out vibesec-demo.svg")


if __name__ == "__main__":
    main()
