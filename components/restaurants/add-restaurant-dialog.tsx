'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AddRestaurantForm } from "./add-restaurant-form"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AddRestaurantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestaurantAdded: (restaurant: any) => void
}

export function AddRestaurantDialog({
  open,
  onOpenChange,
  onRestaurantAdded
}: AddRestaurantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[90vh]"
        aria-describedby="add-restaurant-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>Add New Restaurant</DialogTitle>
          <DialogDescription id="add-restaurant-dialog-description">
            Fill in the restaurant details below. You can search for existing restaurants or add a new one manually.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)] mt-4">
          <div className="px-6">
            <AddRestaurantForm 
              onSuccess={(restaurant) => {
                onRestaurantAdded(restaurant)
                onOpenChange(false)
              }}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
