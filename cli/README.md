# VibeSec CLI

Command-line interface for the VibeSec security scanner.

## Structure

```
cli/
├── cmd/           # Command implementations
└── pkg/           # CLI packages and utilities
```

## Development

Coming soon - CLI implementation will be added in POC phase.

## Commands

```bash
vibesec scan [path]           # Scan directory/file
vibesec report [options]      # Generate reports
vibesec config [action]       # Manage configuration
vibesec update                # Update rules database
vibesec integrate [service]   # Setup integrations
```

See [POC_SPEC.md](../docs/POC_SPEC.md) for detailed implementation plan.
