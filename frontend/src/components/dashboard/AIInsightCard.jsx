import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AIInsightCard({ anomaly = null, devices = [], onOpenModal }) {
  const navigate = useNavigate();
  const [customPrompt, setCustomPrompt] = useState('');

  const hasAnomaly = anomaly && (anomaly.anomalyScore > 0.4 || anomaly.severity === 'CRITICAL' || anomaly.severity === 'HIGH');
  
  const targetDevice = anomaly?.device?.name || anomaly?.device?.host || devices[0]?.name || 'Monitored Target';
  const reason = anomaly?.detectionReason || `Unusual latency fluctuation observed in ${targetDevice}. Evaluated against normal baseline.`;

  const possibleCause = Array.isArray(anomaly?.possibleCauses) && anomaly.possibleCauses.length > 0
    ? anomaly.possibleCauses[0]
    : 'Network socket latency shift detected';

  const recommendedAction = Array.isArray(anomaly?.recommendedActions) && anomaly.recommendedActions.length > 0
    ? anomaly.recommendedActions[0]
    : 'Monitor endpoint response time trend';

  const handleAskAI = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    navigate(`/ai?prompt=${encodeURIComponent(customPrompt)}`);
  };

  return (
    <div className="bg-gradient-to-br from-[#131129] to-[#0F1424] border border-[#3B3278] hover:border-[#6366F1]/50 rounded-xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group">
      {/* Decorative Top Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#6366F1]/10 rounded-full blur-3xl group-hover:bg-[#6366F1]/20 transition duration-500 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 z-10">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#A855F7]" />
          <h3 className="text-sm font-bold text-white tracking-wide">AI Insights</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A855F7] border border-[#8B5CF6]/30 uppercase tracking-wider">
            Beta
          </span>
        </div>
        <button
          onClick={() => navigate('/ai')}
          className="text-xs font-semibold text-[#A855F7] hover:text-purple-300 transition cursor-pointer"
        >
          View all &rarr;
        </button>
      </div>

      {hasAnomaly ? (
        <div className="z-10">
          {/* Anomaly Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert size={12} /> ANOMALY DETECTED
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/30">
              High Confidence
            </span>
          </div>

          {/* Summary Narrative */}
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {reason}
          </p>

          {/* Cause & Action Breakdown */}
          <div className="space-y-2 mb-4 text-xs bg-[#0B0D1B]/60 border border-[#2A2454] rounded-lg p-3">
            <div>
              <span className="font-semibold text-slate-400 block text-[11px]">Possible Cause</span>
              <span className="text-slate-200 font-medium">{possibleCause}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-400 block text-[11px]">Recommended Action</span>
              <span className="text-slate-200 font-medium">{recommendedAction}</span>
            </div>
          </div>

          {/* Full Analysis Button */}
          <button
            onClick={() => onOpenModal && onOpenModal(anomaly)}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <span>View Full Analysis</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="py-4 flex flex-col items-center justify-center text-center space-y-2 z-10">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
            <CheckCircle2 size={22} />
          </div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">System Baseline Nominal</h4>
          <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
            Machine learning isolation forest model reports normal latency baselines for all active endpoints.
          </p>
        </div>
      )}

      {/* Interactive AI Question Input Bar */}
      <form onSubmit={handleAskAI} className="mt-4 pt-3 border-t border-[#3B3278]/60 flex items-center gap-2 z-10">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Ask AI Assistant any question..."
          className="w-full bg-[#0B0D1B] border border-[#2A2454] text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#6366F1]"
        />
        <button
          type="submit"
          className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1 shadow-md"
        >
          <Send size={13} />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
