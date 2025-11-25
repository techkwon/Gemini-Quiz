'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
    const [showGameSelectModal, setShowGameSelectModal] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        if (!auth.currentUser) return;
        try {
            const q = query(
                collection(db, 'quiz_sets'),
                where('teacherId', '==', auth.currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const quizData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setQuizzes(quizData);
        } catch (error) {
            console.error("Error fetching quizzes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this quiz set?')) return;
        try {
            await deleteDoc(doc(db, 'quiz_sets', id));
            fetchQuizzes();
        } catch (error) {
            console.error("Error deleting quiz:", error);
        }
    };

    const handleHostClick = (quizId: string) => {
        setSelectedQuizId(quizId);
        setShowGameSelectModal(true);
    };

    const confirmHostGame = async (gameType: 'MARIO' | 'BATTLE' | 'ONE_PUNCH') => {
        if (!selectedQuizId) return;

        try {
            // Generate 6-digit PIN
            const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

            const sessionRef = await addDoc(collection(db, 'game_sessions'), {
                teacherId: auth.currentUser?.uid,
                quizSetId: selectedQuizId,
                pinCode,
                status: 'WAITING',
                gameType: gameType,
                createdAt: serverTimestamp(),
                settings: {
                    timeLimit: 120
                }
            });

            router.push(`/host/${sessionRef.id}/lobby`);
        } catch (error) {
            console.error("Error creating session:", error);
            alert("Failed to create game session");
        }
    };

    if (loading) return <div>Loading quizzes...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Quiz Sets</h1>
                <button
                    onClick={() => router.push('/teacher/create-quiz')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    + Create New Quiz
                </button>
            </div>

            {quizzes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No quizzes found. Create your first one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 truncate">{quiz.title}</h3>
                                <p className="mt-1 text-sm text-gray-500 truncate">{quiz.description}</p>
                                <p className="mt-2 text-xs text-gray-400">{quiz.questions?.length || 0} Questions</p>
                                <div className="mt-4 flex space-x-2">
                                    <button
                                        onClick={() => handleHostClick(quiz.id)}
                                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                    >
                                        Host Game
                                    </button>
                                    <button
                                        onClick={() => handleDelete(quiz.id)}
                                        className="px-3 py-2 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Game Selection Modal */}
            {showGameSelectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full">
                        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Select Game Mode</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Mario Mode */}
                            <button
                                onClick={() => confirmHostGame('MARIO')}
                                className="group relative overflow-hidden rounded-xl border-4 border-red-500 bg-red-50 p-4 hover:scale-105 transition-transform"
                            >
                                <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <div className="text-6xl mb-4 text-center">🍄</div>
                                <h3 className="text-xl font-black text-red-600 text-center mb-2">SUPER MARIO</h3>
                                <p className="text-sm text-gray-600 text-center">Classic platformer quiz. Jump and collect coins!</p>
                            </button>

                            {/* Battle Mode */}
                            <button
                                onClick={() => confirmHostGame('BATTLE')}
                                className="group relative overflow-hidden rounded-xl border-4 border-purple-500 bg-purple-50 p-4 hover:scale-105 transition-transform"
                            >
                                <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <div className="text-6xl mb-4 text-center">⚔️</div>
                                <h3 className="text-xl font-black text-purple-600 text-center mb-2">BATTLE QUIZ</h3>
                                <p className="text-sm text-gray-600 text-center">1v1 Fighting Action. Attack with correct answers!</p>
                            </button>

                            {/* One Punch Mode */}
                            <button
                                onClick={() => confirmHostGame('ONE_PUNCH')}
                                className="group relative overflow-hidden rounded-xl border-4 border-yellow-500 bg-yellow-50 p-4 hover:scale-105 transition-transform"
                            >
                                <div className="absolute inset-0 bg-yellow-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <div className="text-6xl mb-4 text-center">👊</div>
                                <h3 className="text-xl font-black text-yellow-600 text-center mb-2">ONE PUNCH</h3>
                                <p className="text-sm text-gray-600 text-center">Hero Association Exam. Prove your S-Class knowledge!</p>
                            </button>
                        </div>
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setShowGameSelectModal(false)}
                                className="px-6 py-2 text-gray-500 hover:text-gray-700 font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
