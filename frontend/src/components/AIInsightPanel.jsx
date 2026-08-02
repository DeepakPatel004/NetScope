import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AIInsightPanel({
  title,
  description,
  insight,
  loading,
  error,
  onGenerate,
  buttonLabel = 'ASK AI',
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono">{title}</h4>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">{description}</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white disabled:opacity-60 px-3 py-1.5 rounded-xl text-xs font-mono transition-all"
        >
          <Sparkles size={12} className={loading ? 'animate-pulse' : ''} />
          {loading ? 'THINKING...' : buttonLabel}
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 text-sm text-zinc-400 font-mono">
          Generating an AI explanation for this device state...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300 font-mono">
          {error}
        </div>
      ) : insight ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-mono">AI Summary</div>
            <p className="mt-2 text-sm text-zinc-200 leading-relaxed">{insight.summary}</p>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-mono">Recommendations</div>
            <ul className="mt-2 space-y-2 text-sm text-zinc-300 font-mono">
              {insight.recommendations?.length ? (
                insight.recommendations.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-indigo-400">•</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500">No recommendations were returned.</li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/50 p-4 text-sm text-zinc-500 font-mono">
          No AI insight generated yet. Use the button above to get a practical explanation.
        </div>
      )}
    </div>
  );
}
