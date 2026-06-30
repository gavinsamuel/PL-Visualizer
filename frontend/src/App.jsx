import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Loader2, Moon, Sun, RefreshCcw } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import Dashboard from './Dashboard';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState('dark');
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file) => {
    if (!file.name.endsWith('.xlsx')) {
      setError("Please upload a valid .xlsx file");
      return;
    }
    
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setData(response.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to process file.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container">
      <header className="header-bar">
        <div className="header-title">
          <h1>P&L Visualizer</h1>
          <p>Realized Profit & Loss Analytics</p>
        </div>
        <div className="header-actions">
          {data && (
            <button className="btn" onClick={handleReset}>
              <RefreshCcw size={16} />
              Reset
            </button>
          )}
          <button className="btn" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </header>

      {!data && !loading && (
        <div 
          className={`upload-zone ${dragActive ? "drag-active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <UploadCloud size={48} className="upload-icon" />
          <h3 className="upload-text">Upload your P&L Excel file</h3>
          <p className="upload-subtext">Drag and drop, or click to browse</p>
          <input 
            ref={fileInputRef}
            type="file" 
            className="file-input" 
            accept=".xlsx"
            onChange={handleChange} 
          />
          {error && <p style={{color: 'var(--danger)', marginTop: '1rem', fontSize: '0.875rem'}}>{error}</p>}
        </div>
      )}

      {loading && (
        <div className="loading">
          <Loader2 size={32} className="spinner" />
          <p>Parsing dataset...</p>
        </div>
      )}

      {data && !loading && <Dashboard data={data} theme={theme} />}
      <Analytics />
    </div>
  );
}

export default App;
