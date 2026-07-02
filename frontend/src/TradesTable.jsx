import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const fmt = (val) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(val);

const INSTRUMENT_COLORS = {
  CE:    'var(--ce-color)',
  PE:    'var(--pe-color)',
  FUT:   'var(--fut-color)',
  EQ:    'var(--eq-color)',
  Other: 'var(--text-secondary)',
};

const SortIcon = ({ col, sortConfig }) => {
  if (sortConfig.key !== col)
    return <ChevronsUpDown size={13} style={{ opacity: 0.35 }} />;
  return sortConfig.dir === 'asc'
    ? <ChevronUp size={13} />
    : <ChevronDown size={13} />;
};

export default function TradesTable({ trades, months, onTickerClick }) {
  const [monthFilter, setMonthFilter]   = useState('All');
  const [typeFilter, setTypeFilter]     = useState('All');
  const [tickerFilter, setTickerFilter] = useState('');
  const [sortConfig, setSortConfig]     = useState({ key: 'pnl', dir: 'desc' });
  const [page, setPage]                 = useState(0);
  const PAGE_SIZE = 15;

  // Unique instrument types present in the data
  const instrTypes = useMemo(() => {
    const set = new Set(trades.map((t) => t.instrument_type));
    return ['All', ...Array.from(set).sort()];
  }, [trades]);

  // Apply filters
  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (monthFilter !== 'All' && t.month !== monthFilter) return false;
      if (typeFilter  !== 'All' && t.instrument_type !== typeFilter) return false;
      if (tickerFilter && !t.ticker.toLowerCase().includes(tickerFilter.toLowerCase())) return false;
      return true;
    });
  }, [trades, monthFilter, typeFilter, tickerFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortConfig.key];
      const bv = b[sortConfig.key];
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortConfig.dir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortConfig]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated  = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' }
    );
    setPage(0);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const cols = [
    { key: 'symbol',          label: 'Symbol',      numeric: false },
    { key: 'ticker',          label: 'Ticker',       numeric: false },
    { key: 'month',           label: 'Month',        numeric: false },
    { key: 'instrument_type', label: 'Type',         numeric: false },
    { key: 'quantity',        label: 'Qty',          numeric: true  },
    { key: 'buy_value',       label: 'Buy Value',    numeric: true  },
    { key: 'sell_value',      label: 'Sell Value',   numeric: true  },
    { key: 'pnl',             label: 'P&L',          numeric: true  },
    { key: 'pnl_pct',         label: 'P&L %',        numeric: true  },
  ];

  return (
    <div className="trades-section">
      {/* Header + filters */}
      <div className="trades-header">
        <h3 className="trades-title">All Trades</h3>
        <div className="trades-filters">
          <input
            className="trades-search"
            placeholder="Search ticker…"
            value={tickerFilter}
            onChange={handleFilterChange(setTickerFilter)}
          />
          <div className="select-wrapper">
            <select
              className="clean-select"
              value={monthFilter}
              onChange={handleFilterChange(setMonthFilter)}
            >
              <option value="All">All Months</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="select-wrapper">
            <select
              className="clean-select"
              value={typeFilter}
              onChange={handleFilterChange(setTypeFilter)}
            >
              {instrTypes.map((t) => (
                <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>
          </div>
          <span className="trades-count">
            {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="trades-table-wrapper">
        <table className="trades-table">
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c.key}
                  className={`th-cell ${c.numeric ? 'th-right' : ''}`}
                  onClick={() => toggleSort(c.key)}
                >
                  <span className="th-inner">
                    {c.label}
                    <SortIcon col={c.key} sortConfig={sortConfig} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="td-empty">
                  No trades match the current filters
                </td>
              </tr>
            ) : (
              paginated.map((t, i) => (
                <tr key={i} className="tr-row">
                  <td className="td-cell td-symbol">{t.symbol}</td>
                  <td
                    className="td-cell td-ticker"
                    onClick={() => onTickerClick && onTickerClick(t.ticker)}
                    title={`Drill into ${t.ticker}`}
                  >
                    {t.ticker}
                  </td>
                  <td className="td-cell">{t.month}</td>
                  <td className="td-cell">
                    <span
                      className="badge"
                      style={{ background: INSTRUMENT_COLORS[t.instrument_type] || 'var(--text-secondary)' }}
                    >
                      {t.instrument_type}
                    </span>
                  </td>
                  <td className="td-cell td-right">{fmt(t.quantity)}</td>
                  <td className="td-cell td-right">{fmt(t.buy_value)}</td>
                  <td className="td-cell td-right">{fmt(t.sell_value)}</td>
                  <td className={`td-cell td-right td-pnl ${t.pnl >= 0 ? 'val-positive' : 'val-negative'}`}>
                    {t.pnl >= 0 ? '+' : ''}{fmt(t.pnl)}
                  </td>
                  <td className={`td-cell td-right ${t.pnl_pct >= 0 ? 'val-positive' : 'val-negative'}`}>
                    {t.pnl_pct >= 0 ? '+' : ''}{fmt(t.pnl_pct)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="trades-pagination">
          <button
            className="page-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹ Prev
          </button>
          <span className="page-info">
            Page {page + 1} / {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
