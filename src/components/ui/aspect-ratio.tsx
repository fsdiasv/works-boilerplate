'use client'

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio'
import type React from 'react'

function AspectRatio({ ...props }: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot='aspect-ratio' {...props} />
}

export { AspectRatio }
