# Changelog

All notable changes to the P&L Visualizer project are documented here.

---

## [v1.1.0] — 2026-07-02 · Notebook Feature Parity

This release ports all analytical functionality from the original Jupyter notebook
(`ref/Realised_P&L_by_ticker_Good.ipynb`) into the live web application.

### 🆕 New Files

| File | Description |
|---|---|
| `frontend/src/TradesTable.jsx` | New React component — sortable, filterable, paginated trades table |
| `docs/project_report.md` | Full project documentation (architecture, stack, API, pipeline) |
| `docs/installation.md` | Step-by-step setup guide with troubleshooting |
| `docs/changelog.md` | This file |
| `README.md` | Root-level project overview with links to docs |

---

### 🔧 Modified Files

#### `backend/processor.py`
**What changed:**
- Added extraction and cleaning of `Buy Value`, `Sell Value`, `Quantity`, and `Realized P&L Pct.` columns from the Excel sheet.
- Added `InstrumentType` label per trade (`CE` / `PE` / `FUT` / `EQ`) derived from the Symbol regex flags.
- Added **`raw_trades`** to the API response — a list of every individual trade row with the following fields:
  ```
  symbol, ticker, month, instrument_type,
  quantity, buy_value, sell_value, pnl, pnl_pct
  ```
- Added **`months`** to the API response — a calendar-sorted list of unique expiry months (e.g. `["JAN", "FEB", "MAR"]`) for use in filter dropdowns.
- Improved `sanitize_val()` helper to handle non-float types gracefully.
- Hardened column access to handle missing optional columns without crashing.

**Before:** Returned only `summary`, `ticker_breakdown`, `monthly_data`, `tickers`.  
**After:** Returns all of the above **plus** `raw_trades` and `months`.

---

#### `frontend/src/Dashboard.jsx`
**What changed:**

1. **All-Tickers Monthly Chart (Feature C)**
   - Added a toggle switch labelled "All Tickers" in the Monthly Trend chart header.
   - When toggled ON: renders a stacked bar chart of **all tickers across all months**, colour-coded per ticker using a 10-colour palette.
   - When toggled OFF (default): shows the existing single-ticker dropdown chart.

2. **Click-to-Drill-Down on Stacked Bar Chart (Feature B)**
   - The P&L Breakdown by Ticker chart is now clickable.
   - Clicking any bar triggers a **slide-in side panel** for that ticker.
   - A `"Click a bar to drill in"` hint label was added to the chart header.

3. **Ticker Drill-Down Side Panel (Feature B)**
   - Slides in from the right with a blurred backdrop overlay.
   - Panel contents:
     - **Header** — Ticker name + "Trade detail" subtitle + close (✕) button.
     - **Summary metrics** — Total P&L, Trade Count, Wins / Losses.
     - **Mini monthly bar chart** — Recharts bar chart for just that ticker's monthly breakdown.
     - **All Trades list** — Every trade for that ticker showing symbol, instrument badge, month, and P&L.
   - Can also be triggered from clicking a ticker name in the Trades Table.
   - Dismisses by clicking the backdrop or the close button.

4. **Trades Table integration**
   - Renders `<TradesTable>` below the charts when `raw_trades` data is present.
   - Passes `months`, `raw_trades`, and `onTickerClick` handler.

---

#### `frontend/src/TradesTable.jsx` *(new)*
Full-featured trades data table component:

| Feature | Details |
|---|---|
| **Columns** | Symbol, Ticker, Month, Type, Qty, Buy Value, Sell Value, P&L, P&L % |
| **Sorting** | Click any column header to sort ascending/descending; sort icon indicates active direction |
| **Filter — Month** | Dropdown to filter by expiry month (calendar-sorted); defaults to "All Months" |
| **Filter — Type** | Dropdown to filter by instrument type (CE / PE / FUT / EQ / All) |
| **Filter — Ticker** | Live text search input |
| **Pagination** | 15 rows per page with Prev / Next controls and page indicator |
| **Ticker Drill-Down** | Clicking a ticker name in the table opens the side panel |
| **Instrument badges** | Colour-coded pill badges: 🟢 CE, 🔴 PE, 🔵 FUT, 🟡 EQ |
| **P&L colouring** | Green for profit, red for loss |

---

#### `frontend/src/index.css`
**What was added (appended):**

- `--ce-color`, `--pe-color`, `--fut-color`, `--eq-color` — CSS custom property tokens for instrument type colours.
- `.chart-hint` — Small italic hint label shown in chart headers.
- `.chart-empty` — Centred empty-state message for charts with no data.
- `.chart-header-controls` — Flex row for toggle + dropdown in chart headers.
- `.toggle-label`, `.toggle-switch`, `.toggle-knob`, `.toggle-on` — Full animated toggle switch component styles.
- `.badge` — Pill badge with colour fill, used for instrument type labels.
- `.trades-section`, `.trades-header`, `.trades-title`, `.trades-filters` — Trades table card layout.
- `.trades-search` — Ticker search input field.
- `.trades-count` — Small grey count label.
- `.trades-table-wrapper`, `.trades-table` — Scrollable table container.
- `.th-cell`, `.th-right`, `.th-inner` — Sortable column header styles.
- `.tr-row`, `.td-cell`, `.td-right` — Table row and cell styles.
- `.td-symbol` — Monospaced, muted, truncated symbol text.
- `.td-ticker` — Underlined, accent-coloured, clickable ticker cell.
- `.td-pnl` — Bold P&L cell.
- `.td-empty` — Centred empty-state row.
- `.trades-pagination`, `.page-btn`, `.page-info` — Pagination bar styles.
- `.panel-backdrop` — Fixed blurred dark overlay behind the panel.
- `.panel` — Slide-in side panel container (fixed, right edge, animated).
- `.panel-header`, `.panel-title`, `.panel-subtitle`, `.panel-close` — Panel header row.
- `.panel-summary`, `.panel-stat`, `.panel-stat-label`, `.panel-stat-value` — 3-column metrics strip.
- `.panel-chart-label`, `.panel-chart` — Mini chart label + container.
- `.panel-trades-label`, `.panel-trades` — Trades list section within panel.
- `.panel-trade-row`, `.panel-trade-left`, `.panel-trade-symbol`, `.panel-trade-month`, `.panel-trade-pnl` — Individual trade row in panel.
- `@keyframes slideIn`, `@keyframes fadeIn` — Panel open animations.
- `.dashboard-container` — Bottom padding for the dashboard page.

---

## [v1.0.0] — 2026-07-02 · Initial Release

### Features
- FastAPI backend that accepts Zerodha `.xlsx` P&L export files.
- Regex-based parser extracts stock tickers, expiry months, and instrument type flags (CE/PE/FUT).
- REST API endpoint `POST /api/upload` returns aggregated JSON.
- React + Vite frontend with drag-and-drop file upload.
- Summary metric cards (Total / PE / CE / FUT P&L).
- Stacked bar chart — P&L by ticker (PE / CE / FUT split).
- Monthly trend bar chart — filterable per ticker via dropdown.
- Dark/Light mode toggle with CSS variable-based theming.
- CORS configured for local and deployed environments.

### Stack
- **Backend:** FastAPI 0.110, Uvicorn 0.28, Pandas 2.2.1, Openpyxl 3.1.2
- **Frontend:** React 18, Vite, Recharts, Lucide React, Axios, Vanilla CSS
