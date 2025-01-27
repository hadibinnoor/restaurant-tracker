'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Loader2 } from "lucide-react"
import { TagInput } from '../ui/tag-input'

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  latitude: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Latitude must be a valid number.",
  }),
  longitude: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Longitude must be a valid number.",
  }),
  opening_time: z.string(),
  closing_time: z.string(),
  recommendedDishes: z.array(z.string()),
  tags: z.array(z.string()),
})

interface AddRestaurantFormProps {
  onSuccess?: () => void
}

export function AddRestaurantForm({ onSuccess }: AddRestaurantFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userDishes, setUserDishes] = useState<string[]>([])
  const supabase = createClientComponentClient()
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      latitude: "",
      longitude: "",
      opening_time: "09:00",
      closing_time: "22:00",
      recommendedDishes: [],
      tags: [],
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    onDrop: async (acceptedFiles) => {
      setIsLoading(true)
      setError(null)
      try {
        const uploadedUrls: string[] = []
        
        for (const file of acceptedFiles) {
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

          uploadedUrls.push(urlData.publicUrl)
        }

        setUploadedImages(prev => [...prev, ...uploadedUrls])
      } catch (error) {
        console.error('Error in upload process:', error)
        setError(error instanceof Error ? error.message : 'Failed to upload images')
      } finally {
        setIsLoading(false)
      }
    }
  })

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Process tags and dishes to ensure they are stored as separate array elements
      const processedTags = values.tags?.map(tag => tag.trim()).filter(Boolean) || []
      const processedDishes = values.recommendedDishes?.map(dish => dish.trim()).filter(Boolean) || []

      // First insert the restaurant
      const { data: newRestaurant, error } = await supabase.from('restaurants').insert({
        name: values.name,
        latitude: parseFloat(values.latitude),
        longitude: parseFloat(values.longitude),
        opening_time: values.opening_time,
        closing_time: values.closing_time,
        tags: processedTags,
        recommended_dishes: processedDishes,
      }).select().single()

      if (error) {
        throw error
      }

      // Then insert images if any were uploaded
      if (uploadedImages.length > 0) {
        const { error: imagesError } = await supabase.from('restaurant_images').insert(
          uploadedImages.map(url => ({
            restaurant_id: newRestaurant.id,
            image_url: url
          }))
        )

        if (imagesError) {
          throw imagesError
        }
      }

      form.reset()
      onSuccess?.()
      router.push('/')
    } catch (error) {
      console.error('Error adding restaurant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addExistingDish = (dish: string) => {
    if (!form.getValues('recommendedDishes').includes(dish)) {
      form.setValue('recommendedDishes', [...form.getValues('recommendedDishes'), dish])
    }
  }

  const handleTagInput = (value: string, field: { value: string[], onChange: (value: string[]) => void }) => {
    // Split the input value by commas and newlines
    const newTags = value.split(/[,\n]/).map(tag => tag.trim()).filter(Boolean)
    
    // Get current tags
    const currentTags = field.value || []
    
    // Combine arrays and remove duplicates
    const combinedArray = [...currentTags, ...newTags]
    const uniqueTags = Array.from(new Set(combinedArray))
    
    // Update the field value
    field.onChange(uniqueTags)
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Add New Restaurant</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in the details below to add a new restaurant to your collection.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter restaurant name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-medium">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter latitude" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter longitude" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-base font-medium">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="opening_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="closing_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Closing Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="recommendedDishes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommended Dishes</FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value}
                        onChange={(value) => handleTagInput(value, field)}
                        placeholder="Type dishes separated by comma or Enter"
                      />
                    </FormControl>
                    <FormDescription>
                      Add the restaurant's signature or most popular dishes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {userDishes.length > 0 && (
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Previously added dishes:</p>
                  <div className="flex flex-wrap gap-2">
                    {userDishes.map((dish, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addExistingDish(dish)}
                        className="px-3 py-1 bg-background hover:bg-accent text-sm rounded-full transition-colors"
                      >
                        {dish}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value}
                      onChange={(value) => handleTagInput(value, field)}
                      placeholder="Type tags separated by comma or Enter"
                    />
                  </FormControl>
                  <FormDescription>
                    Add tags like cuisine type, price range, or ambiance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <FormLabel className="text-base">Restaurant Images</FormLabel>
                <FormDescription>
                  Upload images of the restaurant, its ambiance, and food
                </FormDescription>
                <div
                  {...getRootProps()}
                  className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isLoading && <p className="text-sm text-muted-foreground">Uploading images...</p>}
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {uploadedImages.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-green-600 dark:text-green-400">Images uploaded successfully!</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative aspect-square">
                            <Image
                              src={image}
                              alt="Uploaded preview"
                              fill
                              className="object-cover rounded-md"
                              sizes="(max-width: 768px) 50vw, 33vw"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <svg
                          className="mx-auto h-12 w-12 text-muted-foreground"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          />
                        </svg>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Drag & drop images here, or click to select</p>
                        <p className="text-xs">Supported formats: JPG, PNG, GIF</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Restaurant...
                </>
              ) : (
                'Add Restaurant'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}