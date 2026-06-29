import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { ChevronDown } from 'lucide-react';

// Custom formatter for currency/numbers
const formatCurrency = (value) => {
  if (value === 0) return "0";
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', margin: '4px 0', fontSize: '0.875rem' }}>
            <span style={{ color: entry.color || entry.fill, fontWeight: 500 }}>{entry.name}:</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard({ data, theme }) {
  const { summary, ticker_breakdown, monthly_data, tickers } = data;
  const [selectedTicker, setSelectedTicker] = useState(tickers[0] || "");

  // Filter monthly data for the selected ticker
  const filteredMonthlyData = monthly_data.filter(d => d.ticker === selectedTicker);

  // Dynamic colors for charts based on theme
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const textColor = theme === 'dark' ? '#9ca3af' : '#6b7280';

  return (
    <div className="dashboard-container">
      {/* Summary Cards */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">Total Realized P&L</div>
          <div className={`card-value ${summary.total >= 0 ? 'val-positive' : 'val-negative'}`}>
            {summary.total >= 0 ? '+' : ''}{formatCurrency(summary.total)}
          </div>
        </div>
        <div className="card">
          <div className="card-title">PE Options P&L</div>
          <div className={`card-value ${summary.pe >= 0 ? 'val-positive' : 'val-negative'}`}>
            {summary.pe >= 0 ? '+' : ''}{formatCurrency(summary.pe)}
          </div>
        </div>
        <div className="card">
          <div className="card-title">CE Options P&L</div>
          <div className={`card-value ${summary.ce >= 0 ? 'val-positive' : 'val-negative'}`}>
            {summary.ce >= 0 ? '+' : ''}{formatCurrency(summary.ce)}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Futures P&L</div>
          <div className={`card-value ${summary.fut >= 0 ? 'val-positive' : 'val-negative'}`}>
            {summary.fut >= 0 ? '+' : ''}{formatCurrency(summary.fut)}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Main Stacked Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>P&L Breakdown by Ticker</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticker_breakdown} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis 
                  dataKey="ticker" 
                  stroke={textColor}
                  angle={-45}
                  textAnchor="end"
                  tick={{fill: textColor, fontSize: 12}}
                  tickLine={false}
                  axisLine={{stroke: gridColor}}
                  interval={0}
                />
                <YAxis 
                  stroke={textColor}
                  tickFormatter={formatCurrency}
                  tick={{fill: textColor, fontSize: 12}}
                  tickLine={false}
                  axisLine={{stroke: gridColor}}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: theme === 'dark' ? '#374151' : '#f3f4f6'}} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }} 
                  iconType="circle"
                />
                <Bar dataKey="PE P&L" stackId="a" fill="#ef4444" maxBarSize={40} />
                <Bar dataKey="CE P&L" stackId="a" fill="#10b981" maxBarSize={40} />
                <Bar dataKey="FUT P&L" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Monthly Trend</h3>
            <div className="select-wrapper">
              <select 
                className="clean-select"
                value={selectedTicker} 
                onChange={(e) => setSelectedTicker(e.target.value)}
              >
                {tickers.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown size={14} className="chevron" />
            </div>
          </div>
          <div className="chart-wrapper">
            {filteredMonthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke={textColor}
                    tick={{fill: textColor, fontSize: 12}}
                    tickLine={false}
                    axisLine={{stroke: gridColor}}
                  />
                  <YAxis 
                    stroke={textColor}
                    tickFormatter={formatCurrency}
                    tick={{fill: textColor, fontSize: 12}}
                    tickLine={false}
                    axisLine={{stroke: gridColor}}
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{fill: theme === 'dark' ? '#374151' : '#f3f4f6'}} />
                  <Bar dataKey="pnl" name="Realized P&L" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {
                      filteredMonthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No monthly data available for {selectedTicker}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
