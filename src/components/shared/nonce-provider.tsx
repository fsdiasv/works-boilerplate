import { headers } from 'next/headers'

/**
 * Server component that provides CSP nonce to the page
 * Include this in your root layout
 */
export async function NonceProvider() {
  const headersList = await headers()
  const nonce = headersList.get('x-csp-nonce') ?? ''

  if (nonce === '') return null

  return (
    <>
      <meta name='csp-nonce' content={nonce} />
      <style
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS can go here */
            body { margin: 0; }
          `,
        }}
      />
    </>
  )
}
