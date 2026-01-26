"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Portfolio {
    id: number;
    name: string;
    owner_id: number;
    total_return_percent: number;
    total_value: number;
}

// Add to imports
// import { X, Lock } from 'lucide-react';

interface PortfolioItem {
    id: number;
    symbol: string;
    quantity: number;
    current_price: number;
    initial_price: number;
    asset_type: string;
}

interface PortfolioDetails extends Portfolio {
    items: PortfolioItem[];
}

export default function CompetitionLeaderboardPage() {
    const { id } = useParams(); // competition id
    const { user } = useAuth();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal State
    const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (!id) return;

        api.get(`/competitions/${id}/leaderboard`)
            .then(res => {
                setPortfolios(res.data);
            })
            .catch(err => {
                console.error("Failed to fetch leaderboard", err);
                setError('Failed to load leaderboard data.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleRowClick = async (portfolioId: number) => {
        setLoadingDetails(true);
        setIsModalOpen(true);
        setSelectedPortfolio(null);

        try {
            // Pass user_id for owner check logic in backend
            const userIdParam = user ? `?user_id=${user.id}` : '';
            const res = await api.get(`/portfolios/${portfolioId}${userIdParam}`);
            setSelectedPortfolio(res.data);
        } catch (err) {
            console.error("Failed to fetch portfolio details", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                            Competition Leaderboard
                        </h1>
                        <p className="text-gray-400 mt-2">Check the top performers</p>
                    </div>
                    <a href="/dashboard" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors border border-gray-700">
                        Back to Dashboard
                    </a>
                </header>

                {error && (
                    <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                        {error}
                    </div>
                )}

                <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-gray-800 text-xs uppercase text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4">Rank</th>
                                <th scope="col" className="px-6 py-4">Portfolio</th>
                                <th scope="col" className="px-6 py-4">Player</th>
                                <th scope="col" className="px-6 py-4 text-right">Return</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center animate-pulse">Loading leaderboard...</td></tr>
                            ) : portfolios.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No portfolios found in this competition.</td></tr>
                            ) : portfolios.map((p, index) => {
                                const isCurrentUser = user && user.id === p.owner_id;
                                const isPositive = p.total_return_percent >= 0;

                                return (
                                    <tr
                                        key={p.id}
                                        onClick={() => handleRowClick(p.id)}
                                        className={`transition-colors cursor-pointer ${isCurrentUser ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'hover:bg-gray-700/30'}`}
                                    >
                                        <td className="px-6 py-4 font-bold text-white">
                                            {index === 0 && <span className="mr-2 text-yellow-400">🥇</span>}
                                            {index === 1 && <span className="mr-2 text-gray-300">🥈</span>}
                                            {index === 2 && <span className="mr-2 text-amber-600">🥉</span>}
                                            #{index + 1}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">{p.name || "Untitled"}</td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            {isCurrentUser && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">YOU</span>}
                                            <span className="font-semibold text-cyan-300">
                                                {/* @ts-ignore - owner might be missing in type def but present in API */}
                                                {p.owner?.username || `User ${p.owner_id}`}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold w-32 text-lg ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                            {isPositive ? '+' : ''}{p.total_return_percent.toFixed(2)}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Portfolio Details Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {selectedPortfolio ? selectedPortfolio.name : 'Loading...'}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {selectedPortfolio?.total_return_percent !== undefined && (
                                        <span className={selectedPortfolio.total_return_percent >= 0 ? "text-green-400" : "text-red-400"}>
                                            {selectedPortfolio.total_return_percent >= 0 ? '+' : ''}{selectedPortfolio.total_return_percent.toFixed(2)}% Return
                                        </span>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingDetails ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                                    <p className="text-gray-500 animate-pulse">Fetching portfolio details...</p>
                                </div>
                            ) : selectedPortfolio ? (
                                selectedPortfolio.items && selectedPortfolio.items.length > 0 ? (
                                    <table className="w-full text-left text-sm text-gray-300">
                                        <thead className="bg-gray-800/50 text-xs uppercase text-gray-500 font-bold sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 rounded-l-lg">Symbol</th>
                                                <th className="px-4 py-3 text-right">Shares</th>
                                                <th className="px-4 py-3 text-right">Avg Price</th>
                                                <th className="px-4 py-3 text-right rounded-r-lg">Current</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {selectedPortfolio.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3 font-bold text-white">{item.symbol}</td>
                                                    <td className="px-4 py-3 text-right text-gray-400">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right">${item.initial_price.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right text-gray-200">${item.current_price.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t border-gray-700 bg-gray-800/30">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-400">Total Value</td>
                                                <td className="px-4 py-3 text-right font-bold text-white text-lg">
                                                    ${selectedPortfolio.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-gray-800/30 rounded-2xl border border-gray-800 border-dashed">
                                        <div className="p-4 bg-gray-800 rounded-full text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-300">Positions Hidden</h3>
                                            <p className="text-gray-500 max-w-xs mx-auto mt-1">
                                                This portfolio's positions are hidden until the competition deadline passes (Jan 1st).
                                            </p>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <p className="text-red-400 text-center">Failed to load details.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
