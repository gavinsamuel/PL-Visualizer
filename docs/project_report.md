# P&L Stock Visualizer & Analytics Dashboard

An interactive, responsive web application designed to parse, aggregate, and visualize realized Profit and Loss (P&L) statements. The application is tailored to handle Excel export statements (`.xlsx` files) containing trading data for stocks, futures (FUT), and options (CE/PE).

---

## 📁 Directory Structure

```text
stock visualizer/
├── backend/                   # FastAPI Python backend
│   ├── main.py                # Server entry point & CORS configuration
│   ├── processor.py           # Core P&L Excel parser & regex engine
│   ├── requirements.txt       # Python package dependencies
│   ├── test_backend.py        # Local API testing script
│   └── venv/                  # Python virtual environment (ignored)
├── docs/                      # Project documentation and reports
│   └── project_report.md      # Detailed project documentation (this file)
└── frontend/                  # React + Vite frontend application
    ├── public/                # Static public assets
    ├── src/                   # React source code
    │   ├── assets/            # Local asset folder
    │   ├── App.css            # Styles for upload zone, header, and themes
    │   ├── App.jsx            # State management, layout, theme toggles, file upload
    │   ├── Dashboard.jsx      # Metrics cards, Recharts visualizations
    │   ├── index.css          # Design system variables, global CSS rules
    │   └── main.jsx           # App initialization
    ├── .env                   # Configuration for VITE_API_URL
    ├── .gitignore             # Git ignore patterns
    ├── .oxlintrc.json         # Oxlint configuration
    ├── package.json           # npm dependencies and scripts
    └── vite.config.js         # Vite compiler configuration
```

---

## 🛠️ Technology Stack

### Backend
* **FastAPI** (`0.110.0`): High-performance, modern Web framework for building APIs.
* **Uvicorn** (`0.28.0`): ASGI server implementation for running FastAPI.
* **Pandas** (`2.2.1`): Data manipulation and analysis library for formatting and grouping trading metrics.
* **Openpyxl** (`3.1.2`): Excel file reading engine for Pandas.
* **Python-Multipart** (`0.0.9`): Enables processing of uploaded files via multipart form data.

### Frontend
* **React** + **Vite**: Rapid-development building blocks for frontends with Hot Module Replacement (HMR).
* **Vanilla CSS**: Curated, custom styles with glassmorphic accents, responsive grid structures, and variable-based theme tokens.
* **Recharts**: Responsive charting library for rendering stacked bars and conditional coloring.
* **Lucide React**: Clean and minimal modern iconography.
* **Axios**: Promised-based HTTP client for uploading files.

---

## 🚀 Core Features

### 1. Interactive File Upload
* **Drag-and-Drop Zone**: Built-in drag-and-drop mechanics with state-aware highlights (`.drag-active`).
* **Format Protection**: Checks and validates filenames, allowing only `.xlsx` uploads.
* **Status Feedback**: Includes loader transitions and explicit error notifications.

### 2. Analytical Summary Metrics
* Calculates and displays high-level financial summary cards:
  * **Total Realized P&L**
  * **PE Options P&L**
  * **CE Options P&L**
  * **Futures P&L**
* Colors are dynamically styled: green for profits (`val-positive`), red for losses (`val-negative`).

### 3. Advanced Data Visualizations
* **Stacked P&L Breakdown by Ticker**: A comprehensive bar chart detailing options (PE vs. CE) and futures (FUT) splits for each stock ticker.
* **Interactive Monthly Trend**: A filterable monthly breakdown allowing users to choose a specific ticker from a dropdown and view its historical monthly performance. Profits are represented as emerald bars, and losses as rose bars.

### 4. Aesthetics and Themes
* Supports a clean and responsive dark/light mode toggle.
* Custom global styling variable overrides using `[data-theme="dark"]` and `[data-theme="light"]`.

---

## ⚙️ Backend Data Pipeline (`processor.py`)

The backend processes the raw bytes of the uploaded `.xlsx` file using the following pipeline:

### 1. Parsing and Alignment
* **Row Offset**: Statement exports (like Zerodha Console) often start with metadata headers. The parser automatically skips the first `36` rows (`df_orig.iloc[36:, 1:]`) to locate the actual trading logs grid.
* **Header Alignment**: Promotes the first data row to serve as column header names. Handles name variation for the `Index` column.

### 2. Normalization and Cleaning
* **Currency Units**: Converts string-based P&L values to floats, filters out empty rows, and divides the value by `1000` to format values correctly.
* **Sanitization**: Standardizes floating points. Automatically handles occurrences of `NaN` or `inf` values, converting them to `0.0` to preserve JSON compliance.

### 3. Regex Contract Extraction
The processor extracts underlying metadata from complex option/future symbols using Python's `re` module:
* **Stock Ticker**:
  ```python
  ticker_regex = re.compile(r'^([A-Z]+)')
  ```
  Extracts the base stock symbol (e.g., `NIFTY` or `RELIANCE` from option contracts).
* **Option Indicator**:
  ```python
  CE_regex = re.compile(r'CE$')
  PE_regex = re.compile(r'PE$')
  ```
  Identifies whether the contract is a Call Option (`CE`) or Put Option (`PE`).
* **Futures Indicator**:
  ```python
  fut_regex = re.compile(r'FUT$')
  ```
  Identifies whether the contract is a Futures contract (`FUT`).
* **Expiry Month**:
  ```python
  month_regex = re.compile(r'\d{2}([A-Z]{3})[0-9A-Z]+', re.IGNORECASE)
  ```
  Extracts the three-letter expiry month (e.g., `JAN` or `FEB` from `26JAN2317500CE`).

---

## 📡 API Endpoints

### 1. Root Status Check
* **Path**: `GET /`
* **Response**:
  ```json
  {
    "status": "ok",
    "message": "P&L API is running"
  }
  ```

### 2. P&L Upload & Processing
* **Path**: `POST /api/upload`
* **Request Format**: `multipart/form-data` with `file: UploadFile`
* **Response Format**:
  ```json
  {
    "data": {
      "summary": {
        "total": 125.5,
        "pe": 50.2,
        "ce": 45.3,
        "fut": 30.0
      },
      "ticker_breakdown": [
        {
          "ticker": "NIFTY",
          "Total P&L": 95.5,
          "PE P&L": 50.2,
          "CE P&L": 45.3,
          "FUT P&L": 0.0
        }
      ],
      "monthly_data": [
        {
          "ticker": "NIFTY",
          "month": "JAN",
          "pnl": 95.5
        }
      ],
      "tickers": ["NIFTY"]
    }
  }
  ```

---

## 🔌 Setup & Local Installation

### Prerequisites
* Python 3.8+
* Node.js (version 16 or newer)
* npm (Node Package Manager)

### Step 1: Run the Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```
3. Install the required libraries:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   python main.py
   ```
   *The API will run locally at `http://127.0.0.1:8000`.*

### Step 2: Run the Frontend
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy/configure the `.env` file if necessary, ensuring it points to the correct API url:
   - For local development: `VITE_API_URL=http://127.0.0.1:8000`
   - For production: Use the host URL.
4. Launch the Vite dev server:
   ```bash
   npm run dev
   ```
   *The application will open in your browser, typically at `http://localhost:5173`.*

---

## 🔮 Future Enhancements
* **Multi-Broker Statement Parsing**: Introduce additional logic in the backend processor to auto-detect statement formats (e.g., Zerodha, Groww, AngelOne) and parse accordingly.
* **Database Integration**: Persist uploaded data to a database (e.g., SQLite or PostgreSQL) so users can track historical portfolio performance over time without re-uploading files.
* **Advanced Metrics**: Compute additional trading metrics like Win Rate, Profit Factor, Average Win/Loss Ratio, and Maximum Drawdown.
* **Equity/Delivery Trades Analysis**: Support analytics for long-term equity holdings in addition to derivatives (F&O).
