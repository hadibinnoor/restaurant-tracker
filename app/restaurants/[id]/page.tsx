import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { RestaurantImageUpload } from '@/components/restaurants/restaurant-image-upload'
import { MapPin } from 'lucide-react'
import { Utensils } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RestaurantPage({
  params: { id },
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  const { data: restaurantImages } = await supabase
    .from('restaurant_images')
    .select('*')
    .eq('restaurant_id', id)

  if (!restaurant) {
    notFound()
  }

  const { data: { user } } = await supabase.auth.getUser()

  const googleMapsUrl = `https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" className="w-full sm:w-auto">
            ← Back to Restaurants
          </Button>
        </Link>
        {user && (
          <RestaurantImageUpload restaurantId={id} />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Main image */}
            <div className="col-span-2 relative aspect-square">
              <Image
                src={restaurant.image_url || '/placeholder-restaurant.jpg'}
                alt={restaurant.name}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            {/* Additional images */}
            {restaurantImages?.map((img) => (
              <div key={img.id} className="relative aspect-square">
                <Image
                  src={img.image_url}
                  alt={restaurant.name}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-4">{restaurant.name}</h1>
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2">Opening Hours</h2>
                  <p className="text-gray-600">
                    {format(new Date(`2000-01-01T${restaurant.opening_time}`), 'hh:mm a')} - {format(new Date(`2000-01-01T${restaurant.closing_time}`), 'hh:mm a')}
                  </p>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2">Location</h2>
                  <Link 
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <MapPin className="h-4 w-4" />
                    View on Google Maps
                  </Link>
                </div>

                {restaurant.tags && restaurant.tags.length > 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2">Recommended Dishes</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                    {restaurant.recommended_dishes.map((dish: string) => (
                      <li key={dish} className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-primary" />
                        {dish}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
