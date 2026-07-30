import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service.js';
import { ShieldCheck, Zap, Server } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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

    if (!fullName || !username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({ username, email, password, fullName });
      await authService.login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = fullName.trim() !== '' && username.trim() !== '' && email.trim() !== '' && password.length >= 8;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 shadow-[0_25px_80px_rgba(15,23,42,0.45)] grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:block bg-slate-950/80 p-10">
          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-8 h-full flex flex-col justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-pink-300">Create account</p>
              <h2 className="mt-4 text-4xl font-bold text-white">Join NetScope</h2>
              <p className="mt-4 text-slate-400 leading-7">
                Sign up to start monitoring endpoints, SSL certificates, ports, and uptime from a modern dashboard built for developers.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {[
                { icon: <ShieldCheck size={18} className="text-pink-300" />, title: 'Secured by design', desc: 'Encrypted auth and refresh token lifecycle.' },
                { icon: <Zap size={18} className="text-pink-300" />, title: 'Fast setup', desc: 'Get monitoring running in a few clicks.' },
                { icon: <Server size={18} className="text-pink-300" />, title: 'Developer friendly', desc: 'Simple UI with clear system context.' },
              ].map((item, idx) => (
                <div key={idx} className="rounded-3xl border border-slate-800/90 bg-slate-950/80 p-4">
                  <div className="flex items-center gap-3 text-slate-100 font-semibold mb-2">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-7 py-8 sm:px-10 sm:py-10">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-pink-200">Create account</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Sign up for NetScope</h2>
            <p className="mt-3 text-sm text-slate-400">No credit card required. Get access to monitoring, reports, and alerts immediately.</p>
          </div>

          {error && (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100 mb-6">
              <strong className="font-semibold">Registration error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-200">
                Full name
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-pink-500 focus:ring-pink-500/20"
                  placeholder="Jane Doe"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-200">
                Username
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-pink-500 focus:ring-pink-500/20"
                  placeholder="janedoe"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-200">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-pink-500 focus:ring-pink-500/20"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-200">
              Password
              <div className="mt-2 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 pr-24 text-slate-100 outline-none transition focus:border-pink-500 focus:ring-pink-500/20"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 hover:text-slate-100"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">8+ characters recommended.</p>
            </label>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full rounded-3xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:shadow-fuchsia-600/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-slate-100 font-semibold hover:text-white">
              Sign in
            </Link>
            </div>
          </div>
        </div>
      </div>
    
  );
}
