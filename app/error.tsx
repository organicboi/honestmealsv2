'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <RefreshCcw className="w-8 h-8" />
      </div>
      <h2 className="text-3xl font-bold mb-4 text-gray-900">Something went wrong!</h2>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        We ran into an unexpected issue. You can try refreshing the page or going back to the home page.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          className="rounded-full bg-green-600 hover:bg-green-700"
        >
          Try again
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="rounded-full"
        >
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
      </div>
    </div>
  );
}
