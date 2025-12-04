// import React, { useState, useEffect } from 'react';
// import { Activity, AlertCircle, CheckCircle, Clock, TrendingUp, DollarSign, Users, Zap, Download, RefreshCw, Filter } from 'lucide-react';

// // Type definitions
// interface Transaction {
//   id: string;
//   tx_hash: string;
//   tx_type: string;
//   status: string;
//   from_address: string;
//   to_address: string;
//   amount: string;
//   gas_used: number;
//   gas_price: number;
//   block_number: number;
//   block_timestamp: string;
//   created_at: string;
//   updated_at: string;
// }

// interface Alert {
//   id: string;
//   alert_type: string;
//   severity: string;
//   message: string;
//   tx_hash?: string;
//   metadata?: any;
//   acknowledged: boolean;
//   timestamp: string;
// }

// interface Stats {
//   total_txs: number;
//   success_rate: number;
//   failed_rate: number;
//   avg_gas_used: number;
//   total_volume: string;
//   active_users: number;
//   tps: number;
// }

// const API_URL = 'http://localhost:3000';
// const WS_URL = 'ws://localhost:3000/ws';

// const TransactionMonitor = () => {
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [stats, setStats] = useState<Stats>({
//     total_txs: 0,
//     success_rate: 0,
//     failed_rate: 0,
//     avg_gas_used: 0,
//     total_volume: '0',
//     active_users: 0,
//     tps: 0
//   });
//   const [filter, setFilter] = useState<string>('all');
//   const [alerts, setAlerts] = useState<Alert[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [wsConnected, setWsConnected] = useState<boolean>(false);
//   const [refreshing, setRefreshing] = useState<boolean>(false);

//   // Load transactions based on filter
//   const loadTransactions = async (status?: string) => {
//     try {
//       setRefreshing(true);
//       const params = new URLSearchParams();
//       params.append('limit', '50');
//       if (status && status !== 'all') {
//         params.append('status', status);
//       }
      
//       const response = await fetch(`${API_URL}/api/transactions?${params}`);
//       if (!response.ok) throw new Error('Failed to fetch transactions');
//       const data = await response.json();
//       setTransactions(data);
//       console.log(`Loaded ${data.length} transactions with filter: ${status || 'all'}`);
//     } catch (error) {
//       console.error('Failed to load transactions:', error);
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const loadStats = async () => {
//     try {
//       const response = await fetch(`${API_URL}/api/stats`);
//       if (!response.ok) throw new Error('Failed to fetch stats');
//       const data = await response.json();
//       setStats(data);
//     } catch (error) {
//       console.error('Failed to load stats:', error);
//     }
//   };

//   const loadAlerts = async () => {
//     try {
//       const response = await fetch(`${API_URL}/api/alerts?limit=20`);
//       if (!response.ok) throw new Error('Failed to fetch alerts');
//       const data = await response.json();
//       setAlerts(data);
//     } catch (error) {
//       console.error('Failed to load alerts:', error);
//     }
//   };


//   useEffect(() => {
//   const loadData = async () => {
//     console.log('Loading data...');
//     setLoading(true);
    
//     try {
//       const txResponse = await fetch('http://localhost:3000/api/transactions?limit=50');
//       const txData = await txResponse.json();
//       console.log('Transactions loaded:', txData.length);
//       setTransactions(txData);
      
//       const statsResponse = await fetch('http://localhost:3000/api/stats');
//       const statsData = await statsResponse.json();
//       console.log('Stats loaded:', statsData);
//       setStats(statsData);
      
//       setAlerts([]);
//     } catch (error) {
//       console.error('Error:', error);
//     }
    
//     setLoading(false);
//   };
  
//   loadData();
// }, []);

//   // Setup WebSocket
//   useEffect(() => {
//     const ws = new WebSocket(WS_URL);

//     ws.onopen = () => {
//       console.log('WebSocket connected');
//       setWsConnected(true);
//     };

//     ws.onmessage = (event) => {
//       try {
//         const message = JSON.parse(event.data);
        
//         if (message.type === 'transaction') {
//           console.log('New transaction received:', message.data);
//           setTransactions(prev => [message.data, ...prev.slice(0, 49)]);
//           loadStats();
//         } else if (message.type === 'alert') {
//           console.log('New alert received:', message.data);
//           setAlerts(prev => [message.data, ...prev.slice(0, 19)]);
//         }
//       } catch (error) {
//         console.error('WebSocket message error:', error);
//       }
//     };

//     ws.onerror = (error) => {
//       console.error('WebSocket error:', error);
//       setWsConnected(false);
//     };

//     ws.onclose = () => {
//       console.log('WebSocket disconnected');
//       setWsConnected(false);
//       setTimeout(() => {
//         console.log('Reconnecting...');
//       }, 5000);
//     };

//     return () => {
//       ws.close();
//     };
//   }, []);

//   // Handle filter change
//   const handleFilterChange = async (newFilter: string) => {
//     setFilter(newFilter);
//     await loadTransactions(newFilter === 'all' ? undefined : newFilter);
//   };

//   const handleExport = async () => {
//     try {
//       const response = await fetch(`${API_URL}/api/export/csv`);
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `pharos_transactions_${Date.now()}.csv`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//     } catch (error) {
//       console.error('Failed to export CSV:', error);
//       alert('Failed to export CSV. Please try again.');
//     }
//   };

//   const handleRefresh = () => {
//     loadTransactions(filter === 'all' ? undefined : filter);
//     loadStats();
//     loadAlerts();
//   };

//   const getStatusColor = (status: string) => {
//     if (!status) return 'text-gray-600 bg-gray-100 border-gray-300';
//     switch(status.toLowerCase()) {
//       case 'success': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
//       case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200';
//       case 'failed': return 'text-rose-700 bg-rose-50 border-rose-200';
//       default: return 'text-gray-600 bg-gray-100 border-gray-300';
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     if (!status) return null;
//     switch(status.toLowerCase()) {
//       case 'success': return <CheckCircle className="w-4 h-4" />;
//       case 'pending': return <Clock className="w-4 h-4" />;
//       case 'failed': return <AlertCircle className="w-4 h-4" />;
//       default: return null;
//     }
//   };

//   const formatAmount = (amount: string) => {
//     const num = parseFloat(amount || '0');
//     if (num === 0) return '0.00';
//     if (num < 0.01) return num.toExponential(2);
//     return num.toFixed(2);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
//         <div className="text-center">
//           <Activity className="w-16 h-16 text-indigo-400 animate-spin mx-auto mb-4" />
//           <div className="text-white text-2xl font-semibold">Loading Ztarknet Monitor...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
//                 <Activity className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold text-white mb-1">Ztarknet Transaction Monitor</h1>
//                 <p className="text-indigo-200">Starknet L2 on ZCash Monitoring</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
//                 wsConnected 
//                   ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
//                   : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
//               }`}>
//                 <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
//                 <span className="text-sm">{wsConnected ? 'Connected' : 'Disconnected'}</span>
//               </div>
//               <button
//                 onClick={handleRefresh}
//                 disabled={refreshing}
//                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
//               >
//                 <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
//                 Refresh
//               </button>
//               <button
//                 onClick={handleExport}
//                 className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
//               >
//                 <Download className="w-4 h-4" />
//                 Export CSV
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
//           {[
//             { icon: Activity, label: 'Total TXs', value: stats.total_txs || 0, color: 'blue' },
//             { icon: CheckCircle, label: 'Success Rate', value: `${stats.success_rate?.toFixed(1) || 0}%`, color: 'emerald' },
//             { icon: Zap, label: 'Avg Gas', value: Math.floor(stats.avg_gas_used) || 0, color: 'amber' },
//             { icon: DollarSign, label: 'Volume', value: `$${formatAmount(stats.total_volume)}`, color: 'purple' },
//             { icon: Users, label: 'Active Users', value: stats.active_users || 0, color: 'pink' },
//             { icon: TrendingUp, label: 'TPS', value: stats.tps?.toFixed(1) || 0, color: 'cyan' }
//           ].map((stat, idx) => (
//             <div key={idx} className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
//               <div className="flex items-center gap-2 mb-2">
//                 <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
//                 <span className="text-gray-300 text-sm font-medium">{stat.label}</span>
//               </div>
//               <p className="text-2xl font-bold text-white">{stat.value}</p>
//             </div>
//           ))}
//         </div>

//         {/* Alerts Section */}
//         {alerts.length > 0 && (
//           <div className="bg-rose-900/30 backdrop-blur-xl rounded-xl p-5 border border-rose-500/40 mb-6 shadow-xl">
//             <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-lg">
//               <AlertCircle className="w-5 h-5 text-rose-400" />
//               Recent Alerts
//             </h3>
//             <div className="space-y-2">
//               {alerts.slice(0, 5).map(alert => (
//                 <div key={alert.id} className="flex items-start gap-3 text-sm bg-white/5 p-3 rounded-lg">
//                   <span className="text-gray-400 font-mono text-xs">{new Date(alert.timestamp).toLocaleTimeString()}</span>
//                   <span className={`flex-1 ${alert.severity === 'error' ? 'text-rose-300' : 'text-amber-300'}`}>
//                     {alert.message}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Filters */}
//         <div className="mb-6 bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-xl">
//           <div className="flex items-center gap-3">
//             <Filter className="w-5 h-5 text-indigo-300" />
//             <span className="text-white font-semibold">Filter by Status:</span>
//             <div className="flex gap-2 flex-1">
//               {[
//                 { value: 'all', label: 'All Transactions', color: 'indigo' },
//                 { value: 'success', label: 'Success', color: 'emerald' },
//                 { value: 'pending', label: 'Pending', color: 'amber' },
//                 { value: 'failed', label: 'Failed', color: 'rose' }
//               ].map(f => (
//                 <button
//                   key={f.value}
//                   onClick={() => handleFilterChange(f.value)}
//                   className={`px-4 py-2 rounded-lg font-medium transition-all ${
//                     filter === f.value 
//                       ? `bg-${f.color}-600 text-white shadow-lg scale-105` 
//                       : 'bg-white/10 text-gray-300 hover:bg-white/20'
//                   }`}
//                 >
//                   {f.label}
//                 </button>
//               ))}
//             </div>
//             <span className="text-indigo-300 text-sm font-medium">
//               {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
//             </span>
//           </div>
//         </div>

//         {/* Transactions Table */}
//         <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-white/5">
//                 <tr className="border-b border-white/10">
//                   <th className="text-left p-4 text-indigo-300 font-semibold">TX Hash</th>
//                   <th className="text-left p-4 text-indigo-300 font-semibold">Type</th>
//                   <th className="text-left p-4 text-indigo-300 font-semibold">Status</th>
//                   <th className="text-left p-4 text-indigo-300 font-semibold">Amount</th>
//                   <th className="text-left p-4 text-indigo-300 font-semibold">Gas</th>
//                   <th className="text-left p-4 text-indigo-300 font-semibold">From</th>
//                   <th className="text-left p-4 text-indigo-300 font-semibold">Block</th>
//                   <th className="text-left p-4 text-indigo-300 font-semibold">Time</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {transactions.map((tx, index) => (
//                   <tr key={tx.id || tx.tx_hash || index} className="border-b border-white/5 hover:bg-white/10 transition-colors">
//                     <td className="p-4">
//                       <code className="text-purple-300 text-sm font-mono bg-purple-900/30 px-2 py-1 rounded">
//                         {(tx.tx_hash || '').slice(0, 12)}...
//                       </code>
//                     </td>
//                     <td className="p-4">
//                       <span className="inline-block px-3 py-1 rounded-lg bg-blue-500/30 text-blue-200 text-sm font-medium border border-blue-400/30">
//                         {tx.tx_type || 'unknown'}
//                       </span>
//                     </td>
//                     <td className="p-4">
//                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(tx.status)}`}>
//                         {getStatusIcon(tx.status)}
//                         {tx.status || 'pending'}
//                       </span>
//                     </td>
//                     <td className="p-4 text-white font-semibold">
//                       ${formatAmount(tx.amount)}
//                     </td>
//                     <td className="p-4 text-gray-300 font-mono text-sm">{(tx.gas_used || 0).toLocaleString()}</td>
//                     <td className="p-4">
//                       <code className="text-gray-400 text-xs font-mono bg-gray-800/50 px-2 py-1 rounded">
//                         {(tx.from_address || '').slice(0, 10)}...
//                       </code>
//                     </td>
//                     <td className="p-4 text-gray-300 font-mono text-sm">{(tx.block_number || 0).toLocaleString()}</td>
//                     <td className="p-4 text-gray-400 text-sm">
//                       {tx.block_timestamp ? new Date(tx.block_timestamp).toLocaleTimeString() : 'N/A'}
//                     </td> 
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {transactions.length === 0 && (
//           <div className="text-center py-16 bg-white/5 backdrop-blur-xl rounded-xl mt-6 border border-white/10">
//             <Filter className="w-16 h-16 text-gray-500 mx-auto mb-4" />
//             <p className="text-gray-400 text-lg">No transactions found for this filter</p>
//             <p className="text-gray-500 text-sm mt-2">Try selecting a different status filter</p>
//           </div>
//         )}

//         {/* Footer */}
//         <div className="mt-8 text-center text-gray-400 text-sm">
//           <p>Monitoring Ztarknet Blockchain</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TransactionMonitor;
import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, TrendingUp, DollarSign, Users, Zap, Download, RefreshCw, Filter, ExternalLink, ChevronRight, Server, Shield, Cpu } from 'lucide-react';

// Type definitions
interface Transaction {
  id: string;
  tx_hash: string;
  tx_type: string;
  status: string;
  from_address: string;
  to_address: string;
  amount: string;
  gas_used: number;
  gas_price: number;
  block_number: number;
  block_timestamp: string;
  created_at: string;
  updated_at: string;
}

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  tx_hash?: string;
  metadata?: any;
  acknowledged: boolean;
  timestamp: string;
}

interface Stats {
  total_txs: number;
  success_rate: number;
  failed_rate: number;
  avg_gas_used: number;
  total_volume: string;
  active_users: number;
  tps: number;
}

const API_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/ws';

const TransactionMonitor = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_txs: 0,
    success_rate: 0,
    failed_rate: 0,
    avg_gas_used: 0,
    total_volume: '0',
    active_users: 0,
    tps: 0
  });
  const [filter, setFilter] = useState<string>('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load transactions based on filter
  const loadTransactions = async (status?: string) => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (status && status !== 'all') {
        params.append('status', status);
      }
      
      const response = await fetch(`${API_URL}/api/transactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
      console.log(`Loaded ${data.length} transactions with filter: ${status || 'all'}`);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/alerts?limit=20`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      console.log('Loading data...');
      setLoading(true);
      
      try {
        const txResponse = await fetch('http://localhost:3000/api/transactions?limit=50');
        const txData = await txResponse.json();
        console.log('Transactions loaded:', txData.length);
        setTransactions(txData);
        
        const statsResponse = await fetch('http://localhost:3000/api/stats');
        const statsData = await statsResponse.json();
        console.log('Stats loaded:', statsData);
        setStats(statsData);
        
        setAlerts([]);
      } catch (error) {
        console.error('Error:', error);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Setup WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'transaction') {
          console.log('New transaction received:', message.data);
          setTransactions(prev => [message.data, ...prev.slice(0, 49)]);
          loadStats();
        } else if (message.type === 'alert') {
          console.log('New alert received:', message.data);
          setAlerts(prev => [message.data, ...prev.slice(0, 19)]);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      setTimeout(() => {
        console.log('Reconnecting...');
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Handle filter change
  const handleFilterChange = async (newFilter: string) => {
    setFilter(newFilter);
    await loadTransactions(newFilter === 'all' ? undefined : newFilter);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_URL}/api/export/csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pharos_transactions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const handleRefresh = () => {
    loadTransactions(filter === 'all' ? undefined : filter);
    loadStats();
    loadAlerts();
  };

  const getStatusColor = (status: string) => {
    if (!status) return { color: '#9ca3af', bgColor: '#1f2937', borderColor: '#374151' };
    switch(status.toLowerCase()) {
      case 'success': return { color: '#34d399', bgColor: '#064e3b20', borderColor: '#34d39930' };
      case 'pending': return { color: '#fbbf24', bgColor: '#78350f20', borderColor: '#fbbf2430' };
      case 'failed': return { color: '#fb7185', bgColor: '#88133720', borderColor: '#fb718530' };
      default: return { color: '#9ca3af', bgColor: '#1f2937', borderColor: '#374151' };
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return null;
    switch(status.toLowerCase()) {
      case 'success': return <CheckCircle style={{ width: '16px', height: '16px' }} />;
      case 'pending': return <Clock style={{ width: '16px', height: '16px' }} />;
      case 'failed': return <AlertCircle style={{ width: '16px', height: '16px' }} />;
      default: return null;
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount || '0');
    if (num === 0) return '0.00';
    if (num < 0.01) return num.toExponential(2);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    padding: '16px'
  };

  const cardStyle = {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '16px'
  };

  const statCardStyle = {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s ease'
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            borderRadius: '50%',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity style={{ width: '40px', height: '40px', color: 'white', animation: 'spin 1s linear infinite' }} />
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Loading Ztarknet Monitor
          </div>
          <p style={{ color: '#94a3b8' }}>Initializing blockchain data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
            borderRadius: '24px',
            filter: 'blur(48px)'
          }}></div>
          <div style={{
            ...cardStyle,
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    borderRadius: '12px',
                    filter: 'blur(8px)'
                  }}></div>
                  <div style={{
                    position: 'relative',
                    background: '#0f172a',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(71, 85, 105, 0.5)'
                  }}>
                    <Cpu style={{ width: '32px', height: '32px', color: '#06b6d4' }} />
                  </div>
                </div>
                <div>
                  <h1 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0
                  }}>
                    Ztarknet <span style={{
                      background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>Transaction Monitor</span>
                  </h1>
                  <p style={{ color: '#94a3b8', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield style={{ width: '12px', height: '12px', color: '#06b6d4' }} />
                    Ztarknet L2 on ZCash Monitoring • Real-time Blockchain Analytics
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontWeight: '500',
                  background: wsConnected 
                    ? 'rgba(52, 211, 153, 0.1)' 
                    : 'rgba(251, 113, 133, 0.1)',
                  color: wsConnected ? '#34d399' : '#fb7185',
                  border: `1px solid ${wsConnected ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 113, 133, 0.3)'}`
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: wsConnected ? '#34d399' : '#fb7185',
                    animation: wsConnected ? 'pulse 2s infinite' : 'none'
                  }}></div>
                  <span style={{ fontSize: '14px' }}>{wsConnected ? 'Live Connected' : 'Disconnected'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: 'linear-gradient(to right, #1e293b, #0f172a)',
                      color: 'white',
                      borderRadius: '12px',
                      border: '1px solid rgba(71, 85, 105, 0.5)',
                      cursor: refreshing ? 'not-allowed' : 'pointer',
                      opacity: refreshing ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                      if (!refreshing) {
                        e.currentTarget.style.background = 'linear-gradient(to right, #334155, #1e293b)';
                        e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)';
                      }
                    }}
                    onMouseOut={e => {
                      if (!refreshing) {
                        e.currentTarget.style.background = 'linear-gradient(to right, #1e293b, #0f172a)';
                        e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.5)';
                      }
                    }}
                  >
                    <RefreshCw style={{ 
                      width: '16px', 
                      height: '16px',
                      animation: refreshing ? 'spin 1s linear infinite' : 'none'
                    }} />
                    Refresh
                  </button>
                  <button
                    onClick={handleExport}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                      color: 'white',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #60a5fa, #22d3ee)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #06b6d4)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.3)';
                    }}
                  >
                    <Download style={{ width: '16px', height: '16px' }} />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[
            { icon: Activity, label: 'Total Transactions', value: stats.total_txs?.toLocaleString() || '0', color: '#06b6d4' },
            { icon: CheckCircle, label: 'Success Rate', value: `${stats.success_rate?.toFixed(1) || 0}%`, color: '#34d399' },
            { icon: Zap, label: 'Avg Gas Used', value: Math.floor(stats.avg_gas_used)?.toLocaleString() || '0', color: '#fbbf24' },
            { icon: DollarSign, label: 'Total Volume', value: `$${formatAmount(stats.total_volume)}`, color: '#3b82f6' },
            { icon: Users, label: 'Active Users', value: stats.active_users?.toLocaleString() || '0', color: '#a855f7' },
            { icon: TrendingUp, label: 'Current TPS', value: stats.tps?.toFixed(1) || '0.0', color: '#ec4899' }
          ].map((stat, idx) => (
            <div key={idx} style={statCardStyle}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: `${stat.color}20`,
                  border: `1px solid ${stat.color}30`
                }}>
                  <stat.icon style={{ width: '20px', height: '20px', color: stat.color }} />
                </div>
              </div>
              <p style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: 'white',
                margin: '0 0 4px 0' 
              }}>
                {stat.value}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters & Controls */}
        <div style={{ ...cardStyle, padding: '16px', marginBottom: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <Filter style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: '600', margin: 0 }}>Transaction Status Filter</p>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>Filter transactions by their current status</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: 'All Transactions', icon: Activity, count: transactions.length },
                { value: 'success', label: 'Success', icon: CheckCircle, count: transactions.filter(t => t.status === 'success').length },
                { value: 'pending', label: 'Pending', icon: Clock, count: transactions.filter(t => t.status === 'pending').length },
                { value: 'failed', label: 'Failed', icon: AlertCircle, count: transactions.filter(t => t.status === 'failed').length }
              ].map(f => {
                const isActive = filter === f.value;
                const colors = {
                  'all': { bg: '#3b82f6', to: '#06b6d4' },
                  'success': { bg: '#10b981', to: '#34d399' },
                  'pending': { bg: '#f59e0b', to: '#fbbf24' },
                  'failed': { bg: '#ef4444', to: '#fb7185' }
                };
                
                return (
                  <button
                    key={f.value}
                    onClick={() => handleFilterChange(f.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontWeight: '500',
                      minWidth: '150px',
                      flex: 1,
                      background: isActive 
                        ? `linear-gradient(to right, ${colors[f.value as keyof typeof colors].bg}, ${colors[f.value as keyof typeof colors].to})`
                        : '#1e293b',
                      color: isActive ? 'white' : '#cbd5e1',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#334155';
                      }
                    }}
                    onMouseOut={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#1e293b';
                      }
                    }}
                  >
                    <f.icon style={{ width: '16px', height: '16px' }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{f.label}</span>
                    <span style={{
                      padding: '2px 8px',
                      fontSize: '12px',
                      borderRadius: '12px',
                      background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(71, 85, 105, 0.5)'
                    }}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div style={{
          ...cardStyle,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(71, 85, 105, 0.5)',
            background: 'rgba(15, 23, 42, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Recent Transactions
                <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: 'normal', color: '#94a3b8' }}>
                  ({transactions.length} total)
                </span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }}></div>
                  <span style={{ color: '#94a3b8' }}>Success</span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', marginLeft: '16px' }}></div>
                  <span style={{ color: '#94a3b8' }}>Pending</span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fb7185', marginLeft: '16px' }}></div>
                  <span style={{ color: '#94a3b8' }}>Failed</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                <tr>
                  {['Transaction Hash', 'Type', 'Status', 'Amount', 'Gas Used', 'From Address', 'Block', 'Timestamp'].map((header, idx) => (
                    <th key={idx} style={{
                      textAlign: 'left',
                      padding: '16px',
                      color: '#94a3b8',
                      fontWeight: '600',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => {
                  const statusColors = getStatusColor(tx.status);
                  return (
                    <tr 
                      key={tx.id || tx.tx_hash || index} 
                      style={{
                        borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.3)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(71, 85, 105, 0.5)' }}>
                            <Activity style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
                          </div>
                          <code style={{ 
                            color: '#22d3ee', 
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            background: 'rgba(6, 182, 212, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            {tx.tx_hash?.slice(0, 8)}...{tx.tx_hash?.slice(-6)}
                          </code>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#93c5fd',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderRadius: '8px',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                          <Server style={{ width: '12px', height: '12px' }} />
                          {tx.tx_type || 'Transfer'}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderRadius: '8px',
                          color: statusColors.color,
                          background: statusColors.bgColor,
                          border: `1px solid ${statusColors.borderColor}`
                        }}>
                          {getStatusIcon(tx.status)}
                          <span style={{ textTransform: 'capitalize' }}>{tx.status || 'pending'}</span>
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ padding: '4px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.1)' }}>
                            <DollarSign style={{ width: '12px', height: '12px', color: '#34d399' }} />
                          </div>
                          <span style={{ color: 'white', fontWeight: '600' }}>
                            ${formatAmount(tx.amount)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ padding: '4px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.1)' }}>
                            <Zap style={{ width: '12px', height: '12px', color: '#fbbf24' }} />
                          </div>
                          <span style={{ 
                            color: '#e2e8f0',
                            fontFamily: 'monospace',
                            fontSize: '14px'
                          }}>
                            {tx.gas_used?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <code style={{ 
                          color: '#cbd5e1',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                          background: 'rgba(71, 85, 105, 0.3)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(71, 85, 105, 0.5)'
                        }}>
                          {tx.from_address?.slice(0, 10)}...{tx.from_address?.slice(-8)}
                        </code>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          color: '#e2e8f0',
                          fontFamily: 'monospace',
                          fontSize: '14px'
                        }}>
                          #{tx.block_number?.toLocaleString() || '0'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock style={{ width: '16px', height: '16px', color: '#64748b' }} />
                          <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                            {tx.block_timestamp 
                              ? new Date(tx.block_timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  second: '2-digit'
                                })
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {transactions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px', background: 'rgba(15, 23, 42, 0.5)' }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'rgba(71, 85, 105, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Filter style={{ width: '40px', height: '40px', color: '#475569' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
                No transactions found
              </h3>
              <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
                Try selecting a different status filter or wait for new transactions to be processed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '32px', 
          paddingTop: '24px', 
          borderTop: '1px solid rgba(71, 85, 105, 0.5)' 
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                <Cpu style={{ width: '20px', height: '20px', color: '#06b6d4' }} />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: '600', margin: 0 }}>Ztarknet Blockchain Monitor v1.0</p>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
                  Real-time monitoring and analytics for Ztarknet L2 on ZCash
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: wsConnected ? '#34d399' : '#64748b',
                  animation: wsConnected ? 'pulse 2s infinite' : 'none'
                }}></div>
                <span style={{ color: wsConnected ? '#34d399' : '#64748b' }}>
                  {wsConnected ? 'Live Updates Active' : 'Connection Offline'}
                </span>
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
              'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
              sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          button {
            font-family: inherit;
          }
          
          code {
            font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
          }
        `}
      </style>
    </div>
  );
};

export default TransactionMonitor;