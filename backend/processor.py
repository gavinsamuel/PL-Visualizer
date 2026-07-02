import pandas as pd
import re
import io
import math


def sanitize_val(val):
    """Replace NaN/Inf floats with 0.0 for JSON safety."""
    try:
        if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
            return 0.0
    except Exception:
        pass
    return val


def process_pnl_excel(file_bytes: bytes) -> dict:
    try:
        # Read the Excel file into a pandas DataFrame
        df_orig = pd.read_excel(io.BytesIO(file_bytes))

        # Format the dataframe exactly like the notebook
        # Skip the first 36 rows of metadata; row 37 is the header
        df_orig = df_orig.iloc[36:, 1:].copy()
        df_orig.reset_index(drop=True, inplace=True)

        header = df_orig.iloc[0]
        df = df_orig[1:].copy()
        df.columns = header

        # Handle index column naming depending on if it exists
        if 36 in df.columns:
            df.rename(columns={36: 'Index'}, inplace=True)
        elif 'Unnamed: 36' in df.columns:
            df.rename(columns={'Unnamed: 36': 'Index'}, inplace=True)

        df.reset_index(drop=True, inplace=True)

        # ── Numeric column cleaning ─────────────────────────────────────────
        # 'Realized P&L' is mandatory
        df['Realized P&L'] = pd.to_numeric(
            df['Realized P&L'].astype(str).str.replace(',', ''), errors='coerce'
        )
        df['Realized P&L'] = df['Realized P&L'] / 1000

        # Optional columns — coerce safely
        def safe_numeric(series):
            return pd.to_numeric(series.astype(str).str.replace(',', ''), errors='coerce').fillna(0.0)

        buy_values  = safe_numeric(df['Buy Value'])  if 'Buy Value'  in df.columns else pd.Series([0.0] * len(df))
        sell_values = safe_numeric(df['Sell Value']) if 'Sell Value' in df.columns else pd.Series([0.0] * len(df))
        quantities  = safe_numeric(df['Quantity'])   if 'Quantity'   in df.columns else pd.Series([0.0] * len(df))

        # P&L % — Zerodha exports it as "Realized P&L Pct." 
        pnl_pct_col = next(
            (c for c in df.columns if 'pct' in str(c).lower() or '%' in str(c)),
            None
        )
        pnl_pcts = safe_numeric(df[pnl_pct_col]) if pnl_pct_col else pd.Series([0.0] * len(df))

        df['_buy_value']  = buy_values.values
        df['_sell_value'] = sell_values.values
        df['_quantity']   = quantities.values
        df['_pnl_pct']    = pnl_pcts.values

        # ── Regex extractions ───────────────────────────────────────────────
        month_regex  = re.compile(r'\d{2}([A-Z]{3})[0-9A-Z]+', re.IGNORECASE)
        ticker_regex = re.compile(r'^([A-Z]+)')
        fut_regex    = re.compile(r'FUT$')
        CE_regex     = re.compile(r'CE$')
        PE_regex     = re.compile(r'PE$')

        df['StockTicker']  = df['Symbol'].astype(str).str.extract(ticker_regex, expand=False).fillna('UNKNOWN')
        df['Is_PE']        = df['Symbol'].astype(str).str.contains(PE_regex).astype(int)
        df['Is_CE']        = df['Symbol'].astype(str).str.contains(CE_regex).astype(int)
        df['Is_FUT']       = df['Symbol'].astype(str).str.contains(fut_regex).astype(int)
        df['OTHER']        = ((df['Is_PE'] + df['Is_CE'] + df['Is_FUT']) == 0).astype(int)
        df['ExpiryMonth']  = df['Symbol'].astype(str).str.extract(month_regex, expand=False).fillna('N/A')

        # Instrument type label
        def get_instr_type(row):
            if row['Is_PE']:  return 'PE'
            if row['Is_CE']:  return 'CE'
            if row['Is_FUT']: return 'FUT'
            return 'EQ'
        df['InstrumentType'] = df.apply(get_instr_type, axis=1)

        # Drop rows with no P&L value (sub-total / blank rows in broker sheets)
        df = df.dropna(subset=['Realized P&L'])

        # ── 1. Summary totals ───────────────────────────────────────────────
        total_pnl = float(df['Realized P&L'].sum())
        pe_pnl    = float(df[df['Is_PE']  == 1]['Realized P&L'].sum())
        ce_pnl    = float(df[df['Is_CE']  == 1]['Realized P&L'].sum())
        fut_pnl   = float(df[df['Is_FUT'] == 1]['Realized P&L'].sum())

        # ── 2. Stacked bar — P&L by Ticker (PE / CE / FUT split) ───────────
        pnl_total = df.groupby('StockTicker')['Realized P&L'].sum()
        pnl_pe    = df[df['Is_PE']  == 1].groupby('StockTicker')['Realized P&L'].sum()
        pnl_ce    = df[df['Is_CE']  == 1].groupby('StockTicker')['Realized P&L'].sum()
        pnl_fut   = df[df['Is_FUT'] == 1].groupby('StockTicker')['Realized P&L'].sum()

        pnl_combined = pd.DataFrame({
            'Total P&L': pnl_total,
            'PE P&L':    pnl_pe,
            'CE P&L':    pnl_ce,
            'FUT P&L':   pnl_fut,
        }).fillna(0).sort_values(by='Total P&L', ascending=False)

        ticker_breakdown = []
        for ticker, row in pnl_combined.iterrows():
            ticker_breakdown.append({
                "ticker":      ticker,
                "Total P&L":   float(row['Total P&L']),
                "PE P&L":      float(row['PE P&L']),
                "CE P&L":      float(row['CE P&L']),
                "FUT P&L":     float(row['FUT P&L']),
            })

        # ── 3. Monthly P&L by Ticker (single-ticker trend chart) ───────────
        monthly_grouped = (
            df.groupby(['StockTicker', 'ExpiryMonth'])['Realized P&L']
            .sum()
            .reset_index()
        )
        monthly_data = [
            {
                "ticker": row['StockTicker'],
                "month":  row['ExpiryMonth'],
                "pnl":    sanitize_val(float(row['Realized P&L'])),
            }
            for _, row in monthly_grouped.iterrows()
        ]

        # ── 4. Raw trades (for trades table + drill-down panel) ─────────────
        raw_trades = [
            {
                "symbol":          str(row['Symbol']),
                "ticker":          str(row['StockTicker']),
                "month":           str(row['ExpiryMonth']),
                "instrument_type": str(row['InstrumentType']),
                "quantity":        sanitize_val(float(row['_quantity'])),
                "buy_value":       sanitize_val(float(row['_buy_value'])),
                "sell_value":      sanitize_val(float(row['_sell_value'])),
                "pnl":             sanitize_val(float(row['Realized P&L'])),
                "pnl_pct":         sanitize_val(float(row['_pnl_pct'])),
            }
            for _, row in df.iterrows()
        ]

        # ── 5. Sorted months list for filter dropdown ───────────────────────
        month_order = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
        all_months = df['ExpiryMonth'].unique().tolist()
        sorted_months = (
            [m for m in month_order if m in all_months] +
            [m for m in all_months if m not in month_order]
        )

        return {
            "summary": {
                "total": sanitize_val(total_pnl),
                "pe":    sanitize_val(pe_pnl),
                "ce":    sanitize_val(ce_pnl),
                "fut":   sanitize_val(fut_pnl),
            },
            "ticker_breakdown": ticker_breakdown,
            "monthly_data":     monthly_data,
            "tickers":          sorted(df['StockTicker'].unique().tolist()),
            "months":           sorted_months,
            "raw_trades":       raw_trades,
        }

    except Exception as e:
        raise ValueError(f"Failed to process file: {str(e)}")
