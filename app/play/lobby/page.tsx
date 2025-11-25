'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, CheckCircle2 } from 'lucide-react';

function LobbyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');
    const playerId = searchParams.get('playerId');

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
        <div className="min-h-screen bg-[#fbfbfd] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-green-400/10 rounded-full blur-[120px] animate-pulse"></div>

            <div className="glass-card p-12 w-full max-w-md text-center relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
                    <CheckCircle2 className="text-green-600" size={40} />
                </div>

                <h1 className="text-3xl font-bold text-[#1d1d1f] mb-4">입장 완료!</h1>
                <p className="text-[#86868b] text-lg mb-12">
                    선생님이 게임을 시작할 때까지 기다려주세요...
                </p>

                <div className="flex items-center gap-3 px-6 py-3 bg-[#f5f5f7] rounded-full">
                    <Loader2 className="animate-spin text-gray-400" size={18} />
                    <span className="text-sm font-medium text-gray-500 font-mono">
                        세션 ID: {sessionId?.slice(0, 6)}...
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function StudentLobby() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">로딩 중...</div>}>
            <LobbyContent />
        </Suspense>
    );
}
