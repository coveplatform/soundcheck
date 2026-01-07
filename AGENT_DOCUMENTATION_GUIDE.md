# Guide for AI Agents: Creating Mixreflect Documentation

This guide instructs AI coding agents (Windsurf, Cursor, Claude Code, etc.) on how to create comprehensive documentation for the Mixreflect codebase.

---

## Phase 1: Codebase Discovery

Before writing any documentation, you must thoroughly explore the codebase. Do NOT assume or guess - verify everything by reading actual files.

### Step 1.1: Understand the Project Structure

```bash
# First, get the high-level directory structure
ls -la
tree -L 2 -d  # or use: find . -type d -maxdepth 2

# Key directories to explore:
# - src/app/          → Next.js App Router pages
# - src/components/   → React components
# - src/lib/          → Utilities, auth, database
# - prisma/           → Database schema
# - public/           → Static assets
```

### Step 1.2: Read Critical Files First

Read these files in order to understand the foundation:

1. **`package.json`** - Dependencies, scripts, project metadata
2. **`prisma/schema.prisma`** - THE source of truth for data models
3. **`src/lib/auth.ts`** - Authentication configuration
4. **`src/lib/prisma.ts`** - Database client setup
5. **`src/app/layout.tsx`** - Root layout, providers
6. **`next.config.js`** - Next.js configuration

### Step 1.3: Map the Routes

```bash
# Find all page.tsx files to understand routing
find src/app -name "page.tsx" | sort

# Find all API routes
find src/app/api -name "route.ts" | sort
```

Document each route with:
- Path (e.g., `/artist/dashboard`)
- Purpose (one sentence)
- Auth requirements (public, artist-only, reviewer-only, admin-only)

### Step 1.4: Identify User Roles

Search for role-related code:
```bash
grep -r "role" src/ --include="*.ts" --include="*.tsx"
grep -r "session" src/ --include="*.ts" --include="*.tsx"
```

Mixreflect has these roles (verify by reading schema):
- **Artist** - Submits tracks for feedback
- **Reviewer** - Provides paid reviews
- **Admin** - Platform management
- **Both** - Users who are both artist and reviewer

---

## Phase 2: Document Data Models

### Step 2.1: Read the Prisma Schema

```bash
cat prisma/schema.prisma
```

For EACH model, document:

```markdown
### ModelName

**Purpose:** One sentence describing what this represents

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key |
| ... | ... | ... |

**Relationships:**
- Has many: [RelatedModel]
- Belongs to: [ParentModel]

**Key Enums:** List any enum fields and their values
```

### Step 2.2: Understand the Core Flow

Trace the primary user journey by reading the code:

1. **Artist submits track** → Find the submission flow
2. **Track enters queue** → Find queue management logic
3. **Reviewer gets assigned** → Find assignment algorithm
4. **Reviewer completes review** → Find review submission
5. **Artist views feedback** → Find feedback display

---

## Phase 3: Document Features

### Step 3.1: Feature Discovery

For each major feature, create a section:

```markdown
## Feature: [Name]

### Overview
What does this feature do? Who uses it?

### User Flow
1. User does X
2. System responds with Y
3. ...

### Key Files
- `src/app/.../page.tsx` - Main UI
- `src/components/.../` - Components used
- `src/app/api/.../route.ts` - API endpoints

### Database Tables Involved
- Table1: How it's used
- Table2: How it's used

### Business Rules
- Rule 1: e.g., "Artists can only cancel tracks before reviews start"
- Rule 2: e.g., "Reviewers earn $X per review"
```

### Step 3.2: Key Features to Document

Search for and document these features (verify they exist first):

1. **Track Submission** - How artists submit tracks
2. **Payment Processing** - Stripe integration
3. **Review Queue** - How reviews are assigned
4. **Review Form** - What reviewers fill out
5. **Feedback Display** - How artists see results
6. **Analytics/Insights** - Aggregated review data
7. **Reviewer Tiers** - Ranking system
8. **Payouts** - How reviewers get paid
9. **Admin Dashboard** - Platform management

---

## Phase 4: Document Technical Architecture

### Step 4.1: Authentication

```bash
# Find auth configuration
cat src/lib/auth.ts

# Find where auth is used
grep -r "getServerSession" src/app --include="*.tsx" | head -20
```

Document:
- Auth provider (NextAuth, etc.)
- Session structure
- Protected route patterns
- Role-based access control

### Step 4.2: Database

Document:
- Database provider (PostgreSQL, etc.)
- ORM (Prisma)
- Connection handling
- Migration strategy

### Step 4.3: External Services

Search for integrations:
```bash
grep -r "stripe" src/ --include="*.ts" -l
grep -r "sendgrid\|resend\|email" src/ --include="*.ts" -l
grep -r "s3\|cloudinary\|upload" src/ --include="*.ts" -l
```

For each service, document:
- What it's used for
- Key configuration
- Environment variables needed

### Step 4.4: Environment Variables

```bash
# Find all env var references
grep -r "process.env" src/ --include="*.ts" --include="*.tsx" | grep -oE "process\.env\.[A-Z_]+" | sort -u
```

Create a table:
| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| ... | ... | ... |

---

## Phase 5: Document Component Library

### Step 5.1: Find UI Components

```bash
ls src/components/ui/
```

For each component, document:
- Purpose
- Props interface
- Usage example

### Step 5.2: Find Feature Components

```bash
ls src/components/
```

Group by feature area (artist/, reviewer/, admin/, etc.)

---

## Phase 6: Document API Endpoints

### Step 6.1: Find All Endpoints

```bash
find src/app/api -name "route.ts" | sort
```

### Step 6.2: Document Each Endpoint

For each API route:

```markdown
### [METHOD] /api/path/here

**Purpose:** What this endpoint does

**Auth:** Required | Public | Admin-only

**Request Body:**
```json
{
  "field": "type - description"
}
```

**Response:**
```json
{
  "field": "type - description"
}
```

**Error Codes:**
- 400: Invalid input
- 401: Not authenticated
- 403: Not authorized
- 404: Resource not found
```

---

## Phase 7: Create the Documentation Structure

### Recommended File Structure

```
docs/
├── README.md                 # Overview and quick start
├── ARCHITECTURE.md           # Technical architecture
├── DATA_MODELS.md            # Database schema documentation
├── FEATURES/
│   ├── track-submission.md
│   ├── review-system.md
│   ├── payments.md
│   └── analytics.md
├── API/
│   ├── overview.md
│   ├── artist-endpoints.md
│   ├── reviewer-endpoints.md
│   └── admin-endpoints.md
├── COMPONENTS.md             # UI component library
├── DEPLOYMENT.md             # How to deploy
└── DEVELOPMENT.md            # Local development setup
```

### Alternative: Single File

If a single file is preferred, use this structure:

```markdown
# Mixreflect Documentation

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [Data Models](#data-models)
5. [Features](#features)
6. [API Reference](#api-reference)
7. [Components](#components)
8. [Deployment](#deployment)

## Overview
...
```

---

## Phase 8: Writing Style Guidelines

### DO:
- Be concise - developers skim documentation
- Use code examples liberally
- Include file paths for every reference
- Document the "why" not just the "what"
- Keep examples copy-pasteable
- Update line numbers if referencing specific code

### DON'T:
- Assume knowledge - explain acronyms on first use
- Write walls of text - use bullets, tables, code blocks
- Document obvious things - focus on non-obvious behavior
- Hardcode values that might change - reference env vars
- Skip error handling documentation

### Code Example Format

Always show:
1. The file path
2. The relevant code
3. Brief explanation

```markdown
### Example: Checking User Role

**File:** `src/lib/auth.ts:45`

```typescript
export function isArtist(session: Session) {
  return session.user.role === "artist" || session.user.role === "both";
}
```

This helper checks if the user can access artist features. Users with role "both" have dual access.
```

---

## Phase 9: Validation Checklist

Before finalizing documentation, verify:

- [ ] All file paths mentioned actually exist
- [ ] Code examples are from the actual codebase
- [ ] Environment variables list is complete
- [ ] All user roles are documented
- [ ] All API endpoints are documented
- [ ] Database schema matches documentation
- [ ] No placeholder text remains (e.g., "TODO", "TBD")
- [ ] Internal links work
- [ ] Examples are tested/runnable

---

## Phase 10: Maintenance Notes

Add a section for future maintainers:

```markdown
## Documentation Maintenance

**Last Updated:** YYYY-MM-DD

**How to Update:**
1. When adding a new feature, add a section to FEATURES/
2. When adding an API endpoint, update API/
3. When changing the schema, update DATA_MODELS.md

**Known Gaps:**
- [ ] Feature X needs more detail
- [ ] API endpoint Y is undocumented
```

---

## Quick Start Template

Use this template to begin:

```markdown
# Mixreflect Developer Documentation

> Music feedback platform connecting artists with paid reviewers

## Quick Start

```bash
# Clone and install
git clone [repo]
cd mixreflect
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Set up database
npx prisma db push
npx prisma db seed

# Run development server
npm run dev
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js
- **Payments:** Stripe
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Authenticated routes
│   │   ├── artist/         # Artist pages
│   │   ├── reviewer/       # Reviewer pages
│   │   └── admin/          # Admin pages
│   ├── api/                # API routes
│   └── (public)/           # Public pages
├── components/             # React components
├── lib/                    # Utilities
└── types/                  # TypeScript types
```

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| Artist | Submits tracks | /artist/* |
| Reviewer | Reviews tracks | /reviewer/* |
| Admin | Manages platform | /admin/* |
| Both | Artist + Reviewer | Both areas |

[Continue with detailed sections...]
```

---

## Final Notes for AI Agents

1. **Read before writing** - Always verify by reading actual files
2. **Be specific** - Include file paths, line numbers, exact values
3. **Stay current** - Documentation should reflect actual code state
4. **Think like a new developer** - What would they need to know?
5. **Prioritize** - Core flows > edge cases > nice-to-haves

When in doubt, ask the user what level of detail they need.
