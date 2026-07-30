import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await authService.login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.trim() !== '' && password.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 shadow-[0_25px_80px_rgba(15,23,42,0.45)]">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-8 text-white">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-100/80">Welcome back</p>
          <h1 className="mt-4 text-3xl font-semibold">Sign in to NetScope</h1>
          <p className="mt-3 text-sm text-indigo-100/80 leading-relaxed">
            Access your dashboard, devices, and monitoring tools from a secure account.
          </p>
        </div>

        <div className="px-7 py-8">
          {error && (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100 mb-6">
              <strong className="font-semibold">Login error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
                <span>Password</span>
                <button
                  type="button"
                  className="text-slate-400 transition hover:text-slate-200"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            New to NetScope?{' '}
            <Link to="/register" className="text-slate-100 font-semibold hover:text-white">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
