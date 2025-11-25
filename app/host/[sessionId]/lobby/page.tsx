'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

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

    if (loading || !session) return <div className="flex min-h-screen items-center justify-center">Loading lobby...</div>;

    const joinUrl = `${window.location.origin}/play?pin=${session.pinCode}`;

    return (
        <div className="min-h-screen bg-indigo-900 text-white flex flex-col items-center p-8 relative">
            <div className="w-full max-w-6xl flex justify-between items-start mb-12">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <button
                            onClick={handleExitLobby}
                            className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Join at {window.location.host}/play</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-6xl font-mono font-bold bg-white text-indigo-900 px-8 py-4 rounded-xl inline-block">
                            PIN: {session.pinCode}
                        </div>
                        <button
                            onClick={handleCopyUrl}
                            className={`px-6 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 ${copied
                                ? 'bg-green-500 text-white'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {copied ? 'Copied! ✅' : 'Copy Link 🔗'}
                        </button>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG value={joinUrl} size={150} />
                </div>
            </div>

            <div className="w-full max-w-6xl flex-1">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{players.length} Players Joined</h2>
                    <button
                        onClick={handleStartGame}
                        disabled={players.length === 0}
                        className="px-8 py-4 bg-green-500 text-white text-xl font-bold rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform transition hover:scale-105"
                    >
                        Start Game 🚀
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {players.map((player) => (
                        <div
                            key={player.id}
                            className="bg-white/10 backdrop-blur rounded-lg p-4 text-center animate-bounce-in"
                        >
                            <div className="w-12 h-12 bg-indigo-500 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl">
                                👤
                            </div>
                            <div className="font-bold truncate">{player.name}</div>
                            <div className="text-xs opacity-70">{player.studentId}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Exit Modal */}
            {showExitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white text-gray-900 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center transform scale-100 transition-transform">
                        <h3 className="text-2xl font-bold mb-4">⚠️ End Session?</h3>
                        <p className="text-gray-600 mb-8 text-lg">
                            This will disconnect all players and return you to the dashboard.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmExit}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                            >
                                End Session
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
