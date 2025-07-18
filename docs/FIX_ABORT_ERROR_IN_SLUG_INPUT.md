# Fix: AbortError in Workspace Slug Input

## Problem

During the signup flow, when the workspace slug input component auto-generates
slugs, the following error appears in the console:

```
AbortError: The user aborted a request.
```

This happens because:

1. The `WorkspaceSlugInput` component uses React Query's `useQuery` hook with
   `enabled: false`
2. When `refetch()` is called multiple times in quick succession (e.g., when
   workspace name changes rapidly)
3. React Query automatically cancels the previous in-flight request to prevent
   race conditions
4. The canceled request throws an AbortError which gets logged by tRPC's logger

## Solution

Configure the tRPC logger to skip logging AbortErrors since they are expected
behavior for request cancellation.

### Implementation

Updated `/src/trpc/react.tsx` to filter out AbortErrors from logging:

```typescript
loggerLink({
  enabled: op => {
    // Skip logging for aborted requests
    if (
      op.direction === 'down' &&
      op.result instanceof Error &&
      (op.result.message === 'The user aborted a request.' ||
        op.result.name === 'AbortError' ||
        op.result.message.includes('AbortError'))
    ) {
      return false
    }

    return (
      process.env.NODE_ENV === 'development' ||
      (op.direction === 'down' && op.result instanceof Error)
    )
  },
}),
```

### How It Works

- The tRPC logger checks if an error is an AbortError before logging
- AbortErrors are intentionally suppressed since they represent normal request
  cancellation
- Other errors continue to be logged normally
- This keeps the console clean while maintaining visibility of actual errors

### Testing

1. Navigate to `/auth/signup`
2. Type a workspace name quickly (triggering multiple slug generations)
3. The console should no longer show AbortError messages
4. Actual errors (network failures, server errors) will still be logged

### Technical Details

- React Query automatically cancels previous requests when new ones are
  triggered for the same query key
- This is a performance optimization to prevent unnecessary network requests
- The AbortController API is used internally by React Query
- The component's own AbortController (in the useEffect) handles cleanup on
  unmount

### Alternative Approaches (Not Implemented)

1. **Use useMutation**: Convert to mutation-based approach (not suitable since
   these are queries)
2. **Disable auto-cancellation**: Configure React Query to not cancel requests
   (could lead to race conditions)
3. **Handle in component**: Add error handling in each component (repetitive and
   error-prone)

The tRPC logger configuration approach was chosen as it solves the issue
globally for all similar cases.
