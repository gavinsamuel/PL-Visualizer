# Installation & Setup Instructions

This guide provides step-by-step instructions to configure, install, and run the P&L Stock Visualizer project on your local machine.

---

## 📋 System Prerequisites

Ensure you have the following software installed before proceeding:
1. **Python** (version 3.9 or higher): [Download Python](https://www.python.org/downloads/)
2. **Node.js** (LTS version 18 or 20 recommended): [Download Node.js](https://nodejs.org/)
3. **npm** (Node Package Manager - bundled automatically with Node.js)
4. **Git** (for version control): [Download Git](https://git-scm.com/)

---

## 🖥️ Backend Installation & Setup

The backend is built with FastAPI. It handles parsing and analytical aggregations of the uploaded Excel sheets.

### Step 1: Navigate to the Backend Directory
Open your terminal and navigate to the backend folder:
```bash
cd backend
```

### Step 2: Create a Virtual Environment
Isolate your Python dependencies by setting up a virtual environment:
```bash
# On macOS and Linux:
python3 -m venv venv

# On Windows:
python -m venv venv
```

### Step 3: Activate the Virtual Environment
Activate the environment to start using isolated packages:
```bash
# On macOS and Linux:
source venv/bin/activate

# On Windows (Command Prompt):
venv\Scripts\activate.bat

# On Windows (PowerShell):
venv\Scripts\Activate.ps1
```
*(Your terminal prompt should now be prefixed with `(venv)`)*

### Step 4: Install Dependencies
Install all required packages from `requirements.txt`:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 5: Run the Server
Launch the FastAPI development server using the main execution file:
```bash
python main.py
```
By default, the backend will start running on **`http://127.0.0.1:8000`**.

### Step 6: Verify Backend Status
You can check if the API is running by visiting the root endpoint in your browser or executing `curl`:
```bash
curl http://127.0.0.1:8000/
```
Expected response:
```json
{"status":"ok","message":"P&L API is running"}
```

---

## 🎨 Frontend Installation & Setup

The frontend is a React application compiled with Vite.

### Step 1: Open a New Terminal and Navigate to Frontend
Make sure to keep the backend terminal running, open a new terminal tab/window, and go to the frontend directory:
```bash
cd frontend
```

### Step 2: Install Node Modules
Install all necessary packages defined in `package.json`:
```bash
npm install
```

### Step 3: Configure Environment Variables
Create or modify the environment configuration. The frontend uses a `.env` file to point to the backend API endpoint.

1. Open the file `frontend/.env`
2. Configure `VITE_API_URL` to point to your local backend server:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```

### Step 4: Start the Frontend Dev Server
Run the Vite local development server:
```bash
npm run dev
```
*The terminal will output the local network URL (usually **`http://localhost:5173`**). Open this URL in your web browser to access the app.*

---

## 🛠️ Troubleshooting & Common Issues

### 1. Port 8000 or 5173 is Already in Use
If another process is running on the required ports:
* **Backend**: You can customize the backend port by setting the `PORT` environment variable before running:
  ```bash
  PORT=8080 python main.py
  ```
  *(Remember to update `VITE_API_URL` in the frontend `.env` to match the new port).*
* **Frontend**: Vite will automatically try the next available port (e.g. `5174`). You can also specify the port using:
  ```bash
  npm run dev -- --port 3000
  ```

### 2. CORS (Cross-Origin Resource Sharing) Errors
If the frontend fails to connect to the backend API with CORS issues:
* Double-check that the frontend `.env` contains the exact URL of the running backend (without trailing slashes).
* Ensure `CORSMiddleware` in `backend/main.py` is configured to allow requests from your frontend host (the default `allow_origins=["*"]` allows all hosts in development).

### 3. Missing `openpyxl` Engine Error
If uploading an Excel sheet returns an error about a missing library:
* Ensure that you have activated the virtual environment and ran `pip install -r requirements.txt`.
* If you run Python commands globally, install it manually: `pip install openpyxl pandas`.

### 4. Excel Upload Errors
* The backend parser expects a broker statement layout starting with specific row offsets (specifically skipping the first 36 lines). If you are using custom, modified, or empty Excel sheets, verify they conform to the Zerodha Console export layout.
