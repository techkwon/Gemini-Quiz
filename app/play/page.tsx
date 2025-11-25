'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

import { Suspense } from 'react';

function PlayContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pin, setPin] = useState(searchParams.get('pin') || '');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (pin.length !== 6) {
            alert('Please enter a valid 6-digit PIN');
            return;
        }

        setLoading(true);
        try {
            const q = query(collection(db, 'game_sessions'), where('pinCode', '==', pin));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert('Game not found. Please check the PIN.');
                setLoading(false);
                return;
            }

            const session = snapshot.docs[0];
            router.push(`/play/join?sessionId=${session.id}`);
        } catch (error) {
            console.error("Error joining game:", error);
            alert("Error joining game");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-indigo-500 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
                <h1 className="text-3xl font-bold mb-8 text-indigo-900">Join Game</h1>

                <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Game PIN"
                    className="w-full text-center text-4xl tracking-widest font-mono border-b-4 border-indigo-200 focus:border-indigo-600 outline-none py-4 mb-8"
                />

                <button
                    onClick={handleJoin}
                    disabled={loading || pin.length !== 6}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all transform active:scale-95"
                >
                    {loading ? 'Checking...' : 'Enter'}
                </button>
            </div>
        </div>
    );
}

export default function Play() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PlayContent />
        </Suspense>
    );
}
