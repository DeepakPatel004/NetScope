import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, Shield, Wrench, HelpCircle, FileText } from 'lucide-react';
import { aiService } from '../services/ai.service.js';

export default function AIIncidentModal({ incident, onClose }) {
  const [timeline, setTimeline] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  if (!incident) return null;

  const loadTimeline = async () => {
    if (!incident.deviceId) return;
    try {
      setLoadingTimeline(true);
      const res = await aiService.getTimelineSummary(incident.deviceId);
      setTimeline(res.data);
    } catch (err) {
      console.error('Failed to load timeline', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const possibleCauses = Array.isArray(incident.possibleCauses)
    ? incident.possibleCauses
    : typeof incident.possibleCauses === 'string'
    ? JSON.parse(incident.possibleCauses || '[]')
    : [];

  const recommendedActions = Array.isArray(incident.recommendedActions)
    ? incident.recommendedActions
    : typeof incident.recommendedActions === 'string'
    ? JSON.parse(incident.recommendedActions || '[]')
    : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#181b1f',
          border: '1px solid #2b3036',
          borderRadius: '16px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: '#f8fafc',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '8px' }}>
              <Sparkles size={24} color="#5eead4" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>AI Incident Intelligence Diagnosis</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                {incident.device?.name || 'Service'} ({incident.device?.host || 'localhost'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Priority & Confidence Badges */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            Priority: {incident.priority || 'HIGH'} (Score: {incident.priorityScore?.toFixed(1) || '7.5'})
          </div>
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Confidence: {((incident.confidence || 0.85) * 100).toFixed(0)}%
          </div>
        </div>

        {/* Incident Summary */}
        <div style={{ marginBottom: '20px', background: '#2b3036', padding: '16px', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#5eead4', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> Incident Summary
          </h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            {incident.summary || incident.error || 'Anomaly observed in service metrics.'}
          </p>
        </div>

        {/* Possible Causes (Hypotheses) */}
        {possibleCauses.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} /> Technical Hypotheses & Possible Causes
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {possibleCauses.map((cause, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{cause}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Action Steps */}
        {recommendedActions.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={18} /> Recommended Investigations
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {recommendedActions.map((action, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{action}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Timeline Summary Button & View */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: '16px' }}>
          {!timeline ? (
            <button
              onClick={loadTimeline}
              disabled={loadingTimeline}
              style={{
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {loadingTimeline ? 'Generating Timeline Summary...' : 'Generate Incident Timeline'}
            </button>
          ) : (
            <div style={{ background: '#181b1f', border: '1px solid #334155', padding: '14px', borderRadius: '8px' }}>
              <h5 style={{ margin: '0 0 6px 0', color: '#60a5fa' }}>Timeline Summary</h5>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                {timeline.timeline_summary}
              </p>
              {timeline.key_events?.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  {timeline.key_events.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
