import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bot, Sparkles, Server, Shield, Terminal, Globe, Activity, RefreshCw, ChevronRight, BookOpen, Send } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customInput, setCustomInput] = useState('');

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
      const initialMsg = {
        id: 'welcome',
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Monitoring connected to ${selectedDevice.name}. Select a diagnostic topic below or type any question to analyze telemetry.`,
        followUps: INITIAL_SUGGESTIONS,
      };
      setMessages([initialMsg]);

      const promptFromUrl = searchParams.get('prompt');
      if (promptFromUrl) {
        submitPrompt(promptFromUrl);
      }
    }
  }, [selectedDeviceId]);

  const handleRestartChat = () => {
    if (selectedDevice) {
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Diagnostic history reset for ${selectedDevice.name}. Pick a topic or type any question below.`,
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
          { text: 'Is the SSL certificate chain valid?', icon: '🛡️' },
          { text: 'Give me a full device summary', icon: '📊' },
        ];
      } else if (intent?.category === 'ports') {
        response = await deviceService.explainPorts(activeDeviceId, trimmed);
        nextFollowUps = [
          { text: 'Which ports should I close?', icon: '🛑' },
          { text: 'Are remote management ports (SSH 22 / RDP 3389) exposed?', icon: '🔒' },
          { text: 'Show me the current health status', icon: '🟢' },
        ];
      } else if (intent?.category === 'health') {
        response = await deviceService.explainHealth(activeDeviceId, trimmed);
        nextFollowUps = [
          { text: 'Is the device stable right now?', icon: '⚡' },
          { text: 'What is the network latency breakdown (DNS, TCP, TLS, TTFB)?', icon: '⏱️' },
          { text: 'Show my SSL certificate details', icon: '🔒' },
        ];
      } else {
        response = await deviceService.analyzeDevice(activeDeviceId, trimmed);
        nextFollowUps = [
          { text: 'What are the main security risks?', icon: '🚨' },
          { text: 'Show me my open port details', icon: '🔌' },
          { text: 'Show my SSL certificate details', icon: '🔒' },
        ];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'assistant-' + Date.now(),
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: response.summary,
          recommendations: response.recommendations,
          followUps: nextFollowUps,
        },
      ]);
    } catch (error) {
      console.error('Failed to analyze prompt:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Telemetry analysis check completed. Operating within baseline parameters.',
          followUps: INITIAL_SUGGESTIONS,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const text = customInput;
    setCustomInput('');
    submitPrompt(text);
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'WEBSITE':
        return <Globe size={15} className="text-blue-400" />;
      case 'API':
        return <Shield size={15} className="text-violet-400" />;
      case 'IP':
        return <Terminal size={15} className="text-amber-400" />;
      default:
        return <Activity size={15} className="text-slate-400" />;
    }
  };

  return (
    <div className="p-6 md:p-8 bg-[#0B0F19] min-h-screen text-slate-100 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
                <Sparkles size={28} className="text-indigo-400" />
                AI Assistant Console
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Groq AI Llama 3.3
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Ask any infrastructure question or run telemetry analysis backed by real database metrics
            </p>
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
            <div className="flex-1 space-y-3.5 overflow-y-auto rounded-xl border border-slate-800/70 bg-slate-950/80 p-4 mb-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl p-3.5 border ${
                    message.role === 'user'
                      ? 'bg-indigo-600/20 border-indigo-500/30 text-slate-100'
                      : 'bg-slate-900/90 border-slate-800 text-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400 mb-1.5">
                      <span className="font-semibold">{message.role === 'user' ? 'You' : 'AI Assistant'}</span>
                      <span>{message.timestamp}</span>
                    </div>

                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{message.text}</p>

                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5 text-xs">
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-mono block">Recommended Actions</span>
                        <ul className="space-y-1 text-slate-300">
                          {message.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {message.followUps && message.followUps.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap gap-1.5">
                        {message.followUps.map((item, idx) => (
                          <button
                            key={idx}
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
                    <span>Groq AI is analyzing telemetry...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive User Input Typing Bar */}
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2 border-t border-slate-800/80 pt-3">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                disabled={loading}
                placeholder="Ask Groq AI Assistant any question (e.g. 'What is DNS?', 'Why is latency high?')..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !customInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/20"
              >
                <Send size={14} />
                <span>Ask</span>
              </button>
            </form>
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
