'use client';

import { Toaster } from '@/components/ui/toaster';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Toaster internally includes ToastProvider (shadcn)
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
