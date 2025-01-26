'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { ImagePlus } from 'lucide-react'
import Image from 'next/image'

interface RestaurantImageUploadProps {
  restaurantId: string
}

export function RestaurantImageUpload({ restaurantId }: RestaurantImageUploadProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

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

          // Store the image URL in restaurant_images table
          const { error: insertError } = await supabase
            .from('restaurant_images')
            .insert({
              restaurant_id: restaurantId,
              image_url: urlData.publicUrl
            })

          if (insertError) {
            throw new Error(`Failed to save image: ${insertError.message}`)
          }

          setIsOpen(false)
          router.refresh()
        } catch (error) {
          console.error('Error in upload process:', error)
          setError(error instanceof Error ? error.message : 'Failed to upload image')
        } finally {
          setLoading(false)
        }
      }
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <ImagePlus className="w-4 h-4 mr-2" />
          Add Image
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Restaurant Image</DialogTitle>
        </DialogHeader>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
        >
          <input {...getInputProps()} />
          {loading ? (
            <p className="text-sm text-gray-500">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-sm text-gray-500">Drop the image here</p>
          ) : (
            <div>
              <Button type="button" variant="outline" className="mb-2">
                Choose Image
              </Button>
              <p className="text-sm text-gray-500">or drag and drop</p>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
