'use client'

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { AddRestaurantForm } from "./add-restaurant-form"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AddRestaurantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestaurantAdded: () => void
}

export function AddRestaurantDialog({
  open,
  onOpenChange,
  onRestaurantAdded
}: AddRestaurantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <ScrollArea className="h-full">
          <AddRestaurantForm 
            onSuccess={() => {
              onRestaurantAdded()
              onOpenChange(false)
            }}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
