"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CreatePortfolioForm() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const competitionId = searchParams.get('competitionId');
    const competitionName = searchParams.get('competitionName');

    const [name, setName] = useState('');
    // Start with 3 empty slots (minimum requirement)
    const [tickers, setTickers] = useState<string[]>(['', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!competitionId) {
        return (
            <div className="text-center p-10">
                <p className="text-red-400">No competition selected. Please clear dashboards and select a competition.</p>
                <button onClick={() => router.push('/dashboard')} className="mt-4 text-blue-400 underline">Back to Dashboard</button>
            </div>
        )
    }

    const handleTickerChange = (index: number, value: string) => {
        const newTickers = [...tickers];
        newTickers[index] = value.toUpperCase();
        setTickers(newTickers);
    };

    const addTicker = () => {
        if (tickers.length < 10) {
            setTickers([...tickers, '']);
        }
    };

    const removeTicker = (index: number) => {
        if (tickers.length > 3) {
            const newTickers = tickers.filter((_, i) => i !== index);
            setTickers(newTickers);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError('');
        setLoading(true);

        // Basic validation
        const filledTickers = tickers.filter(t => t.trim() !== '');

        if (filledTickers.length < 3) {
            setError('You must select at least 3 assets.');
            setLoading(false);
            return;
        }

        if (filledTickers.length > 10) {
            setError('You can select a maximum of 10 assets.');
            setLoading(false);
            return;
        }

        // Check for duplicates
        if (new Set(filledTickers).size !== filledTickers.length) {
            setError('Please remove duplicate tickers.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                name,
                competition_id: parseInt(competitionId),
                items: filledTickers.map(t => ({
                    symbol: t,
                    asset_type: "STOCK",
                    quantity: 1
                }))
            };

            await api.post(`/users/${user.id}/portfolios/`, payload);
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError('Failed to create portfolio. ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Create Portfolio</h1>
            <p className="text-gray-400 mb-8">Competition: <span className="text-cyan-400 font-semibold">{competitionName || 'Unknown'}</span></p>

            <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
                <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-300">Portfolio Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. My Winning Strategy"
                        required
                    />
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-gray-300">
                            Select Assets (Min 3, Max 10)
                        </label>
                        <span className="text-xs text-gray-500">{tickers.length}/10 slots used</span>
                    </div>

                    <div className="space-y-3">
                        {tickers.map((ticker, idx) => (
                            <div key={idx} className="flex items-center gap-3 animate-fade-in-up">
                                <span className="w-6 text-gray-500 font-mono text-right text-sm">{idx + 1}.</span>
                                <input
                                    type="text"
                                    value={ticker}
                                    onChange={e => handleTickerChange(idx, e.target.value)}
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg p-3 text-white font-mono uppercase focus:border-blue-500 outline-none"
                                    placeholder="Enter Ticker (e.g. AAPL)"
                                    required
                                />
                                {tickers.length > 3 && (
                                    <button
                                        type="button"
                                        onClick={() => removeTicker(idx)}
                                        className="text-red-400 hover:text-red-300 p-2"
                                        title="Remove asset"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {tickers.length < 10 && (
                        <button
                            type="button"
                            onClick={addTicker}
                            className="mt-4 w-full py-3 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>+ Add Another Asset</span>
                        </button>
                    )}

                    <p className="text-xs text-gray-500 mt-3">*Supports Stocks, ETFs, and Crypto pairs (e.g. BTC-USD)</p>
                </div>

                {error && <div className="p-4 mb-6 text-sm text-red-200 bg-red-900/40 border border-red-500/20 rounded-lg text-center animate-pulse">{error}</div>}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-sm px-8 py-3 shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Portfolio...' : 'Submit Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function CreatePortfolioPage() {
    return (
        <div className="min-h-screen p-8 bg-gray-900 text-white">
            <Suspense fallback={<div>Loading...</div>}>
                <CreatePortfolioForm />
            </Suspense>
        </div>
    );
}
