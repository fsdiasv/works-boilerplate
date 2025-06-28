# Responsive Layout System Documentation

This comprehensive responsive layout system provides mobile-first,
performance-optimized components with container queries, adaptive loading, and
PWA support.

## Core Components

### 1. Container Component

A responsive container with container query support:

```tsx
import { Container } from '@/components/layout/Container'

// Basic usage
<Container>
  <h1>Content</h1>
</Container>

// With size variants
<Container size="sm">Small container (max-w-2xl)</Container>
<Container size="lg">Large container (max-w-6xl)</Container>

// Disable container queries
<Container enableQueries={false}>
  Static container
</Container>
```

### 2. Grid Component

Intelligent grid system with automatic responsive behavior:

```tsx
import { Grid, GridItem } from '@/components/layout/Grid'

// Responsive grid with container queries
<Grid cols={3} gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>

// Auto-fit grid
<Grid cols="auto" gap="lg">
  <div>Auto-sized item</div>
  <div>Auto-sized item</div>
</Grid>

// Grid with custom items
<Grid cols={12}>
  <GridItem span={8}>Main content</GridItem>
  <GridItem span={4}>Sidebar</GridItem>
</Grid>
```

### 3. Stack Component

Flexible layout component for vertical/horizontal stacking:

```tsx
import { Stack, Spacer } from '@/components/layout/Stack'

// Vertical stack (default)
<Stack gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>

// Horizontal stack with spacer
<Stack direction="horizontal" align="center">
  <div>Left</div>
  <Spacer />
  <div>Right</div>
</Stack>

// Responsive stack
<Stack direction="responsive" gap="responsive">
  <div>Adapts to viewport</div>
  <div>Changes direction</div>
</Stack>
```

### 4. Typography Component

Fluid typography with responsive scaling:

```tsx
import { Typography, Heading, Text } from '@/components/layout/Typography'

// Responsive headings
<Typography variant="h1" responsive>
  Fluid Heading
</Typography>

// Custom styling
<Typography
  variant="body"
  size="lg"
  weight="semibold"
  color="primary"
>
  Styled text
</Typography>

// Convenience components
<Heading level={2}>Section Title</Heading>
<Text size="sm" color="muted">Description text</Text>
```

### 5. ResponsiveImage Component

Performance-optimized image loading with adaptive strategies:

```tsx
import { ResponsiveImage } from '@/components/layout/ResponsiveImage'

// Basic responsive image
<ResponsiveImage
  src="/hero.jpg"
  alt="Hero image"
  width={800}
  height={600}
/>

// With adaptive loading
<ResponsiveImage
  src="/product.jpg"
  alt="Product"
  loading="adaptive"
  quality={{ default: 85, mobile: 70 }}
  priority={false}
/>

// Art-directed images
<ResponsiveImage
  src="/default.jpg"
  alt="Responsive"
  srcSet={{
    mobile: "/mobile.jpg",
    tablet: "/tablet.jpg",
    desktop: "/desktop.jpg"
  }}
/>
```

## Utility Hooks

### useViewport()

Detect current viewport size and device type:

```tsx
const { width, height, isMobile, isTablet, isDesktop } = useViewport()

if (isMobile) {
  return <MobileLayout />
}
```

### useDeviceCapabilities()

Detect device capabilities for adaptive features:

```tsx
const { isTouch, networkSpeed, deviceMemory } = useDeviceCapabilities()

if (networkSpeed === 'slow') {
  return <LowBandwidthContent />
}
```

### useResponsiveValue()

Get viewport-aware values:

```tsx
const columns = useResponsiveValue({
  base: 1,
  sm: 2,
  lg: 3,
  xl: 4,
})
```

## Adaptive Loading

### AdaptiveLoader Component

Load components based on conditions:

```tsx
import { AdaptiveLoader } from '@/components/layout/AdaptiveLoader'

// Load on viewport visibility
<AdaptiveLoader loadOn="visible">
  <HeavyComponent />
</AdaptiveLoader>

// Load on user interaction
<AdaptiveLoader loadOn="interaction">
  <InteractiveWidget />
</AdaptiveLoader>

// Load when idle
<AdaptiveLoader loadOn="idle">
  <Analytics />
</AdaptiveLoader>
```

### DynamicComponent

Dynamic imports with loading strategies:

```tsx
import { DynamicComponent } from '@/components/layout/AdaptiveLoader'
;<DynamicComponent
  loader={() => import('./Chart')}
  loadOn='visible'
  fallback={<ChartSkeleton />}
/>
```

## Core Web Vitals Optimization

### WebVitals Component

Monitor performance metrics:

```tsx
import { WebVitals } from '@/components/layout/WebVitals'

// Development monitoring
<WebVitals showIndicator={true} />

// Production monitoring
<WebVitals
  showIndicator={false}
  onReport={(metrics) => {
    // Send to analytics
    analytics.track('web-vitals', metrics)
  }}
/>
```

### Layout Shift Prevention

Prevent cumulative layout shift:

```tsx
import { LayoutStable } from '@/components/layout/WebVitals'

// Fixed dimensions
<LayoutStable width={300} height={200}>
  <AsyncContent />
</LayoutStable>

// Aspect ratio
<LayoutStable aspectRatio={16/9}>
  <VideoPlayer />
</LayoutStable>
```

## PWA Features

### PWALayout Component

PWA-optimized layout with safe areas:

```tsx
import { PWALayout } from '@/components/layout/PWALayout'
;<PWALayout safeArea='all' preventPullToRefresh showInstallPrompt>
  <App />
</PWALayout>
```

### usePWAFeatures Hook

Detect PWA capabilities:

```tsx
const { isInstalled, canInstall, hasShareSupport } = usePWAFeatures()

if (hasShareSupport) {
  navigator.share({ title, text, url })
}
```

## Layout Debugging

### LayoutDebugger Component

Visual debugging tools for development:

```tsx
import { LayoutDebugger } from '@/components/layout/LayoutDebugger'

// Add to app during development
;<LayoutDebugger
  showGrid
  showBreakpoints
  showTouchTargets
  showViewportInfo
  showPerformance
/>
```

Press `Ctrl+Shift+D` to toggle the debugger.

## CSS Utilities

### Viewport-Aware Spacing

```css
/* Fluid padding/margin */
.p-fluid    /* Responsive padding */
.px-fluid   /* Horizontal padding */
.py-fluid   /* Vertical padding */
.m-fluid    /* Responsive margin */
.gap-fluid  /* Responsive gap */

/* Safe area utilities */
.safe-area-container  /* All safe areas */
.px-viewport         /* Viewport-aware horizontal padding */
.py-viewport         /* Viewport-aware vertical padding */

/* Touch targets */
.touch-responsive    /* Responsive touch target sizes */
.touch-target       /* Minimum 44px touch target */
```

### Container Queries

Enable container queries on any element:

```tsx
<div className='@container'>
  <div className='@sm:grid-cols-2 @lg:grid-cols-3'>
    Responsive to container size
  </div>
</div>
```

### Print Styles

```css
/* Hide elements in print */
.no-print

/* Force visibility in print */
.print-visible

/* Page break controls */
.page-break      /* Force page break after */
.avoid-break     /* Prevent page break inside */
```

## Best Practices

1. **Mobile-First Development**
   - Start with mobile layout
   - Enhance for larger screens
   - Test on real devices

2. **Performance Optimization**
   - Use adaptive loading for heavy components
   - Implement lazy loading for images
   - Monitor Core Web Vitals

3. **Container Queries**
   - Use for component-level responsiveness
   - Combine with viewport queries
   - Test browser compatibility

4. **Touch Optimization**
   - Ensure 44px minimum touch targets
   - Add appropriate spacing
   - Test with touch devices

5. **PWA Considerations**
   - Handle safe areas properly
   - Test in standalone mode
   - Provide install prompts

## Browser Support

- Modern browsers with container query support
- Fallbacks for older browsers
- Progressive enhancement approach
- Polyfills available for critical features
