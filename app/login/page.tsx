'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInSupabase, signUpSupabase } from '@/lib/auth-supabase';
import { supabase } from '@/lib/supabase';
import { checkSubscriptionStatus, registerDeviceSession } from '@/lib/storage-supabase';
import { getDeviceInfo, storeDeviceId } from '@/lib/device-utils';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Por favor, preencha todos os campos obrigatórios');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        setIsLoading(false);
        return;
      }

      const subscriptionCheck = await checkSubscriptionStatus(email);
      
      if (!subscriptionCheck.isActive) {
        setError('Acesso negado: ' + subscriptionCheck.message);
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase Auth
      const user = await signUpSupabase(email, password);

      if (user) {
        try {
          const deviceInfo = getDeviceInfo();
          storeDeviceId(deviceInfo.deviceId);
          await registerDeviceSession(user.id, email, deviceInfo);
        } catch (err) {
          console.log('[v0] Device registration failed (non-critical):', err);
        }
        
        setSuccessMessage('Conta criada com sucesso! Redirecionando para o painel...');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
      console.error('[v0] Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Por favor, preencha todos os campos');
        setIsLoading(false);
        return;
      }

      const user = await signInSupabase(email, password);
      
      if (user) {
        try {
          const deviceInfo = getDeviceInfo();
          storeDeviceId(deviceInfo.deviceId);
          await registerDeviceSession(user.id, email, deviceInfo);
        } catch (err) {
          console.log('[v0] Device registration failed (non-critical):', err);
        }
        
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação');
      console.error('[v0] Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Imagem%20do%20WhatsApp%20de%202025-11-12%20%C3%A0%28s%29%2016.54.36_e2b89511-fO4Fvth3crm7NHkUGnR0odWfKNRsIo.jpg"
                alt="Bora Revalidar"
                width={300}
                height={150}
                className="mx-auto"
                priority
              />
            </div>
            <p className="text-muted-foreground text-sm mt-1">Domine o aprendizado com repetição espaçada</p>
          </div>

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-md text-accent text-sm">
                {successMessage}
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome (Opcional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Seu nome"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              {isSignUp && (
                <p className="text-xs text-muted-foreground mt-1">Mínimo de 6 caracteres</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>Processando...</>
              ) : isSignUp ? (
                <>
                  <Mail className="w-4 h-4" />
                  Criar Conta
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border pt-6">
            {isSignUp ? (
              <>
                Já tem uma conta?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                    setSuccessMessage('');
                    setName('');
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Entrar
                </button>
              </>
            ) : (
              <>
                Não tem uma conta?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Criar Conta
                </button>
              </>
            )}
          </div>

          {/* Info message */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Importante:</strong> Apenas usuários que realizaram o pagamento na plataforma Cakto podem se cadastrar. Seu e-mail será validado automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
