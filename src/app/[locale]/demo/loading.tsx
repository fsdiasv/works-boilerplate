export default function DemoLoading() {
  return (
    <div className='bg-background flex min-h-screen flex-col'>
      {/* Header skeleton */}
      <div className='bg-muted/50 h-16 animate-pulse border-b' />

      {/* Main content skeleton */}
      <main className='flex-1 p-4'>
        <div className='container mx-auto max-w-4xl space-y-8'>
          {/* Title section */}
          <div className='space-y-4 text-center'>
            <div className='bg-muted mx-auto h-8 w-48 animate-pulse rounded' />
            <div className='bg-muted mx-auto h-4 w-64 animate-pulse rounded' />
          </div>

          {/* Content sections */}
          <div className='bg-muted h-32 animate-pulse rounded-lg' />
          <div className='bg-muted h-48 animate-pulse rounded-lg' />
          <div className='bg-muted h-24 animate-pulse rounded-lg' />
        </div>
      </main>

      {/* Bottom nav skeleton */}
      <div className='bg-muted/50 h-16 animate-pulse border-t' />
    </div>
  )
}
