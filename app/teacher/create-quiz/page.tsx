'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';

interface Question {
    q: string;
    options: string[];
    answer: number; // 0-3
}

export default function CreateQuiz() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const quizId = searchParams.get('id');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([
        { q: '', options: ['', '', '', ''], answer: 0 }
    ]);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(!!quizId);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [topicInput, setTopicInput] = useState('');

    useEffect(() => {
        if (!quizId) return;

        const fetchQuiz = async () => {
            try {
                const docRef = doc(db, 'quiz_sets', quizId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTitle(data.title);
                    setDescription(data.description || '');
                    setQuestions(data.questions || []);
                } else {
                    alert('퀴즈를 찾을 수 없습니다.');
                    router.push('/teacher/dashboard');
                }
            } catch (error) {
                console.error("Error fetching quiz:", error);
                alert("퀴즈 정보를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId, router]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { q: '', options: ['', '', '', ''], answer: 0 }]);
    };

    const handleQuestionChange = (idx: number, field: string, value: any) => {
        const newQuestions = [...questions];
        if (field === 'q') newQuestions[idx].q = value;
        else if (field === 'answer') newQuestions[idx].answer = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIdx: number, oIdx: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIdx].options[oIdx] = value;
        setQuestions(newQuestions);
    };

    const handleRemoveQuestion = (idx: number) => {
        const newQuestions = questions.filter((_, i) => i !== idx);
        setQuestions(newQuestions);
    };

    const handleSave = async () => {
        if (!title || questions.some(q => !q.q || q.options.some(o => !o))) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        setSaving(true);
        try {
            const quizData = {
                teacherId: auth.currentUser?.uid,
                title,
                description,
                questions,
                updatedAt: serverTimestamp()
            };

            if (quizId) {
                await updateDoc(doc(db, 'quiz_sets', quizId), quizData);
            } else {
                await addDoc(collection(db, 'quiz_sets'), {
                    ...quizData,
                    createdAt: serverTimestamp()
                });
            }
            router.push('/teacher/dashboard');
        } catch (error) {
            console.error("Error saving quiz:", error);
            alert("퀴즈 저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );



    const handleOpenGenModal = () => {
        setShowTopicModal(true);
        setTopicInput('');
    };

    const handleGenerateConfirm = async () => {
        if (!topicInput.trim()) return;
        setShowTopicModal(false);

        const topic = topicInput;
        setGenerating(true);
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

            const promptText = `Generate 5 multiple choice questions about "${topic}" in Korean. 
            Return ONLY a valid JSON array of objects. 
            Each object must have:
            - "q": string (the question in Korean)
            - "options": array of 4 strings (in Korean)
            - "answer": number (0-3, index of correct option)
            
            Example format:
            [
              {
                "q": "대한민국의 수도는 어디입니까?",
                "options": ["부산", "서울", "대구", "인천"],
                "answer": 1
              }
            ]`;

            const result = await model.generateContent(promptText);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown code blocks if present
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const generatedQuestions = JSON.parse(jsonString);

            if (Array.isArray(generatedQuestions)) {
                setQuestions([...questions, ...generatedQuestions]);
            } else {
                alert("AI 응답을 분석하는데 실패했습니다.");
            }
        } catch (error) {
            console.error("Gemini API Error:", error);
            alert("질문 생성에 실패했습니다. API 키를 확인해주세요.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fbfbfd] pb-32">
            {/* Topic Input Modal */}
            {showTopicModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-[24px] shadow-2xl w-full max-w-md mx-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">AI로 생성하기</h3>
                        <p className="text-[#86868b] mb-6">주제를 입력하면 Gemini가 퀴즈를 만들어줍니다.</p>

                        <input
                            type="text"
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            placeholder="예: 광합성, 제2차 세계대전"
                            className="w-full px-4 py-3 bg-[#f5f5f7] border-none rounded-xl mb-6 focus:ring-2 focus:ring-blue-500/50 outline-none text-lg transition-all"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateConfirm()}
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowTopicModal(false)}
                                className="px-6 py-3 text-[#86868b] hover:text-[#1d1d1f] font-medium transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleGenerateConfirm}
                                disabled={!topicInput.trim()}
                                className="px-6 py-3 bg-[#1d1d1f] text-white rounded-xl hover:bg-[#333] disabled:opacity-50 font-medium transition-all"
                            >
                                생성하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#fbfbfd]/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-semibold text-[#1d1d1f]">새 퀴즈 만들기</h1>
                    <div className="w-10"></div> {/* Spacer for alignment */}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8">
                {/* Quiz Info Card */}
                <div className="bg-white rounded-[24px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] mb-8 border border-gray-100">
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">퀴즈 제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-3xl font-bold text-[#1d1d1f] placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent"
                            placeholder="제목 없는 퀴즈"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">설명</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full text-lg text-[#1d1d1f] placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent resize-none h-24"
                            placeholder="설명을 입력하세요..."
                        />
                    </div>
                </div>

                {/* AI Generator Banner */}
                <div className="mb-8">
                    <button
                        onClick={handleOpenGenModal}
                        disabled={generating}
                        className="w-full group relative overflow-hidden rounded-[20px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300"
                    >
                        <div className="relative bg-white rounded-[19px] px-6 py-4 flex items-center justify-between group-hover:bg-opacity-95 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                    <Sparkles className="text-purple-600" size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-900">Gemini AI로 생성하기</h3>
                                    <p className="text-sm text-gray-500">어떤 주제로든 즉시 문제를 만들어보세요</p>
                                </div>
                            </div>
                            <span className="text-purple-600 font-medium group-hover:translate-x-1 transition-transform">
                                {generating ? '생성 중...' : '지금 해보기 →'}
                            </span>
                        </div>
                    </button>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {questions.map((q, qIdx) => (
                        <div key={qIdx} className="group bg-white rounded-[24px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 relative transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                            <div className="flex justify-between items-start mb-6">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                                    {qIdx + 1}
                                </span>
                                <button
                                    onClick={() => handleRemoveQuestion(qIdx)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="mb-8">
                                <input
                                    type="text"
                                    value={q.q}
                                    onChange={(e) => handleQuestionChange(qIdx, 'q', e.target.value)}
                                    className="w-full text-xl font-medium text-[#1d1d1f] placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent border-b border-gray-100 pb-2 focus:border-blue-500 transition-colors"
                                    placeholder="질문을 입력하세요..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((opt, oIdx) => (
                                    <div
                                        key={oIdx}
                                        onClick={() => handleQuestionChange(qIdx, 'answer', oIdx)}
                                        className={`relative flex items-center p-1 rounded-xl border-2 transition-all cursor-pointer ${q.answer === oIdx
                                            ? 'border-green-500 bg-green-50/30'
                                            : 'border-transparent bg-[#f5f5f7] hover:bg-[#ebebeb]'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-2 transition-colors ${q.answer === oIdx ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                            {q.answer === oIdx ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                                        </div>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-[#1d1d1f] font-medium"
                                            placeholder={`옵션 ${oIdx + 1}`}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleAddQuestion}
                    className="w-full mt-8 py-6 border-2 border-dashed border-gray-300 rounded-[24px] text-gray-400 hover:border-[#0071e3] hover:text-[#0071e3] hover:bg-blue-50/50 transition-all font-medium flex items-center justify-center gap-2 group"
                >
                    <Plus size={20} className="group-hover:scale-110 transition-transform" />
                    문제 추가하기
                </button>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 p-4 z-40">
                <div className="max-w-3xl mx-auto flex justify-end gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 text-[#86868b] font-medium hover:text-[#1d1d1f] transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            '저장 중...'
                        ) : (
                            <>
                                <Save size={18} />
                                퀴즈 저장
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
