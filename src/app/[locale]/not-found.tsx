import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8 text-center'>
        <div>
          <h1 className='text-9xl font-bold text-gray-200 dark:text-gray-700'>404</h1>
          <h2 className='mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100'>
            Page Not Found
          </h2>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>

        <div className='space-y-4'>
          <Link
            href='/'
            className='inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
