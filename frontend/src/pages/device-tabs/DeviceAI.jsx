import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bot, SendHorizontal, Sparkles } from 'lucide-react';
import { deviceService } from '../../services/device.service.js';

const starterPrompts = [
  'Explain the current health status',
  'What should I worry about with SSL?',
  'Summarize the open ports and risk',
  'Give me an overall device summary',
];

export default function DeviceAI() {
  const { device } = useOutletContext();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'I can help you understand this device in plain English. Ask about health, SSL, ports, or get a full summary.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const currentDeviceLabel = useMemo(() => device?.name || 'this device', [device]);

  const submitPrompt = async (promptText) => {
    const trimmed = promptText?.trim();
    if (!trimmed) return;

    const userMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await deviceService.analyzeDevice(device.id);
      const summary = response?.summary || 'I could not generate a summary right now.';
      const recommendations = response?.recommendations || [];

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `${summary}`,
          recommendations,
          prompt: trimmed,
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 via-zinc-900 to-zinc-950 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-600/20 p-2 text-indigo-300">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 font-mono">AI Assistant</h3>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Chat with the assistant about {currentDeviceLabel}.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => submitPrompt(prompt)}
              disabled={loading}
              className="rounded-full border border-zinc-700/80 bg-zinc-950/70 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-zinc-300 hover:border-indigo-500/40 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
                  message.role === 'user'
                    ? 'border-indigo-500/30 bg-indigo-600/15 text-zinc-100'
                    : 'border-zinc-800/80 bg-zinc-950/80 text-zinc-200'
                }`}
              >
                <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">
                  {message.role === 'user' ? <Sparkles size={12} /> : <Bot size={12} />}
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                {message.recommendations?.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    {message.recommendations.map((item, itemIndex) => (
                      <li key={`${message.role}-${itemIndex}`} className="flex gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-3">
        <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">Ask the assistant</label>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Ask about ${currentDeviceLabel}...`}
            className="flex-1 rounded-xl border border-zinc-800/80 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <SendHorizontal size={15} />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
