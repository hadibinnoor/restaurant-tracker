'use client'

import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { format } from 'date-fns'
import Link from 'next/link'
import { Clock, MapPin } from 'lucide-react'

interface RestaurantCardProps {
  id: string
  name: string
  imageUrl: string
  latitude: number
  longitude: number
  openingTime: string
  closingTime: string
  recommendedDishes: string[]
  tags?: string[]
}

export function RestaurantCard({
  id,
  name,
  imageUrl,
  latitude,
  longitude,
  openingTime,
  closingTime,
  recommendedDishes,
  tags = []
}: RestaurantCardProps) {
  return (
    <Link href={`/restaurants/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-video sm:aspect-square">
            <Image
              src={imageUrl || '/placeholder-restaurant.jpg'}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg sm:text-xl mb-2 line-clamp-1">{name}</CardTitle>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{format(new Date(`2000-01-01T${openingTime}`), 'hh:mm a')} - {format(new Date(`2000-01-01T${closingTime}`), 'hh:mm a')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>View Location</span>
            </div>
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-gray-500">+{tags.length - 3} more</span>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="text-sm">
            <p className="font-medium text-gray-700">Recommended:</p>
            <p className="text-gray-600 line-clamp-1">
              {recommendedDishes.slice(0, 2).join(', ')}
              {recommendedDishes.length > 2 && ' ...'}
            </p>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
