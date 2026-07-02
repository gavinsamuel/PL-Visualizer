import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts';

// ── Formatting ────────────────────────────────────────────────────────────────
const fmt = (val) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(val);

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="label" style={{ marginBottom: '0.5rem', fontWeight: 700 }}>{label}</p>
      {payload.map((entry, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1.5rem',
            margin: '3px 0',
            fontSize: '0.8rem',
          }}
        >
          <span style={{ color: entry.fill, fontWeight: 600 }}>{entry.name}:</span>
          <span style={{ fontWeight: 700 }}>{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Custom bar value label — handles +/−/0 without overlapping ────────────────
const BarLabel = (props) => {
  const { x, y, width, height, value } = props;
  if (value === undefined || value === null) return null;

  const display = fmt(value);
  const FONT_SIZE = 8;
  const PAD = 3;

  let ty, anchor;
  if (value > 0) {
    ty = y - PAD;
    anchor = 'end'; // recharts uses dominantBaseline, we'll use textAnchor for x
  } else if (value < 0) {
    ty = y + height + PAD + FONT_SIZE;
    anchor = 'start';
  } else {
    // zero — show just above the baseline
    ty = y - PAD;
    anchor = 'end';
  }

  return (
    <text
      x={x + width / 2}
      y={ty}
      textAnchor="middle"
      fontSize={FONT_SIZE}
      fontFamily="Inter, system-ui, sans-serif"
      fill={value >= 0 ? '#10b981' : '#ef4444'}
      fontWeight={600}
    >
      {display}
    </text>
  );
};

// ── Bar colour definitions ─────────────────────────────────────────────────────
const BAR_DEFS = [
  { key: 'Total P&L', color: '#818cf8', label: 'Total P&L' },
  { key: 'PE P&L',    color: '#ef4444', label: 'PE P&L'    },
  { key: 'CE P&L',    color: '#10b981', label: 'CE P&L'    },
  { key: 'FUT P&L',   color: '#3b82f6', label: 'FUT P&L'   },
];

// ── Single chart panel ────────────────────────────────────────────────────────
function GroupChart({ data, title, theme }) {
  const gridColor  = theme === 'dark' ? '#374151' : '#e5e7eb';
  const textColor  = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const cursorFill = theme === 'dark' ? '#1f2937' : '#f3f4f6';

  // Dynamic bar size: fewer tickers → wider bars, more tickers → narrower
  const barSize = Math.max(6, Math.min(20, Math.floor(200 / (data.length * BAR_DEFS.length))));

  return (
    <div className="grouped-chart-card">
      <div className="grouped-chart-title">{title}</div>
      <div className="grouped-chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 28, right: 16, left: 0, bottom: 70 }}
            barCategoryGap="25%"
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="ticker"
              stroke={textColor}
              angle={-45}
              textAnchor="end"
              tick={{ fill: textColor, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              interval={0}
            />
            <YAxis
              stroke={textColor}
              tickFormatter={(v) => fmt(v)}
              tick={{ fill: textColor, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              width={60}
            />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{ fill: cursorFill, opacity: 0.5 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }}
              iconType="circle"
            />
            {BAR_DEFS.map(({ key, color }) => (
              <Bar
                key={key}
                dataKey={key}
                fill={color}
                maxBarSize={barSize}
                radius={[3, 3, 0, 0]}
              >
                <LabelList content={<BarLabel />} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function GroupedBreakdown({ ticker_breakdown, theme }) {
  if (!ticker_breakdown?.length) return null;

  // Sort alphabetically by ticker name (matches notebook behaviour)
  const sorted = [...ticker_breakdown].sort((a, b) =>
    a.ticker.localeCompare(b.ticker)
  );

  // Split at midpoint (matches notebook: mid_point = len(sorted_tickers) // 2)
  const mid = Math.ceil(sorted.length / 2);
  const group1 = sorted.slice(0, mid);
  const group2 = sorted.slice(mid);

  // Determine label ranges for the section headings
  const g1Start = group1[0]?.ticker[0] ?? 'A';
  const g1End   = group1[group1.length - 1]?.ticker[0] ?? 'M';
  const g2Start = group2[0]?.ticker[0] ?? 'M';
  const g2End   = group2[group2.length - 1]?.ticker[0] ?? 'Z';

  const title1 = `Realized P&L by Ticker — Group 1 (${g1Start}–${g1End})`;
  const title2 = group2.length
    ? `Realized P&L by Ticker — Group 2 (${g2Start}–${g2End})`
    : null;

  return (
    <div className="grouped-breakdown-section">
      <div className="grouped-breakdown-header">
        <h3 className="grouped-breakdown-title">Detailed P&L Breakdown</h3>
        <span className="grouped-breakdown-subtitle">
          Tickers split alphabetically · Total / PE / CE / FUT per ticker · values shown on every bar
        </span>
      </div>

      <div className="grouped-breakdown-grid">
        <GroupChart data={group1} title={title1} theme={theme} />
        {group2.length > 0 && (
          <GroupChart data={group2} title={title2} theme={theme} />
        )}
      </div>
    </div>
  );
}
