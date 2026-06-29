import pandas as pd
import re
import io
import math

def process_pnl_excel(file_bytes: bytes) -> dict:
    try:
        # Read the Excel file into a pandas DataFrame
        df_orig = pd.read_excel(io.BytesIO(file_bytes))
        
        # Format the dataframe exactly like the notebook
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
        
        # Clean 'Realized P&L' column
        df['Realized P&L'] = df['Realized P&L'].astype(str)
        df['Realized P&L'] = pd.to_numeric(df['Realized P&L'], errors='coerce')
        df['Realized P&L'] = df['Realized P&L'] / 1000
        
        # Apply regex extractions
        month_regex = re.compile(r'\d{2}([A-Z]{3})[0-9A-Z]+', re.IGNORECASE)
        ticker_regex = re.compile(r'^([A-Z]+)')
        fut_regex = re.compile(r'FUT$')
        CE_regex = re.compile(r'CE$')
        PE_regex = re.compile(r'PE$')
        
        df['StockTicker'] = df['Symbol'].astype(str).str.extract(ticker_regex, expand=False).fillna('UNKNOWN')
        df['Is_PE'] = df['Symbol'].astype(str).str.contains(PE_regex).astype(int)
        df['Is_CE'] = df['Symbol'].astype(str).str.contains(CE_regex).astype(int)
        df['Is_FUT'] = df['Symbol'].astype(str).str.contains(fut_regex).astype(int)
        df['OTHER'] = ((df['Is_PE'] + df['Is_CE'] + df['Is_FUT']) == 0).astype(int)
        df['ExpiryMonth'] = df['Symbol'].astype(str).str.extract(month_regex, expand=False).fillna('N/A')

        # Drop NaNs in Realized P&L for aggregation
        df = df.dropna(subset=['Realized P&L'])
        
        # 1. Total P&L Breakdown
        total_pnl = float(df['Realized P&L'].sum())
        pe_pnl = float(df[df['Is_PE'] == 1]['Realized P&L'].sum())
        ce_pnl = float(df[df['Is_CE'] == 1]['Realized P&L'].sum())
        fut_pnl = float(df[df['Is_FUT'] == 1]['Realized P&L'].sum())
        
        # 2. Total Realized P&L by Stock Ticker and Category (for the stacked bar chart)
        pnl_total = df.groupby('StockTicker')['Realized P&L'].sum()
        pnl_pe = df[df['Is_PE'] == 1].groupby('StockTicker')['Realized P&L'].sum()
        pnl_ce = df[df['Is_CE'] == 1].groupby('StockTicker')['Realized P&L'].sum()
        pnl_fut = df[df['Is_FUT'] == 1].groupby('StockTicker')['Realized P&L'].sum()
        
        pnl_combined = pd.DataFrame({
            'Total P&L': pnl_total,
            'PE P&L': pnl_pe,
            'CE P&L': pnl_ce,
            'FUT P&L': pnl_fut
        }).fillna(0).sort_values(by='Total P&L', ascending=False)
        
        # Convert to a list of dicts for frontend charts
        ticker_breakdown = []
        for ticker, row in pnl_combined.iterrows():
            ticker_breakdown.append({
                "ticker": ticker,
                "Total P&L": float(row['Total P&L']),
                "PE P&L": float(row['PE P&L']),
                "CE P&L": float(row['CE P&L']),
                "FUT P&L": float(row['FUT P&L']),
            })
            
        # 3. Monthly P&L by Ticker (for the interactive chart)
        monthly_grouped = df.groupby(['StockTicker', 'ExpiryMonth'])['Realized P&L'].sum().reset_index()
        monthly_data = []
        for _, row in monthly_grouped.iterrows():
            monthly_data.append({
                "ticker": row['StockTicker'],
                "month": row['ExpiryMonth'],
                "pnl": float(row['Realized P&L'])
            })
            
        # Cleaned numeric columns replacement for inf and nan to make valid json
        def sanitize_val(val):
            if math.isnan(val) or math.isinf(val):
                return 0.0
            return val
            
        return {
            "summary": {
                "total": sanitize_val(total_pnl),
                "pe": sanitize_val(pe_pnl),
                "ce": sanitize_val(ce_pnl),
                "fut": sanitize_val(fut_pnl)
            },
            "ticker_breakdown": ticker_breakdown,
            "monthly_data": monthly_data,
            "tickers": sorted(df['StockTicker'].unique().tolist())
        }
    except Exception as e:
        raise ValueError(f"Failed to process file: {str(e)}")
