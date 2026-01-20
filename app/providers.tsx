'use client';

import { AuthProvider } from '@/components/auth/auth-provider';
import { Toaster } from '@/components/ui/toaster';

export default function Providers({ children }: { children: React.ReactNode }) {
  // AuthProvider at root level prevents remounts on navigation
  // Toaster internally includes ToastProvider (shadcn)
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
