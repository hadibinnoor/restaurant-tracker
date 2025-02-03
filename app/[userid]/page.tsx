'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Utensils } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SearchInput } from '@/components/restaurants/search-input'

interface UserProfilePageProps {
  params: { userid: string }
}

interface Restaurant {
  id: string
  name: string
  latitude: number
  longitude: number
  opening_time: string
  closing_time: string
  tags: string[]
  recommended_dishes: string[]
  restaurant_images: RestaurantImage[]
  user_id: string
  created_at: string
}

interface RestaurantImage {
  id: string
  restaurant_id: string
  image_url: string
  created_at: string
}

export default function UserProfilePage({ params: { userid } }: UserProfilePageProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [userName, setUserName] = useState<string>('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserData = async () => {
      // Get user data from auth
      const { data: { user } } = await supabase.auth.getUser(userid)
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name)
      }

      // Fetch user's restaurants
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select(`
          *,
          restaurant_images (*)
        `)
        .eq('user_id', userid)
        .order('created_at', { ascending: false })

      if (restaurantsData) {
        setRestaurants(restaurantsData)
        setFilteredRestaurants(restaurantsData)
      }
    }

    fetchUserData()
  }, [userid, supabase])

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
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">
        {userName ? `${userName}'s Restaurants` : 'Restaurants'}
      </h1>

      <div className="mb-8 max-w-2xl">
        <SearchInput
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by restaurant name, tags, or dishes..."
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map((restaurant) => (
          <Link href={`/restaurants/${restaurant.id}`} key={restaurant.id}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-video relative mb-4 overflow-hidden rounded-lg">
                  {restaurant.restaurant_images?.[0] ? (
                    <Image
                      src={restaurant.restaurant_images[0].image_url}
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Utensils className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold mb-2">{restaurant.name}</h2>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <a 
                    href={`https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View on Google Maps
                  </a>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>
                    Open: {format(new Date(`2000-01-01T${restaurant.opening_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${restaurant.closing_time}`), 'h:mm a')}
                  </p>
                </div>
                
                {restaurant.tags && restaurant.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {restaurant.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
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
      
      {filteredRestaurants.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No restaurants found
        </div>
      )}
    </div>
  )
}
