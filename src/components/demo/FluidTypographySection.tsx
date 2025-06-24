import { Typography } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'

export function FluidTypographySection() {
  return (
    <section>
      <Typography variant='h2' className='mb-6 text-center font-semibold'>
        Fluid Typography
      </Typography>
      <Card>
        <CardContent className='space-y-4 pt-6'>
          <Typography variant='h3' responsive>
            Responsive Heading
          </Typography>
          <Typography size='fluid' responsive>
            This text scales fluidly with the viewport for optimal readability.
          </Typography>
          <Typography variant='body'>
            Regular body text with proper line spacing for comfortable reading.
          </Typography>
          <Typography variant='caption'>Caption text with subtle styling.</Typography>
        </CardContent>
      </Card>
    </section>
  )
}
