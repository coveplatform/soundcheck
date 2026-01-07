# Feature: Support Tickets

## Overview

Authenticated users can create support tickets and exchange messages.

## User Flow

1. User opens support page
   - UI: `src/app/support/page.tsx`
2. User creates a ticket
   - API: `POST /api/support/tickets`
   - File: `src/app/api/support/tickets/route.ts`
3. User views tickets
   - API: `GET /api/support/tickets`
   - File: `src/app/api/support/tickets/route.ts`
4. User adds messages
   - API: `POST /api/support/tickets/[id]/messages`
   - File: `src/app/api/support/tickets/[id]/messages/route.ts`

## Database Tables Involved

- `SupportTicket`
- `SupportMessage`

## Business Rules

- Ticket creation is rate-limited per user (max 3 in 60 seconds) in `src/app/api/support/tickets/route.ts`.
- Tickets are scoped to the authenticated user in list routes.
