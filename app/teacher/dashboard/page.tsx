'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Plus, Play, Trash2, MoreHorizontal, LayoutGrid, List, Search } from 'lucide-react';

export default function Dashboard() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
    const [showGameSelectModal, setShowGameSelectModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
        if (!confirm('정말로 이 퀴즈 세트를 삭제하시겠습니까?')) return;
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
            alert("게임 세션을 생성하는데 실패했습니다.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );



    const handleEdit = (id: string) => {
        router.push(`/teacher/create-quiz?id=${id}`);
    };

    return (
        <div className="min-h-screen bg-[#fbfbfd] p-6 md:p-12" onClick={() => setActiveMenu(null)}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-[#1d1d1f] tracking-tight">라이브러리</h1>
                        <p className="text-[#86868b] mt-1 text-lg">퀴즈 세트를 관리하고 게임을 시작하세요.</p>
                    </div>
                    <button
                        onClick={() => router.push('/teacher/create-quiz')}
                        className="px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        새 퀴즈 만들기
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="퀴즈 검색..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded shadow-sm transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded shadow-sm transition-all ${viewMode === 'list' ? 'bg-white text-gray-900' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Quiz List/Grid */}
                {quizzes.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">아직 퀴즈가 없습니다</h3>
                        <p className="text-gray-500 mb-6">첫 번째 퀴즈를 만들어보세요.</p>
                        <button
                            onClick={() => router.push('/teacher/create-quiz')}
                            className="text-[#0071e3] font-medium hover:underline"
                        >
                            퀴즈 만들기
                        </button>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className={`group bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 flex ${viewMode === 'grid' ? 'flex-col h-[280px]' : 'flex-row items-center gap-6'}`}>
                                <div className={`flex justify-between items-start ${viewMode === 'grid' ? 'mb-4 w-full' : 'mb-0'}`}>
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                                        {quiz.title.charAt(0).toUpperCase()}
                                    </div>
                                    {viewMode === 'grid' && (
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === quiz.id ? null : quiz.id);
                                                }}
                                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>
                                            {activeMenu === quiz.id && (
                                                <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(quiz.id); }}
                                                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        수정하기
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id); }}
                                                        className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        삭제하기
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className={`flex-1 min-w-0 ${viewMode === 'list' ? 'flex items-center justify-between gap-8' : ''}`}>
                                    <div className={viewMode === 'list' ? 'flex-1' : ''}>
                                        <h3 className="text-xl font-bold text-[#1d1d1f] mb-2 line-clamp-1">{quiz.title}</h3>
                                        <p className="text-[#86868b] text-sm line-clamp-2 mb-4">{quiz.description || "설명이 없습니다."}</p>

                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-6">
                                            <span className="bg-gray-100 px-2 py-1 rounded-md">{quiz.questions?.length || 0} 문제</span>
                                            <span>•</span>
                                            <span>최근 업데이트</span>
                                        </div>
                                    </div>

                                    <div className={`flex gap-3 ${viewMode === 'grid' ? 'mt-auto' : 'shrink-0'}`}>
                                        <button
                                            onClick={() => handleHostClick(quiz.id)}
                                            className="px-6 py-2.5 bg-[#1d1d1f] hover:bg-[#333] text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Play size={16} fill="currentColor" /> 게임 시작
                                        </button>

                                        {viewMode === 'list' && (
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(activeMenu === quiz.id ? null : quiz.id);
                                                    }}
                                                    className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600 border border-gray-200"
                                                >
                                                    <MoreHorizontal size={20} />
                                                </button>
                                                {activeMenu === quiz.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(quiz.id); }}
                                                            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                        >
                                                            수정하기
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id); }}
                                                            className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            삭제하기
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {viewMode === 'grid' && (
                                            <button
                                                onClick={() => handleDelete(quiz.id)}
                                                className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium text-sm transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Game Selection Modal */}
                {showGameSelectModal && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                        <div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-5xl w-full mx-4 border border-white/20">
                            <h2 className="text-3xl font-bold mb-2 text-center text-[#1d1d1f]">게임 모드 선택</h2>
                            <p className="text-center text-[#86868b] mb-10">학생들이 퀴즈를 풀 방식을 선택해주세요.</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Mario Mode */}
                                <button
                                    onClick={() => confirmHostGame('MARIO')}
                                    className="group relative overflow-hidden rounded-3xl bg-[#f5f5f7] p-6 hover:bg-[#fff] hover:shadow-xl transition-all duration-300 text-left border border-transparent hover:border-red-200"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">🍄</div>
                                    <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">슈퍼 마리오</h3>
                                    <p className="text-sm text-[#86868b] leading-relaxed">클래식 플랫폼 게임 경험. 점프하고, 달리고, 정답을 맞추며 코인을 모으세요.</p>
                                </button>

                                {/* Battle Mode */}
                                <button
                                    onClick={() => confirmHostGame('BATTLE')}
                                    className="group relative overflow-hidden rounded-3xl bg-[#f5f5f7] p-6 hover:bg-[#fff] hover:shadow-xl transition-all duration-300 text-left border border-transparent hover:border-purple-200"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">⚔️</div>
                                    <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">배틀 아레나</h3>
                                    <p className="text-sm text-[#86868b] leading-relaxed">치열한 1:1 대결. 정답을 맞출 때마다 상대에게 데미지를 입힙니다.</p>
                                </button>

                                {/* One Punch Mode */}
                                <button
                                    onClick={() => confirmHostGame('ONE_PUNCH')}
                                    className="group relative overflow-hidden rounded-3xl bg-[#f5f5f7] p-6 hover:bg-[#fff] hover:shadow-xl transition-all duration-300 text-left border border-transparent hover:border-yellow-200"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">👊</div>
                                    <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">히어로 시험</h3>
                                    <p className="text-sm text-[#86868b] leading-relaxed">C급에서 S급 히어로까지 승급하세요. 당신의 지식을 증명하세요.</p>
                                </button>
                            </div>

                            <div className="mt-10 text-center">
                                <button
                                    onClick={() => setShowGameSelectModal(false)}
                                    className="px-8 py-3 text-[#86868b] hover:text-[#1d1d1f] font-medium transition-colors"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
