
'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * A component that protects routes and ensures the user is authenticated.
 * Redirects to /login if not authenticated.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isUserLoading, pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isUserLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-background">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center animate-pulse">
          <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
        </div>
        <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em]">Initialising Core...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}