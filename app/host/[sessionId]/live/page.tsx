'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, updateDoc, orderBy, query } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function LiveGame({ params }: { params: Promise<{ sessionId: string }> }) {
    const router = useRouter();
    const { sessionId } = use(params);
    const [players, setPlayers] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState(120); // Default 2 mins

    useEffect(() => {
        // Real-time leaderboard
        const playersRef = collection(db, 'game_sessions', sessionId, 'players');
        const q = query(playersRef, orderBy('score', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const playersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPlayers(playersData);
        });

        // Timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleEndGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            unsubscribe();
            clearInterval(timer);
        };
    }, [sessionId]);

    const handleEndGame = async () => {
        await updateDoc(doc(db, 'game_sessions', sessionId), {
            status: 'FINISHED',
            endTime: new Date()
        });
        router.push(`/host/${sessionId}/results`);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Live Leaderboard</h1>
                <div className="text-4xl font-mono font-bold text-yellow-400">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <button
                    onClick={handleEndGame}
                    className="px-6 py-2 bg-red-600 rounded hover:bg-red-700"
                >
                    End Game Now
                </button>
            </div>

            <div className="space-y-4 max-w-4xl mx-auto">
                {players.map((player, index) => (
                    <div
                        key={player.id}
                        className={`flex items-center p-4 rounded-lg transform transition-all duration-500 ${index === 0 ? 'bg-yellow-500/20 border-2 border-yellow-500 scale-105' :
                            index === 1 ? 'bg-gray-400/20 border-2 border-gray-400' :
                                index === 2 ? 'bg-orange-500/20 border-2 border-orange-500' :
                                    'bg-white/5'
                            }`}
                    >
                        <div className="w-12 text-2xl font-bold text-center">
                            {index + 1}
                        </div>
                        <div className="flex-1 ml-4">
                            <div className="font-bold text-lg">{player.name}</div>
                            <div className="text-sm opacity-70">{player.studentId}</div>
                        </div>
                        <div className="text-2xl font-mono font-bold">
                            {player.score?.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
