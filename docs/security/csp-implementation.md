# Content Security Policy Implementation

## Overview

This document explains the secure Content Security Policy (CSP) implementation
that eliminates the use of `unsafe-inline` and `unsafe-eval` directives.

## Security Issue

The previous implementation used `'unsafe-inline'` and `'unsafe-eval'` in the
CSP header, which significantly weakens XSS protection by allowing:

- Inline JavaScript execution
- Dynamic code evaluation via `eval()`
- Inline event handlers

## Secure Implementation

### 1. Nonce-Based Approach

The new implementation uses cryptographic nonces for allowing specific inline
scripts and styles:

```typescript
// src/lib/csp.ts
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64')
}
```

### 2. Middleware Integration

CSP headers are now generated in middleware with a fresh nonce for each request:

```typescript
// src/middleware.ts
const isDev = process.env.NODE_ENV === 'development'
addCSPHeaders(authResponse.headers, isDev)
```

### 3. Using Inline Scripts

For inline scripts, use the `ScriptWithNonce` component:

```tsx
import { ScriptWithNonce } from '@/components/shared/script-with-nonce'
;<ScriptWithNonce id='analytics'>
  {`
    // Your inline script here
    console.log('This script has proper CSP nonce')
  `}
</ScriptWithNonce>
```

### 4. Critical CSS

For critical inline styles, use the `NonceProvider` in your root layout:

```tsx
import { NonceProvider } from '@/components/shared/nonce-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <NonceProvider />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 5. Style Hashes

For specific inline styles that can't use nonces, calculate their SHA-256
hashes:

```bash
pnpm run scripts/calculate-style-hashes.js
```

Add the resulting hashes to the CSP `style-src` directive.

## Migration Guide

### Before (Unsafe)

```html
<script>
  console.log('This is unsafe!')
</script>

<div style="color: red;">Inline styles</div>
```

### After (Secure)

```tsx
// Use external scripts
<Script src="/scripts/analytics.js" />

// Or use ScriptWithNonce for inline scripts
<ScriptWithNonce>
  {`console.log('This is secure!')`}
</ScriptWithNonce>

// Use CSS classes instead of inline styles
<div className="text-red-500">Styled with classes</div>
```

## CSP Directives Explained

- `default-src 'self'`: Only allow resources from same origin
- `script-src 'self' 'nonce-{random}'`: Scripts from same origin or with valid
  nonce
- `style-src 'self' 'nonce-{random}' 'sha256-{hash}'`: Styles with nonce or
  specific hashes
- `object-src 'none'`: Disable plugins like Flash
- `base-uri 'self'`: Prevent base tag injection
- `frame-ancestors 'none'`: Prevent clickjacking

## Development Considerations

In development, we allow `'unsafe-eval'` for hot module replacement, but this is
removed in production.

## Testing

1. Check browser console for CSP violations
2. Use browser developer tools Security tab
3. Test with CSP evaluator: https://csp-evaluator.withgoogle.com/
4. Verify no inline scripts/styles work without proper nonce

## Monitoring

Set up CSP reporting to monitor violations:

```typescript
// Add to CSP directives
'report-uri': 'https://your-app.com/api/csp-report'
'report-to': 'csp-endpoint'
```

## Common Issues

1. **Third-party scripts**: Add trusted domains to `script-src`
2. **Inline styles from libraries**: Calculate hashes or use nonces
3. **Dynamic script injection**: Use `ScriptWithNonce` component
4. **Google Fonts**: Already allowed in `font-src`
