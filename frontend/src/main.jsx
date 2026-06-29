import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AOIProvider } from './context/AOIContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AOIProvider>
        <App />
      </AOIProvider>
    </AuthProvider>
  </React.StrictMode>,
);
