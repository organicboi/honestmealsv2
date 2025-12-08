'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createMeal, updateMeal } from '@/app/actions/admin/meals';
import { useRouter } from 'next/navigation';
import { Meal } from '@/types/database.types';
import { Loader2 } from 'lucide-react';

// Fallback for UI components if they don't exist in the project yet
// I'll assume standard HTML elements if imports fail, but for now I'll try to use standard Tailwind classes if I'm unsure about the UI library components availability.
// Actually, I see `components/ui/button.tsx` and `input.tsx` in the file list. I don't see `textarea.tsx`, `label.tsx`, `switch.tsx`, `select.tsx`.
// I will use standard HTML elements for those missing components to be safe, or simple Tailwind wrappers.

interface MealFormProps {
  meal?: Meal;
  isEditing?: boolean;
}

export default function MealForm({ meal, isEditing = false }: MealFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(meal?.image_url || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    
    try {
      let result;
      if (isEditing && meal) {
        result = await updateMeal(meal.id, formData);
      } else {
        result = await createMeal(formData);
      }

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/admin/meals');
        router.refresh();
      }
    } catch (e) {
      setError('An unexpected error occurred');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{isEditing ? 'Edit Meal' : 'Add New Meal'}</h2>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <Input id="name" name="name" defaultValue={meal?.name} required placeholder="e.g. Chicken Salad" />
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">Price (₹)</label>
          <Input id="price" name="price" type="number" step="0.01" defaultValue={meal?.price} required placeholder="0.00" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea 
          id="description" 
          name="description" 
          defaultValue={meal?.description || ''} 
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Describe the meal..."
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label htmlFor="calories" className="text-sm font-medium">Calories</label>
          <Input id="calories" name="calories" type="number" defaultValue={meal?.calories} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="protein" className="text-sm font-medium">Protein (g)</label>
          <Input id="protein" name="protein" type="number" step="0.1" defaultValue={meal?.protein} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="carbs" className="text-sm font-medium">Carbs (g)</label>
          <Input id="carbs" name="carbs" type="number" step="0.1" defaultValue={meal?.carbs || 0} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="fat" className="text-sm font-medium">Fat (g)</label>
          <Input id="fat" name="fat" type="number" step="0.1" defaultValue={meal?.fat || 0} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="image" className="text-sm font-medium">Meal Image</label>
          <div className="flex flex-col gap-4">
            {imagePreview && (
              <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imagePreview} 
                  alt="Meal preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <Input 
              id="image" 
              name="image" 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
            />
            {/* Hidden input to keep existing URL if no new file is uploaded */}
            <input type="hidden" name="image_url" value={meal?.image_url || ''} />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="food_type" className="text-sm font-medium">Food Type</label>
          <select 
            id="food_type" 
            name="food_type" 
            defaultValue={meal?.food_type || 'vegetarian'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="vegetarian">Vegetarian</option>
            <option value="non-vegetarian">Non-Vegetarian</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="spice_level" className="text-sm font-medium">Spice Level (1-5)</label>
          <Input id="spice_level" name="spice_level" type="number" min="1" max="5" defaultValue={meal?.spice_level || 1} />
        </div>
        <div className="space-y-2">
          <label htmlFor="cooking_time_minutes" className="text-sm font-medium">Cooking Time (mins)</label>
          <Input id="cooking_time_minutes" name="cooking_time_minutes" type="number" defaultValue={meal?.cooking_time_minutes || 15} />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="is_available" 
            name="is_available" 
            defaultChecked={meal?.is_available ?? true}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="is_available" className="text-sm font-medium">Available</label>
        </div>

        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="is_featured" 
            name="is_featured" 
            defaultChecked={meal?.is_featured ?? false}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="is_featured" className="text-sm font-medium">Featured</label>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Meal' : 'Create Meal'}
        </Button>
      </div>
    </form>
  );
}
