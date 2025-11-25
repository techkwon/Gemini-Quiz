'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowRight, KeyRound } from 'lucide-react';

function PlayContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pin, setPin] = useState(searchParams.get('pin') || '');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (pin.length !== 6) {
            alert('유효한 6자리 PIN 번호를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const q = query(collection(db, 'game_sessions'), where('pinCode', '==', pin));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert('게임을 찾을 수 없습니다. PIN 번호를 확인해주세요.');
                setLoading(false);
                return;
            }

            const session = snapshot.docs[0];
            router.push(`/play/join?sessionId=${session.id}`);
        } catch (error) {
            console.error("Error joining game:", error);
            alert("게임 참여 중 오류가 발생했습니다.");
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
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <KeyRound className="text-indigo-600 dark:text-indigo-400" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">게임 참여</h1>
                    <p className="text-gray-500 dark:text-gray-400">선생님이 공유한 PIN 번호를 입력하세요.</p>
                </div>

                <div className="space-y-6">
                    <input
                        type="text"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full text-center text-5xl tracking-[0.5em] font-mono font-bold bg-transparent border-b-2 border-gray-200 dark:border-white/10 focus:border-primary focus:ring-0 outline-none py-4 mb-8 text-foreground placeholder-gray-200 dark:placeholder-white/5 transition-all"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    />

                    <button
                        onClick={handleJoin}
                        disabled={loading || pin.length !== 6}
                        className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                    >
                        {loading ? '확인 중...' : '입장하기'}
                        {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Play() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">로딩 중...</div>}>
            <PlayContent />
        </Suspense>
    );
}
