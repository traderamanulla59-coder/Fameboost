import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, CreditCard, Key, Settings, 
  Bell, Shield, LogOut, Search, Filter, Download,
  TrendingUp, TrendingDown, MoreVertical, Ban, Trash2,
  RefreshCw, CheckCircle, XCircle, Zap, Coins, Eye, Heart,
  AlertCircle, Lock, Smartphone, Star, Activity
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

interface AdminDashboardProps {
  admin: any;
  onLogout: () => void;
}

type Tab = 'overview' | 'users' | 'subscriptions' | 'payments' | 'api-keys' | 'settings' | 'logs';

export default function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, keysRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/api-keys').then(r => r.json()),
        fetch('/api/admin/settings').then(r => r.json())
      ]);

      setStats(statsRes);
      setUsers(usersRes);
      setApiKeys(keysRes);
      setSettings(settingsRes);
    } catch (err) {
      console.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' 
          : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex text-zinc-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-900 p-6 flex flex-col gap-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-white leading-tight">FameFlow</h2>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem id="overview" icon={LayoutDashboard} label="Overview" />
          <SidebarItem id="users" icon={Users} label="User Management" />
          <SidebarItem id="subscriptions" icon={CreditCard} label="Subscriptions" />
          <SidebarItem id="payments" icon={Coins} label="Payments & Sales" />
          <SidebarItem id="api-keys" icon={Key} label="API Management" />
          <SidebarItem id="settings" icon={Settings} label="App Settings" />
          <SidebarItem id="logs" icon={RefreshCw} label="Activity Logs" />
        </nav>

        <div className="pt-6 border-t border-zinc-900 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
              {admin.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{admin.email}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">{admin.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <p className="text-zinc-500 mt-1">Welcome back, {admin.role}. Here's what's happening.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-zinc-900" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl font-bold text-sm hover:bg-pink-400 transition-all shadow-lg shadow-pink-500/20">
              <Download className="w-4 h-4" />
              Export Reports
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && stats && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} trend="+12.5%" trendUp={true} icon={Coins} color="emerald" />
                <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} trend="+8.2%" trendUp={true} icon={Users} color="blue" />
                <StatCard title="Total Orders" value={stats.totalOrders.toLocaleString()} trend="-2.4%" trendUp={false} icon={Zap} color="pink" />
                <StatCard title="Active Subs" value={stats.activeSubs.toLocaleString()} trend="+15.0%" trendUp={true} icon={CreditCard} color="purple" />
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white">Revenue Growth</h3>
                    <select className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold px-2 py-1 outline-none">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.growth}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                          itemStyle={{ color: '#ec4899', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white">User Acquisition</h3>
                    <select className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold px-2 py-1 outline-none">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.growth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                          cursor={{ fill: '#27272a' }}
                        />
                        <Bar dataKey="users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  <input 
                    type="text" 
                    placeholder="Search users by name, email or ID..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-pink-500 transition-all"
                  />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all">
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                  <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-2xl text-sm font-bold hover:bg-pink-400 transition-all shadow-lg shadow-pink-500/20">
                    Add New User
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-800">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">User</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Balance</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Joined</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white">
                                {user.username[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">@{user.username}</div>
                                <div className="text-xs text-zinc-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              user.status === 'Active' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {formatCurrency(user.balance)}
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                                <Ban className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'subscriptions' && (
            <motion.div
              key="subscriptions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Active Subscriptions</h3>
                    <div className="flex gap-2">
                      <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                        <Filter className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-950 border-b border-zinc-800">
                          <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">User</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Plan</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Renewal</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-white">@growth_expert</div>
                            <div className="text-[10px] text-zinc-500">Pro Member</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-purple-500">Yearly Pro</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-500">Jan 15, 2027</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Manage Plans</h3>
                  <div className="space-y-4">
                    <PlanCard name="Basic" price="₹499" duration="Month" color="blue" />
                    <PlanCard name="Pro" price="₹1,299" duration="Month" color="purple" />
                    <PlanCard name="Enterprise" price="₹4,999" duration="Year" color="pink" />
                    <button className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 font-bold hover:border-zinc-700 hover:text-zinc-400 transition-all">
                      + Create New Plan
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Success Rate</p>
                  <div className="text-3xl font-bold text-emerald-500">98.4%</div>
                  <div className="mt-4 h-2 bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[98.4%]" />
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Pending Payouts</p>
                  <div className="text-3xl font-bold text-white">₹14,200</div>
                  <p className="text-[10px] text-zinc-500 mt-2">3 transactions awaiting clearance</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Refunds (30d)</p>
                  <div className="text-3xl font-bold text-red-500">₹1,250</div>
                  <p className="text-[10px] text-zinc-500 mt-2">0.5% of total volume</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Transaction History</h3>
                  <button className="text-xs font-bold text-pink-500 hover:text-pink-400 transition-all">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-800">
                        <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Transaction ID</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Method</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Date</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      <tr className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-zinc-400">TXN-82910482</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-zinc-500" />
                            <span className="text-xs font-bold text-white">UPI / PhonePe</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">₹500.00</td>
                        <td className="px-6 py-4 text-xs text-zinc-500">Feb 21, 2026</td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase">
                            <CheckCircle className="w-3 h-3" />
                            Success
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">System Activity Logs</h3>
                <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <LogItem time="2 mins ago" action="Admin Login" details="Admin logged in from IP 192.168.1.1" type="auth" />
                <LogItem time="15 mins ago" action="Settings Updated" details="Maintenance mode disabled by Owner" type="settings" />
                <LogItem time="1 hour ago" action="New Order" details="Order #ORD-XJ291 placed by @demo_user" type="order" />
                <LogItem time="3 hours ago" action="API Error" details="Gemini API returned 429 Too Many Requests" type="error" />
              </div>
            </motion.div>
          )}
          {activeTab === 'api-keys' && (
            <motion.div
              key="api-keys"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Add New API Key</h3>
                    <Key className="w-6 h-6 text-pink-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-zinc-500">Key Name</label>
                      <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:border-pink-500 outline-none" placeholder="e.g. Gemini Pro" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-zinc-500">Provider</label>
                      <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:border-pink-500 outline-none">
                        <option>Google Gemini</option>
                        <option>OpenAI</option>
                        <option>Anthropic</option>
                        <option>Custom Provider</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-zinc-500">API Key Value</label>
                      <input type="password" title="API Key Value" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:border-pink-500 outline-none" placeholder="sk-••••••••••••••••" />
                    </div>
                    <button className="w-full py-4 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 hover:bg-pink-400 transition-all">
                      Save API Key
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Active Integrations</h3>
                  <div className="space-y-4">
                    {apiKeys.map(key => (
                      <div key={key.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center text-pink-500 border border-zinc-800">
                            <Zap className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-white">{key.name}</div>
                            <div className="text-xs text-zinc-500">{key.provider} • Limit: {key.usage_limit === -1 ? 'Unlimited' : key.usage_limit}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right mr-4">
                            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Enabled</div>
                            <div className="text-[10px] text-zinc-500">Usage: {key.current_usage} calls</div>
                          </div>
                          <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {apiKeys.length === 0 && (
                      <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl border-dashed">
                        <p className="text-zinc-500 italic">No API keys configured yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                  <h3 className="text-xl font-bold text-white">Platform Controls</h3>
                  <div className="space-y-4">
                    <ToggleSetting 
                      title="Maintenance Mode" 
                      description="Disable all user-facing features" 
                      enabled={settings.maintenance_mode === 'true'} 
                    />
                    <ToggleSetting 
                      title="Registration Open" 
                      description="Allow new users to sign up" 
                      enabled={true} 
                    />
                    <ToggleSetting 
                      title="Auto-Approve Orders" 
                      description="Process SMM orders instantly" 
                      enabled={true} 
                    />
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                  <h3 className="text-xl font-bold text-white">Global Announcement</h3>
                  <div className="space-y-4">
                    <textarea 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm focus:border-pink-500 outline-none h-32 resize-none"
                      defaultValue={settings.announcement}
                      placeholder="Enter announcement text..."
                    />
                    <button className="w-full py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all">
                      Update Announcement
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function StatCard({ title, value, trend, trendUp, icon: Icon, color }: any) {
  const colors: any = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    pink: 'text-pink-500 bg-pink-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
    </div>
  );
}

function ToggleSetting({ title, description, enabled }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
      <div>
        <div className="font-bold text-white text-sm">{title}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-tight font-bold">{description}</div>
      </div>
      <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${enabled ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-zinc-800 border border-zinc-700'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${enabled ? 'right-1 bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'left-1 bg-zinc-600'}`} />
      </div>
    </div>
  );
}

function PlanCard({ name, price, duration, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    pink: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
  };

  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} flex items-center justify-between`}>
      <div>
        <div className="font-bold text-white">{name}</div>
        <div className="text-xs text-zinc-500">{price} / {duration}</div>
      </div>
      <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}

function LogItem({ time, action, details, type }: any) {
  const icons: any = {
    auth: <Lock className="w-4 h-4 text-blue-500" />,
    settings: <Settings className="w-4 h-4 text-purple-500" />,
    order: <Zap className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800/50 transition-all">
      <div className="mt-1">{icons[type]}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white">{action}</div>
          <div className="text-[10px] text-zinc-500 font-bold uppercase">{time}</div>
        </div>
        <div className="text-xs text-zinc-500 mt-1">{details}</div>
      </div>
    </div>
  );
}
