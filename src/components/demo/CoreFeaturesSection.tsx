import { Typography } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  { title: 'Mobile First', description: 'Optimized for touch interactions', icon: '📱' },
  { title: 'PWA Ready', description: 'Installable with offline support', icon: '🚀' },
  { title: 'International', description: 'Multi-language support', icon: '🌍' },
  { title: 'Type Safe', description: 'End-to-end TypeScript', icon: '🔒' },
  { title: 'Responsive', description: 'Container queries & fluid design', icon: '📐' },
  { title: 'Accessible', description: 'WCAG 2.1 AA compliant', icon: '♿' },
]

export function CoreFeaturesSection() {
  return (
    <section className='mb-12'>
      <Typography variant='h2' className='mb-6 text-center font-semibold'>
        Core Features
      </Typography>
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6'>
        {features.map((feature, i) => (
          <Card key={i} className='group text-center transition-shadow hover:shadow-lg'>
            <CardHeader>
              <div className='bg-secondary mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl'>
                {feature.icon}
              </div>
              <CardTitle className='text-base font-semibold'>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className='text-xs'>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
