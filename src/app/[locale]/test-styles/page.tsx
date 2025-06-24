'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

export default function TestStylesPage() {
  const [cssVars, setCssVars] = useState<Record<string, string>>({})

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    setCssVars({
      background: styles.getPropertyValue('--background'),
      foreground: styles.getPropertyValue('--foreground'),
      card: styles.getPropertyValue('--card'),
      primary: styles.getPropertyValue('--primary'),
    })
  }, [])
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Test Styles Page</h1>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards</h2>
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>This is a card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Colors Test</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-background text-foreground border rounded">
            Background / Foreground
          </div>
          <div className="p-4 bg-card text-card-foreground border rounded">
            Card / Card Foreground
          </div>
          <div className="p-4 bg-primary text-primary-foreground rounded">
            Primary / Primary Foreground
          </div>
          <div className="p-4 bg-secondary text-secondary-foreground rounded">
            Secondary / Secondary Foreground
          </div>
          <div className="p-4 bg-muted text-muted-foreground rounded">
            Muted / Muted Foreground
          </div>
          <div className="p-4 bg-accent text-accent-foreground rounded">
            Accent / Accent Foreground
          </div>
          <div className="p-4 bg-destructive text-destructive-foreground rounded">
            Destructive / Destructive Foreground
          </div>
          <div className="p-4 border-2 border-border rounded">
            Border Color
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">CSS Variables Check</h2>
        <div className="p-4 border rounded font-mono text-sm">
          <div>--background: <span className="text-muted-foreground">{cssVars.background}</span></div>
          <div>--foreground: <span className="text-muted-foreground">{cssVars.foreground}</span></div>
          <div>--card: <span className="text-muted-foreground">{cssVars.card}</span></div>
          <div>--primary: <span className="text-muted-foreground">{cssVars.primary}</span></div>
        </div>
      </div>
    </div>
  )
}