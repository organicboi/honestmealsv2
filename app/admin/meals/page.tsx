import React from 'react';
import { getMeals } from '@/app/actions/admin/meals';
import MealsTable from '@/components/admin/MealsTable';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function MealsPage() {
  const meals = await getMeals();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Meals</h1>
          <p className="text-gray-500">Manage your menu items</p>
        </div>
        <Link href="/admin/addmeal">
          <Button className="gap-2">
            <Plus size={16} />
            Add Meal
          </Button>
        </Link>
      </div>

      <MealsTable meals={meals} />
    </div>
  );
}
