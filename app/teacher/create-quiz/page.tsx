'use client';

import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface Question {
    q: string;
    options: string[];
    answer: number; // 0-3
}

export default function CreateQuiz() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([
        { q: '', options: ['', '', '', ''], answer: 0 }
    ]);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

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
            alert('Please fill in all fields');
            return;
        }

        setSaving(true);
        try {
            await addDoc(collection(db, 'quiz_sets'), {
                teacherId: auth.currentUser?.uid,
                title,
                description,
                questions,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            router.push('/teacher/dashboard');
        } catch (error) {
            console.error("Error saving quiz:", error);
            alert("Failed to save quiz");
        } finally {
            setSaving(false);
        }
    };

    const [showTopicModal, setShowTopicModal] = useState(false);
    const [topicInput, setTopicInput] = useState('');

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

            const promptText = `Generate 5 multiple choice questions about "${topic}". 
            Return ONLY a valid JSON array of objects. 
            Each object must have:
            - "q": string (the question)
            - "options": array of 4 strings
            - "answer": number (0-3, index of correct option)
            
            Example format:
            [
              {
                "q": "What is 2+2?",
                "options": ["1", "2", "3", "4"],
                "answer": 3
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
                alert("Failed to parse AI response");
            }
        } catch (error) {
            console.error("Gemini API Error:", error);
            alert("Failed to generate questions. Please check your API key.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 relative">
            {/* Topic Input Modal */}
            {showTopicModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-96 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4">What is the quiz about?</h3>
                        <input
                            type="text"
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            placeholder="e.g. Photosynthesis, World War II"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-purple-500 outline-none"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateConfirm()}
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowTopicModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateConfirm}
                                disabled={!topicInput.trim()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Create New Quiz</h1>
                <div className="space-x-4">
                    <button
                        onClick={handleOpenGenModal}
                        disabled={generating}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {generating ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Generating...
                            </span>
                        ) : '✨ Generate with Gemini'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                        {saving ? 'Saving...' : 'Save Quiz'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g., Science Final Review"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Optional description..."
                    />
                </div>
            </div>

            <div className="space-y-6">
                {questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-white p-6 rounded-lg shadow relative group hover:shadow-md transition-shadow">
                        <button
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="absolute top-4 right-4 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            Remove
                        </button>
                        <h3 className="text-lg font-medium mb-4 text-gray-700">Question {qIdx + 1}</h3>

                        <div className="mb-4">
                            <input
                                type="text"
                                value={q.q}
                                onChange={(e) => handleQuestionChange(qIdx, 'q', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                placeholder="Enter question text..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className={`flex items-center space-x-2 p-2 rounded-lg border ${q.answer === oIdx ? 'border-green-500 bg-green-50' : 'border-transparent hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name={`q-${qIdx}`}
                                        checked={q.answer === oIdx}
                                        onChange={() => handleQuestionChange(qIdx, 'answer', oIdx)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                        className={`flex-1 px-3 py-2 border rounded-md outline-none focus:border-indigo-500 ${q.answer === oIdx ? 'border-green-500 bg-white' : 'border-gray-300'}`}
                                        placeholder={`Option ${oIdx + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleAddQuestion}
                className="w-full mt-6 py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors font-medium"
            >
                + Add Question
            </button>
        </div>
    );
}
