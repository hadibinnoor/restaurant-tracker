import { AddRestaurantForm } from '@/components/restaurants/add-restaurant-form'

export default function AddRestaurantPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Add New Restaurant</h1>
      <AddRestaurantForm />
    </div>
  )
}
