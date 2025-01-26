'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { TagInput } from '../ui/tag-input'

export function AddRestaurantForm() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userDishes, setUserDishes] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    openingTime: '',
    closingTime: '',
    recommendedDishes: [] as string[],
    tags: [] as string[],
    latitude: '',
    longitude: '',
  })

  // Fetch user's previously added dishes
  useEffect(() => {
    async function fetchUserDishes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: restaurants } = await supabase
          .from('restaurants')
          .select('recommended_dishes')
          .eq('user_id', user.id)

        if (restaurants) {
          const allDishes = restaurants.flatMap(r => r.recommended_dishes)
          const uniqueDishes = Array.from(new Set(allDishes))
          setUserDishes(uniqueDishes)
        }
      }
    }
    fetchUserDishes()
  }, [supabase])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setLoading(true)
        setError(null)
        try {
          const file = acceptedFiles[0]
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`

          // Upload the file to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('restaurant-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`)
          }

          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('restaurant-images')
            .getPublicUrl(fileName)

          setUploadedImage(urlData.publicUrl)
        } catch (error) {
          console.error('Error in upload process:', error)
          setError(error instanceof Error ? error.message : 'Failed to upload image')
          setUploadedImage(null)
        } finally {
          setLoading(false)
        }
      }
    }
  })

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }))
        },
        (error) => {
          setError(`Error getting location: ${error.message}`)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    } else {
      setError('Geolocation is not supported by your browser')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error: insertError } = await supabase.from('restaurants').insert({
        name: formData.name,
        opening_time: formData.openingTime,
        closing_time: formData.closingTime,
        recommended_dishes: formData.recommendedDishes,
        tags: formData.tags,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        image_url: uploadedImage,
        user_id: user.id
      })

      if (insertError) {
        throw new Error(`Failed to add restaurant: ${insertError.message}`)
      }

      router.refresh()
      router.push('/')
    } catch (error) {
      console.error('Error adding restaurant:', error)
      setError(error instanceof Error ? error.message : 'Failed to add restaurant')
    } finally {
      setLoading(false)
    }
  }

  const addDishSuggestion = (dish: string) => {
    if (!formData.recommendedDishes.includes(dish)) {
      setFormData(prev => ({
        ...prev,
        recommendedDishes: [...prev.recommendedDishes, dish]
      }))
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl">Add New Restaurant</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="name" className="text-base">Restaurant Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="openingTime" className="text-base">Opening Time</Label>
              <Input
                id="openingTime"
                type="time"
                value={formData.openingTime}
                onChange={(e) => setFormData(prev => ({ ...prev, openingTime: e.target.value }))}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="closingTime" className="text-base">Closing Time</Label>
              <Input
                id="closingTime"
                type="time"
                value={formData.closingTime}
                onChange={(e) => setFormData(prev => ({ ...prev, closingTime: e.target.value }))}
                required
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-base">Location</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1.5">
              <Input
                placeholder="Latitude"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  latitude: e.target.value
                }))}
                required
                inputMode="decimal"
                type="number"
                step="any"
              />
              <Input
                placeholder="Longitude"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  longitude: e.target.value
                }))}
                required
                inputMode="decimal"
                type="number"
                step="any"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              className="mt-2 w-full sm:w-auto"
            >
              Use Current Location
            </Button>
          </div>

          <div>
            <Label htmlFor="recommendedDishes" className="text-base">Recommended Dishes</Label>
            <div className="mt-1.5">
              <TagInput
                value={formData.recommendedDishes}
                onChange={(tags) => setFormData(prev => ({ ...prev, recommendedDishes: tags }))}
                placeholder="Type a dish name and press Enter or comma"
              />
            </div>
            {userDishes.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Previously added dishes:</p>
                <div className="flex flex-wrap gap-2">
                  {userDishes.map((dish) => (
                    <Button
                      key={dish}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDishSuggestion(dish)}
                      className="text-xs"
                    >
                      + {dish}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="tags" className="text-base">Tags</Label>
            <div className="mt-1.5">
              <TagInput
                value={formData.tags}
                onChange={(tags) => setFormData(prev => ({ ...prev, tags: tags }))}
                placeholder="Type a tag and press Enter or comma"
              />
            </div>
          </div>

          <div>
            <Label className="text-base">Restaurant Image</Label>
            <div
              {...getRootProps()}
              className={`mt-1.5 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              {loading && <p className="text-sm text-gray-600">Uploading image...</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {uploadedImage ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-600">Image uploaded successfully!</p>
                  <div className="relative w-full aspect-video sm:aspect-square max-w-md mx-auto">
                    <Image
                      src={uploadedImage}
                      alt="Uploaded preview"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Drag & drop an image here, or click to select one</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding Restaurant...' : 'Add Restaurant'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}