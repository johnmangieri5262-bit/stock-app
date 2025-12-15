"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState<number | null>(null);

    const fetchData = async () => {
        if (user) {
            try {
                const [compsRes, portsRes] = await Promise.all([
                    api.get('/competitions/'),
                    api.get('/portfolios/')
                ]);
                setCompetitions(compsRes.data);
                setPortfolios(portsRes.data.filter((p: any) => p.owner_id === user.id));
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            }
        }
    }

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleRefresh = async (portfolioId: number) => {
        setRefreshing(portfolioId);
        try {
            await api.post(`/portfolios/${portfolioId}/refresh`);
            fetchData();
        } catch (err) {
            console.error("Failed to refresh:", err);
            alert("Failed to refresh portfolio values. Ensure backend is running.");
        } finally {
            setRefreshing(null);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen p-8 bg-gray-900 text-white">
            <header className="flex justify-between items-center mb-10 border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">Dashboard</h1>
                <div className="flex gap-4 items-center">
                    <span className="text-gray-300">Welcome, {user.email}</span>
                    <button onClick={logout} className="text-red-400 hover:text-red-300 text-sm border border-red-400/30 rounded px-3 py-1 hover:bg-red-400/10 transition">Logout</button>
                </div>
            </header>

            <div className="space-y-12">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-200">Active Competitions</h2>
                    <button
                        onClick={() => fetchData()}
                        className="text-sm text-cyan-400 hover:text-cyan-300"
                    >
                        Refresh Data
                    </button>
                </div>

                {competitions.map(comp => {
                    const myPortfolio = portfolios.find(p => p.competition_id === comp.id);

                    return (
                        <div key={comp.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{comp.name}</h3>
                                    <div className="flex gap-4 text-sm">
                                        <p className="text-gray-400">Status: <span className="text-emerald-400">Active</span></p>
                                        {comp.entry_deadline && (
                                            <p className="text-gray-400">
                                                Entry Deadline: <span className="text-orange-400">{new Date(comp.entry_deadline).toLocaleDateString()}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {!myPortfolio && (
                                    (() => {
                                        const isExpired = comp.entry_deadline && new Date() > new Date(comp.entry_deadline);
                                        return (
                                            <a
                                                href={isExpired ? '#' : `/dashboard/create?competitionId=${comp.id}&competitionName=${encodeURIComponent(comp.name)}`}
                                                className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all ${isExpired
                                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:scale-105 shadow-blue-500/20'
                                                    }`}
                                                onClick={(e) => isExpired && e.preventDefault()}
                                            >
                                                {isExpired ? 'Entry Closed' : 'Join Competition'}
                                            </a>
                                        );
                                    })()
                                )}
                            </div>

                            <div className="mb-4">
                                <a href={`/competitions/${comp.id}/leaderboard`} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                                    View Leaderboard &rarr;
                                </a>
                            </div>

                            {myPortfolio ? (
                                <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-200">{myPortfolio.name}</h4>
                                            <p className="text-xs text-gray-500">Portfolio ID: #{myPortfolio.id}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className={`font-mono text-2xl font-bold ${myPortfolio.total_return_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {myPortfolio.total_return_percent >= 0 ? '+' : ''}{myPortfolio.total_return_percent.toFixed(2)}%
                                                </p>
                                                <p className="text-xs text-gray-400">Total Return</p>
                                            </div>
                                            <button
                                                onClick={() => handleRefresh(myPortfolio.id)}
                                                disabled={refreshing === myPortfolio.id}
                                                className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                                                title="Refresh Values"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${refreshing === myPortfolio.id ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Detailed Asset Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-400">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-700/50">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3">Asset</th>
                                                    <th scope="col" className="px-4 py-3 text-right">Qty</th>
                                                    <th scope="col" className="px-4 py-3 text-right">Initial</th>
                                                    <th scope="col" className="px-4 py-3 text-right">Current</th>
                                                    <th scope="col" className="px-4 py-3 text-right">Change</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {myPortfolio.items.map((item: any) => {
                                                    const change = item.current_price - item.initial_price;
                                                    const changePercent = item.initial_price > 0
                                                        ? ((change / item.initial_price) * 100)
                                                        : 0;

                                                    return (
                                                        <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                                                            <td className="px-4 py-3 font-medium text-white">{item.symbol}</td>
                                                            <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-gray-500">${item.initial_price.toFixed(2)}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-white">${item.current_price.toFixed(2)}</td>
                                                            <td className={`px-4 py-3 text-right font-mono font-bold ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Add Asset Section */}
                                    {(() => {
                                        const isExpired = comp.entry_deadline && new Date() > new Date(comp.entry_deadline);
                                        const canAdd = !isExpired && myPortfolio.items.length < 10;
                                        
                                        if (canAdd) {
                                            return (
                                                <div className="mt-4 pt-4 border-t border-gray-600">
                                                    <form 
                                                        onSubmit={async (e) => {
                                                            e.preventDefault();
                                                            const form = e.target as HTMLFormElement;
                                                            const input = form.elements.namedItem('symbol') as HTMLInputElement;
                                                            const symbol = input.value.trim().toUpperCase();
                                                            if (!symbol) return;
                                                            
                                                            try {
                                                                await api.post(`/portfolios/${myPortfolio.id}/items?user_id=${user.id}`, {
                                                                    symbol: symbol,
                                                                    quantity: 1
                                                                });
                                                                input.value = '';
                                                                fetchData();
                                                            } catch (err: any) {
                                                                alert(err.response?.data?.detail || "Failed to add asset");
                                                            }
                                                        }}
                                                        className="flex gap-2"
                                                    >
                                                        <input 
                                                            type="text" 
                                                            name="symbol"
                                                            placeholder="Add Ticker (e.g. NVDA)" 
                                                            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 block w-full"
                                                        />
                                                        <button 
                                                            type="submit"
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                                                        >
                                                            Add +
                                                        </button>
                                                    </form>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        You can add {10 - myPortfolio.items.length} more asset{10 - myPortfolio.items.length !== 1 ? 's' : ''}.
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            ) : (
                                <div className="p-8 border-2 border-dashed border-gray-700 rounded-xl text-center">
                                    <p className="text-gray-500">You haven't created a portfolio for this competition yet.</p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {competitions.length === 0 && (
                    <div className="text-center text-gray-500 py-20">
                        Loading competitions...
                    </div>
                )}
            </div>
        </div>
    );
}
