import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface HistogramChartProps {
  histogram: number[];
  title?: string;
  className?: string;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  histogram,
  title = 'Pixel Luminance Distribution (0-255)',
  className = '',
}) => {
  if (!histogram || histogram.length === 0) {
    return (
      <div className={`p-4 bg-bio-950 rounded-lg border border-bio-800 text-center text-xs text-slate-500 ${className}`}>
        No histogram data available.
      </div>
    );
  }

  // Downsample 256 bins to 64 buckets for crisp rendering
  const bucketSize = 4;
  const chartData = [];
  for (let i = 0; i < 256; i += bucketSize) {
    let sum = 0;
    for (let j = 0; j < bucketSize && i + j < histogram.length; j++) {
      sum += histogram[i + j];
    }
    chartData.push({
      intensity: `${i}-${i + bucketSize - 1}`,
      count: Math.round(sum / bucketSize),
    });
  }

  return (
    <div className={`bg-bio-950 rounded-xl p-3 border border-bio-800/80 ${className}`}>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-medium text-slate-300">{title}</span>
        <span className="text-[10px] font-mono text-cyan-400">256 Bins &bull; 8-bit Depth</span>
      </div>

      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="intensity"
              stroke="#334155"
              tick={{ fontSize: 9, fill: '#64748b' }}
              interval={15}
            />
            <YAxis
              stroke="#334155"
              tick={{ fontSize: 9, fill: '#64748b' }}
              tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-bio-900 border border-bio-700 p-2 rounded shadow-lg text-[11px] font-mono">
                      <p className="text-slate-300">Level: {payload[0].payload.intensity}</p>
                      <p className="text-cyan-400 font-semibold">Pixels: {payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#06b6d4"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#histGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
        <span>0 (Deep Nuclei / Shadows)</span>
        <span>128 (Cytoplasm / Stroma)</span>
        <span>255 (Glass Slide Background)</span>
      </div>
    </div>
  );
};
