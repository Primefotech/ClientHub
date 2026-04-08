'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Loader2, BookOpen } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      await login(data.email, data.password);
      // Use window.location.href instead of router.push to ensure the
      // cookie is committed to the browser before the next request is sent.
      // router.push is client-side and the middleware won't see the new cookie.
      window.location.href = '/dashboard';
    } catch (err: any) {
      if (!err.response) {
        setError('Server is unavailable. Please check your connection or try again later.');
      } else {
        setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brandbook-950 via-brandbook-900 to-brandbook-800 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brandbook-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brandbook-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brandbook-500 rounded-2xl mb-4 shadow-lg shadow-brandbook-500/30">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">BrandBook</h1>
          <p className="text-brandbook-300 mt-1">Client OS — Powered by BrandBook</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your workspace</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brandbook-200 mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={cn(
                  'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-brandbook-400',
                  'focus:outline-none focus:ring-2 focus:ring-brandbook-400 focus:border-transparent',
                  'transition-all duration-200',
                  errors.email && 'border-red-400 focus:ring-red-400',
                )}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-brandbook-200 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    'w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-brandbook-400',
                    'focus:outline-none focus:ring-2 focus:ring-brandbook-400 focus:border-transparent',
                    'transition-all duration-200',
                    errors.password && 'border-red-400 focus:ring-red-400',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brandbook-400 hover:text-brandbook-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/50 rounded-lg px-4 py-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full py-3 px-4 bg-brandbook-500 hover:bg-brandbook-400 text-white font-semibold rounded-xl',
                'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brandbook-400 focus:ring-offset-2 focus:ring-offset-transparent',
                'flex items-center justify-center gap-2',
                isSubmitting && 'opacity-70 cursor-not-allowed',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-brandbook-400 text-center mb-3">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-brandbook-400">
              <div className="bg-white/5 rounded-lg p-2">
                <p className="font-medium text-brandbook-300">Super Admin</p>
                <p>admin@brandbook.com</p>
                <p>Admin@brandbook123</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="font-medium text-brandbook-300">Client Owner</p>
                <p>owner@democlient.com</p>
                <p>Client@brandbook123</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-brandbook-500 text-sm mt-6">
          © 2026 BrandBook. All rights reserved.
        </p>
      </div>
    </div>
  );
}
