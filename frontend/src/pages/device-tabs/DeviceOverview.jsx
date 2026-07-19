import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Filler,
  Legend
} from 'chart.js';
import { Settings, Play } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Filler,
  Legend
);

export default function DeviceOverview() {
  const {
    analytics,
    healthHistory,
    device,
    checking,
    handleManualCheck,
    formatDate
  } = useOutletContext();

  const logsReversed = [...healthHistory].reverse();

  const chartData = {
    labels: logsReversed.map(h => new Date(h.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        data: logsReversed.map(h => h.latency || 0),
        borderColor: '#34d399',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#34d399',
        tension: 0.4,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(52, 211, 153, 0.12)');
          gradient.addColorStop(1, 'rgba(52, 211, 153, 0)');
          return gradient;
        }
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#a1a1aa',
        bodyColor: '#f4f4f5',
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          family: 'Geist Mono, JetBrains Mono, monospace',
          size: 10
        },
        bodyFont: {
          family: 'Geist Mono, JetBrains Mono, monospace',
          size: 11
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'transparent'
        },
        ticks: {
          color: '#71717a',
          font: {
            family: 'Geist Mono, JetBrains Mono, monospace',
            size: 9
          }
        }
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'transparent'
        },
        ticks: {
          color: '#71717a',
          font: {
            family: 'Geist Mono, JetBrains Mono, monospace',
            size: 9
          },
          callback: (value) => `${value} ms`
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between min-h-[120px]">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Uptime Index</div>
          <div className="text-3xl font-bold text-zinc-100 font-mono mt-2">
            {analytics ? `${analytics.uptimePercentage.toFixed(2)}%` : '0.00%'}
          </div>
          <div className="text-xs text-zinc-500 font-mono mt-2">Active ping success ratio</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between min-h-[120px]">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Avg Latency</div>
          <div className="text-3xl font-bold text-zinc-100 font-mono mt-2">
            {analytics ? `${analytics.avgLatency} ms` : '0 ms'}
          </div>
          <div className="text-xs text-zinc-500 font-mono mt-2">Mean round-trip audit</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between min-h-[120px]">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Max Latency</div>
          <div className="text-3xl font-bold text-zinc-100 font-mono mt-2">
            {analytics ? `${analytics.maxLatency} ms` : '0 ms'}
          </div>
          <div className="text-xs text-zinc-500 font-mono mt-2">Peak ping limit logged</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono">Latency Sweep</h3>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Dynamic Bezier Curve</span>
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="flex items-center gap-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 disabled:opacity-50 px-3 py-1.5 rounded-xl text-xs font-mono transition-all"
            >
              <Play size={10} className="rotate-90 text-emerald-400" />
              {checking ? 'PINGING...' : 'PING HEALTH'}
            </button>
          </div>
        </div>
        <div className="h-64">
          {healthHistory.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-zinc-500">
              NO HEALTH Sweeps LOGGED
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} className="text-zinc-500" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono">Registry Datagrams</h3>
          </div>
          <div className="space-y-3 font-mono text-xs mt-4">
            <div className="flex justify-between border-b border-zinc-800/50 pb-2">
              <span className="text-zinc-500">Target Type:</span>
              <span className="font-semibold text-zinc-300">{device.type}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/50 pb-2">
              <span className="text-zinc-500">Registered On:</span>
              <span className="font-semibold text-zinc-300">{formatDate(device.createdAt)}</span>
            </div>
            <div className="pt-1">
              <span className="text-zinc-500 block mb-1">Audit Identifier (UUID):</span>
              <span className="font-semibold text-zinc-400 text-[10px] break-all select-all block bg-zinc-950 p-2 rounded-lg border border-zinc-800/55">{device.id}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Diagnostics Guide & Benefits</h3>
              <Settings size={16} className="text-zinc-550" />
            </div>
            <div className="space-y-4 text-xs font-mono">
              <div>
                <h4 className="text-emerald-400 font-bold text-xs">⏱️ Latency & Uptime</h4>
                <p className="text-zinc-350 mt-1 leading-relaxed text-[11px]">
                  Latency measures network lag, and Uptime measures accessibility. Lower lag speeds up load times, directly improving Google SEO rank and user retention.
                </p>
              </div>
              <div>
                <h4 className="text-indigo-400 font-bold text-xs">🔒 SSL Certificate encryption</h4>
                <p className="text-zinc-350 mt-1 leading-relaxed text-[11px]">
                  Secures connections between visitors and servers. Keeping certificates valid avoids scary browser safety warning screens that block traffic.
                </p>
              </div>
              <div>
                <h4 className="text-amber-400 font-bold text-xs">🛡️ Open Port auditing</h4>
                <p className="text-zinc-350 mt-1 leading-relaxed text-[11px]">
                  Scans exposed entrance points on your server. Keeping unused ports closed blocks potential hackers from executing raw TCP exploits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
