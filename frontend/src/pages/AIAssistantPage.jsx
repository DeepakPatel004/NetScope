import React, { useEffect, useMemo, useState } from 'react';
import { Bot, SendHorizontal, Sparkles, Server, Shield, Terminal, Globe, Activity, ChevronRight, MessageCircleQuestion } from 'lucide-react';
import { deviceService } from '../services/device.service.js';
import { assistantQuestionTree, resolveAssistantIntent, getGuidanceSuggestions } from './aiAssistantIntents.mjs';

export default function AIAssistantPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Choose a device and pick one of the guided topics below for a practical, domain-specific answer.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const response = await deviceService.getDevices();
        const list = response?.data || [];
        setDevices(list);
        setSelectedDeviceId((currentSelection) => {
          if (currentSelection) {
            return list.some((device) => device.id === currentSelection) ? currentSelection : list[0]?.id || '';
          }
          return list[0]?.id || '';
        });
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
  const guidanceSections = useMemo(() => Object.entries(assistantQuestionTree), []);
  const guidancePrompts = useMemo(() => getGuidanceSuggestions(), []);

  const submitPrompt = async (promptText) => {
    const trimmed = promptText?.trim();
    if (!trimmed) return;
    const intent = resolveAssistantIntent(trimmed);

    if (!activeDeviceId) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Please select a device before asking for an AI explanation.',
        },
      ]);
      return;
    }

    if (!intent) {
      const guidanceText = 'I can help with a few guided topics. Try one of the suggested questions below for health, SSL, ports, or a device overview.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: guidanceText,
          recommendations: guidancePrompts.slice(0, 4).map((item) => `${item.category}: ${item.label}`),
        },
      ]);
      return;
    }

    const userMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setLoading(true);

    try {
      const normalized = trimmed.toLowerCase();
      let response;

      if (intent.category === 'ssl') {
        response = await deviceService.explainSsl(activeDeviceId, trimmed);
      } else if (intent.category === 'ports') {
        response = await deviceService.explainPorts(activeDeviceId, trimmed);
      } else if (intent.category === 'health') {
        response = await deviceService.explainHealth(activeDeviceId, trimmed);
      } else {
        response = await deviceService.analyzeDevice(activeDeviceId, trimmed);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response?.summary || 'The assistant could not generate a response right now.',
          recommendations: response?.recommendations || [],
        },
      ]);
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'The AI assistant could not respond.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitPrompt(input);
  };

  const getDeviceIcon = (type) => {
    if (type === 'WEBSITE') return <Globe size={16} className="text-sky-400" />;
    if (type === 'API') return <Shield size={16} className="text-violet-400" />;
    return <Terminal size={16} className="text-amber-400" />;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] p-2 text-slate-100 lg:p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-2">
        <div className="rounded-[18px] border border-white/10 bg-slate-900/80 px-3 py-2.5 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-500/15 p-2 text-indigo-300">
                <Bot size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">NetScope AI</div>
                <div className="text-sm font-semibold text-white">Support assistant</div>
              </div>
            </div>
            {selectedDevice ? (
              <div className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-indigo-300">
                {selectedDevice.name}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-[1.15fr_0.45fr]">
          <div className="flex h-[70vh] min-h-[560px] flex-col rounded-[18px] border border-white/10 bg-slate-900/80 p-2.5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-2 flex flex-wrap gap-2 relative z-10">
              {guidanceSections.map(([key, section]) => (
                <button
                  key={key}
                  onClick={() => submitPrompt(section.prompts[0].prompt)}
                  disabled={loading}
                  type="button"
                  className="relative z-20 rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300 transition hover:border-indigo-500/40 hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  {section.title}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto rounded-[14px] border border-slate-800/70 bg-slate-950/70 p-2.5 relative z-0">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[86%] rounded-2xl px-3 py-2.5 break-words ${message.role === 'user' ? 'bg-indigo-600/20 text-slate-100' : 'bg-slate-900/80 text-slate-200'}`}>
                    <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      {message.role === 'user' ? <Sparkles size={12} /> : <MessageCircleQuestion size={12} />}
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <p className="text-sm leading-5 whitespace-pre-wrap break-words">{message.text}</p>
                    {message.recommendations?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.recommendations.map((item, itemIndex) => (
                          <button
                            key={`${message.role}-${itemIndex}`}
                            type="button"
                            onClick={() => submitPrompt(item.includes(':') ? item.split(':').slice(1).join(':').trim() : item)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-indigo-500/40 hover:text-white"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-2 rounded-[14px] border border-slate-800/70 bg-slate-950/80 p-2 relative z-10">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={selectedDevice ? `Ask about ${selectedDevice.name}...` : 'Select a device first...'}
                  className="flex-1 rounded-xl border border-slate-800/80 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  <SendHorizontal size={15} />
                  Send
                </button>
              </div>
            </form>
          </div>

          <aside className="rounded-[18px] border border-white/10 bg-slate-900/80 p-2.5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Server size={16} className="text-emerald-400" />
              Devices
            </div>

            <div className="mt-3 space-y-2">
              {devices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-3 py-3 text-sm text-slate-500">
                  No devices available yet.
                </div>
              ) : (
                devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDeviceId(device.id)}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition cursor-pointer ${
                      selectedDeviceId === device.id
                        ? 'border-indigo-500/40 bg-indigo-500/10'
                        : 'border-slate-800/80 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-xl bg-slate-900/80 p-2">{getDeviceIcon(device.type)}</div>
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{device.name}</div>
                        <div className="text-xs text-slate-500">{device.host}</div>
                      </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{device.type}</div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-3 rounded-[16px] border border-slate-800/70 bg-slate-950/70 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Activity size={15} className="text-cyan-400" />
                Quick help
              </div>
              <div className="mt-2 space-y-2 text-sm text-slate-400">
                {guidanceSections.flatMap(([key, section]) => section.prompts.slice(0, 2).map((item) => (
                  <button
                    key={`${key}-${item.label}`}
                    onClick={() => submitPrompt(item.prompt)}
                    disabled={loading}
                    type="button"
                    className="flex w-full items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-indigo-500/40 hover:text-white disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronRight size={14} className="mt-0.5 text-indigo-400" />
                    <span>{item.label}</span>
                  </button>
                ))) }
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
