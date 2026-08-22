import React from 'react';
import { AlertTriangle, Cpu, Activity, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';

const SEVERITY_COLORS = {
  CRITICAL: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.4)' },
  HIGH: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.4)' },
  MEDIUM: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.4)' },
  LOW: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.4)' }
};

export default function AIAnomalyCard({ anomaly, onSelectIncident }) {
  if (!anomaly) return null;

  const severityStyle = SEVERITY_COLORS[anomaly.severity] || SEVERITY_COLORS.MEDIUM;
  const scorePct = Math.min(100, Math.round((anomaly.anomalyScore || 0) * 100));

  return (
    <div
      style={{
        background: '#121926',
        border: `1px solid ${severityStyle.border}`,
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '12px',
        color: '#f3f4f6',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={20} color={severityStyle.text} />
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
            {anomaly.device?.name || 'Monitored Service'}
            <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 400, marginLeft: '8px' }}>
              ({anomaly.device?.host || 'localhost'})
            </span>
          </h4>
        </div>
        <div
          style={{
            background: severityStyle.bg,
            color: severityStyle.text,
            border: `1px solid ${severityStyle.border}`,
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {anomaly.severity}
        </div>
      </div>

      <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#d1d5db', lineHeight: 1.5 }}>
        {anomaly.detectionReason}
      </p>

      {/* Anomaly Score Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>
          <span>Isolation Forest Anomaly Score</span>
          <span style={{ fontWeight: 700, color: severityStyle.text }}>{anomaly.anomalyScore?.toFixed(2)} ({scorePct}%)</span>
        </div>
        <div style={{ height: '6px', background: '#1f2937', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${scorePct}%`,
              background: severityStyle.text,
              borderRadius: '4px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
        <span>Detected: {new Date(anomaly.timestamp).toLocaleTimeString()}</span>
        {onSelectIncident && (
          <button
            onClick={() => onSelectIncident(anomaly)}
            style={{
              background: 'transparent',
              border: `1px solid ${severityStyle.text}`,
              color: severityStyle.text,
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            View LLM Diagnosis
          </button>
        )}
      </div>
    </div>
  );
}
