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
        <div className="min-h-screen bg-background text-foreground p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">실시간 리더보드</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">학생들의 점수가 실시간으로 업데이트됩니다.</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="px-6 py-3 bg-card border border-card-border rounded-2xl shadow-sm flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">남은 시간</span>
                            <div className="text-3xl font-mono font-bold text-primary tabular-nums">
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                        </div>

                        <button
                            onClick={handleEndGame}
                            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl font-bold transition-all"
                        >
                            게임 종료
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {players.map((player, index) => (
                        <div
                            key={player.id}
                            className={`flex items-center p-6 rounded-3xl transform transition-all duration-500 ${index === 0 ? 'bg-yellow-500/10 border-2 border-yellow-500/50 scale-105 shadow-lg shadow-yellow-500/10 z-10' :
                                index === 1 ? 'bg-gray-400/10 border-2 border-gray-400/50 scale-102 z-0' :
                                    index === 2 ? 'bg-orange-500/10 border-2 border-orange-500/50 scale-100 z-0' :
                                        'bg-card border border-card-border shadow-sm'
                                }`}
                        >
                            <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl mr-6 ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                    index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300' :
                                        index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                                            'bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                                }`}>
                                {index + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-xl text-foreground truncate">{player.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{player.studentId}</div>
                            </div>

                            <div className="text-3xl font-mono font-bold text-foreground tabular-nums">
                                {player.score?.toLocaleString()}
                            </div>
                        </div>
                    ))}

                    {players.length === 0 && (
                        <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-card rounded-3xl border border-dashed border-card-border">
                            아직 점수가 집계되지 않았습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
