# API Overview

All API routes are implemented as Next.js App Router route handlers under `src/app/api/**/route.ts`.

## Conventions

- Most endpoints return JSON via `NextResponse.json(...)`.
- Auth is usually handled using `getServerSession(authOptions)`.
- Admin-only endpoints also check `isAdminEmail(session.user.email)`.

## Error model

Common patterns:

- `401 Unauthorized`: not logged in
- `403 Forbidden`: lacks required role/verification or restricted
- `400 Bad Request`: invalid input / schema validation failures
- `404 Not Found`: missing record

## Route groups

- Public endpoints: `docs/API/public-endpoints.md`
- Artist endpoints: `docs/API/artist-endpoints.md`
- Reviewer endpoints: `docs/API/reviewer-endpoints.md`
- Admin endpoints: `docs/API/admin-endpoints.md`
