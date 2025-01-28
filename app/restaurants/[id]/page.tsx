'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { RestaurantImageUpload } from '@/components/restaurants/restaurant-image-upload'
import { MapPin, Plus, Utensils } from 'lucide-react'
import { ImageViewerModal } from '@/components/ui/image-viewer-modal'
import { InputDialog } from '@/components/ui/input-dialog'
import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'

interface RestaurantPageProps {
  params: { id: string }
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
}

interface RestaurantImage {
  id: string
  restaurant_id: string
  image_url: string
  created_at: string
}

export default function RestaurantPage({ params: { id } }: RestaurantPageProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [user, setUser] = useState<any>(null)
  const [sortedImages, setSortedImages] = useState<RestaurantImage[]>([])
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isAddingDish, setIsAddingDish] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching data for restaurant ID:', id)
      
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*, restaurant_images(*)')
        .eq('id', id)
        .single()

      console.log('Restaurant data:', restaurantData)
      console.log('Restaurant error:', restaurantError)

      if (!restaurantData) {
        console.error('No restaurant data found')
        notFound()
      }

      const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
      console.log('User data:', userData)
      console.log('User error:', userError)

      // Sort restaurant images by created_at
      const images = restaurantData.restaurant_images?.sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) || []

      setRestaurant(restaurantData)
      setUser(userData)
      setSortedImages(images)
    }

    // Set up realtime subscription
    const restaurantSubscription = supabase
      .channel(`restaurant-${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'restaurants',
        filter: `id=eq.${id}`
      }, () => {
        fetchData()
      })
      .subscribe()

    // Initial fetch
    fetchData()

    // Cleanup
    return () => {
      restaurantSubscription.unsubscribe()
    }
  }, [id, supabase]) // Only depend on id and supabase client

  if (!restaurant) return null

  const googleMapsUrl = `https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`

  const handleAddTag = async (tag: string) => {
    console.log('Adding tag:', tag)
    
    // Ensure we have an array, even if tags is null/undefined
    const currentTags = Array.isArray(restaurant.tags) ? restaurant.tags : []
    console.log('Current tags:', currentTags)
    
    // Create new array with the new tag
    const newTags = [...currentTags, tag]
    console.log('New tags array:', newTags)
    
    try {
      // Update the restaurant
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ 
          tags: newTags
        })
        .eq('id', restaurant.id)

      if (updateError) {
        console.error('Error updating tags:', updateError)
        return
      }

      // Update local state
      setRestaurant((prev: Restaurant | null) => {
        if (!prev) return prev
        return {
          ...prev,
          tags: newTags
        }
      })
    } catch (error) {
      console.error('Error in handleAddTag:', error)
    }
  }

  const handleAddDish = async (dish: string) => {
    console.log('Adding dish:', dish)
    
    // Ensure we have an array, even if recommended_dishes is null/undefined
    const currentDishes = Array.isArray(restaurant.recommended_dishes) 
      ? restaurant.recommended_dishes 
      : []
    
    // Create new array with the new dish
    const newDishes = [...currentDishes, dish]
    
    try {
      // Update the restaurant
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ 
          recommended_dishes: newDishes
        })
        .eq('id', restaurant.id)

      if (updateError) {
        console.error('Error updating dishes:', updateError)
        return
      }

      // Update local state
      setRestaurant((prev: Restaurant | null) => {
        if (!prev) return prev
        return {
          ...prev,
          recommended_dishes: newDishes
        }
      })
    } catch (error) {
      console.error('Error in handleAddDish:', error)
    }
  }

  const handleImageUpload = (imageData: RestaurantImage) => {
    setSortedImages(prev => {
      const newImages = [...prev, imageData].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      return newImages
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" className="w-full sm:w-auto">
            ← Back to Restaurants
          </Button>
        </Link>
        {user && (
          <RestaurantImageUpload 
            restaurantId={id} 
            onUploadComplete={handleImageUpload} 
          />
        )}
      </div>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Card className="flex-1 md:w-1/2">
            <CardContent className="p-0">
              <div 
                className="relative aspect-video w-full cursor-pointer"
                onClick={() => setSelectedImageIndex(0)}
              >
                <Image
                  src={sortedImages[0]?.image_url || '/placeholder-restaurant.jpg'}
                  alt={restaurant.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 md:w-1/2">
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg sm:text-xl font-semibold">Tags</h2>
                    {user && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => setIsAddingTag(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.tags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg sm:text-xl font-semibold">Recommended Dishes</h2>
                    {user && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => setIsAddingDish(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.recommended_dishes?.map((dish: string) => (
                      <span
                        key={dish}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                      >
                        <Utensils className="h-3 w-3" />
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {sortedImages.length > 1 && (
          <div className="mt-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">More Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
              {sortedImages.slice(1).map((img, index) => (
                <div 
                  key={index} 
                  className={`relative cursor-pointer rounded-lg overflow-hidden ${
                    index % 3 === 0 ? 'row-span-2' : ''
                  }`}
                  onClick={() => setSelectedImageIndex(index + 1)}
                >
                  <Image
                    src={img.image_url}
                    alt={`${restaurant.name} image ${index + 2}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ImageViewerModal
        images={sortedImages}
        currentIndex={selectedImageIndex}
        isOpen={selectedImageIndex !== -1}
        onClose={() => setSelectedImageIndex(-1)}
        onNext={() => setSelectedImageIndex(prev => Math.min(prev + 1, sortedImages.length - 1))}
        onPrevious={() => setSelectedImageIndex(prev => Math.max(prev - 1, 0))}
      />

      <InputDialog
        title="Add Tag"
        isOpen={isAddingTag}
        onClose={() => setIsAddingTag(false)}
        onSubmit={handleAddTag}
        placeholder="Enter a tag"
      />

      <InputDialog
        title="Add Recommended Dish"
        isOpen={isAddingDish}
        onClose={() => setIsAddingDish(false)}
        onSubmit={handleAddDish}
        placeholder="Enter a dish name"
      />
    </div>
  )
}
