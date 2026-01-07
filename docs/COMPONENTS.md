# Components

## UI primitives

UI primitives live in `src/components/ui/`.

| Component | File | Notes |
|----------|------|------|
| Button | `src/components/ui/button.tsx` | Variants via `class-variance-authority`, supports `isLoading` |
| Card | `src/components/ui/card.tsx` | `interactive` option adds hover styles |
| Input | `src/components/ui/input.tsx` | Styled input |
| Label | `src/components/ui/label.tsx` | Styled label |
| Skeleton | `src/components/ui/skeleton.tsx` | Loading placeholder |
| VerifyEmailBanner | `src/components/ui/verify-email-banner.tsx` | Email verification UX banner |
| GenreSelector | `src/components/ui/genre-selector.tsx` | Genre selection widget |
| GenreTag | `src/components/ui/genre-tag.tsx` | Genre pills / list |

## Feature component areas

Top-level feature component folders:

- `src/components/artist/`
- `src/components/reviewer/`
- `src/components/admin/`
- `src/components/feedback/`
- `src/components/support/`
- `src/components/audio/`

## Providers

App-wide providers are composed in `src/components/providers/` and mounted in `src/app/layout.tsx` via `src/components/providers.tsx`.
