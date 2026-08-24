import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Shield, Bot, Terminal, Play, ChevronRight } from 'lucide-react';
import { authService } from '../services/auth.service.js';

export default function Landing() {
  const navigate = useNavigate();
  const isAuth = authService.isAuthenticated();

  return (
    <div className="bg-[#030712] text-slate-100 min-h-screen font-sans relative overflow-hidden">

      {/* Ambient Radial Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[350px] bg-purple-500/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Navigation Header */}
      <nav className="border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-xl bg-[#030712]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/20 font-mono">
              N
            </div>
            <span className="text-xl font-extrabold tracking-tight font-mono text-white">NETSCOPE</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            {isAuth ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 font-bold text-slate-300 hover:text-white transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/devices')}
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  Console &rarr;
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 font-bold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 relative z-10">
        <div className="text-center space-y-6 max-w-4xl mx-auto">

          {/* Tech Badges */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-cyan-400 font-bold">ISOLATION FOREST ML</span>
            <span className="text-slate-600">•</span>
            <span className="text-purple-400 font-bold">LANGCHAIN SRE AGENT</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-bold">MCP TOOLS</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white font-mono">
            Autonomous Infrastructure Risk & <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              AI Incident Remediation
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Real-time observability engine with automated scikit-learn anomaly scoring, LangChain diagnostic agents, and safe allowlisted recovery execution for Docker & Compose services.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isAuth ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold font-mono text-xs transition transform hover:scale-[1.02] shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
              >
                Open SRE Dashboard &rarr;
              </button>
            ) : (
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold font-mono text-xs transition transform hover:scale-[1.02] shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
              >
                Start Free Monitoring <ChevronRight size={16} />
              </button>
            )}

            <a
              href="/Docs/netscope-architecture-demo.html"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 bg-[#0F172A] hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 rounded-xl font-bold font-mono text-xs transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Play size={15} className="text-cyan-400 fill-cyan-400" />
              <span>Interactive Architecture Demo</span>
            </a>
          </div>
        </div>

        {/* Core Pillars Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-20">
          {[
            {
              icon: <Globe className="text-cyan-400" size={22} />,
              title: 'Real-Time Telemetry',
              desc: 'Host CPU, RAM, Disk, and HTTP latency probes every 15 seconds.'
            },
            {
              icon: <Bot className="text-purple-400" size={22} />,
              title: 'Isolation Forest ML',
              desc: 'Scikit-learn multi-metric anomaly scoring for early outage detection.'
            },
            {
              icon: <Terminal className="text-amber-400" size={22} />,
              title: 'LangChain SRE Agent',
              desc: 'Groq Llama-3.3 LLM executing 5 read-only MCP diagnostic tools.'
            },
            {
              icon: <Shield className="text-emerald-400" size={22} />,
              title: 'Safe Auto-Remediation',
              desc: 'Allowlisted docker restart execution upon human SRE approval.'
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-[#0F172A]/70 border border-[#1E293B] hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl shadow-xl space-y-3 font-mono"
            >
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl w-fit">
                {feature.icon}
              </div>
              <h3 className="font-bold text-white text-sm tracking-tight">{feature.title}</h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Quantified System Metrics Banner */}
        <div className="mt-16 bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-950/40 border border-indigo-500/20 rounded-2xl p-8 backdrop-blur-xl font-mono">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-black text-cyan-400">&lt; 1.8s</div>
              <p className="text-[11px] text-slate-400 mt-1 uppercase font-bold">Detection (MTTD)</p>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-emerald-400">14.2s</div>
              <p className="text-[11px] text-slate-400 mt-1 uppercase font-bold">Recovery (MTTR)</p>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-purple-400">91.4%</div>
              <p className="text-[11px] text-slate-400 mt-1 uppercase font-bold">AI Diagnostic Accuracy</p>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-amber-400">0 Writes</div>
              <p className="text-[11px] text-slate-400 mt-1 uppercase font-bold">Safe MCP Governance</p>
            </div>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 relative z-10 font-mono text-xs text-slate-500 text-center">
        <p>&copy; 2026 NetScope. AI-Powered Infrastructure Risk & Incident Remediation Platform.</p>
      </footer>
    </div>
  );
}
