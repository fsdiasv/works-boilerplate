'use client'

import { Plus } from 'lucide-react'
import dynamic from 'next/dynamic'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { DocumentsTable } from './DocumentsTable'
import { MetricCard } from './MetricCard'

// Import the chart directly without dynamic loading for now
// This ensures the component is available immediately
import { VisitorsChart } from './VisitorsChart'

export function Dashboard() {
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$1,250.00',
      change: '+12.5%',
      trend: 'up' as const,
      description: 'Trending up this month',
      subtext: 'Visitors for the last 6 months',
    },
    {
      title: 'New Customers',
      value: '1,234',
      change: '-20%',
      trend: 'down' as const,
      description: 'Down 20% this period',
      subtext: 'Acquisition needs attention',
    },
    {
      title: 'Active Accounts',
      value: '45,678',
      change: '+12.5%',
      trend: 'up' as const,
      description: 'Strong user retention',
      subtext: 'Engagement exceed targets',
    },
    {
      title: 'Growth Rate',
      value: '4.5%',
      change: '+4.5%',
      trend: 'up' as const,
      description: 'Steady performance increase',
      subtext: 'Meets growth projections',
    },
  ]

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Documents</h2>
        <div className='flex items-center space-x-2'>
          <Button>
            <Plus className='mr-2 h-4 w-4' /> Quick Create
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6'>
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle>Total Visitors</CardTitle>
              <CardDescription>Total for the last 3 months</CardDescription>
            </div>
            <Tabs defaultValue='3months' className='w-full sm:w-auto'>
              <TabsList className='grid w-full grid-cols-3 sm:w-auto sm:grid-cols-none'>
                <TabsTrigger
                  value='3months'
                  className='min-w-0 text-xs sm:min-w-[100px] sm:text-sm'
                >
                  Last 3 months
                </TabsTrigger>
                <TabsTrigger value='30days' className='min-w-0 text-xs sm:min-w-[100px] sm:text-sm'>
                  Last 30 days
                </TabsTrigger>
                <TabsTrigger value='7days' className='min-w-0 text-xs sm:min-w-[100px] sm:text-sm'>
                  Last 7 days
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className='h-[300px] p-0 sm:h-[400px]'>
          <VisitorsChart />
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className='space-y-4'>
            {/* Mobile: Stack tabs and buttons */}
            <div className='flex flex-col gap-4 lg:hidden'>
              <Tabs defaultValue='outline' className='w-full'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='outline' className='text-xs'>
                    Outline
                  </TabsTrigger>
                  <TabsTrigger value='past' className='text-xs'>
                    Past{' '}
                    <Badge variant='secondary' className='ml-1 px-1 py-0.5 text-xs'>
                      3
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className='flex gap-2'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='min-h-[44px] flex-1'>
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Section Type</DropdownMenuItem>
                    <DropdownMenuItem>Status</DropdownMenuItem>
                    <DropdownMenuItem>Target</DropdownMenuItem>
                    <DropdownMenuItem>Limit</DropdownMenuItem>
                    <DropdownMenuItem>Reviewer</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size='sm' className='min-h-[44px] flex-1'>
                  <Plus className='mr-2 h-4 w-4' />
                  Add
                </Button>
              </div>
            </div>

            {/* Desktop: Side by side */}
            <div className='hidden flex-wrap items-center justify-between gap-4 lg:flex'>
              <Tabs defaultValue='outline' className='w-auto'>
                <TabsList>
                  <TabsTrigger value='outline'>Outline</TabsTrigger>
                  <TabsTrigger value='past' className='flex items-center gap-2'>
                    Past Performance
                    <Badge variant='secondary' className='ml-1 px-2 py-0.5 text-xs'>
                      3
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value='key' className='flex items-center gap-2'>
                    Key Personnel
                    <Badge variant='secondary' className='ml-1 px-2 py-0.5 text-xs'>
                      2
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value='focus'>Focus Documents</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className='flex items-center gap-2'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' className='min-h-[44px]'>
                      Customize Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Section Type</DropdownMenuItem>
                    <DropdownMenuItem>Status</DropdownMenuItem>
                    <DropdownMenuItem>Target</DropdownMenuItem>
                    <DropdownMenuItem>Limit</DropdownMenuItem>
                    <DropdownMenuItem>Reviewer</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button className='min-h-[44px]'>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Section
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DocumentsTable />
        </CardContent>
      </Card>
    </div>
  )
}
