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

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Game...</div>;
    if (!quizSet) return <div>Error loading quiz data</div>;

    if (gameStatus === 'WAITING') {
        return (
            <div className="min-h-screen bg-indigo-900 text-white flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-8 animate-pulse">Waiting for Host to Start...</h1>
                <div className="text-8xl animate-bounce">⏳</div>
                <p className="mt-8 text-xl text-indigo-200">Get Ready!</p>
            </div>
        );
    }

    if (gameStatus === 'FINISHED') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4 text-red-500">GAME OVER</h1>
                <p className="text-xl">The teacher has ended the game.</p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-8 px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200"
                >
                    Back to Home
                </button>
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
