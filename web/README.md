# VibeSec Web Dashboard

Optional web-based dashboard for team collaboration and centralized security monitoring.

## Structure

```
web/
├── dashboard/     # Frontend React application
└── api/          # Backend API server
```

## Features (Planned for MVP)

### Project Overview
- Security score (0-100)
- Trend charts (issues over time)
- Recent scan history
- Top vulnerabilities by category

### Findings Explorer
- Filterable table of all issues
- Drill-down to code snippets
- Fix status tracking (pending/resolved)
- Export to PDF/CSV

### Team Management
- Multi-user access (email/password auth)
- Role-based permissions (viewer, admin)
- Shared scan history
- Team activity logs

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + SQLite
- **Deployment**: Docker Compose (single command setup)

## Development

See [MVP_ROADMAP.md](../docs/MVP_ROADMAP.md) for dashboard timeline (Weeks 6-7).

## Note

Dashboard is optional for MVP. The CLI remains the primary interface for VibeSec.
