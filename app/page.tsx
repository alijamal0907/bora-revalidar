'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="text-center">
        <div className="mb-8">
          <Image
            src="/images/design-mode/Imagem%20do%20WhatsApp%20de%202025-11-12%20%C3%A0%28s%29%2016.54.36_e2b89511.jpg"
            alt="Bora Revalidar"
            width={400}
            height={200}
            className="mx-auto"
            priority
          />
        </div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
