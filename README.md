# Stock P&L Visualizer

An interactive web application to analyze and visualize realized profit and loss (P&L) statements for stock, options, and futures trades.

## 📊 Overview

This project consists of:
* **Backend (FastAPI)**: Parses and cleans uploaded broker Excel statements (`.xlsx`), extracting tickers, monthly data, and option types (CE/PE/FUT) using Python regular expressions.
* **Frontend (React + Vite + Recharts)**: Displays summary cards and dynamic charts, supporting dark/light mode toggling and interactive filtering by ticker.

## 📂 Project Documentation

Detailed project documentation and guides are available under the `docs/` folder:

* 👉 **[Detailed Project Report](file:///Users/gavin/Downloads/stock%20visualizer/docs/project_report.md)**: A complete walkthrough of the architecture, tech stack, API endpoints, regex parsing patterns, and backend/frontend designs.
* 👉 **[Installation & Setup Instructions](file:///Users/gavin/Downloads/stock%20visualizer/docs/installation.md)**: A step-by-step setup guide covering environment variables, dependencies, running servers, and troubleshooting.

## 🛠️ Quick Start

### 1. Run the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 2. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```

For more details, check out the **[Project Report](file:///Users/gavin/Downloads/stock%20visualizer/docs/project_report.md)** and the **[Installation & Setup Instructions](file:///Users/gavin/Downloads/stock%20visualizer/docs/installation.md)**.
