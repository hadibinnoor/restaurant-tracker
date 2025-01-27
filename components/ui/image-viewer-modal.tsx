'use client'

import { Dialog, DialogContent } from "@/components/ui/dialog"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface RestaurantImage {
  id: string
  restaurant_id: string
  image_url: string
  created_at: string
}

interface ImageViewerModalProps {
  images: RestaurantImage[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}

export function ImageViewerModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious
}: ImageViewerModalProps) {
  if (!images.length || currentIndex < 0 || currentIndex >= images.length) return null

  const currentImage = images[currentIndex]
  if (!currentImage) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
        >
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Close</span>
        </button>
        <div className="relative w-full h-[90vh] flex items-center justify-center">
          <button
            onClick={onPrevious}
            className="absolute left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="relative w-full h-full">
            <Image
              src={currentImage.image_url}
              alt={`Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="95vw"
              priority
            />
          </div>
          <button
            onClick={onNext}
            className="absolute right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none"
            disabled={currentIndex === images.length - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
          {currentIndex + 1} / {images.length}
        </div>
      </DialogContent>
    </Dialog>
  )
}
