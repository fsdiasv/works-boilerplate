'use client'

import { useSafeAreaInsets } from '@/components/navigation/hooks/useSafeAreaInsets'

export default function TestSafeAreaPage() {
  const { insets, cssInsets, paddingClasses, hasInsets } = useSafeAreaInsets()

  return (
    <div className='min-h-screen bg-gray-100'>
      {/* Test 1: Visual representation of safe areas */}
      <div className='relative h-screen'>
        {/* Top safe area */}
        <div
          className='absolute top-0 right-0 left-0 bg-red-500/30'
          style={{ height: cssInsets.top }}
        >
          <span className='p-2 text-xs text-white'>Top Safe Area: {cssInsets.top}</span>
        </div>

        {/* Bottom safe area */}
        <div
          className='absolute right-0 bottom-0 left-0 bg-blue-500/30'
          style={{ height: cssInsets.bottom }}
        >
          <span className='p-2 text-xs text-white'>Bottom Safe Area: {cssInsets.bottom}</span>
        </div>

        {/* Left safe area */}
        <div
          className='absolute top-0 bottom-0 left-0 bg-green-500/30'
          style={{ width: cssInsets.left }}
        >
          <span className='writing-mode-vertical p-2 text-xs text-white'>
            Left: {cssInsets.left}
          </span>
        </div>

        {/* Right safe area */}
        <div
          className='absolute top-0 right-0 bottom-0 bg-yellow-500/30'
          style={{ width: cssInsets.right }}
        >
          <span className='writing-mode-vertical p-2 text-xs text-white'>
            Right: {cssInsets.right}
          </span>
        </div>

        {/* Content area with safe area padding */}
        <div className={`h-full ${paddingClasses.all} bg-white/90`}>
          <div className='p-4'>
            <h1 className='mb-4 text-2xl font-bold'>Safe Area Insets Test</h1>

            <div className='mb-6 space-y-2'>
              <p className='text-sm'>
                Has Insets: <strong>{hasInsets ? 'Yes' : 'No'}</strong>
              </p>
              <p className='text-sm'>
                Top: <strong>{insets.top}px</strong>
              </p>
              <p className='text-sm'>
                Right: <strong>{insets.right}px</strong>
              </p>
              <p className='text-sm'>
                Bottom: <strong>{insets.bottom}px</strong>
              </p>
              <p className='text-sm'>
                Left: <strong>{insets.left}px</strong>
              </p>
            </div>

            <div className='space-y-4'>
              <div className='rounded bg-gray-100 p-4'>
                <h2 className='mb-2 font-semibold'>Tailwind Classes Test</h2>
                <div className='pt-safe-top pr-safe-right pb-safe-bottom pl-safe-left rounded bg-blue-100 p-4'>
                  This div uses Tailwind safe area padding utilities
                </div>
              </div>

              <div className='rounded bg-gray-100 p-4'>
                <h2 className='mb-2 font-semibold'>CSS Custom Properties Test</h2>
                <div
                  className='rounded bg-green-100 p-4'
                  style={{
                    paddingTop: `var(--safe-area-inset-top, 0px)`,
                    paddingRight: `var(--safe-area-inset-right, 0px)`,
                    paddingBottom: `var(--safe-area-inset-bottom, 0px)`,
                    paddingLeft: `var(--safe-area-inset-left, 0px)`,
                  }}
                >
                  This div uses CSS custom properties for safe areas
                </div>
              </div>
            </div>

            <div className='mt-8 rounded bg-yellow-100 p-4'>
              <h2 className='mb-2 font-semibold'>Testing Instructions:</h2>
              <ol className='list-inside list-decimal space-y-1 text-sm'>
                <li>Install this PWA on an iOS device (iPhone X or newer)</li>
                <li>Open the app in standalone mode</li>
                <li>Rotate the device to see safe area changes</li>
                <li>Check that content doesn&apos;t overlap with notch/home indicator</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
