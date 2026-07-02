import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { ChevronDown, X } from 'lucide-react';
import TradesTable from './TradesTable';
import GroupedBreakdown from './GroupedBreakdown';

// ── Formatters ────────────────────────────────────────────────────────────────
const formatCurrency = (value) => {
  if (value === 0) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value);
};

// ── Custom recharts tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        {payload.map((entry, index) => (
          <div
            key={index}
            style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', margin: '4px 0', fontSize: '0.875rem' }}
          >
            <span style={{ color: entry.color || entry.fill, fontWeight: 500 }}>{entry.name}:</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Palette for All-Tickers view — cycles through a set of vivid colours
const TICKER_PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899',
  '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16',
];

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ data, theme }) {
  const { summary, ticker_breakdown, monthly_data, tickers, months = [], raw_trades = [] } = data;

  // Monthly trend state
  const [selectedTicker, setSelectedTicker] = useState(tickers[0] || '');
  const [allTickersMode, setAllTickersMode]  = useState(false);

  // Drill-down side panel
  const [panelTicker, setPanelTicker] = useState(null);

  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const textColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const cursorFill = theme === 'dark' ? '#374151' : '#f3f4f6';

  // ── Data derivations ────────────────────────────────────────────────────────
  const filteredMonthlyData = useMemo(
    () => monthly_data.filter((d) => d.ticker === selectedTicker),
    [monthly_data, selectedTicker]
  );

  // For all-tickers view: group monthly_data by month, pivot tickers into keys
  const allTickersChartData = useMemo(() => {
    const byMonth = {};
    monthly_data.forEach(({ ticker, month, pnl }) => {
      if (!byMonth[month]) byMonth[month] = { month };
      byMonth[month][ticker] = (byMonth[month][ticker] || 0) + pnl;
    });
    // Sort calendar order
    const monthOrder = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return Object.values(byMonth).sort(
      (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
    );
  }, [monthly_data]);

  // Drill-down: trades for selected ticker
  const panelTrades = useMemo(
    () => (panelTicker ? raw_trades.filter((t) => t.ticker === panelTicker) : []),
    [raw_trades, panelTicker]
  );
  const panelSummary = useMemo(() => {
    if (!panelTrades.length) return null;
    const total = panelTrades.reduce((s, t) => s + t.pnl, 0);
    const wins  = panelTrades.filter((t) => t.pnl > 0).length;
    const losses = panelTrades.filter((t) => t.pnl < 0).length;
    return { total, wins, losses, count: panelTrades.length };
  }, [panelTrades]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleBarClick = (data) => {
    if (data && data.activeLabel) setPanelTicker(data.activeLabel);
  };

  const handleTickerClick = (ticker) => {
    setPanelTicker(ticker);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="dashboard-container">

        {/* ── Summary Cards ─────────────────────────────────────────────────── */}
        <div className="dashboard-grid">
          {[
            { label: 'Total Realized P&L', val: summary.total },
            { label: 'PE Options P&L',     val: summary.pe    },
            { label: 'CE Options P&L',     val: summary.ce    },
            { label: 'Futures P&L',        val: summary.fut   },
          ].map(({ label, val }) => (
            <div className="card" key={label}>
              <div className="card-title">{label}</div>
              <div className={`card-value ${val >= 0 ? 'val-positive' : 'val-negative'}`}>
                {val >= 0 ? '+' : ''}{formatCurrency(val)}
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts Grid ───────────────────────────────────────────────────── */}
        <div className="charts-grid">

          {/* Stacked P&L by Ticker */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>P&L Breakdown by Ticker</h3>
              <span className="chart-hint">Click a bar to drill in</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ticker_breakdown}
                  margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                  onClick={handleBarClick}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="ticker"
                    stroke={textColor}
                    angle={-45}
                    textAnchor="end"
                    tick={{ fill: textColor, fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: gridColor }}
                    interval={0}
                  />
                  <YAxis
                    stroke={textColor}
                    tickFormatter={formatCurrency}
                    tick={{ fill: textColor, fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: gridColor }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: cursorFill }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  <Bar dataKey="PE P&L"  stackId="a" fill="#ef4444" maxBarSize={40} />
                  <Bar dataKey="CE P&L"  stackId="a" fill="#10b981" maxBarSize={40} />
                  <Bar dataKey="FUT P&L" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trend — single ticker OR all tickers */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Monthly Trend</h3>
              <div className="chart-header-controls">
                {/* All-tickers toggle */}
                <label className="toggle-label">
                  <span className="toggle-text">All Tickers</span>
                  <div
                    className={`toggle-switch ${allTickersMode ? 'toggle-on' : ''}`}
                    onClick={() => setAllTickersMode((v) => !v)}
                  >
                    <div className="toggle-knob" />
                  </div>
                </label>

                {/* Single-ticker dropdown — hidden when all-tickers mode is on */}
                {!allTickersMode && (
                  <div className="select-wrapper">
                    <select
                      className="clean-select"
                      value={selectedTicker}
                      onChange={(e) => setSelectedTicker(e.target.value)}
                    >
                      {tickers.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="chevron" />
                  </div>
                )}
              </div>
            </div>

            <div className="chart-wrapper">
              {allTickersMode ? (
                /* All tickers stacked by month */
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={allTickersChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke={textColor}
                      tick={{ fill: textColor, fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: gridColor }}
                    />
                    <YAxis
                      stroke={textColor}
                      tickFormatter={formatCurrency}
                      tick={{ fill: textColor, fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: gridColor }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: cursorFill }} />
                    <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} iconType="circle" />
                    {tickers.map((ticker, i) => (
                      <Bar
                        key={ticker}
                        dataKey={ticker}
                        stackId="a"
                        fill={TICKER_PALETTE[i % TICKER_PALETTE.length]}
                        radius={i === tickers.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        maxBarSize={50}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : filteredMonthlyData.length > 0 ? (
                /* Single ticker */
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredMonthlyData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke={textColor}
                      tick={{ fill: textColor, fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: gridColor }}
                    />
                    <YAxis
                      stroke={textColor}
                      tickFormatter={formatCurrency}
                      tick={{ fill: textColor, fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: gridColor }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="pnl" name="Realized P&L" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {filteredMonthlyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  No monthly data for {selectedTicker}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Grouped P&L Breakdown (notebook-style) ────────────────────── */}
        <GroupedBreakdown
          ticker_breakdown={ticker_breakdown}
          theme={theme}
        />

        {/* ── Trades Table ─────────────────────────────────────────────────── */}
        {raw_trades.length > 0 && (
          <TradesTable
            trades={raw_trades}
            months={months}
            onTickerClick={handleTickerClick}
          />
        )}
      </div>

      {/* ── Ticker Drill-Down Side Panel ─────────────────────────────────────── */}
      {panelTicker && (
        <>
          <div className="panel-backdrop" onClick={() => setPanelTicker(null)} />
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">{panelTicker}</h2>
                <p className="panel-subtitle">Trade detail</p>
              </div>
              <button className="panel-close" onClick={() => setPanelTicker(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Panel summary metrics */}
            {panelSummary && (
              <div className="panel-summary">
                <div className="panel-stat">
                  <span className="panel-stat-label">Total P&L</span>
                  <span className={`panel-stat-value ${panelSummary.total >= 0 ? 'val-positive' : 'val-negative'}`}>
                    {panelSummary.total >= 0 ? '+' : ''}{formatCurrency(panelSummary.total)}
                  </span>
                </div>
                <div className="panel-stat">
                  <span className="panel-stat-label">Trades</span>
                  <span className="panel-stat-value">{panelSummary.count}</span>
                </div>
                <div className="panel-stat">
                  <span className="panel-stat-label">Wins / Losses</span>
                  <span className="panel-stat-value">
                    <span className="val-positive">{panelSummary.wins}W</span>
                    {' / '}
                    <span className="val-negative">{panelSummary.losses}L</span>
                  </span>
                </div>
              </div>
            )}

            {/* Panel monthly mini-chart */}
            <div className="panel-chart-label">Monthly P&L</div>
            <div className="panel-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthly_data.filter((d) => d.ticker === panelTicker)}
                  margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: textColor, fontSize: 11 }} tickFormatter={formatCurrency} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="pnl" name="P&L" radius={[3, 3, 0, 0]} maxBarSize={40}>
                    {monthly_data
                      .filter((d) => d.ticker === panelTicker)
                      .map((entry, index) => (
                        <Cell key={`pc-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Panel trades list */}
            <div className="panel-trades-label">All Trades</div>
            <div className="panel-trades">
              {panelTrades.map((t, i) => (
                <div key={i} className="panel-trade-row">
                  <div className="panel-trade-left">
                    <span className="panel-trade-symbol">{t.symbol}</span>
                    <span className="badge" style={{ marginLeft: 8 }}>{t.instrument_type}</span>
                    <span className="panel-trade-month">{t.month}</span>
                  </div>
                  <div className={`panel-trade-pnl ${t.pnl >= 0 ? 'val-positive' : 'val-negative'}`}>
                    {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
