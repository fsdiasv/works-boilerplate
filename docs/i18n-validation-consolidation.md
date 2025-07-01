# i18n Validation Message Consolidation

## Overview

This document describes the consolidation of duplicate validation messages in
the translation files to avoid confusion and maintain consistency.

## Problem

There were duplicate validation keys in the translation files:

- `auth.validation.passwordMinLength` - Used in auth-specific contexts
- `validation.passwordMinLength` - Used in general validation contexts

Having the same validation message in two places creates confusion and
maintenance issues.

## Solution

### Structure After Consolidation

1. **`auth.validation` namespace** - Contains auth-specific validation messages:
   - `invalidEmail` - Invalid email address
   - `nameMinLength` - Name must be at least 2 characters
   - `currentPasswordRequired` - Current password is required
   - `urlInvalid` - Invalid URL
   - `bioMaxLength` - Bio must not exceed 500 characters

2. **`validation` namespace** - Contains general validation messages including
   all password rules:
   - `required` - This field is required
   - `email` - Enter a valid email
   - `min` - Minimum {min} characters
   - `max` - Maximum {max} characters
   - `passwordMatch` - Passwords do not match
   - `passwordMinLength` - Password must be at least 8 characters
   - `passwordUppercase` - Password must contain at least one uppercase letter
   - `passwordLowercase` - Password must contain at least one lowercase letter
   - `passwordNumber` - Password must contain at least one number
   - `validInput` - Valid input
   - `invalidInput` - Invalid input

### Code Updates

The auth router (`/src/server/api/routers/auth.ts`) was updated to use the
appropriate namespaces:

```typescript
// Before
const t = await getTranslations({ locale, namespace: 'auth.validation' })
password: z.string().min(8, t('passwordMinLength'))

// After
const tAuth = await getTranslations({ locale, namespace: 'auth.validation' })
const tValidation = await getTranslations({ locale, namespace: 'validation' })
password: z.string().min(8, tValidation('passwordMinLength'))
```

## Guidelines for Future Development

1. **Auth-specific validation** - Add to `auth.validation` namespace
2. **Password validation rules** - Add to top-level `validation` namespace
3. **General validation messages** - Add to top-level `validation` namespace
4. **Never duplicate** - Each validation message should exist in only one
   location

## Benefits

- Eliminates confusion about which validation message to use
- Prevents duplicate maintenance
- Clear separation of concerns
- Consistent validation messages across the application
