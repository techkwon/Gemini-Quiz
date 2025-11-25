'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import MarioGame from '@/components/games/MarioGame';
import BattleGame from '@/components/games/BattleGame';
import OnePunchGame from '@/components/games/OnePunchGame';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';

function GameContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');
    const playerId = searchParams.get('playerId');

    const [quizSet, setQuizSet] = useState<any>(null);
    const [gameType, setGameType] = useState<'MARIO' | 'BATTLE' | 'ONE_PUNCH'>('MARIO');
    const [loading, setLoading] = useState(true);
    const [gameStatus, setGameStatus] = useState('WAITING');
    const gameStatusRef = useRef(gameStatus);

    useEffect(() => {
        gameStatusRef.current = gameStatus;
    }, [gameStatus]);

    useEffect(() => {
        if (!sessionId) return;

        // Initial fetch for quiz data
        const fetchGameData = async () => {
            const sessionDoc = await getDoc(doc(db, 'game_sessions', sessionId));
            if (sessionDoc.exists()) {
                const data = sessionDoc.data();
                const quizId = data.quizSetId;
                setGameType(data.gameType || 'MARIO'); // Default to MARIO if not set
                const quizDoc = await getDoc(doc(db, 'quiz_sets', quizId));
                if (quizDoc.exists()) {
                    setQuizSet(quizDoc.data());
                }
            }
            setLoading(false);
        };
        fetchGameData();

        // Real-time listener for game status
        const unsubscribe = onSnapshot(doc(db, 'game_sessions', sessionId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                console.log("Game Status Update:", data.status); // Debug log

                if (data.status === 'FINISHED') {
                    setGameStatus('FINISHED');
                } else if (data.status === 'WAITING') {
                    // Check if we need to reload (if coming from FINISHED)
                    if (gameStatusRef.current === 'FINISHED') {
                        window.location.reload();
                    } else {
                        setGameStatus('WAITING');
                    }
                } else if (data.status === 'PLAYING') {
                    setGameStatus('PLAYING');
                }
            }
        });

        return () => unsubscribe();
    }, [sessionId]);

    const handleScoreUpdate = async (points: number) => {
        if (!sessionId || !playerId) return;
        await updateDoc(doc(db, 'game_sessions', sessionId, 'players', playerId), {
            score: points
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
    if (!quizSet) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Error loading quiz data</div>;

    if (gameStatus === 'WAITING') {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 transition-colors duration-300 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

                <div className="relative z-10 text-center">
                    <div className="text-8xl mb-8 animate-bounce">⏳</div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                        게임 시작 대기 중...
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                        선생님이 곧 게임을 시작합니다!
                    </p>
                </div>
            </div>
        );
    }

    if (gameStatus === 'FINISHED') {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 transition-colors duration-300">
                <div className="bg-card p-12 rounded-[32px] shadow-2xl border border-card-border text-center max-w-md w-full">
                    <h1 className="text-4xl font-bold mb-4 text-red-500">GAME OVER</h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 mb-8">게임이 종료되었습니다.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full px-6 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    if (gameType === 'BATTLE') {
        return (
            <div className="w-full h-screen overflow-hidden bg-black">
                <BattleGame
                    questions={quizSet.questions}
                    onScoreUpdate={handleScoreUpdate}
                />
            </div>
        );
    }

    if (gameType === 'ONE_PUNCH') {
        return (
            <div className="w-full h-screen overflow-hidden bg-black">
                <OnePunchGame
                    questions={quizSet.questions}
                    onScoreUpdate={handleScoreUpdate}
                />
            </div>
        );
    }

    // Default to Mario
    return (
        <div className="w-full h-screen overflow-hidden bg-black">
            <MarioGame
                questions={quizSet.questions}
                onScoreUpdate={handleScoreUpdate}
            />
        </div>
    );
}

export default function GameContainer() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GameContent />
        </Suspense>
    );
}
