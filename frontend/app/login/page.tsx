'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Home, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '', role: 'STUDENT' });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(form.email, form.password, form.role);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-bg-primary flex items-center justify-center mx-auto mb-4 pulse-glow">
            <Home size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">HostelIQ</h1>
          <p className="text-white/40 text-sm mt-1">Smart Room Allocation Platform</p>
        </div>

        {}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-white/40 text-sm mb-6">Sign in to your account</p>

          {}
          <div className="flex gap-2 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['STUDENT', 'ADMIN'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  form.role === role
                    ? 'gradient-bg-primary text-white shadow-lg'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@university.edu"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-white/40 text-sm">
              {"Don't have an account? "}
              <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Register as Student
              </Link>
            </p>
          </div>
        </div>

        {}
        <div className="mt-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <p className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-2">Demo Credentials</p>
          <div className="space-y-1 text-xs text-white/40">
            <p><span className="text-amber-400/70">Admin</span> → admin@hostel.edu / Admin@123</p>
            <p><span className="text-teal-400/70">Student</span> → sanchit@student.edu / Student@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
