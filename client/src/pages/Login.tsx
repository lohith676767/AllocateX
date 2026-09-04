import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Scale } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiRequestError } from '../services/api';

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to={user.role === 'NGO' ? '/ngo' : '/'} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter both your email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px]"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-600 text-white shadow-card">
            <Scale size={20} strokeWidth={2.2} />
          </div>
          <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-stone-900">FairFill</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-stone-500">
            Equitable CSR allocation, structurally enforced — not left to who pitches best.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label-caps mb-1.5 block">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organization.org"
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-[13.5px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="label-caps mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-stone-200 px-3 py-2 pr-10 text-[13.5px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700"
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-accent-600 px-3.5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-stone-400">
          Company accounts see the allocation dashboard. NGO accounts submit funding proposals.
          <br />
          See <span className="font-mono text-stone-500">DEMO_CREDENTIALS.md</span> for demo logins.
        </p>
      </motion.div>
    </div>
  );
}
