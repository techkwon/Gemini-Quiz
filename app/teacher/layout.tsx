'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/');
            } else {
                setUser(user);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-indigo-600">Gemini Quiz Teacher</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">{user?.email}</span>
                            <button
                                onClick={() => signOut(auth)}
                                className="text-sm text-red-600 hover:text-red-800"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
