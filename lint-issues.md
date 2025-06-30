# Lint Issues Report

## Summary

Total files with issues: 12 Total errors: 81 Total warnings: 2

## Issues by File

### src/app/[locale]/(auth)/forgot-password/page.tsx

- ~~**Line 33:27** - Error: '\_data' is defined but never used.
  `@typescript-eslint/no-unused-vars`~~ ✅ Fixed
- ~~**Line 48:25** - Error: Replace `(e)` with `e` `prettier/prettier`~~ ✅
  Fixed

### src/app/[locale]/(auth)/login/page.tsx

- ~~**Line 7:1** - Error: `@hookform/resolvers/zod` import should occur before
  import of `next/link` `import/order`~~ ✅ Fixed
- ~~**Line 36:27** - Error: '\_data' is defined but never used.
  `@typescript-eslint/no-unused-vars`~~ ✅ Fixed
- ~~**Line 59:25** - Error: Replace `(e)` with `e` `prettier/prettier`~~ ✅
  Fixed

### src/app/[locale]/(auth)/signup/page.tsx

- ~~**Line 7:1** - Error: `@hookform/resolvers/zod` import should occur before
  import of `next/link` `import/order`~~ ✅ Fixed
- ~~**Line 42:27** - Error: '\_data' is defined but never used.
  `@typescript-eslint/no-unused-vars`~~ ✅ Fixed
- ~~**Line 65:25** - Error: Replace `(e)` with `e` `prettier/prettier`~~ ✅
  Fixed

### src/components/layout/AdaptiveLoader.tsx

- ~~**Line 90:19** - Error: Unexpected nullable boolean value in conditional.
  Please handle the nullish case explicitly.
  `@typescript-eslint/strict-boolean-expressions`~~ ✅ Fixed
- ~~**Line 111:14** - Error: Unexpected value in conditional. A boolean
  expression is required. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed
- ~~**Line 116:23** - Error: Prefer using nullish coalescing operator (`??`)
  instead of a logical or (`||`), as it is a safer operator.
  `@typescript-eslint/prefer-nullish-coalescing`~~ ✅ Fixed
- ~~**Line 143:59** - Error: Unexpected any. Specify a different type.
  `@typescript-eslint/no-explicit-any`~~ ✅ Fixed
- ~~**Line 172:78** - Error: Function component is not a function declaration
  `react/function-component-definition`~~ ✅ Fixed
- ~~**Line 231:58** - Error: Function component is not a function declaration
  `react/function-component-definition`~~ ✅ Fixed
- ~~**Line 244:9** - Error: Unexpected nullable string value in conditional.
  Please handle the nullish/empty cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`~~ ✅ Fixed

### src/components/layout/LayoutDebugger.tsx

- ~~**Line 19:62** - Error: Function component is not a function declaration
  `react/function-component-definition`~~ ✅ Fixed
- ~~**Line 80:15** - Error: Unsafe assignment of an `any` value.
  `@typescript-eslint/no-unsafe-assignment`~~ ✅ Fixed
- ~~**Line 80:40** - Error: Unexpected any. Specify a different type.
  `@typescript-eslint/no-explicit-any`~~ ✅ Fixed
- ~~**Line 80:45** - Error: Unsafe member access .memory on an `any` value.
  `@typescript-eslint/no-unsafe-member-access`~~ ✅ Fixed
- ~~**Line 83:37** - Error: Unsafe member access .usedJSHeapSize on an `any`
  value. `@typescript-eslint/no-unsafe-member-access`~~ ✅ Fixed
- ~~**Line 115:1** - Error: Delete `····` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 117:11** - Error: Unexpected object value in conditional. The
  condition is always true. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed
- ~~**Line 117:11** - Error: Unnecessary conditional, value is always truthy.
  `@typescript-eslint/no-unnecessary-condition`~~ ✅ Fixed
- ~~**Line 123:9** - Error: Unnecessary conditional, value is always falsy.
  `@typescript-eslint/no-unnecessary-condition`~~ ✅ Fixed
- ~~**Line 123:10** - Error: Unexpected object value in conditional. The
  condition is always true. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed
- ~~**Line 163:11** - Error: Unexpected object value in conditional. The
  condition is always true. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed
- ~~**Line 163:11** - Error: Unnecessary conditional, value is always truthy.
  `@typescript-eslint/no-unnecessary-condition`~~ ✅ Fixed

### src/components/layout/PWALayout.tsx

- ~~**Line 7:1** - Error: `@/lib/pwa` type import should occur before import of
  `@/lib/utils` `import/order`~~ ✅ Fixed
- ~~**Line 9:34** - Warning: Caution: `React` also has a named export
  `HTMLAttributes`. Check if you meant to write
  `import {HTMLAttributes} from 'react'` instead.
  `import/no-named-as-default-member`~~ ✅ Fixed
- ~~**Line 45:62** - Error: Unexpected any. Specify a different type.
  `@typescript-eslint/no-explicit-any`~~ ✅ Fixed
- ~~**Line 45:67** - Error: Unsafe member access .standalone on an `any` value.
  `@typescript-eslint/no-unsafe-member-access`~~ ✅ Fixed
- ~~**Line 66:13** - Error: Unexpected object value in conditional. The
  condition is always true. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed
- ~~**Line 66:13** - Error: Unnecessary conditional, value is always truthy.
  `@typescript-eslint/no-unnecessary-condition`~~ ✅ Fixed
- ~~**Line 77:13** - Error: Unexpected object value in conditional. The
  condition is always true. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed
- ~~**Line 77:13** - Error: Unnecessary conditional, value is always truthy.
  `@typescript-eslint/no-unnecessary-condition`~~ ✅ Fixed
- ~~**Line 107:11** - Error: Unexpected nullable string value in conditional.
  Please handle the nullish/empty cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`~~ ✅ Fixed
- ~~**Line 127:12** - Error: Unexpected value in conditional. A boolean
  expression is required. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed
- ~~**Line 172:27** - Error: Promise-returning function provided to attribute
  where a void return was expected. `@typescript-eslint/no-misused-promises`~~
  ✅ Fixed
- ~~**Line 173:85** - Error: Replace
  `w-full·rounded-md·px-4·py-3·text-sm·font-medium·transition-colors·active:scale-95·sm:flex-1·sm:py-2·min-h-[44px]·touch-manipulation`
  with
  `min-h-[44px]·w-full·touch-manipulation·rounded-md·px-4·py-3·text-sm·font-medium·transition-colors·active:scale-95·sm:flex-1·sm:py-2`
  `prettier/prettier`~~ ✅ Fixed
- ~~**Line 174:30** - Error: Replace `"Install·the·app"` with
  `'Install·the·app'` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 180:45** - Error: Replace
  `w-full·rounded-md·border·px-4·py-3·text-sm·font-medium·transition-colors·active:scale-95·sm:w-auto·sm:py-2·min-h-[44px]·touch-manipulation`
  with
  `min-h-[44px]·w-full·touch-manipulation·rounded-md·border·px-4·py-3·text-sm·font-medium·transition-colors·active:scale-95·sm:w-auto·sm:py-2`
  `prettier/prettier`~~ ✅ Fixed
- ~~**Line 181:25** - Error: Replace `"Later"` with `'Later'`
  `prettier/prettier`~~ ✅ Fixed

### src/components/layout/ResponsiveBreakpoint.tsx

- **Line 1:1** - Error: There should be at least one empty line between import
  groups `import/order`
- **Line 96:16** - Error: Unsafe return of a value of type `any`.
  `@typescript-eslint/no-unsafe-return`
- **Line 102:35** - Error: Unsafe assignment of an `any` value.
  `@typescript-eslint/no-unsafe-assignment`
- **Line 115:22** - Error: Unexpected nullable string value in conditional.
  Please handle the nullish/empty cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`
- **Line 116:11** - Error: Prefer using nullish coalescing operator (`??`)
  instead of a logical or (`||`), as it is a safer operator.
  `@typescript-eslint/prefer-nullish-coalescing`
- **Line 124:23** - Error: Replace `"bg-green-50·text-green-800"` with
  `'bg-green-50·text-green-800'` `prettier/prettier`
- **Line 124:55** - Error: Replace `"bg-green-500/10·text-green-400"` with
  `'bg-green-500/10·text-green-400'` `prettier/prettier`
- **Line 125:14** - Error: Replace `"bg-green-100·text-green-900"` with
  `'bg-green-100·text-green-900'` `prettier/prettier`
- **Line 201:33** - Error: Unexpected nullable number value in conditional.
  Please handle the nullish/zero/NaN cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`
- **Line 215:52** - Error: Unexpected nullable string value in conditional.
  Please handle the nullish/empty cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`
- **Line 277:53** - Error: Unexpected nullable string value in conditional.
  Please handle the nullish/empty cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`

### src/components/layout/ResponsiveUtils.tsx

- ~~**Line 80:28** - Error: Unexpected nullable number value in conditional.
  Please handle the nullish/zero/NaN cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`~~ ✅ Fixed
- ~~**Line 80:65** - Error: Prefer using nullish coalescing operator (`??`)
  instead of a logical or (`||`), as it is a safer operator.
  `@typescript-eslint/prefer-nullish-coalescing`~~ ✅ Fixed
- ~~**Line 135:9** - Error: Unnecessary conditional, value is always falsy.
  `@typescript-eslint/no-unnecessary-condition`~~ ✅ Fixed
- ~~**Line 135:10** - Error: Unexpected object value in conditional. The
  condition is always true. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed

### src/components/layout/Stack.tsx

- ~~**Line 5:1** - Error: `@radix-ui/react-slot` import should occur before type
  import of `react` `import/order`~~ ✅ Fixed

### src/components/layout/WebVitals.tsx

- ~~**Line 25:52** - Error: Function component is not a function declaration
  `react/function-component-definition`~~ ✅ Fixed
- ~~**Line 51:9** - Warning: Unexpected console statement. `no-console`~~ ✅
  Fixed
- ~~**Line 78:9** - Error: Unnecessary conditional, value is always falsy.
  `@typescript-eslint/no-unnecessary-condition`~~ ✅ Fixed
- ~~**Line 78:10** - Error: Unexpected object value in conditional. The
  condition is always true. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed
- ~~**Line 103:47** - Error: Unsafe argument of type `any` assigned to a
  parameter of type `number | null`. `@typescript-eslint/no-unsafe-argument`~~
  ✅ Fixed
- ~~**Line 111:42** - Error: Unsafe call of a(n) `any` typed value.
  `@typescript-eslint/no-unsafe-call`~~ ✅ Fixed
- ~~**Line 111:48** - Error: Unsafe member access .toFixed on an `any` value.
  `@typescript-eslint/no-unsafe-member-access`~~ ✅ Fixed
- ~~**Line 131:48** - Error: Unexpected nullable string value in conditional.
  Please handle the nullish/empty cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`~~ ✅ Fixed
- ~~**Line 180:58** - Error: Function component is not a function declaration
  `react/function-component-definition`~~ ✅ Fixed
- ~~**Line 189:7** - Error: Unexpected value in conditional. A boolean
  expression is required. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed
- ~~**Line 190:7** - Error: Unexpected value in conditional. A boolean
  expression is required. `@typescript-eslint/strict-boolean-expressions`~~ ✅
  Fixed
- ~~**Line 191:7** - Error: Unexpected nullable number value in conditional.
  Please handle the nullish/zero/NaN cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`~~ ✅ Fixed
- ~~**Line 206:7** - Error: Promises must be awaited, end with a call to .catch,
  end with a call to .then with a rejection handler or be explicitly marked as
  ignored with the `void` operator. `@typescript-eslint/no-floating-promises`~~
  ✅ Fixed

### src/components/navigation/components/DrawerNavigation/index.tsx

- ~~**Line 126:1** - Error: Delete `······` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 129:1** - Error: Delete `······` `prettier/prettier`~~ ✅ Fixed

### src/hooks/use-navigation-persistence.tsx

- ~~**Line 57:11** - Error: Unexpected nullable string value in conditional.
  Please handle the nullish/empty cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`~~ ✅ Fixed
- ~~**Line 58:9** - Error: Unsafe return of a value of type `any`.
  `@typescript-eslint/no-unsafe-return`~~ ✅ Fixed
- ~~**Line 75:11** - Error: Unexpected nullable string value in conditional.
  Please handle the nullish/empty cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`~~ ✅ Fixed
- ~~**Line 76:9** - Error: Unsafe return of a value of type `any`.
  `@typescript-eslint/no-unsafe-return`~~ ✅ Fixed
- ~~**Line 121:11** - Error: Unexpected nullable string value in conditional.
  Please handle the nullish/empty cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`~~ ✅ Fixed
- ~~**Line 136:11** - Error: Unexpected nullable string value in conditional.
  Please handle the nullish/empty cases explicitly.
  `@typescript-eslint/strict-boolean-expressions`~~ ✅ Fixed
- ~~**Line 155:29** - Error: 'e' is defined but never used.
  `@typescript-eslint/no-unused-vars`~~ ✅ Fixed

### src/hooks/use-pwa-features.tsx

- ~~**Line 1:1** - Error: There should be at least one empty line between import
  groups `import/order`~~ ✅ Fixed
- ~~**Line 98:58** - Error: Delete `·` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 101:1** - Error: Delete `······` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 227:1** - Error: Delete `··` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 232:9** - Error: Insert `··` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 233:1** - Error: Insert `··` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 236:1** - Error: Delete `····` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 239:1** - Error: Delete `····` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 245:1** - Error: Delete `··` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 251:1** - Error: Delete `····` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 255:1** - Error: Delete `····` `prettier/prettier`~~ ✅ Fixed
- ~~**Line 60:11** - Error: Unnecessary conditional, the types have no overlap
  `@typescript-eslint/no-unnecessary-condition`~~ ✅ Fixed
- ~~**Line 66:11** - Error: Unnecessary conditional, the types have no overlap
  `@typescript-eslint/no-unnecessary-condition`~~ ✅ Fixed

### src/hooks/useGestureNavigation.ts

- ~~**Line 5:1** - Error: `@use-gesture/react` import should occur before import
  of `next/navigation` `import/order`~~ ✅ Fixed
