'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

function LobbyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');
    const playerId = searchParams.get('playerId');

    const [status, setStatus] = useState('WAITING');

    useEffect(() => {
        if (!sessionId) return;

        const sessionRef = doc(db, 'game_sessions', sessionId);
        const unsubscribe = onSnapshot(sessionRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.status === 'PLAYING') {
                    router.push(`/play/game?sessionId=${sessionId}&playerId=${playerId}`);
                }
            }
        });

        return () => unsubscribe();
    }, [sessionId, playerId, router]);

    return (
        <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center text-white p-4">
            <div className="animate-bounce text-6xl mb-8">⏳</div>
            <h1 className="text-3xl font-bold mb-4 text-center">You're in!</h1>
            <p className="text-xl opacity-80 text-center">Waiting for the host to start the game...</p>

            <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
                <p className="text-sm font-mono opacity-60">Session ID: {sessionId?.slice(0, 8)}...</p>
            </div>
        </div>
    );
}

export default function StudentLobby() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LobbyContent />
        </Suspense>
    );
}
