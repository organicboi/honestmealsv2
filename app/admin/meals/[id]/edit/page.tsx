import React from 'react';
import MealForm from '@/components/admin/MealForm';
import { getMeal } from '@/app/actions/admin/meals';
import { notFound } from 'next/navigation';

export default async function EditMealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meal = await getMeal(id);

  if (!meal) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Edit Meal</h1>
        <p className="text-gray-500">Update meal details.</p>
      </div>
      
      <MealForm meal={meal} isEditing={true} />
    </div>
  );
}
