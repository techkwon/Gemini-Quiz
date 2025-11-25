'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

import { Suspense } from 'react';

function JoinContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');

    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [loading, setLoading] = useState(false);

    if (!sessionId) return <div>Invalid Session</div>;

    const handleSubmit = async () => {
        if (!name || !studentId) {
            alert('Please fill in all fields');
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
            alert("Failed to join");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-purple-600 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-purple-900">Enter Details</h1>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            suppressHydrationWarning
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            suppressHydrationWarning
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="e.g., 2024001"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Joining...' : 'Join Game'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function JoinGame() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <JoinContent />
        </Suspense>
    );
}
