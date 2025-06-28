'use client'

import { useTheme } from 'next-themes'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const chartData = [
  { date: 'Apr 5', visitors: 2400, returning: 1800 },
  { date: 'Apr 11', visitors: 1398, returning: 1200 },
  { date: 'Apr 17', visitors: 9800, returning: 2800 },
  { date: 'Apr 23', visitors: 3908, returning: 2200 },
  { date: 'Apr 29', visitors: 4800, returning: 3200 },
  { date: 'May 5', visitors: 3800, returning: 2600 },
  { date: 'May 11', visitors: 4300, returning: 3100 },
  { date: 'May 17', visitors: 2400, returning: 1900 },
  { date: 'May 23', visitors: 2400, returning: 1800 },
  { date: 'May 29', visitors: 1800, returning: 1400 },
  { date: 'Jun 4', visitors: 4200, returning: 3000 },
  { date: 'Jun 10', visitors: 5600, returning: 4200 },
  { date: 'Jun 16', visitors: 6800, returning: 5100 },
  { date: 'Jun 22', visitors: 7200, returning: 5500 },
  { date: 'Jun 29', visitors: 6900, returning: 5200 },
]

export function VisitorsChart() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <ResponsiveContainer width='100%' height='100%' className='px-6 pb-6'>
      <AreaChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          stroke={isDark ? '#374151' : '#e5e7eb'}
          vertical={false}
        />
        <XAxis
          dataKey='date'
          axisLine={false}
          tickLine={false}
          tick={{
            fontSize: 12,
            fill: isDark ? '#9ca3af' : '#6b7280',
          }}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{
            fontSize: 12,
            fill: isDark ? '#9ca3af' : '#6b7280',
          }}
          tickMargin={8}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active === true && payload != null && payload.length > 0) {
              return (
                <div className='rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800'>
                  <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>{label}</p>
                  <div className='mt-2 space-y-1'>
                    {payload.map((entry, index) => (
                      <div key={index} className='flex items-center gap-2 text-sm'>
                        <div
                          className='h-3 w-3 rounded-full'
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className='text-gray-600 capitalize dark:text-gray-400'>
                          {entry.dataKey}:
                        </span>
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          {entry.value?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Area
          type='monotone'
          dataKey='returning'
          stackId='1'
          stroke='#6b7280'
          fill='#6b7280'
          fillOpacity={0.6}
        />
        <Area
          type='monotone'
          dataKey='visitors'
          stackId='1'
          stroke='#374151'
          fill='#374151'
          fillOpacity={0.8}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
