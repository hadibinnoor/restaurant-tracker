'use client'

import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function RestaurantLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link href="/">
          <Button variant="outline">← Back to Restaurants</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Main image skeleton */}
            <div className="col-span-2 relative aspect-square bg-gray-200 animate-pulse rounded-lg" />
            {/* Additional image skeletons */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative aspect-square bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-6 w-1/4 bg-gray-200 animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
