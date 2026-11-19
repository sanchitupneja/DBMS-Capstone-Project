'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Home, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    studentId: '',
    phone: '',
    gender: 'MALE',
    course: '',
    yearOfStudy: 1,
    password: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { phone, ...rest } = form;
      await register({
        ...rest,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        yearOfStudy: Number(form.yearOfStudy),
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-bg-primary flex items-center justify-center mx-auto mb-4">
            <Home size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Create Account</h1>
          <p className="text-white/40 text-sm mt-1">Join the HostelIQ platform</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">Full Name</label>
                <input id="reg-fullname" type="text" className="form-input" placeholder="John Doe" value={form.fullName} onChange={set('fullName')} required />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input id="reg-email" type="email" className="form-input" placeholder="you@uni.edu" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="form-label">Student ID</label>
                <input id="reg-studentid" type="text" className="form-input" placeholder="STU2024001" value={form.studentId} onChange={set('studentId')} required />
              </div>
              <div>
                <label className="form-label">Phone (Optional)</label>
                <input id="reg-phone" type="tel" className="form-input" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select id="reg-gender" className="form-input" value={form.gender} onChange={set('gender')} required>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Course</label>
                <input id="reg-course" type="text" className="form-input" placeholder="B.Tech Computer Science" value={form.course} onChange={set('course')} required />
              </div>
              <div>
                <label className="form-label">Year of Study</label>
                <select id="reg-year" className="form-input" value={form.yearOfStudy} onChange={set('yearOfStudy')} required>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    className="form-input pr-12"
                    placeholder="Min 8 chars, uppercase, number, special"
                    value={form.password}
                    onChange={set('password')}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button id="reg-submit" type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-white/40 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
