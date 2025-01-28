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
import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Loader2 } from "lucide-react"
import { TagInput } from '../ui/tag-input'
import { useLoadScript } from "@react-google-maps/api";
import Script from 'next/script';

const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

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
  placeId: z.string().optional(),
})

interface AddRestaurantFormProps {
  onSuccess?: () => void
}

export function AddRestaurantForm({ onSuccess }: AddRestaurantFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userDishes, setUserDishes] = useState<string[]>([])
  const [userTags, setUserTags] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [mapsError, setMapsError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const supabase = createClientComponentClient()
  const router = useRouter()

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  useEffect(() => {
    console.log('Google Maps Load Status:', {
      isLoaded,
      loadError,
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing',
      window: typeof window !== 'undefined' ? 'Available' : 'Not Available',
      google: typeof google !== 'undefined' ? 'Available' : 'Not Available',
      places: typeof google !== 'undefined' && google.maps ? 'Available' : 'Not Available'
    });

    if (loadError) {
      console.error('Google Maps Load Error:', loadError);
      setMapsError("Failed to load Google Maps. Please check if you have an ad blocker enabled and disable it for this site.");
    }

    if (isLoaded && mapRef.current && !placesService && typeof google !== 'undefined') {
      try {
        console.log('Initializing Places service...');
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 0, lng: 0 },
          zoom: 1
        });
        const service = new google.maps.places.PlacesService(map);
        setPlacesService(service);
        console.log('Places service initialized successfully');
      } catch (error) {
        console.error('Error initializing Places service:', error);
        setMapsError("Failed to initialize Google Places service");
      }
    }
  }, [isLoaded, loadError]);

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
      placeId: "",
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
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch restaurants data
        const { data: restaurants } = await supabase
          .from('restaurants')
          .select('recommended_dishes, tags')
          .eq('user_id', user.id)

        if (restaurants) {
          // Process dishes
          const allDishes = restaurants.flatMap(r => r.recommended_dishes || [])
          const uniqueDishes = Array.from(new Set(allDishes))
          setUserDishes(uniqueDishes)

          // Process tags
          const allTags = restaurants.flatMap(r => r.tags || [])
          const uniqueTags = Array.from(new Set(allTags))
          setUserTags(uniqueTags)
        }
      }
    }
    fetchUserData()
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
    const currentDishes = form.getValues('recommendedDishes')
    if (!currentDishes.includes(dish)) {
      form.setValue('recommendedDishes', [...currentDishes, dish])
    }
  }

  const addExistingTag = (tag: string) => {
    const currentTags = form.getValues('tags')
    if (!currentTags.includes(tag)) {
      form.setValue('tags', [...currentTags, tag])
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

  const handlePlaceSelect = async (placeId: string) => {
    if (!isLoaded || !google?.maps?.places) {
      console.error('Google Maps Places not available');
      setMapsError("Google Maps is not loaded. Please check your internet connection and try again.");
      return;
    }
    
    try {
      console.log('Fetching place details for:', placeId);
      
      const service = new google.maps.places.PlacesService(mapRef.current!);
      service.getDetails(
        {
          placeId: placeId,
          fields: ['name', 'geometry', 'opening_hours', 'formatted_address', 'types', 'rating', 'price_level']
        },
        (place, status) => {
          console.log('Place Details Response:', { place, status });

          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            // Check if the place is actually a restaurant or cafe
            const isValidType = place.types?.some(type => 
              ['restaurant', 'cafe', 'food', 'meal_takeaway', 'meal_delivery'].includes(type)
            );

            if (!isValidType) {
              console.log('Place is not a restaurant or cafe:', place.types);
              setMapsError("This place doesn't appear to be a restaurant. Please try another location or enter details manually.");
              return;
            }

            form.setValue('name', place.name || '');
            if (place.geometry?.location) {
              form.setValue('latitude', place.geometry.location.lat().toString());
              form.setValue('longitude', place.geometry.location.lng().toString());
            }
            
            if (place.opening_hours?.weekday_text) {
              const weekdayText = place.opening_hours.weekday_text;
              if (weekdayText && weekdayText[0]) {
                const hours = weekdayText[0].split(': ')[1];
                if (hours) {
                  const [opening, closing] = hours.split(' – ');
                  if (opening && closing) {
                    form.setValue('opening_time', convertTo24Hour(opening));
                    form.setValue('closing_time', convertTo24Hour(closing));
                  }
                }
              }
            }
            
            form.setValue('placeId', placeId);
            setPredictions([]);
            setSearchInput(place.name || '');
            setMapsError(null);
          } else {
            console.error('Place Details Error:', status);
            setMapsError("Failed to fetch place details. Please try again or enter details manually.");
          }
        }
      );
    } catch (error) {
      console.error('Place Details Exception:', error);
      setMapsError("An error occurred while fetching place details. Please try again or enter details manually.");
    }
  };

  const handleSearchInputChange = (value: string) => {
    console.log('Search input changed:', value);
    setSearchInput(value);
    
    if (!isLoaded || !google?.maps?.places) {
      console.error('Google Maps Places not available:', {
        isLoaded,
        googleExists: typeof google !== 'undefined',
        mapsExists: typeof google?.maps !== 'undefined',
        placesExists: typeof google?.maps?.places !== 'undefined'
      });
      setPredictions([]);
      return;
    }

    if (!value || value.length < 3) {
      console.log('Search input too short, clearing predictions');
      setPredictions([]);
      return;
    }

    try {
      console.log('Fetching predictions for:', value);
      const service = new google.maps.places.AutocompleteService();
      const request = {
        input: value,
        types: ['restaurant', 'cafe'],  // Restrict to only restaurants and cafes
        componentRestrictions: { country: 'IN' },
      };
      console.log('AutocompleteService request:', request);

      service.getPlacePredictions(
        request,
        (predictions, status) => {
          console.log('Raw AutocompleteService response:', {
            status,
            predictionsCount: predictions?.length ?? 0,
            predictions: predictions
          });
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const filteredPredictions = predictions.filter(prediction => 
              prediction.types.some(type => 
                ['restaurant', 'cafe', 'food', 'meal_takeaway', 'meal_delivery'].includes(type)
              )
            );
            console.log('Setting predictions:', filteredPredictions);
            setPredictions(filteredPredictions);
            setMapsError(null);
          } else {
            console.log('Autocomplete status:', status);
            setPredictions([]);
            if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              console.log('No results found');
              setMapsError("No restaurants found with this name. You can still enter details manually.");
            } else {
              console.error('Autocomplete Error:', status);
              setMapsError("Failed to fetch suggestions. You can still enter details manually.");
            }
          }
        }
      );
    } catch (error) {
      console.error('Autocomplete Exception:', error);
      setPredictions([]);
      setMapsError("Failed to fetch suggestions. You can still enter details manually.");
    }
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude.toString());
          form.setValue('longitude', position.coords.longitude.toString());
        },
        (error) => {
          setError('Error getting current location: ' + error.message);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const convertTo24Hour = (time: string): string => {
    const [timeStr, period] = time.split(' ');
    const [hours, minutes] = timeStr.split(':');
    let hour = parseInt(hours);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes || '00'}`;
  };

  return (
    <>
      <Script 
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="beforeInteractive"
      />
      <Form {...form}>
        <div ref={mapRef} style={{ display: 'none' }} />
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {mapsError && (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-md text-sm">
              {mapsError}
            </div>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field: { onChange, ...field } }) => (
              <FormItem className="relative">
                <FormLabel>Restaurant Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={isLoaded ? "Search for a restaurant or enter manually..." : "Enter restaurant name"}
                      {...field}
                      onChange={(e) => {
                        console.log('Input changed:', e.target.value);
                        onChange(e); // Call the form's onChange
                        handleSearchInputChange(e.target.value);
                      }}
                      autoComplete="off"
                      className="w-full"
                    />
                    {predictions.length > 0 && (
                      <div 
                        className="absolute z-50 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
                      >
                        {predictions.map((prediction) => {
                          console.log('Rendering prediction:', prediction);
                          return (
                            <button
                              key={prediction.place_id}
                              type="button"
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                              onClick={() => {
                                console.log('Prediction clicked:', prediction);
                                handlePlaceSelect(prediction.place_id);
                              }}
                            >
                              <span className="block text-sm font-medium">
                                {prediction.structured_formatting?.main_text || prediction.description}
                              </span>
                              {prediction.structured_formatting?.secondary_text && (
                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                  {prediction.structured_formatting.secondary_text}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  {isLoaded ? 
                    "Search for a restaurant or enter details manually if not found" : 
                    "Enter restaurant details manually"
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
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
          
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            className="w-full"
          >
            Get Current Location
          </Button>

          <div className="space-y-4">
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
                    Add the restaurant&apos;s signature or most popular dishes
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

          {userTags.length > 0 && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Previously used tags:</p>
              <div className="flex flex-wrap gap-2">
                {userTags.map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addExistingTag(tag)}
                    className="px-3 py-1 bg-background hover:bg-accent text-sm rounded-full transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
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
    </>
  )
}