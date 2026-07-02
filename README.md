# Stock P&L Visualizer

An interactive web application to analyze and visualize realized profit and loss (P&L) statements for stock, options, and futures trades.

## 📊 Overview

This project consists of:
* **Backend (FastAPI)**: Parses and cleans uploaded broker Excel statements (`.xlsx`), extracting tickers, monthly data, and option types (CE/PE/FUT) using Python regular expressions.
* **Frontend (React + Vite + Recharts)**: Displays summary cards and dynamic charts, supporting dark/light mode toggling and interactive filtering by ticker.

## 📂 Project Documentation

A comprehensive project report outlining the directory structure, technology stack, features, backend pipeline details, API documentation, and step-by-step local setup is available here:

👉 **[Detailed Project Report](file:///Users/gavin/Downloads/stock%20visualizer/docs/project_report.md)**

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

For more details, check out the [Project Report](file:///Users/gavin/Downloads/stock%20visualizer/docs/project_report.md).
