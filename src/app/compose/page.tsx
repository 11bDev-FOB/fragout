'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ComposePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to /dashboard with all query parameters preserved
    const params = new URLSearchParams(searchParams.toString());
    router.replace(`/dashboard?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-tactical-50 via-military-100 to-tactical-100 dark:from-tactical-950 dark:via-military-900 dark:to-tactical-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lightning-500 dark:border-lightning-400 mx-auto mb-4"></div>
        <p className="text-xl text-tactical-700 dark:text-lightning-400 font-semibold">Redirecting to command center...</p>
      </div>
    </main>
  );
}
