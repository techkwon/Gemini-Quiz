'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Suspense } from 'react';
import { ArrowRight, User, Hash } from 'lucide-react';

function JoinContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');

    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [loading, setLoading] = useState(false);

    if (!sessionId) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#86868b]">
            유효하지 않은 세션입니다.
        </div>
    );

    const handleSubmit = async () => {
        if (!name || !studentId) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const playerRef = await addDoc(collection(db, 'game_sessions', sessionId, 'players'), {
                name,
                studentId,
                score: 0,
                status: 'READY',
                joinedAt: new Date()
            });

            // Store player ID in localStorage for reconnection
            localStorage.setItem('playerId', playerRef.id);
            localStorage.setItem('sessionId', sessionId);

            router.push(`/play/lobby?sessionId=${sessionId}&playerId=${playerRef.id}`);
        } catch (error) {
            console.error("Error joining:", error);
            alert("참여에 실패했습니다.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-700"></div>

            <div className="bg-card backdrop-blur-xl border border-card-border shadow-2xl rounded-[32px] p-8 md:p-12 w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-foreground mb-2">게임 참여하기</h1>
                    <p className="text-gray-500 dark:text-gray-400">정보를 입력하고 게임을 시작하세요.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">닉네임</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                suppressHydrationWarning
                                className="w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none text-lg transition-all text-foreground placeholder-gray-400"
                                placeholder="이름을 입력하세요"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">학번</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                suppressHydrationWarning
                                className="w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none text-lg transition-all text-foreground placeholder-gray-400"
                                placeholder="예: 2024001"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-medium text-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 transition-all mt-8"
                    >
                        {loading ? '참여 중...' : '게임 입장'}
                        {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function JoinGame() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">로딩 중...</div>}>
            <JoinContent />
        </Suspense>
    );
}
