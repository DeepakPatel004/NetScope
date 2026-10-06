import { useEffect, useRef, useState } from 'react';
import { Send, RotateCcw } from 'lucide-react';
import { deviceService } from '../services/device.service.js';
import api from '../services/api.js';

const starters = ['Explain current health', 'Investigate latency', 'Review SSL and port risks'];
export default function AIAssistantPage() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const end = useRef(null);
  const request = useRef(null);
  useEffect(() => {
    let active = true;
    deviceService.getDevices().then(response => {
      if (!active) return;
      setDevices(response.data || []);
      setDeviceId(response.data?.[0]?.id || '');
    }).catch(() => { if (active) setError('Could not load your devices. Refresh to retry.'); });
    return () => { active = false; request.current?.abort(); };
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages, loading]);
  const reset = () => { request.current?.abort(); request.current = null; setLoading(false); setMessages([]); };
  const submit = async text => {
    if (!text.trim() || loading) return;
    const prompt = text.trim();
    const controller = new AbortController();
    request.current = controller;
    setInput(''); setLoading(true);
    setMessages(items => [...items, { role: 'user', text: prompt }]);
    try {
      const response = await api.post('/ai/chat', { prompt, deviceId: deviceId || null }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const answer = response.data?.data;
      setMessages(items => [...items, { role: 'assistant', text: answer?.summary || 'No response was available. Please retry.', recommendations: answer?.recommendations || [] }]);
    } catch (error) {
      if (!controller.signal.aborted) setMessages(items => [...items, { role: 'assistant', text: 'The assistant is unavailable. Please check the backend and AI service, then retry.' }]);
    } finally { if (request.current === controller) { request.current = null; setLoading(false); } }
  };
  return <div className="max-w-5xl mx-auto p-5 sm:p-8 space-y-6 text-slate-100">
    <header className="flex items-center justify-between gap-3 border-b border-[#2b3036] pb-6"><div><h1 className="text-2xl font-semibold">Assistant</h1><p className="text-sm text-slate-400 mt-2">Ask questions about your recorded device telemetry.</p></div><button onClick={reset} aria-label="New conversation" className="p-2 text-slate-400 hover:text-white"><RotateCcw size={18} /></button></header>
    {error && <p role="alert" className="text-rose-300 text-sm">{error}</p>}
    <div className="flex items-center gap-3"><label htmlFor="assistant-device" className="text-sm text-slate-400">Device</label><select id="assistant-device" value={deviceId} onChange={event => { reset(); setDeviceId(event.target.value); }} className="bg-[#181b1f] border border-[#2b3036] rounded-lg px-3 py-2 text-sm"><option value="">General question</option>{devices.map(device => <option key={device.id} value={device.id}>{device.name}</option>)}</select></div>
    <div className="rounded-xl border border-[#2b3036] bg-[#181b1f] flex flex-col h-[min(65vh,640px)] min-h-96">
      <div aria-live="polite" className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
        {!messages.length && <div className="py-12 max-w-md mx-auto text-center"><h2 className="text-lg font-medium">What would you like to investigate?</h2><p className="text-sm text-slate-500 mt-3">Select a device to include its health checks, certificates, and open ports.</p><div className="flex flex-wrap justify-center gap-2 mt-6">{starters.map(text => <button key={text} onClick={() => submit(text)} className="rounded-lg border border-[#2b3036] px-3 py-2 text-xs text-slate-300 hover:border-slate-500">{text}</button>)}</div></div>}
        {messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'ml-auto max-w-[85%] rounded-xl bg-white/5 p-4' : 'max-w-[90%]'}><p className="text-xs text-slate-500 mb-2">{message.role === 'user' ? 'You' : 'Assistant'}</p><p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>{message.recommendations?.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-slate-400 space-y-2">{message.recommendations.map((item, index) => <li key={index}>{item}</li>)}</ul>}</div>)}
        {loading && <p role="status" className="text-sm text-slate-500">Reviewing telemetry…</p>}<div ref={end} />
      </div>
      <form onSubmit={event => { event.preventDefault(); submit(input); }} className="flex gap-3 p-4 border-t border-[#2b3036]"><input aria-label="Your question" value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about health, latency, or security…" className="flex-1 min-w-0 bg-transparent text-sm outline-none px-2" /><button aria-label="Send question" disabled={loading || !input.trim()} className="rounded-lg bg-teal-700 hover:bg-teal-600 disabled:opacity-40 p-2.5"><Send size={17} /></button></form>
    </div>
    <p className="text-xs text-slate-500">AI explanations can be incomplete. Check the underlying telemetry before acting. NetScope does not restart services.</p>
  </div>;
}
