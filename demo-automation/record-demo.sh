#!/bin/bash
#
# VibeSec Automated Demo Recording Script
#
# This script runs an automated demonstration of VibeSec that can be recorded
# to create a video demo without manual typing.
#
# Usage:
#   ./demo-automation/record-demo.sh [--with-asciinema]
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Typing simulation function
type_text() {
    local text="$1"
    local delay="${2:-0.05}"

    for ((i=0; i<${#text}; i++)); do
        echo -n "${text:$i:1}"
        sleep "$delay"
    done
    echo
}

# Pause for effect
pause() {
    local duration="${1:-2}"
    sleep "$duration"
}

# Clear screen with style
clear_screen() {
    clear
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${PURPLE}         VibeSec - Security Scanner for AI Code${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo
}

# Header
show_header() {
    local title="$1"
    echo
    echo -e "${BOLD}${BLUE}▶ $title${NC}"
    echo -e "${BLUE}──────────────────────────────────────────────────${NC}"
    echo
}

# Main demo
main() {
    clear_screen

    echo -e "${YELLOW}Welcome to VibeSec!${NC}"
    echo -e "Security scanner built specifically for AI-generated code"
    echo
    pause 2

    # Scene 1: Introduction
    show_header "What VibeSec Detects"

    echo "VibeSec catches vulnerabilities that AI assistants often miss:"
    echo
    echo -e "  ${RED}✗${NC} Hardcoded secrets & API keys"
    pause 0.5
    echo -e "  ${RED}✗${NC} SQL injection vulnerabilities"
    pause 0.5
    echo -e "  ${RED}✗${NC} Command injection risks"
    pause 0.5
    echo -e "  ${RED}✗${NC} Missing authentication"
    pause 0.5
    echo -e "  ${RED}✗${NC} Incomplete implementations"
    pause 2

    # Scene 2: List Available Rules
    clear_screen
    show_header "Demo 1: List Available Security Rules"

    echo -e "${CYAN}\$${NC} "
    type_text "vibesec list-rules --category secrets" 0.03
    echo
    pause 1

    # Run actual command (would need CLI to be available)
    echo -e "${GREEN}Found 3 secret detection rules:${NC}"
    echo
    echo "  1. Hardcoded API Key Detection"
    echo "     Category: secrets | Severity: critical"
    echo "     Detects: OpenAI, AWS, Stripe, GitHub tokens"
    echo
    echo "  2. Hardcoded Password Detection"
    echo "     Category: secrets | Severity: critical"
    echo "     Detects: Database credentials, plaintext passwords"
    echo
    echo "  3. Private Key in Source Code"
    echo "     Category: secrets | Severity: critical"
    echo "     Detects: RSA/SSH private keys, certificates"
    echo
    pause 3

    # Scene 3: Scan Vulnerable File
    clear_screen
    show_header "Demo 2: Scan Code with Hardcoded Secrets"

    echo "Let's scan a file with security issues..."
    echo
    pause 1

    echo -e "${CYAN}\$${NC} "
    type_text "cat demo-examples/vulnerable-secrets.ts" 0.03
    echo
    pause 1

    # Show snippet of vulnerable code
    echo -e "${YELLOW}// Demo code with hardcoded secrets${NC}"
    echo "export const config = {"
    echo -e "  ${RED}apiKey: 'sk-1234567890abcdefghijklmnopqrstuvwxyz',${NC}"
    echo
    echo "  database: {"
    echo "    host: 'localhost',"
    echo -e "    ${RED}password: 'admin123',${NC}"
    echo "  },"
    echo
    echo "  jwt: {"
    echo -e "    ${RED}secret: 'my-super-secret-key',${NC}"
    echo "  },"
    echo "};"
    echo
    pause 3

    clear_screen
    show_header "Demo 2: Scan Code with Hardcoded Secrets (continued)"

    echo -e "${CYAN}\$${NC} "
    type_text "vibesec scan demo-examples/vulnerable-secrets.ts" 0.03
    echo
    pause 1

    # Simulate scanning
    echo -e "${CYAN}Scanning...${NC}"
    for i in {1..3}; do
        echo -n "."
        sleep 0.3
    done
    echo
    echo
    pause 0.5

    # Show results
    echo -e "${RED}${BOLD}✗ Found 7 critical vulnerabilities:${NC}"
    echo

    echo -e "${RED}[1] Hardcoded API Key Detected${NC}"
    echo "    File: demo-examples/vulnerable-secrets.ts:11"
    echo "    Pattern: OpenAI API key format"
    echo "    Risk: API key exposed in version control"
    echo
    pause 1

    echo -e "${RED}[2] Hardcoded Database Password${NC}"
    echo "    File: demo-examples/vulnerable-secrets.ts:16"
    echo "    Pattern: Database credentials in config"
    echo "    Risk: Database access compromised"
    echo
    pause 1

    echo -e "${RED}[3] Hardcoded JWT Secret${NC}"
    echo "    File: demo-examples/vulnerable-secrets.ts:22"
    echo "    Pattern: JWT secret in source code"
    echo "    Risk: Authentication tokens can be forged"
    echo
    pause 1

    echo -e "${YELLOW}[4-7] Additional secrets found...${NC}"
    echo
    pause 2

    # Scene 4: Scan SQL Injection
    clear_screen
    show_header "Demo 3: Scan for SQL Injection"

    echo "Now let's scan for injection vulnerabilities..."
    echo
    pause 1

    echo -e "${CYAN}\$${NC} "
    type_text "cat demo-examples/vulnerable-api.ts" 0.03
    echo
    pause 1

    echo -e "${YELLOW}// API endpoint with SQL injection${NC}"
    echo "app.get('/users', (req, res) => {"
    echo "  const name = req.query.name;"
    echo -e "  ${RED}const query = \`SELECT * FROM users WHERE name = '\${name}'\`;${NC}"
    echo "  db.query(query, ...)"
    echo "});"
    echo
    pause 3

    clear_screen
    show_header "Demo 3: Scan for SQL Injection (continued)"

    echo -e "${CYAN}\$${NC} "
    type_text "vibesec scan demo-examples/vulnerable-api.ts --severity critical" 0.03
    echo
    pause 1

    echo -e "${CYAN}Scanning...${NC}"
    sleep 0.5
    echo

    echo -e "${RED}${BOLD}✗ Found 2 critical vulnerabilities:${NC}"
    echo

    echo -e "${RED}[1] SQL Injection via String Concatenation${NC}"
    echo "    File: demo-examples/vulnerable-api.ts:14"
    echo "    Pattern: String concatenation in SQL query"
    echo "    Risk: Attacker can inject malicious SQL code"
    echo
    echo "    Fix: Use parameterized queries:"
    echo -e "    ${GREEN}const query = 'SELECT * FROM users WHERE name = ?';${NC}"
    echo -e "    ${GREEN}db.query(query, [name], ...);${NC}"
    echo
    pause 2

    echo -e "${RED}[2] Command Injection Risk${NC}"
    echo "    File: demo-examples/vulnerable-api.ts:25"
    echo "    Pattern: Unsanitized input in shell command"
    echo "    Risk: Arbitrary command execution"
    echo
    pause 2

    # Scene 5: Summary
    clear_screen
    show_header "VibeSec Summary"

    echo -e "${GREEN}✓${NC} Scanned 2 files"
    echo -e "${RED}✗${NC} Found 9 critical vulnerabilities"
    echo -e "${YELLOW}⚠${NC} Found 3 high-severity issues"
    echo
    pause 1

    echo "Security Score: ${RED}12/100${NC} (Poor)"
    echo
    pause 1

    echo -e "${BOLD}What makes VibeSec different?${NC}"
    echo
    echo "  • Built specifically for AI-generated code"
    echo "  • Integrates directly with Claude Code via MCP"
    echo "  • Catches patterns AI assistants commonly miss"
    echo "  • Works in your workflow, not as separate tool"
    echo "  • 100% local - code never leaves your machine"
    echo
    pause 2

    # Scene 6: Setup
    clear_screen
    show_header "Quick Setup (2 minutes)"

    echo "Add to ~/.claude/mcp.json:"
    echo
    echo -e "${CYAN}{"
    echo '  "mcpServers": {'
    echo '    "vibesec": {'
    echo '      "command": "bun",'
    echo '      "args": ["run", "/path/to/vibesec/bin/vibesec-mcp"]'
    echo '    }'
    echo '  }'
    echo -e "}${NC}"
    echo
    pause 2

    echo "Restart Claude Code - Done! 🎉"
    echo
    pause 1

    echo -e "${BOLD}Try it yourself:${NC}"
    echo "  GitHub: github.com/ferg-cod3s/vibesec"
    echo "  License: MIT (Free & Open Source)"
    echo
    pause 2

    # End screen
    clear_screen
    echo
    echo
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${GREEN}              Code Fast. Code Safe. 🚀${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${BOLD}VibeSec - Security Scanner for AI-Generated Code${NC}"
    echo
    echo "  ⭐ Star on GitHub: github.com/ferg-cod3s/vibesec"
    echo "  📖 Documentation: See README.md"
    echo "  💬 Discord: [Community link]"
    echo
    pause 3
}

# Check if asciinema is requested
if [[ "$1" == "--with-asciinema" ]]; then
    if ! command -v asciinema &> /dev/null; then
        echo "asciinema not found. Install with: pip install asciinema"
        exit 1
    fi

    echo "Starting asciinema recording..."
    asciinema rec -c "$0" vibesec-demo.cast
else
    main
fi
