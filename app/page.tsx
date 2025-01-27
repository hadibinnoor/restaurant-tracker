'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/restaurants/search-input'
import { AddRestaurantDialog } from '@/components/restaurants/add-restaurant-dialog'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Plus } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  latitude: number
  longitude: number
  tags: string[]
  recommended_dishes: string[]
  restaurant_images: { image_url: string }[]
}

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchRestaurants()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, restaurant_images(*)')

    if (error) {
      console.error('Error fetching restaurants:', error)
      return
    }

    if (data) {
      // Sort restaurants so ones with images appear first
      const sortedRestaurants = data.sort((a, b) => {
        const aHasImages = a.restaurant_images && a.restaurant_images.length > 0
        const bHasImages = b.restaurant_images && b.restaurant_images.length > 0
        return bHasImages - aHasImages
      })

      setRestaurants(sortedRestaurants)
      setFilteredRestaurants(sortedRestaurants)
    }
  }

  // Update filtered restaurants whenever search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRestaurants(restaurants)
      return
    }

    const searchTermLower = searchTerm.toLowerCase()
    const filtered = restaurants.filter(restaurant => {
      // Search in name
      const nameMatch = restaurant.name.toLowerCase().includes(searchTermLower)
      
      // Search in tags
      const tagsMatch = restaurant.tags?.some(tag => 
        tag.toLowerCase().includes(searchTermLower)
      ) || false
      
      // Search in recommended dishes
      const dishesMatch = restaurant.recommended_dishes?.some(dish => 
        dish.toLowerCase().includes(searchTermLower)
      ) || false

      return nameMatch || tagsMatch || dishesMatch
    })

    setFilteredRestaurants(filtered)
  }, [searchTerm, restaurants])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex-1 w-full sm:max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {user && (
          <Button onClick={() => setIsAddingRestaurant(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Restaurant
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map((restaurant) => {
          const mainImage = restaurant.restaurant_images?.[0]?.image_url || '/placeholder-restaurant.jpg'
          
          return (
            <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative aspect-video">
                    <Image
                      src={mainImage}
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl font-semibold mb-2">{restaurant.name}</h2>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <a
                        href={`https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Maps
                      </a>
                    </div>
                    {restaurant.tags && restaurant.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {restaurant.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <AddRestaurantDialog
        open={isAddingRestaurant}
        onOpenChange={setIsAddingRestaurant}
        onRestaurantAdded={fetchRestaurants}
      />
    </div>
  )
}
