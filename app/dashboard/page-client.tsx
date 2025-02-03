'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/restaurants/search-input'
import { AddRestaurantDialog } from '@/components/restaurants/add-restaurant-dialog'
import { ShareProfileDialog } from '@/components/profile/share-profile-dialog'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Plus, Utensils } from 'lucide-react'
import { redirect } from 'next/navigation'
import { useToast } from "@/components/ui/use-toast"

interface Restaurant {
  id: string
  name: string
  latitude: number
  longitude: number
  tags: string[]
  recommended_dishes: string[]
  restaurant_images: { image_url: string }[]
}

export default function DashboardClient({ initialUser }: { initialUser: any }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const fetchRestaurants = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, restaurant_images(*)')
      .eq('user_id', userId)

    if (data) {
      setRestaurants(data)
      setFilteredRestaurants(data)
    }
  }, [supabase])

  useEffect(() => {
    if (initialUser) {
      fetchRestaurants(initialUser.id)
    }
  }, [initialUser, fetchRestaurants])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (!term.trim()) {
      setFilteredRestaurants(restaurants)
      return
    }

    const searchTermLower = term.toLowerCase().trim()
    const filtered = restaurants.filter(restaurant => {
      // Search in restaurant name
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
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex-1 w-full md:w-auto">
          <SearchInput
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by restaurant name, tags, or dishes..."
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={() => setIsAddingRestaurant(true)}
            className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Restaurant
          </Button>
          <Button
            onClick={() => {
              const url = `${window.location.origin}/${initialUser.id}`;
              navigator.clipboard.writeText(url);
              toast({
                description: "Public profile link copied to clipboard!",
              })
            }}
            className="w-full md:w-auto"
          >
            Share Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map((restaurant) => (
          <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <div className="relative h-48 w-full">
                {restaurant.restaurant_images?.[0]?.image_url ? (
                  <Image
                    src={restaurant.restaurant_images[0].image_url}
                    alt={restaurant.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <Utensils className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">{restaurant.name}</h3>
                <div className="flex items-center text-gray-500 mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {restaurant.latitude && restaurant.longitude
                      ? 'View on Google Maps'
                      : 'No location set'}
                  </span>
                </div>
                {restaurant.tags && restaurant.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {restaurant.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <AddRestaurantDialog
        open={isAddingRestaurant}
        onOpenChange={setIsAddingRestaurant}
        onRestaurantAdded={(newRestaurant) => {
          setRestaurants([...restaurants, newRestaurant])
          setFilteredRestaurants([...filteredRestaurants, newRestaurant])
        }}
      />
    </div>
  )
}
