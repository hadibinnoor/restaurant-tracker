import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { RestaurantCard } from '@/components/restaurants/restaurant-card'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/restaurants/search-input'

interface RestaurantImage {
  created_at: string
  image_url: string
}

interface Restaurant {
  id: string
  name: string
  latitude: number
  longitude: number
  opening_time: string
  closing_time: string
  recommended_dishes: string[]
  tags: string[]
  image_url: string | null
  restaurant_images: RestaurantImage[] | null
}

export const dynamic = 'force-dynamic'

export default async function HomePage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const supabase = createServerComponentClient({ cookies })
  
  let query = supabase
    .from('restaurants')
    .select('*, restaurant_images(*)')
    .order('created_at', { ascending: false })

  // Apply search filter if search param exists
  if (searchParams.search) {
    const searchTerm = searchParams.search.toLowerCase()
    query = query.or(
      `name.ilike.%${searchTerm}%,` +
      `tags.cs.{${searchTerm}},` +
      `recommended_dishes.cs.{${searchTerm}}`
    )
  }

  const { data: restaurants, error } = await query

  if (error) {
    console.error('Error fetching restaurants:', error)
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Get the latest image for each restaurant
  const restaurantsWithLatestImage = restaurants?.map((restaurant: Restaurant) => {
    const latestImage = restaurant.restaurant_images?.sort((a: RestaurantImage, b: RestaurantImage) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
    return {
      ...restaurant,
      image_url: latestImage ? latestImage.image_url : restaurant.image_url || '/placeholder-restaurant.jpg'
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Theeeta</h1>
        {user && (
          <Link href="/add-restaurant">
            <Button className="w-full sm:w-auto">Add Restaurant</Button>
          </Link>
        )}
      </div>

      {user && (
        <div className="mb-8">
          <SearchInput />
        </div>
      )}

      {!user ? (
        <div className="text-center py-12">
          <h2 className="text-xl mb-4">Please sign in to view and add restaurants</h2>
        </div>
      ) : !restaurants || restaurants.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl mb-4">
            {searchParams.search
              ? 'No restaurants found matching your search'
              : 'No restaurants added yet'}
          </h2>
          {!searchParams.search && (
            <p className="text-gray-600">Add your first restaurant to get started!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {restaurantsWithLatestImage?.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              id={restaurant.id}
              name={restaurant.name}
              imageUrl={restaurant.image_url}
              latitude={restaurant.latitude}
              longitude={restaurant.longitude}
              openingTime={restaurant.opening_time}
              closingTime={restaurant.closing_time}
              recommendedDishes={restaurant.recommended_dishes || []}
              tags={restaurant.tags || []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
