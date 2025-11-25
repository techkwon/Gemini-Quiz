'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Results({ params }: { params: Promise<{ sessionId: string }> }) {
    const router = useRouter();
    const { sessionId } = use(params);
    const [topPlayers, setTopPlayers] = useState<any[]>([]);

    useEffect(() => {
        const fetchResults = async () => {
            const q = query(
                collection(db, 'game_sessions', sessionId, 'players'),
                orderBy('score', 'desc'),
                limit(3)
            );
            const snapshot = await getDocs(q);
            const players = snapshot.docs.map(doc => doc.data());
            setTopPlayers(players);
        };
        fetchResults();
    }, [sessionId]);

    const [showRestartModal, setShowRestartModal] = useState(false);

    const handleRestart = async () => {
        await updateDoc(doc(db, 'game_sessions', sessionId), {
            status: 'WAITING',
            startTime: null,
            endTime: null
        });
        router.push(`/host/${sessionId}/lobby`);
    };

    return (
        <div className="min-h-screen bg-indigo-900 text-white flex flex-col items-center justify-center p-8 relative">
            <h1 className="text-5xl font-bold mb-12 text-yellow-400">🏆 Hall of Fame 🏆</h1>

            <div className="flex items-end justify-center space-x-4 mb-12">
                {/* 2nd Place */}
                {topPlayers[1] && (
                    <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="text-xl font-bold mb-2">{topPlayers[1].name}</div>
                        <div className="w-32 h-48 bg-gray-400 rounded-t-lg flex items-center justify-center text-4xl font-bold shadow-lg">
                            2
                        </div>
                        <div className="mt-2 text-gray-300">{topPlayers[1].score} pts</div>
                    </div>
                )}

                {/* 1st Place */}
                {topPlayers[0] && (
                    <div className="flex flex-col items-center animate-slide-up">
                        <div className="text-2xl font-bold mb-2 text-yellow-300">👑 {topPlayers[0].name}</div>
                        <div className="w-40 h-64 bg-yellow-500 rounded-t-lg flex items-center justify-center text-6xl font-bold shadow-xl z-10">
                            1
                        </div>
                        <div className="mt-2 text-yellow-300 font-bold">{topPlayers[0].score} pts</div>
                    </div>
                )}

                {/* 3rd Place */}
                {topPlayers[2] && (
                    <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <div className="text-xl font-bold mb-2">{topPlayers[2].name}</div>
                        <div className="w-32 h-32 bg-orange-500 rounded-t-lg flex items-center justify-center text-4xl font-bold shadow-lg">
                            3
                        </div>
                        <div className="mt-2 text-orange-300">{topPlayers[2].score} pts</div>
                    </div>
                )}
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => router.push('/teacher/dashboard')}
                    className="px-8 py-3 bg-white text-indigo-900 rounded-full font-bold hover:bg-gray-100 transition-colors"
                >
                    Back to Dashboard
                </button>
                <button
                    onClick={() => setShowRestartModal(true)}
                    className="px-8 py-3 bg-yellow-400 text-indigo-900 rounded-full font-bold hover:bg-yellow-300 transition-colors shadow-lg animate-pulse"
                >
                    Play Again 🔄
                </button>
            </div>

            {/* Custom Restart Modal */}
            {showRestartModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white text-gray-900 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center transform scale-100 transition-transform">
                        <h3 className="text-2xl font-bold mb-4">🔄 Restart Game?</h3>
                        <p className="text-gray-600 mb-8 text-lg">
                            This will return everyone to the lobby with the same players.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setShowRestartModal(false)}
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRestart}
                                className="px-6 py-3 bg-yellow-400 text-indigo-900 rounded-xl font-bold hover:bg-yellow-500 transition"
                            >
                                Restart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
