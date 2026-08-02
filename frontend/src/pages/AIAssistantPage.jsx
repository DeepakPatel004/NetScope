import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, Server, Shield, Terminal, Globe, Activity, RefreshCw, ChevronRight, BookOpen } from 'lucide-react';
import { deviceService } from '../services/device.service.js';
import { resolveAssistantIntent } from './aiAssistantIntents.mjs';

const CATEGORY_TOPICS = [
  { id: 'device', label: 'Overview', icon: Activity, prompt: 'Give me a device summary' },
  { id: 'health', label: 'Health & Uptime', icon: Globe, prompt: 'Show me the current health status' },
  { id: 'ssl', label: 'SSL Certificate', icon: Shield, prompt: 'Show my SSL certificate details' },
  { id: 'ports', label: 'Open Ports', icon: Terminal, prompt: 'Show me my open port details' },
];

const INITIAL_SUGGESTIONS = [
  { text: 'Give me a device summary', icon: '📊' },
  { text: 'Show me the current health status', icon: '🟢' },
  { text: 'Show my SSL certificate details', icon: '🔒' },
  { text: 'Show me my open port details', icon: '🔌' },
];

export default function AIAssistantPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const response = await deviceService.getDevices();
        const list = response?.data || [];
        setDevices(list);
        if (list.length > 0) {
          setSelectedDeviceId(list[0].id);
        }
      } catch (error) {
        console.error('Failed to load devices for AI assistant', error);
      }
    };

    loadDevices();
  }, []);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) || null,
    [devices, selectedDeviceId]
  );

  const activeDeviceId = selectedDeviceId || selectedDevice?.id || devices[0]?.id || '';

  useEffect(() => {
    if (selectedDevice) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Monitoring connected to ${selectedDevice.name}. Select a diagnostic topic below to analyze telemetry logs.`,
          followUps: INITIAL_SUGGESTIONS,
        },
      ]);
    }
  }, [selectedDeviceId]);

  const handleRestartChat = () => {
    if (selectedDevice) {
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Diagnostic history reset for ${selectedDevice.name}. Pick a topic to run fresh telemetry checks.`,
          followUps: INITIAL_SUGGESTIONS,
        },
      ]);
    }
  };

  const submitPrompt = async (promptText) => {
    const trimmed = promptText?.trim();
    if (!trimmed || loading) return;
    const intent = resolveAssistantIntent(trimmed);

    if (!activeDeviceId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Please select a monitored target device from the right panel first.',
          followUps: [],
        },
      ]);
      return;
    }

    const userMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      let response;
      let nextFollowUps = [];

      if (intent?.category === 'ssl') {
        response = await deviceService.explainSsl(activeDeviceId, trimmed);
        nextFollowUps = [
          { text: 'When does my SSL certificate expire?', icon: '⏳' },
          { text: 'What happens if SSL expires?', icon: '⚠️' },
          { text: 'How do I set up automated SSL renewal?', icon: '🔄' },
          { text: 'Is the SSL certificate chain valid?', icon: '🛡️' },
          { text: 'Give me a full device summary', icon: '📊' },
        ];
      } else if (intent?.category === 'ports') {
        response = await deviceService.explainPorts(activeDeviceId, trimmed);
        nextFollowUps = [
          { text: 'Which ports should I close?', icon: '🛑' },
          { text: 'What harm can unnecessary open ports cause?', icon: '🛡️' },
          { text: 'Are remote management ports (SSH 22 / RDP 3389) exposed?', icon: '🔒' },
          { text: 'What firewall security rules should I apply?', icon: '🧱' },
          { text: 'Show me the current health status', icon: '🟢' },
        ];
      } else if (intent?.category === 'health') {
        response = await deviceService.explainHealth(activeDeviceId, trimmed);
        nextFollowUps = [
          { text: 'Is the device stable right now?', icon: '⚡' },
          { text: 'What is causing the recent downtime?', icon: '📈' },
          { text: 'What is the network latency breakdown (DNS, TCP, TLS, TTFB)?', icon: '⏱️' },
          { text: 'What should I do about slow response or uptime issues?', icon: '🛠️' },
          { text: 'Show my SSL certificate details', icon: '🔒' },
        ];
      } else {
        response = await deviceService.analyzeDevice(activeDeviceId, trimmed);
        nextFollowUps = [
          { text: 'What are the main security risks?', icon: '🚨' },
          { text: 'What should I fix first?', icon: '🛠️' },
          { text: 'Show me my open port details', icon: '🔌' },
          { text: 'Summarize the overall uptime SLA compliance', icon: '📉' },
          { text: 'Show my SSL certificate details', icon: '🔒' },
        ];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: response?.summary || 'Telemetry check completed successfully.',
          followUps: nextFollowUps,
        },
      ]);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'The AI diagnostic engine could not respond.';
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: msg,
          followUps: INITIAL_SUGGESTIONS,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (type) => {
    if (type === 'WEBSITE') return <Globe size={16} className="text-sky-400" />;
    if (type === 'API') return <Shield size={16} className="text-violet-400" />;
    return <Terminal size={16} className="text-amber-400" />;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] p-3 text-slate-100 lg:p-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        {/* Header */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-300 border border-indigo-500/30">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">NetScope AI Assistant</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedDevice && (
              <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-mono text-indigo-300 font-medium">
                {selectedDevice.name}
              </span>
            )}
            <Link
              to="/docs"
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300 font-medium transition hover:bg-indigo-500/20 hover:text-white"
            >
              <BookOpen size={12} />
              Guide & Docs
            </Link>
            <button
              onClick={handleRestartChat}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400 transition hover:border-slate-700 hover:text-white cursor-pointer"
            >
              <RefreshCw size={12} />
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.25fr_0.45fr]">
          {/* Diagnostic Window */}
          <div className="flex h-[80vh] min-h-[620px] flex-col rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl justify-between">
            
            {/* Topic Shortcuts Bar */}
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
              {CATEGORY_TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <button
                    key={topic.id}
                    disabled={loading}
                    onClick={() => submitPrompt(topic.prompt)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white disabled:opacity-50 cursor-pointer"
                  >
                    <Icon size={13} className="text-indigo-400" />
                    <span>{topic.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Message Feed */}
            <div className="flex-1 space-y-3.5 overflow-y-auto rounded-xl border border-slate-800/70 bg-slate-950/80 p-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl p-3.5 border ${
                    message.role === 'user'
                      ? 'bg-indigo-600/20 border-indigo-500/30 text-slate-100'
                      : 'bg-slate-900/90 border-slate-800 text-slate-200'
                  }`}>
                    <div className="mb-1.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase font-semibold">
                        {message.role === 'user' ? <Sparkles size={12} className="text-indigo-400" /> : <Bot size={13} className="text-emerald-400" />}
                        <span>{message.role === 'user' ? 'You' : 'AI Assistant'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{message.timestamp}</span>
                    </div>

                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">{message.text}</p>

                    {/* Prebuilt Follow-Up Option Buttons */}
                    {message.followUps?.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap gap-2">
                        {message.followUps.map((item, idx) => (
                          <button
                            key={`item-${idx}`}
                            disabled={loading}
                            onClick={() => submitPrompt(item.text)}
                            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 hover:bg-indigo-600/25 hover:border-indigo-400/50 px-3 py-1.5 text-xs text-indigo-200 transition-all cursor-pointer disabled:opacity-50 text-left"
                          >
                            <span>{item.icon}</span>
                            <span>{item.text}</span>
                            <ChevronRight size={12} className="text-indigo-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                    <Sparkles size={14} className="animate-spin text-indigo-400" />
                    <span>Analyzing telemetry logs...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Monitored Device Selection Sidebar */}
          <aside className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  <Server size={15} className="text-emerald-400" />
                  Monitored Devices
                </div>
                <span className="text-[10px] font-mono text-slate-500">{devices.length} Total</span>
              </div>

              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {devices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 p-4 text-center text-xs text-slate-500">
                    No devices registered.
                  </div>
                ) : (
                  devices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => setSelectedDeviceId(device.id)}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
                        selectedDeviceId === device.id
                          ? 'border-indigo-500/50 bg-indigo-500/15'
                          : 'border-slate-800/80 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">{getDeviceIcon(device.type)}</div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">{device.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[130px]">{device.host}</div>
                        </div>
                      </div>
                      <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
                        {device.type}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
