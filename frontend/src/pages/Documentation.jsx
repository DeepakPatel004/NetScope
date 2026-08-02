import React, { useState } from 'react';
import { 
  BookOpen, Globe, Shield, Terminal, Activity, Bot, 
  HelpCircle, ArrowRight, CheckCircle2, Clock, FileText, 
  Zap, Lock, Cpu, Server, Play, ChevronRight, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DOC_SECTIONS = [
  { id: 'quickstart', title: 'Quickstart Guide', icon: Zap },
  { id: 'latency', title: 'Network Phase Latency', icon: Clock },
  { id: 'ssl', title: 'SSL & TLS Security', icon: Shield },
  { id: 'ports', title: 'TCP Port Scanner', icon: Terminal },
  { id: 'ai', title: 'AI Diagnostic Bot', icon: Bot },
  { id: 'reports', title: 'SLA Reports & PDF Export', icon: FileText },
];

export default function Documentation() {
  const [activeTab, setActiveTab] = useState('quickstart');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero Banner */}
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-mono font-semibold text-indigo-300 mb-4">
              <BookOpen size={14} /> Platform Documentation & Knowledge Base
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Understanding NetScope Telemetry & Monitoring
            </h1>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              A comprehensive guide explaining how NetScope measures network availability, performs OSI-layer socket latency breakdowns, audits SSL certificates, scans open TCP ports, and leverages generative AI for root-cause diagnosis.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/devices/new"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
              >
                Add Your First Device <ArrowRight size={14} />
              </Link>
              <Link
                to="/ai"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:border-slate-600 hover:text-white"
              >
                Launch AI Assistant <Bot size={14} className="text-emerald-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Navigation Sidebar Tabs */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Documentation Topics
            </div>
            {DOC_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeTab === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30'
                      : 'bg-slate-900/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-white' : 'text-indigo-400'} />
                    <span>{section.title}</span>
                  </div>
                  <ChevronRight size={14} className={isActive ? 'text-white' : 'text-slate-600'} />
                </button>
              );
            })}
          </div>

          {/* Detailed Content Panel */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-6">
            
            {/* 1. Quickstart Guide */}
            {activeTab === 'quickstart' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 text-indigo-400 mb-2">
                    <Zap size={20} />
                    <h2 className="text-xl font-bold text-white">Getting Started with NetScope</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    NetScope is a developer-first network monitoring platform designed to audit website health, REST API responsiveness, SSL/TLS security, and open TCP ports in real time.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px]">1</span>
                      Add Monitored Host
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      Navigate to <strong>Devices &gt; Add Device</strong>. Enter your target URL (e.g., <code className="text-indigo-300">https://api.myapp.com</code>) and select a check frequency (30s to 60m).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px]">2</span>
                      Automated Background Sweeps
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      NetScope's background workers (powered by BullMQ & Redis) automatically execute scheduled HTTP, SSL, and TCP socket checks.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-[10px]">3</span>
                      Inspect OSI Telemetry
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      Click any device to view individual phase timings (DNS resolution, TCP connection, TLS negotiation, TTFB response).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px]">4</span>
                      Consult AI Assistant
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      Open the <strong>AI Assistant</strong> tab to get generative AI root-cause analysis and actionable fix recommendations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Network Phase Latency */}
            {activeTab === 'latency' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 text-indigo-400 mb-2">
                    <Clock size={20} />
                    <h2 className="text-xl font-bold text-white">Network Phase Latency Breakdown (OSI Layer Diagnostics)</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Total response latency is broken down into 4 high-precision socket lifecycle phases to isolate network bottlenecks:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-sky-300 font-mono">1. DNS Lookup Time (dnsTime)</span>
                      <span className="text-[10px] font-mono text-sky-400 uppercase">Application / Transport Layer</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Measures the time required for DNS servers to resolve your hostname (e.g., <code className="text-white">api.github.com</code>) to an IPv4/IPv6 IP address. High DNS latency indicates DNS provider bottlenecks or slow domain propagation.
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-300 font-mono">2. TCP Handshake Time (tcpTime)</span>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase">Transport Layer (SYN / SYN-ACK / ACK)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Measures the duration to establish a 3-way TCP socket connection between NetScope and the remote host server. High TCP latency points to geographical distance, routing issues, or network congestion.
                    </p>
                  </div>

                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-purple-300 font-mono">3. TLS Handshake Time (tlsTime)</span>
                      <span className="text-[10px] font-mono text-purple-400 uppercase">Presentation Layer (SSL Encryption)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Measures the security negotiation duration, cipher suite selection, and certificate validation. High TLS latency indicates heavy CPU load on target SSL terminators or outdated cipher suites.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-300 font-mono">4. Time to First Byte (ttfbTime)</span>
                      <span className="text-[10px] font-mono text-amber-400 uppercase">Application Layer (HTTP Server Response)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Measures the server processing time from receiving the HTTP request to returning the first byte of response data. High TTFB indicates slow database queries, backend code execution delays, or server resource exhaustion.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SSL Security */}
            {activeTab === 'ssl' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 text-sky-400 mb-2">
                    <Shield size={20} />
                    <h2 className="text-xl font-bold text-white">SSL & TLS Certificate Expiry Tracking</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    NetScope performs deep TLS socket audits to prevent unexpected downtime caused by expired SSL certificates.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="text-xs font-bold text-slate-200 mb-2">SSL Status Classifications</h3>
                    <ul className="space-y-2 text-xs text-slate-400 font-mono">
                      <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> <strong className="text-white">VALID:</strong> Certificate is healthy with &gt;14 days remaining.</li>
                      <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" /> <strong className="text-white">EXPIRING:</strong> Validity falls under 14 days; urgent renewal recommended.</li>
                      <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-400" /> <strong className="text-white">EXPIRED:</strong> Certificate passed expiry date; browsers will block access.</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="text-xs font-bold text-slate-200 mb-2">Why SSL Monitoring Matters</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      An expired SSL certificate results in catastrophic browser security warnings (<code className="text-rose-300">NET::ERR_CERT_DATE_INVALID</code>), loss of user trust, API request failures, and immediate search engine ranking penalties.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. TCP Port Scanner */}
            {activeTab === 'ports' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 text-amber-400 mb-2">
                    <Terminal size={20} />
                    <h2 className="text-xl font-bold text-white">TCP Port Scanner & Attack Surface Audit</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    NetScope scans target host IP addresses for open listening TCP ports to identify exposed network services.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Common Port Definitions & Risks</h3>
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <strong className="text-emerald-400">Port 80 (HTTP) & 443 (HTTPS):</strong>
                      <p className="text-slate-400 mt-1">Standard web traffic ports. Port 80 should automatically redirect all traffic to secure HTTPS on Port 443.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <strong className="text-rose-400">Port 22 (SSH Remote Shell):</strong>
                      <p className="text-slate-400 mt-1">Exposing SSH publicly presents severe brute-force risks. Must be protected behind a VPN or strict firewall IP whitelist.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <strong className="text-amber-400">Port 3389 (RDP Remote Desktop):</strong>
                      <p className="text-slate-400 mt-1">Windows Remote Desktop port. Exposing RDP directly to the internet is a top vector for ransomware attacks.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <strong className="text-sky-400">Port 3306 (MySQL) / 5432 (PostgreSQL):</strong>
                      <p className="text-slate-400 mt-1">Database listening ports. Should NEVER be publicly accessible; bind to localhost or private VPC subnets only.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. AI Assistant */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 text-emerald-400 mb-2">
                    <Bot size={20} />
                    <h2 className="text-xl font-bold text-white">AI Assistant & Telemetry Reasoning Engine</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    NetScope integrates Google Gemini AI to analyze raw health metrics, port registries, and SSL validity to provide instant technical summaries and priority action steps.
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-2">
                  <h3 className="text-xs font-bold text-indigo-300">How the AI Assistant Evaluates Telemetry</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    When you select a topic or click a suggested prompt in the AI Assistant chat window (<code className="text-indigo-200">/ai</code>), NetScope constructs a telemetry prompt containing recent audit logs, open ports, and certificate state. The generative AI model reviews the data and outputs a 100% complete diagnostic analysis.
                  </p>
                </div>
              </div>
            )}

            {/* 6. SLA Reports */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 text-purple-400 mb-2">
                    <FileText size={20} />
                    <h2 className="text-xl font-bold text-white">Executive SLA Reports (PDF & CSV Export)</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Download formal SLA availability reports for stakeholders, clients, and technical audits.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="text-xs font-bold text-indigo-300 mb-2">PDF Executive SLA Summary</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Generates a styled, multi-page PDF report containing overall uptime percentages, average latency metrics, open port inventories, and active security advisories.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="text-xs font-bold text-emerald-300 mb-2">CSV Raw Data Export</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Downloads a raw spreadsheet CSV file containing timestamped check histories, HTTP status codes, and latency measurements for custom data analysis.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
