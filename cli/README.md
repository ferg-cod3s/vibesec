# VibeSec CLI

Command-line interface for the VibeSec security scanner.

## Structure

```
cli/
├── index.ts              # CLI entry point
└── commands/
    ├── scan.ts           # Scan command implementation
    └── benchmark.ts      # Performance benchmarking command
```

## Implementation Status

✅ **Implemented** - CLI is fully functional with the following commands:

### Available Commands

```bash
# Scan a directory or file for security vulnerabilities
vibesec scan [path] [options]

# Options:
#   --format <type>     Output format: text, json, stakeholder (default: text)
#   --explain           Use plain-language explanations for non-technical users
#   --severity <level>  Filter by severity: critical, high, medium, low
#   --output <file>     Write results to file
#   --quiet             Suppress progress indicators
#   --no-color          Disable colored output

# Examples:
vibesec scan .                         # Scan current directory
vibesec scan src/ --format json        # JSON output
vibesec scan . --explain               # Plain language mode
vibesec scan . --severity critical     # Only critical findings
```

## Features

- **Multiple Output Formats**: Text, JSON, and stakeholder-friendly reports
- **Plain Language Mode**: Non-technical explanations with `--explain` flag
- **Severity Filtering**: Focus on critical/high priority issues
- **User-Friendly Errors**: Friendly error handler with actionable suggestions
- **Progress Indicators**: Visual feedback with ora spinners
- **Color Support**: Syntax-highlighted output (can be disabled)

## Usage from Code

```typescript
import { Scanner } from '../scanner/core/engine';

const scanner = new Scanner({
  path: './src',
  quiet: false
});

const result = await scanner.scan();
console.log(result);
```

## See Also

- [API Documentation](../docs/API.md) - Complete CLI reference
- [Programmatic API](../docs/PROGRAMMATIC_API.md) - TypeScript API usage
- [User Testing Guide](../docs/USER_TESTING_GUIDE.md) - Testing guidelines
