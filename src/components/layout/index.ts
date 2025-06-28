// Base layout components
export { Container } from './Container'
export { Grid, GridItem } from './Grid'
export { Stack, Spacer } from './Stack'
export { Section } from './Section'

// Typography
export { Typography, Heading, Text } from './Typography'

// Images
export { OptimizedImage, AvatarImage } from './OptimizedImage'
export { ResponsiveImage, Picture } from './ResponsiveImage'

// Responsive utilities
export {
  useViewport,
  useDeviceCapabilities,
  useResponsiveValue,
  useContainerQuery,
} from './ResponsiveUtils'

// Adaptive loading
export {
  AdaptiveLoader,
  DynamicComponent,
  ProgressiveEnhancement,
  ResourceHint,
} from './AdaptiveLoader'

// Core Web Vitals
export {
  WebVitals,
  useLayoutShiftPrevention,
  LayoutStable,
  useFontLoadOptimization,
} from './WebVitals'

// PWA features
export { PWALayout, usePWAFeatures, SafeAreaInset, useViewportMeta } from './PWALayout'

// Development tools
export { LayoutDebugger } from './LayoutDebugger'
