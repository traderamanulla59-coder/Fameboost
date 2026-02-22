/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Instagram, Eye, Heart, Users, CheckCircle, ShieldCheck, Zap, Lock, Star, CreditCard, Smartphone, Wallet, Coins, Shield } from 'lucide-react';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';

type ServiceType = 'followers' | 'views' | 'likes';
type PaymentMethod = 'wallet';
type Currency = 'INR';

type Order = {
  id: string;
  type: ServiceType | 'deposit';
  amount: number;
  price: number;
  username?: string;
  date: string;
  status: 'completed' | 'pending';
};

const PACKAGES = {
  followers: [
    { id: 'f1', count: 100, price: 79, popular: false },
    { id: 'f2', count: 500, price: 299, popular: true },
    { id: 'f3', count: 1000, price: 549, popular: false },
    { id: 'f4', count: 5000, price: 2499, popular: false },
  ],
  views: [
    { id: 'v1', count: 500, price: 49, popular: false },
    { id: 'v2', count: 1000, price: 89, popular: false },
    { id: 'v3', count: 5000, price: 399, popular: true },
    { id: 'v4', count: 10000, price: 699, popular: false },
  ],
  likes: [
    { id: 'l1', count: 100, price: 49, popular: false },
    { id: 'l2', count: 500, price: 199, popular: true },
    { id: 'l3', count: 1000, price: 349, popular: false },
    { id: 'l4', count: 2500, price: 799, popular: false },
  ]
};

const FEATURES = [
  { icon: Zap, title: 'Instant Delivery', desc: 'Orders start within minutes' },
  { icon: ShieldCheck, title: '100% Safe', desc: 'No password required ever' },
  { icon: Star, title: 'High Quality', desc: 'Real-looking premium accounts' },
];

export default function App() {
  const [activeService, setActiveService] = useState<ServiceType>('followers');
  const [selectedPackage, setSelectedPackage] = useState<any>(PACKAGES.followers[1]);
  const [customAmount, setCustomAmount] = useState<number>(250);
  const [customPriceValue, setCustomPriceValue] = useState<number>(50);
  const [isCustom, setIsCustom] = useState(false);
  const [isPriceCustom, setIsPriceCustom] = useState(false);
  const [username, setUsername] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeView, setActiveView] = useState<'shop' | 'history' | 'admin'>('shop');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [hoveredPackageId, setHoveredPackageId] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (activeView === 'history') {
      fetchOrders();
    }
  }, [activeView]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      // Map DB fields to Order type if necessary
      const mappedOrders = data.map((o: any) => ({
        id: o.id,
        type: o.type,
        amount: o.amount,
        price: o.price,
        username: o.target,
        date: new Date(o.created_at).toLocaleString(),
        status: o.status || 'completed'
      }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleServiceChange = (service: ServiceType) => {
    setActiveService(service);
    setIsCustom(false);
    setSelectedPackage(PACKAGES[service].find(p => p.popular) || PACKAGES[service][0]);
  };

  const getCustomPrice = (amount: number, service: ServiceType) => {
    const rates = { followers: 0.75, views: 0.10, likes: 0.40 };
    return amount * rates[service];
  };

  const getAmountFromPrice = (price: number, service: ServiceType) => {
    const rates = { followers: 0.75, views: 0.10, likes: 0.40 };
    return Math.floor(price / rates[service]);
  };

  const currentAmount = isCustom 
    ? (isPriceCustom ? getAmountFromPrice(customPriceValue, activeService) : customAmount)
    : selectedPackage.count;
    
  const currentPrice = isCustom 
    ? (isPriceCustom ? customPriceValue : getCustomPrice(customAmount, activeService))
    : selectedPackage.price;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    if (walletBalance < currentPrice) {
      setShowRechargeModal(true);
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeService,
          amount: currentAmount,
          username: username,
          link: username // In this app, username is used for both followers and links
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      const newOrder: Order = {
        id: data.orderId || Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: activeService,
        amount: currentAmount,
        price: currentPrice,
        username: username,
        date: new Date().toLocaleString(),
        status: 'completed'
      };
      
      setOrders(prev => [newOrder, ...prev]);
      setWalletBalance(prev => prev - currentPrice);
      setOrderSuccess(true);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    setShowQRModal(false);
    setIsProcessing(true);
    
    try {
      if (showRechargeModal) {
        const response = await fetch('/api/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: rechargeAmount })
        });
        const data = await response.json();
        
        if (data.success) {
          const depositOrder: Order = {
            id: data.orderId,
            type: 'deposit',
            amount: rechargeAmount,
            price: rechargeAmount,
            date: new Date().toLocaleString(),
            status: 'completed'
          };
          setOrders(prev => [depositOrder, ...prev]);
          setWalletBalance(prev => prev + rechargeAmount);
          setShowRechargeModal(false);
        }
      } else {
        setOrderSuccess(true);
      }
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecharge = () => {
    setShowRechargeModal(true);
    setShowQRModal(true);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (activeView === 'admin') {
    if (!adminUser) {
      return <AdminLogin onLogin={setAdminUser} />;
    }
    return <AdminDashboard admin={adminUser} onLogout={() => { setAdminUser(null); setActiveView('shop'); }} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-pink-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-2 text-xl font-bold tracking-tight cursor-pointer"
              onClick={() => setActiveView('admin')}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <span>Fame<span className="text-pink-500">Boost</span></span>
            </div>

            {/* Financial Area (INR Only) */}
            <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800 h-8 sm:h-9 items-center">
              <div className="flex items-center gap-1.5 px-3">
                <Wallet className="w-3 h-3 text-pink-500" />
                <span className="text-white font-bold text-xs sm:text-sm whitespace-nowrap">{formatPrice(walletBalance)}</span>
              </div>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setActiveView('shop'); }}
              className={`transition-colors ${activeView === 'shop' ? 'text-pink-500' : 'hover:text-zinc-50'}`}
            >
              Services
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setActiveView('history'); }}
              className={`transition-colors ${activeView === 'history' ? 'text-pink-500' : 'hover:text-zinc-50'}`}
            >
              Order History
            </a>
            <button 
              onClick={() => setActiveView('admin')}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center gap-2 text-zinc-300 text-xs font-bold transition-colors"
            >
              <Shield className="w-3 h-3 text-pink-500" />
              Admin
            </button>
            <button 
              onClick={() => setShowRechargeModal(true)}
              className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 flex items-center gap-2 text-white text-xs font-bold transition-colors shadow-lg shadow-pink-500/20"
            >
              <Zap className="w-3 h-3 fill-current" />
              Deposit
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 lg:py-20">
        <AnimatePresence mode="wait">
          {activeView === 'shop' ? (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Hero */}
              <div className="text-center max-w-3xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-6"
                >
                  <Zap className="w-3 h-3" />
                  Lowest Price Guarantee
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
                >
                  The smarter way to grow your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500">Instagram</span>
                </motion.h1>
              </div>

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
                
                {/* Left Column: Selection */}
                <div className="space-y-12">
                  {/* Step 1: Deposit */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                      <h2 className="text-2xl font-bold">Deposit Funds</h2>
                    </div>
                    
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="bg-pink-500/5 border border-pink-500/10 p-3 rounded-xl inline-block">
                          <p className="text-[10px] text-pink-500 font-medium italic">
                            "They are the ones who make it low."
                          </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-inner">
                          <Wallet className="w-4 h-4 text-pink-500" />
                          <div className="flex flex-col">
                            <span className="text-[8px] uppercase font-bold text-zinc-500 leading-none mb-1">Available Balance</span>
                            <span className="text-white font-bold leading-none">{formatPrice(walletBalance)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {[10, 25, 50, 100, 250, 500].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setRechargeAmount(amount)}
                            className={`py-3 rounded-xl border-2 font-bold transition-all text-sm ${
                              rechargeAmount === amount
                                ? 'border-pink-500 bg-pink-500/5 text-white'
                                : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'
                            }`}
                          >
                            {formatPrice(amount)}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2 w-full">
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Custom Deposit Amount</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                              ₹
                            </div>
                            <input
                              type="number"
                              value={rechargeAmount}
                              onChange={(e) => setRechargeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-9 pr-4 text-white focus:outline-none focus:border-pink-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleRecharge}
                          className="w-full sm:w-auto px-8 py-3.5 bg-pink-500 hover:bg-pink-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4 fill-current" />
                          Deposit Now
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Step 2: Select Service */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                      <h2 className="text-2xl font-bold">Select Service</h2>
                    </div>
                    
                    <div className="space-y-8">
                      {/* Service Tabs */}
                      <div className="flex p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
                        {(['followers', 'views', 'likes'] as ServiceType[]).map((service) => (
                          <button
                            key={service}
                            onClick={() => handleServiceChange(service)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                              activeService === service 
                                ? 'bg-zinc-800 text-white shadow-sm' 
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                            }`}
                          >
                            {service === 'followers' && <Users className="w-4 h-4" />}
                            {service === 'views' && <Eye className="w-4 h-4" />}
                            {service === 'likes' && <Heart className="w-4 h-4" />}
                            <span className="capitalize">{service}</span>
                          </button>
                        ))}
                      </div>

                      {/* Packages Grid */}
                      <div className="grid sm:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {PACKAGES[activeService].map((pkg) => (
                        <motion.div
                          key={pkg.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onMouseEnter={() => setHoveredPackageId(pkg.id)}
                          onMouseLeave={() => setHoveredPackageId(null)}
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setIsCustom(false);
                          }}
                          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                            !isCustom && selectedPackage.id === pkg.id
                              ? 'border-pink-500 bg-pink-500/5'
                              : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/50'
                          }`}
                        >
                          <AnimatePresence>
                            {hoveredPackageId === pkg.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute -top-20 left-0 right-0 z-10 p-3 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl pointer-events-none"
                              >
                                <div className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1">Package Details</div>
                                <div className="text-xs text-zinc-300 leading-relaxed">
                                  {activeService === 'followers' && "• High Quality Profiles • 0-24h Delivery • No Password Required"}
                                  {activeService === 'views' && "• Instant Start • High Retention • Safe & Anonymous"}
                                  {activeService === 'likes' && "• Real User Likes • Instant Delivery • 100% Safe"}
                                </div>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-800 border-r border-b border-zinc-700 rotate-45" />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {pkg.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                              Most Popular
                            </div>
                          )}
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-2xl font-bold text-white">
                              {pkg.count.toLocaleString()}
                            </span>
                            {!isCustom && selectedPackage.id === pkg.id && (
                              <CheckCircle className="w-5 h-5 text-pink-500" />
                            )}
                          </div>
                          <div className="text-zinc-400 text-sm font-medium capitalize mb-4">
                            Instagram {activeService}
                          </div>
                          <div className="text-xl font-bold text-white">
                            {formatPrice(pkg.price)}
                          </div>
                        </motion.div>
                      ))}

                      {/* Custom Amount Option */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onMouseEnter={() => setHoveredPackageId('custom')}
                        onMouseLeave={() => setHoveredPackageId(null)}
                        onClick={() => setIsCustom(true)}
                        className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-center ${
                          isCustom
                            ? 'border-pink-500 bg-pink-500/5'
                            : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/50'
                        }`}
                      >
                        <AnimatePresence>
                          {hoveredPackageId === 'custom' && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute -top-20 left-0 right-0 z-10 p-3 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl pointer-events-none"
                            >
                              <div className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1">Custom Order</div>
                              <div className="text-xs text-zinc-300 leading-relaxed">
                                • Flexible Quantity • Choose Your Budget • Same High Quality Delivery
                              </div>
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-800 border-r border-b border-zinc-700 rotate-45" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xl font-bold text-white">Custom Amount</span>
                          {isCustom && <CheckCircle className="w-5 h-5 text-pink-500" />}
                        </div>
                        {isCustom ? (
                          <div className="mt-2 space-y-4">
                            <div className="flex p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsPriceCustom(false); }}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${!isPriceCustom ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                              >
                                By Amount
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsPriceCustom(true); }}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${isPriceCustom ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                              >
                                By Price
                              </button>
                            </div>

                            {isPriceCustom ? (
                              <div className="space-y-2">
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 text-sm">
                                    ₹
                                  </div>
                                  <input
                                    type="number"
                                    min="1"
                                    value={customPriceValue}
                                    onChange={(e) => setCustomPriceValue(Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-7 pr-3 text-white focus:outline-none focus:border-pink-500 text-sm"
                                    placeholder="Enter budget..."
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="text-sm font-medium text-pink-500">
                                  ≈ {getAmountFromPrice(customPriceValue, activeService).toLocaleString()} {activeService}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <input
                                  type="number"
                                  min="50"
                                  max="50000"
                                  value={customAmount}
                                  onChange={(e) => setCustomAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-pink-500 text-sm"
                                  placeholder="Enter quantity..."
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="text-sm font-bold text-pink-500">
                                  {formatPrice(getCustomPrice(customAmount, activeService))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500 mt-1">Choose exactly how many you want</p>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Features */}
                  <div className="grid sm:grid-cols-3 gap-6 py-8 border-t border-zinc-800">
                    {FEATURES.map((feature, i) => (
                      <div key={i} className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-pink-500">
                          <feature.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-200 text-sm">{feature.title}</h3>
                          <p className="text-xs text-zinc-500 mt-1">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                </section>
              </div>

                {/* Right Column: Checkout Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 lg:p-8 sticky top-24">
                  {orderSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Order Received!</h2>
                      <p className="text-zinc-400 mb-8">
                        Your {currentAmount.toLocaleString()} {activeService} will start delivering shortly to <span className="text-white font-medium">@{username}</span>.
                      </p>
                      <button 
                        onClick={() => {
                          setOrderSuccess(false);
                          setUsername('');
                        }}
                        className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors"
                      >
                        Place Another Order
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleCheckout} className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold mb-1">Order Summary</h2>
                        <p className="text-sm text-zinc-400">Complete your details to start growing.</p>
                      </div>

                      <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-white">
                            {currentAmount.toLocaleString()} {activeService}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">High Quality • Instant</div>
                        </div>
                        <div className="text-xl font-bold text-white">
                          {formatPrice(currentPrice)}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            {activeService === 'followers' ? 'Instagram Username' : 'Instagram Post Link'}
                          </label>
                          <div className="relative">
                            {activeService === 'followers' && (
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                                @
                              </div>
                            )}
                            <input
                              type="text"
                              required
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder={activeService === 'followers' ? 'yourusername' : 'https://instagram.com/p/...'}
                              className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all ${
                                activeService === 'followers' ? 'pl-9' : ''
                              }`}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Email Address <span className="text-zinc-600">(for receipt)</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-3">
                            Payment Method
                          </label>
                          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                                <Wallet className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">Wallet Balance</div>
                                <div className="text-xs text-zinc-500">Available: {formatPrice(walletBalance)}</div>
                              </div>
                            </div>
                            {walletBalance < currentPrice && (
                              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">Insufficient</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isProcessing || !username || (isCustom && currentAmount < 50)}
                        className={`w-full py-4 px-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                          walletBalance >= currentPrice
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-pink-500/25'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        }`}
                      >
                        {isProcessing ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            {walletBalance >= currentPrice ? (
                              <>
                                <Lock className="w-5 h-5" />
                                Pay {formatPrice(currentPrice)} Now
                              </>
                            ) : (
                              <>
                                <Zap className="w-5 h-5 fill-current" />
                                Deposit & Pay
                              </>
                            )}
                          </>
                        )}
                      </button>

                      <p className="text-xs text-center text-zinc-500 flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Secure 256-bit SSL encryption
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          ) : activeView === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
                  <p className="text-zinc-400 mt-1">View and track your past purchases and deposits.</p>
                </div>
                <button 
                  onClick={() => setActiveView('shop')}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Back to Shop
                </button>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                {loadingOrders ? (
                  <div className="p-20 text-center">
                    <div className="w-10 h-10 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-zinc-500 text-sm font-medium">Fetching your history...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-700">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-300">No orders yet</h3>
                    <p className="text-zinc-500 text-sm mt-1 max-w-xs mx-auto">Your purchase history will appear here once you place an order or make a deposit.</p>
                    <button 
                      onClick={() => setActiveView('shop')}
                      className="mt-6 px-6 py-2 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-400 transition-colors"
                    >
                      Start Growing
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-950 border-b border-zinc-800">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Order ID</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Service</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Details</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Amount</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Date</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-zinc-400">#{order.id}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {order.type === 'deposit' ? (
                                  <Zap className="w-4 h-4 text-emerald-500 fill-current" />
                                ) : order.type === 'followers' ? (
                                  <Users className="w-4 h-4 text-pink-500" />
                                ) : order.type === 'views' ? (
                                  <Eye className="w-4 h-4 text-pink-500" />
                                ) : (
                                  <Heart className="w-4 h-4 text-pink-500" />
                                )}
                                <span className="text-sm font-semibold capitalize">{order.type}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-zinc-300">
                                {order.type === 'deposit' ? (
                                  'Wallet Recharge'
                                ) : (
                                  <>
                                    {order.amount.toLocaleString()} units for <span className="text-zinc-500">@{order.username}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-white">
                              {formatPrice(order.price)}
                            </td>
                            <td className="px-6 py-4 text-xs text-zinc-500">
                              {order.date}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Recharge Modal */}
      <AnimatePresence>
        {showRechargeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRechargeModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-2 text-xl font-bold">
                  <Zap className="w-6 h-6 text-pink-500 fill-current" />
                  <span>Deposit Funds</span>
                </div>

                <div className="bg-pink-500/5 border border-pink-500/10 p-3 rounded-xl">
                  <p className="text-[10px] text-pink-500 font-medium italic">
                    "They are the ones who make it low."
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[10, 25, 50, 100, 250, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setRechargeAmount(amount)}
                      className={`py-3 rounded-xl border-2 font-bold transition-all ${
                        rechargeAmount === amount
                          ? 'border-pink-500 bg-pink-500/5 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {formatPrice(amount)}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 text-left">Custom Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                      ₹
                    </div>
                    <input
                      type="number"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-9 pr-4 text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleRecharge}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/25 transition-all"
                  >
                    Deposit Now
                  </button>
                  <button
                    onClick={() => setShowRechargeModal(false)}
                    className="w-full py-3 text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQRModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-2 text-xl font-bold">
                  <Wallet className="w-6 h-6 text-pink-500" />
                  <span>Scan to Pay</span>
                </div>
                
                <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
                  {/* Using a placeholder for the QR code image provided by the user */}
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=punjabnationalbank@upi&pn=Punjab%20National%20Bank&am=0" 
                    alt="Payment QR Code"
                    className="w-64 h-64"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-zinc-300 font-medium">Punjab National Bank</p>
                  <p className="text-sm text-zinc-500">Scan this QR code using any UPI app (PhonePe, Google Pay, Paytm) to complete your payment of <span className="text-white font-bold">{formatPrice(showRechargeModal ? rechargeAmount : currentPrice)}</span>.</p>
                </div>

                <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50 text-left">
                  <p className="text-zinc-300 font-bold text-xs uppercase tracking-wider mb-2">Important Note:</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    "Fame is just one scan away. Once paid, your balance will reflect in your wallet within 60 seconds. Please do not close this window until you click confirm."
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleConfirmPayment}
                    className="w-full py-4 bg-pink-500 hover:bg-pink-400 text-white rounded-xl font-bold transition-colors"
                  >
                    I've Made the Payment
                  </button>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="w-full py-3 text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
