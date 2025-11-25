'use client';

import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/teacher/dashboard');
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Please check your Firebase configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Gemini Quiz Platform</h1>
      </div>

      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col items-center">
        <p className="mb-6 text-lg">Teacher Portal</p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="px-6 py-3 bg-white text-indigo-600 rounded-full font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login with Google'}
        </button>

        <div className="mt-8 pt-8 border-t border-white/20 w-full text-center">
          <p className="mb-4 text-sm opacity-80">Are you a student?</p>
          <button
            onClick={() => router.push('/play')}
            className="px-6 py-2 border-2 border-white text-white rounded-full font-bold hover:bg-white/10 transition-colors"
          >
            Join a Game
          </button>
        </div>
      </div>
    </main>
  );
}
