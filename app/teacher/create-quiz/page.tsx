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
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        <div className="min-h-screen bg-background pb-32 transition-colors duration-300">
            {/* Topic Input Modal */}
            {showTopicModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-card p-8 rounded-[24px] shadow-2xl w-full max-w-md mx-4 border border-card-border">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">AI로 생성하기</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">주제를 입력하면 Gemini가 퀴즈를 만들어줍니다.</p>

                        <input
                            type="text"
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            placeholder="예: 광합성, 제2차 세계대전"
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-white/10 border-none rounded-xl mb-6 focus:ring-2 focus:ring-primary/50 outline-none text-lg transition-all text-foreground placeholder-gray-400"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateConfirm()}
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowTopicModal(false)}
                                className="px-6 py-3 text-gray-500 hover:text-foreground font-medium transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleGenerateConfirm}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all"
                            >
                                생성하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">돌아가기</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleOpenGenModal}
                            disabled={generating}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {generating ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Sparkles size={16} />
                            )}
                            AI로 생성
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-bold shadow-md transition-all disabled:opacity-50"
                        >
                            {saving ? '저장 중...' : '저장하기'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Quiz Info */}
                <div className="bg-card rounded-3xl p-8 shadow-sm border border-card-border mb-8">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="퀴즈 제목을 입력하세요"
                        className="w-full text-4xl font-bold bg-transparent border-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 text-foreground mb-4 p-0"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="퀴즈에 대한 설명을 입력하세요 (선택사항)"
                        className="w-full text-lg text-gray-500 dark:text-gray-400 bg-transparent border-none focus:ring-0 resize-none p-0 h-24"
                    />
                </div>

                {/* Questions */}
                <div className="space-y-6">
                    {questions.map((q, qIdx) => (
                        <div key={qIdx} className="group bg-card rounded-3xl p-8 shadow-sm border border-card-border hover:shadow-md transition-all relative">
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleRemoveQuestion(qIdx)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 mt-1">
                                    {qIdx + 1}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={q.q}
                                        onChange={(e) => handleQuestionChange(qIdx, 'q', e.target.value)}
                                        placeholder="질문을 입력하세요"
                                        className="w-full text-xl font-semibold bg-transparent border-b border-gray-200 dark:border-white/10 focus:border-primary focus:ring-0 rounded-none px-0 py-2 transition-all text-foreground placeholder-gray-300 dark:placeholder-gray-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
                                {q.options.map((opt, oIdx) => (
                                    <div
                                        key={oIdx}
                                        onClick={() => handleQuestionChange(qIdx, 'answer', oIdx)}
                                        className={`relative flex items-center p-1 rounded-xl border-2 transition-all cursor-pointer ${q.answer === oIdx
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : 'border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold mr-3 ${q.answer === oIdx ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                                            }`}>
                                            {['A', 'B', 'C', 'D'][oIdx]}
                                        </div>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                            placeholder={`보기 ${oIdx + 1}`}
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder-gray-400 font-medium"
                                        />
                                        {q.answer === oIdx && (
                                            <div className="absolute right-3 text-green-500">
                                                <CheckCircle2 size={20} fill="currentColor" className="text-white dark:text-black" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleAddQuestion}
                    className="w-full py-6 mt-8 rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/20 text-gray-400 hover:text-primary hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 font-bold text-lg group"
                >
                    <Plus size={24} className="group-hover:scale-110 transition-transform" />
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
