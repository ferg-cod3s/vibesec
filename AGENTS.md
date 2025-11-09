# Agent Guidelines for VibeSec Development

VibeSec is a security scanner for AI-generated code that detects vulnerabilities in vibe-coded projects. It integrates with Claude Code, Cursor, and Cline via MCP.

**Key docs:** [README.md](README.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [QUICK_START.md](docs/QUICK_START.md)

## Commands

- Build: `bun run build` (TypeScript compilation + asset copying)
- Lint: `bun run lint` (ESLint with TypeScript rules)
- Format: `bun run format` (Prettier auto-format)
- Test: `bun test` (run all tests)
- Single test: `bun test path/to/test.test.ts`
- Test coverage: `bun test --coverage`
- MCP tests: `bun test tests/mcp`

## Code Style

- Use TypeScript with strict mode enabled
- Import style: `import * as fs from 'fs/promises'` (named imports for modules)
- Formatting: Prettier with single quotes, semicolons, 100 char width
- Naming: PascalCase for classes, camelCase for variables/functions
- Error handling: Use try/catch with proper error types, avoid `any`
- Return types: Explicit function return types preferred (ESLint warns)
- Unused vars: Prefix with underscore (`_`) to suppress warnings
- Console: Only use `console.warn/error` (ESLint restricts console.log)
- File structure: Organize by feature (cli/, scanner/, reporters/, src/)
