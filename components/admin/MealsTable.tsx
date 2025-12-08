'use client';

import React, { useState } from 'react';
import { Meal } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { deleteMeal } from '@/app/actions/admin/meals';
import { useRouter } from 'next/navigation';

interface MealsTableProps {
  meals: Meal[];
}

export default function MealsTable({ meals }: MealsTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this meal?')) return;
    
    setIsDeleting(id);
    try {
      const result = await deleteMeal(id);
      if (result.error) {
        alert('Error deleting meal: ' + result.error);
      } else {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      alert('An unexpected error occurred');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {meals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No meals found. Add one to get started.
                </td>
              </tr>
            ) : (
              meals.map((meal) => (
                <tr key={meal.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      {meal.image_url && (
                        <img 
                          src={meal.image_url} 
                          alt={meal.name} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div>{meal.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{meal.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">₹{meal.price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      meal.food_type === 'vegetarian' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {meal.food_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      meal.is_available ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {meal.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/meals/${meal.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit size={16} className="text-blue-600" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(meal.id)}
                        disabled={isDeleting === meal.id}
                      >
                        {isDeleting === meal.id ? (
                          <span className="animate-spin">...</span>
                        ) : (
                          <Trash2 size={16} className="text-red-600" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
