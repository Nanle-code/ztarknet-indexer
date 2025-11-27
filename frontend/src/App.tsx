// import React from 'react';
// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.tsx</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect } from 'react';
import WebSocketService from './services/websocket';
import { getTransactions, getStats, getAlerts, exportCSV } from './services/api';
import { Transaction, Alert, Stats } from './types';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [wsService] = useState(() => new WebSocketService(WS_URL));

  useEffect(() => {
    // Initial data load
    loadInitialData();

    // Connect WebSocket
    wsService.connect(
      (tx) => {
        setTransactions((prev) => [tx, ...prev.slice(0, 49)]);
        loadStats(); // Refresh stats
      },
      (alert) => {
        setAlerts((prev) => [alert, ...prev.slice(0, 19)]);
      }
    );

    return () => {
      wsService.disconnect();
    };
  }, [wsService]);

  const loadInitialData = async () => {
    try {
      const [txs, statistics, alertData] = await Promise.all([
        getTransactions({ limit: 50 }),
        getStats(),
        getAlerts(20),
      ]);
      
      setTransactions(txs);
      setStats(statistics);
      setAlerts(alertData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await getStats();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportCSV();
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  // ... rest of your dashboard UI code
}

export default App;
