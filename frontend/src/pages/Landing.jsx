import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Shield, BarChart3, Bell, Zap, ChevronRight, Server, Lock, TrendingUp } from 'lucide-react';
import { authService } from '../services/auth.service.js';

export default function Landing() {
  const navigate = useNavigate();
  const isAuth = authService.isAuthenticated();

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* Navigation Header */}
      <nav className="border-b border-slate-800 sticky top-0 z-50 backdrop-blur-lg bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Globe size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">NetScope</span>
          </div>
          <div className="flex gap-3">
            {isAuth ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/devices')}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                >
                  Start Monitoring
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Monitor Everything, Know Everything
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            NetScope gives you complete visibility into your infrastructure. Monitor uptime, SSL certificates, port availability, and latency—all from one unified dashboard.
          </p>
          {!isAuth && (
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-semibold flex items-center gap-2 transition transform hover:scale-105"
              >
                Start Free Trial <ChevronRight size={18} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 border border-slate-700 hover:border-slate-600 rounded-lg font-semibold transition"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {[
            {
              icon: <Globe size={24} />,
              title: 'Global Monitoring',
              desc: 'Monitor endpoints worldwide with real-time latency tracking'
            },
            {
              icon: <Shield size={24} />,
              title: 'SSL Tracking',
              desc: 'Get alerts before SSL certificates expire'
            },
            {
              icon: <Server size={24} />,
              title: 'Port Scanning',
              desc: 'Verify critical service ports remain accessible'
            },
            {
              icon: <Bell size={24} />,
              title: 'Smart Alerts',
              desc: 'Instant notifications on outages and anomalies'
            },
            {
              icon: <BarChart3 size={24} />,
              title: 'Analytics',
              desc: 'Deep dive into historical trends and patterns'
            },
            {
              icon: <Lock size={24} />,
              title: 'Role-Based Access',
              desc: 'Secure multi-user environment with granular controls'
            },
            {
              icon: <Zap size={24} />,
              title: 'Instant Setup',
              desc: 'Add devices in seconds, monitoring starts immediately'
            },
            {
              icon: <TrendingUp size={24} />,
              title: 'Reports & Export',
              desc: 'Generate PDF/CSV reports for compliance and analysis'
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition group cursor-pointer"
            >
              <div className="text-indigo-400 mb-4 group-hover:scale-110 transition">
                {feature.icon}
              </div>
              <h3 className="font-bold text-slate-200 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-12 mb-20">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-indigo-400 mb-2">99.9%</div>
              <p className="text-slate-300">Uptime SLA</p>
            </div>
            <div>
              <div className="text-4xl font-black text-purple-400 mb-2">&lt;100ms</div>
              <p className="text-slate-300">Check Latency</p>
            </div>
            <div>
              <div className="text-4xl font-black text-pink-400 mb-2">24/7</div>
              <p className="text-slate-300">Background Monitoring</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Register Account', desc: 'Create a free NetScope account in seconds' },
              { step: '2', title: 'Add Devices', desc: 'Provide hostnames or IPs to monitor' },
              { step: '3', title: 'Get Insights', desc: 'View real-time metrics and historical data' }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 -right-12 text-indigo-600">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {!isAuth && (
          <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to monitor your infrastructure?</h2>
            <p className="text-slate-400 mb-8">Join thousands of teams using NetScope for reliable uptime monitoring.</p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-semibold transition transform hover:scale-105"
            >
              Start Your Free Trial
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>&copy; 2026 NetScope. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
