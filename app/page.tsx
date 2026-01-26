"use client";

// Force Vercel Rebuild
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true); // Toggle state
  const { login, register, isLoading } = useAuth();
  const [error, setError] = useState('');

  const [tickers, setTickers] = useState([
    { sym: 'BTC-USD', price: 'Loading...', change: '...', color: 'gray' },
    { sym: 'SPY', price: 'Loading...', change: '...', color: 'gray' },
    { sym: 'ETH-USD', price: 'Loading...', change: '...', color: 'gray' }
  ]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const symbols = ['BTC-USD', 'SPY', 'ETH-USD'];
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const results = await Promise.all(
          symbols.map(sym =>
            fetch(`${API_URL}/stocks/price/${sym}`).then(res => res.json())
          )
        );

        const newTickers = results.map(data => {
          const change = data.change_percent ? parseFloat(data.change_percent) : 0;
          const isPositive = change >= 0;
          return {
            sym: data.symbol,
            price: `$${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
            color: isPositive ? 'green' : 'red'
          };
        });
        setTickers(newTickers);
      } catch (err) {
        console.error("Failed to fetch market data", err);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 15 * 60 * 1000); // 15 minutes
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError('');

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        if (!username) {
          setError("Username is required for registration.");
          return;
        }
        await register(email, password, username);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Authentication failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-white relative overflow-hidden font-sans selection:bg-fuchsia-500/30 selection:text-fuchsia-200">

      {/* Background Elements - More Colorful */}
      <div className="absolute inset-0 bg-grid-pattern z-0 pointer-events-none opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {/* Main Blue Blob */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        {/* Purple/Pink Blob - Bottom Left */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }}></div>
        {/* Cyan/Teal Blob - Center/Top */}
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      <div className="z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">

        {/* Left Content Area */}
        <div className="flex-1 text-center lg:text-left space-y-10 animate-fade-in-up">

          {/* Branding Badge - Colorful Gradient */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-900/40 to-fuchsia-900/40 border border-blue-500/30 backdrop-blur-md mx-auto lg:mx-0 shadow-lg shadow-blue-500/10 cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase">Live Market Data</span>
          </div>

          {/* Main Title Area */}
          <div className="flex flex-col items-center lg:items-start space-y-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
              <img
                src="/nobull-logo.png"
                alt="NoBull Economics Logo"
                className="relative w-28 h-28 lg:w-32 lg:h-32 object-contain bg-slate-900 rounded-full p-2 border border-white/10 shadow-2xl"
              />
            </div>

            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] relative z-10">
              <span className="text-white drop-shadow-md">NoBull Economics</span>
              <br />
              {/* Solid vibrant color for visibility */}
              <span className="text-cyan-400 drop-shadow-lg filter shadow-cyan-500/50">
                Investing Challenge 2026
              </span>
            </h1>
          </div>

          <div className="max-w-xl mx-auto lg:mx-0 space-y-3">
            <p className="text-2xl text-slate-300 font-light leading-relaxed">
              Pick your investments and compete for free.
            </p>
            <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center lg:justify-start gap-2">
              Presented by
              <a href="https://nobulleconomics.com" target="_blank" className="text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-4 decoration-fuchsia-400/30 hover:decoration-fuchsia-400/80 transition-all">
                nobulleconomics.com
              </a>
            </p>
          </div>

          {/* Tickers - Chip Style with Color Indicators */}
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-4 delay-200 animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            {tickers.map((ticker) => (
              <div key={ticker.sym} className={`px-5 py-2.5 rounded-xl bg-slate-800/40 backdrop-blur-sm flex items-center gap-3 border transition-all cursor-default group shadow-lg overflow-hidden relative hover:-translate-y-1 ${ticker.color === 'green' ? 'border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10' :
                ticker.color === 'red' ? 'border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10' :
                  'border-gray-500/20'
                }`}>
                <span className="font-bold text-white text-sm tracking-wide z-10">{ticker.sym}</span>
                <div className="h-4 w-px bg-white/10 z-10"></div>
                <span className="font-mono text-slate-300 text-sm z-10">{ticker.price}</span>
                <span className={`text-xs font-bold z-10 ${ticker.color === 'green' ? 'text-emerald-400' : ticker.color === 'red' ? 'text-rose-400' : 'text-gray-400'}`}>
                  {ticker.change}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center lg:text-left delay-300 animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            *Please allow a 15 minute delay for prices
          </p>
        </div>

        {/* Right - Login Card */}
        <div className="w-full max-w-md delay-300 animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 lg:p-10 rounded-3xl shadow-2xl shadow-black/50">
            {/* Colorful Glow Behind Card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-fuchsia-600 to-cyan-500 rounded-3xl blur opacity-20 pointer-events-none"></div>

            {/* Top Gradient Border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

            <div className="relative">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-3xl font-bold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                  {isLoginMode ? "Welcome Back" : "Join the Arena"}
                </h2>
                <p className="text-slate-400 text-sm">
                  {isLoginMode ? "Enter your credentials to access your portfolio." : "Create an account to start your portfolio."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="space-y-4">
                  {!isLoginMode && (
                    <div className="space-y-2">
                      <label htmlFor="username" className="block text-xs font-bold text-cyan-400 tracking-wider uppercase ml-1">Username</label>
                      <input
                        type="text"
                        id="username"
                        className="w-full bg-slate-950/50 border border-slate-700 text-white text-lg rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 block p-4 transition-all placeholder-slate-600 hover:bg-slate-950/70 focus:bg-slate-950/80 outline-none"
                        placeholder="YourDisplay_Name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required={!isLoginMode}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-bold text-cyan-400 tracking-wider uppercase ml-1">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      className="w-full bg-slate-950/50 border border-slate-700 text-white text-lg rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 block p-4 transition-all placeholder-slate-600 hover:bg-slate-950/70 focus:bg-slate-950/80 outline-none"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-xs font-bold text-cyan-400 tracking-wider uppercase ml-1">Password</label>
                    <input
                      type="password"
                      id="password"
                      className="w-full bg-slate-950/50 border border-slate-700 text-white text-lg rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 block p-4 transition-all placeholder-slate-600 hover:bg-slate-950/70 focus:bg-slate-950/80 outline-none"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-pulse">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-center text-white font-bold text-lg shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? 'Processing...' : (isLoginMode ? 'LOGIN' : 'CREATE ACCOUNT')}
                    {!isLoading && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                  </span>
                </button>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(!isLoginMode);
                      setError('');
                    }}
                    className="text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4 decoration-slate-600 hover:decoration-white"
                  >
                    {isLoginMode ? "Need an account? Sign Up" : "Have an account? Login"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

