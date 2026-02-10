# Remove Email Verification - Implementation Guide

## Overview
Remove email verification requirement to allow users immediate access after signup.

## Changes Required

### 1. API Routes - Remove emailVerified Checks

**Pattern to remove:**
```typescript
if (!user?.emailVerified) {
  return NextResponse.json(
    { error: "Please verify your email to continue" },
    { status: 403 }
  );
}
```

**Files to update (13):**
1. `src/app/api/tracks/route.ts`
2. `src/app/api/tracks/[id]/request-reviews/route.ts`
3. `src/app/api/get-feedback/submit/route.ts`
4. `src/app/api/reviews/route.ts`
5. `src/app/api/get-feedback/create-account/route.ts`
6. `src/app/api/auth/trial-signup/route.ts`
7. `src/app/api/auth/signup/route.ts`
8. `src/app/api/reviews/[id]/route.ts`
9. `src/app/api/admin/tracks/[id]/generate-fake-reviews/route.ts`
10. Other review/track endpoints

### 2. Dashboard Layouts - Remove Verification Checks

**Files to update (3):**
1. `src/app/(dashboard)/reviewer/layout.tsx`
2. `src/app/(dashboard)/layout.tsx`
3. `src/app/(dashboard)/artist/layout.tsx`

**Pattern to remove:**
```typescript
if (!user?.emailVerified) {
  redirect('/verify-email');
}
```

### 3. Pages to Remove/Update

1. **DELETE:** `src/app/(auth)/verify-email/page.tsx`
2. **Update:** `src/app/(auth)/login/page.tsx` - Remove verification redirects

### 4. E2E Tests - Already Updated
- ✅ Removed email verification test from auth.spec.ts

## Quick Fix Script

Run this to remove all emailVerified checks:

```bash
# Find all files with emailVerified checks
find src/app/api -name "*.ts" -exec grep -l "emailVerified" {} \;

# Remove the verification blocks (backup first!)
# This is a manual process - review each file
```

## Manual Steps

1. **Backup your code** (commit current state)
2. Search for `emailVerified` in each file
3. Remove the conditional blocks that check it
4. Test the changes
5. Update any middleware if needed

## Testing After Removal

- Users should be able to signup and immediately access all features
- No redirect to /verify-email
- Track submission works immediately
- Review assignment works immediately
