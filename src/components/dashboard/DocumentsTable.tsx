'use client'

import { MoreVertical, Circle, CheckCircle2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const documents = [
  {
    id: 1,
    header: 'Cover page',
    sectionType: 'Cover page',
    status: 'In Process',
    target: 18,
    limit: 5,
    reviewer: 'Eddie Lake',
  },
  {
    id: 2,
    header: 'Technical approach',
    sectionType: 'Narrative',
    status: 'Done',
    target: 27,
    limit: 23,
    reviewer: 'Jamik Tashputatov',
  },
  {
    id: 3,
    header: 'Design',
    sectionType: 'Narrative',
    status: 'In Process',
    target: 2,
    limit: 16,
    reviewer: 'Jamik Tashputatov',
  },
  {
    id: 4,
    header: 'Capabilities',
    sectionType: 'Narrative',
    status: 'In Process',
    target: 20,
    limit: 8,
    reviewer: 'Jamik Tashputatov',
  },
  {
    id: 5,
    header: 'Integration with existing systems',
    sectionType: 'Narrative',
    status: 'In Process',
    target: 19,
    limit: 21,
    reviewer: 'Jamik Tashputatov',
  },
  {
    id: 6,
    header: 'Innovation and Advantages',
    sectionType: 'Narrative',
    status: 'Done',
    target: 25,
    limit: 26,
    reviewer: 'Assign reviewer',
  },
  {
    id: 7,
    header: "Overview of EMR's Innovative Solutions",
    sectionType: 'Technical content',
    status: 'Done',
    target: 7,
    limit: 23,
    reviewer: 'Assign reviewer',
  },
  {
    id: 8,
    header: 'Advanced Algorithms and Machine Learning',
    sectionType: 'Narrative',
    status: 'Done',
    target: 30,
    limit: 28,
    reviewer: 'Assign reviewer',
  },
]

export function DocumentsTable() {
  return (
    <div className='space-y-4'>
      {/* Mobile Cards View */}
      <div className='block space-y-3 md:hidden'>
        {documents.map(doc => (
          <div
            key={doc.id}
            className='space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                  #{doc.id}
                </span>
                <h3 className='font-medium text-gray-900 dark:text-white'>{doc.header}</h3>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>View details</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className='text-red-600'>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <span className='text-gray-500 dark:text-gray-400'>Type:</span>
                <Badge variant='outline' className='ml-2 text-xs'>
                  {doc.sectionType}
                </Badge>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-gray-500 dark:text-gray-400'>Status:</span>
                {doc.status === 'Done' ? (
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                ) : (
                  <Circle className='h-4 w-4 text-gray-400' />
                )}
                <span className='text-sm'>{doc.status}</span>
              </div>
              <div>
                <span className='text-gray-500 dark:text-gray-400'>Target:</span>
                <span className='ml-2 font-medium'>{doc.target}</span>
              </div>
              <div>
                <span className='text-gray-500 dark:text-gray-400'>Limit:</span>
                <span className='ml-2 font-medium'>{doc.limit}</span>
              </div>
            </div>

            <div>
              <span className='text-sm text-gray-500 dark:text-gray-400'>Reviewer:</span>
              {doc.reviewer === 'Assign reviewer' ? (
                <Select>
                  <SelectTrigger className='mt-1 h-9 w-full'>
                    <SelectValue placeholder='Assign reviewer' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='eddie'>Eddie Lake</SelectItem>
                    <SelectItem value='jamik'>Jamik Tashputatov</SelectItem>
                    <SelectItem value='other'>Other reviewer</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className='ml-2 text-sm font-medium'>{doc.reviewer}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[50px]'>#</TableHead>
              <TableHead>Header</TableHead>
              <TableHead>Section Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead className='w-[50px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map(doc => (
              <TableRow key={doc.id} className='hover:bg-gray-50 dark:hover:bg-gray-800/50'>
                <TableCell className='font-medium'>{doc.id}</TableCell>
                <TableCell className='font-medium'>{doc.header}</TableCell>
                <TableCell>
                  <Badge variant='outline' className='text-xs'>
                    {doc.sectionType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    {doc.status === 'Done' ? (
                      <CheckCircle2 className='h-4 w-4 text-green-500' />
                    ) : (
                      <Circle className='h-4 w-4 text-gray-400' />
                    )}
                    <span className='text-sm'>{doc.status}</span>
                  </div>
                </TableCell>
                <TableCell>{doc.target}</TableCell>
                <TableCell>{doc.limit}</TableCell>
                <TableCell>
                  {doc.reviewer === 'Assign reviewer' ? (
                    <Select>
                      <SelectTrigger className='h-8 w-auto min-w-[120px]'>
                        <SelectValue placeholder='Assign reviewer' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='eddie'>Eddie Lake</SelectItem>
                        <SelectItem value='jamik'>Jamik Tashputatov</SelectItem>
                        <SelectItem value='other'>Other reviewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className='text-sm'>{doc.reviewer}</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <MoreVertical className='h-4 w-4' />
                        <span className='sr-only'>Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className='text-red-600'>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex flex-col items-start justify-between gap-4 text-sm text-gray-500 sm:flex-row sm:items-center dark:text-gray-400'>
        <span className='order-2 sm:order-1'>0 of 68 row(s) selected.</span>
        <div className='order-1 flex flex-col items-start gap-3 sm:order-2 sm:flex-row sm:items-center sm:gap-2'>
          <div className='flex items-center gap-2'>
            <span className='text-nowrap'>Rows per page</span>
            <Select defaultValue='10'>
              <SelectTrigger className='h-9 w-16'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='20'>20</SelectItem>
                <SelectItem value='50'>50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-nowrap'>Page 1 of 7</span>
            <div className='flex gap-1'>
              <Button variant='outline' size='sm' disabled className='min-h-[44px] px-3'>
                Previous
              </Button>
              <Button variant='outline' size='sm' className='min-h-[44px] px-3'>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
