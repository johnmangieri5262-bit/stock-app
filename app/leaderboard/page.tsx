"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch competitions first
        api.get('/competitions/').then(res => {
            setCompetitions(res.data);
            if (res.data.length > 0) {
                setSelectedCompetitionId(res.data[0].id);
            }
        }).catch(err => console.error("Failed to fetch competitions", err));
    }, []);

    useEffect(() => {
        if (!selectedCompetitionId) return;

        setLoading(true);
        api.get(`/competitions/${selectedCompetitionId}/leaderboard`)
            .then(res => {
                setPortfolios(res.data);
            })
            .catch(err => console.error("Failed to fetch leaderboard", err))
            .finally(() => setLoading(false));
    }, [selectedCompetitionId]);

    return (
        <div className="min-h-screen p-8 bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">Leaderboard</h1>
                    <button onClick={() => router.push('/dashboard')} className="text-cyan-400 hover:text-cyan-300 transition-colors">Back to Dashboard</button>
                </header>

                {/* Competition Selector */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    {competitions.map(comp => (
                        <button
                            key={comp.id}
                            onClick={() => setSelectedCompetitionId(comp.id)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${selectedCompetitionId === comp.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {comp.name}
                        </button>
                    ))}
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-gray-700 text-xs uppercase text-gray-200">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Rank</th>
                                    <th scope="col" className="px-6 py-4">User</th>
                                    <th scope="col" className="px-6 py-4">Portfolio Name</th>
                                    <th scope="col" className="px-6 py-4 text-right">Return %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 animate-pulse">Loading rankings...</td></tr>
                                ) : portfolios.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No portfolios found for this competition.</td></tr>
                                ) : portfolios.map((p, index) => (
                                    <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-white">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-300">
                                            {user && user.id === p.owner_id ? <span className="text-cyan-400 font-bold">You</span> : `User ${p.owner_id}`}
                                        </td>
                                        <td className="px-6 py-4 text-white">{p.name || "Untitled"}</td>
                                        <td className={`px-6 py-4 text-right font-mono font-bold text-lg ${p.total_return_percent > 0 ? 'text-green-400' :
                                                p.total_return_percent < 0 ? 'text-red-400' : 'text-gray-400'
                                            }`}>
                                            {p.total_return_percent > 0 ? '+' : ''}{p.total_return_percent.toFixed(2)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
