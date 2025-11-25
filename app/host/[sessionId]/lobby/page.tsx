'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Copy, Check, Users, Play } from 'lucide-react';

export default function Lobby({ params }: { params: Promise<{ sessionId: string }> }) {
    const router = useRouter();
    const { sessionId } = use(params);
    const [session, setSession] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const sessionRef = doc(db, 'game_sessions', sessionId);
        const unsubscribeSession = onSnapshot(sessionRef, (doc) => {
            if (doc.exists()) {
                setSession(doc.data());
                if (doc.data().status === 'PLAYING') {
                    router.push(`/host/${sessionId}/live`);
                }
            }
        });

        const playersRef = collection(db, 'game_sessions', sessionId, 'players');
        const unsubscribePlayers = onSnapshot(playersRef, (snapshot) => {
            const playersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPlayers(playersData);
        });

        setLoading(false);

        return () => {
            unsubscribeSession();
            unsubscribePlayers();
        };
    }, [sessionId, router]);

    const handleStartGame = async () => {
        try {
            await updateDoc(doc(db, 'game_sessions', sessionId), {
                status: 'PLAYING',
                startTime: new Date()
            });
        } catch (error) {
            console.error("Error starting game:", error);
        }
    };

    const handleCopyUrl = () => {
        const url = `${window.location.origin}/play?pin=${session.pinCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const [showExitModal, setShowExitModal] = useState(false);

    const handleExitLobby = () => {
        setShowExitModal(true);
    };

    const confirmExit = async () => {
        await updateDoc(doc(db, 'game_sessions', sessionId), {
            status: 'FINISHED'
        });
        router.push('/teacher/dashboard');
    };

    if (loading || !session) return (
        <div className="min-h-screen flex items-center justify-center bg-[#1d1d1f] text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
    );

    const joinUrl = `${window.location.origin}/play?pin=${session.pinCode}`;

    return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center p-8 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px] animate-pulse delay-1000"></div>

            {/* Header / Top Bar */}
            <div className="w-full max-w-7xl flex justify-between items-center mb-12 z-10">
                <button
                    onClick={handleExitLobby}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    로비 나가기
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md">
                    <Users size={16} className="text-gray-400" />
                    <span className="font-bold">{players.length}</span>
                    <span className="text-gray-400 text-sm">명 참여 중</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-7xl flex flex-col md:flex-row gap-12 items-center justify-center flex-1 z-10">

                {/* Left: Join Info */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-8">
                    <div>
                        <h2 className="text-2xl font-medium text-gray-400 mb-2">접속 주소</h2>
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                            {window.location.host}/play
                        </h1>
                    </div>

                    <div>
                        <h2 className="text-2xl font-medium text-gray-400 mb-4">게임 PIN</h2>
                        <div className="flex items-center gap-4">
                            <div className="text-7xl md:text-9xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                                {session.pinCode}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleCopyUrl}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1d1d1f] hover:bg-[#2c2c2e] border border-white/10 transition-all group"
                    >
                        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-400 group-hover:text-white" />}
                        <span className="font-medium">{copied ? '링크 복사됨' : '참여 링크 복사'}</span>
                    </button>
                </div>

                {/* Right: QR Code */}
                <div className="p-6 bg-white rounded-[32px] shadow-2xl shadow-blue-500/10">
                    <QRCodeSVG value={joinUrl} size={280} />
                </div>
            </div>

            {/* Players Grid */}
            <div className="w-full max-w-7xl mt-12 z-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {players.map((player, idx) => (
                        <div
                            key={player.id}
                            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 animate-in fade-in zoom-in duration-300 border border-white/5"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-900 ${['bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-yellow-400', 'bg-pink-400'][idx % 5]
                                }`}>
                                {player.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold truncate text-sm">{player.name}</div>
                                <div className="text-xs text-gray-400 truncate">{player.studentId}</div>
                            </div>
                        </div>
                    ))}
                    {players.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 italic">
                            학생들의 입장을 기다리는 중입니다...
                        </div>
                    )}
                </div>
            </div>

            {/* Start Button Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20 flex justify-center">
                <button
                    onClick={handleStartGame}
                    disabled={players.length === 0}
                    className="px-12 py-5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xl font-bold rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all transform hover:scale-105 flex items-center gap-3"
                >
                    <Play fill="currentColor" />
                    게임 시작
                </button>
            </div>

            {/* Custom Exit Modal */}
            {showExitModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-[#1c1c1e] text-white p-8 rounded-[24px] shadow-2xl max-w-md w-full text-center border border-white/10">
                        <h3 className="text-2xl font-bold mb-4">세션을 종료하시겠습니까?</h3>
                        <p className="text-gray-400 mb-8 text-lg">
                            모든 플레이어의 연결이 끊어지고 대시보드로 돌아갑니다.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="px-6 py-3 bg-[#2c2c2e] text-white rounded-xl font-bold hover:bg-[#3a3a3c] transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmExit}
                                className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/50 rounded-xl font-bold hover:bg-red-500 hover:text-white transition"
                            >
                                세션 종료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
