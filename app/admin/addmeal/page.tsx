import React from 'react';
import MealForm from '@/components/admin/MealForm';

export default function AddMealPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Add New Meal</h1>
        <p className="text-gray-500">Create a new meal to add to the menu.</p>
      </div>
      
      <MealForm />
    </div>
  );
}
