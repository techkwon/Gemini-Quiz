'use client';

import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Sparkles, GraduationCap, Gamepad2 } from 'lucide-react';

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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-full blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-gradient-to-bl from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[70%] h-[70%] bg-gradient-to-t from-indigo-400/20 to-blue-400/20 dark:from-indigo-600/10 dark:to-blue-600/10 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      <div className="z-10 max-w-5xl w-full flex flex-col items-center text-center mb-20">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 dark:bg-white/10 border border-white/40 dark:border-white/5 backdrop-blur-xl shadow-sm mb-10 hover:scale-105 transition-transform cursor-default">
          <Sparkles size={18} className="text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">AI 기반 에듀테크 플랫폼</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
          교실을 깨우는 <br className="md:hidden" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            스마트한 퀴즈 시간
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl font-medium leading-relaxed mb-12">
          Gemini AI가 선생님을 도와 퀴즈를 만들고,<br className="hidden md:block" />
          학생들은 게임처럼 즐겁게 학습합니다.
        </p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Teacher Card */}
        <div className="group relative bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-10 border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative z-10 flex flex-col h-full items-start text-left">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">선생님</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              AI로 퀴즈를 자동 생성하고<br />
              실시간 학습 현황을 확인하세요.
            </p>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="mt-auto w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 group transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? '로그인 중...' : '시작하기 (선생님)'}</span>
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>

        {/* Student Card */}
        <div className="glass-card p-10 flex flex-col items-start hover:scale-[1.02] transition-transform duration-300 border border-white/20 dark:border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-opacity group-hover:opacity-70"></div>

          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Gamepad2 className="text-purple-600 dark:text-purple-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">학생</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            복잡한 가입 없이 PIN 번호만으로<br />
            친구들과 함께 퀴즈 대결을 펼치세요.
          </p>
          <Link
            href="/play"
            className="mt-auto w-full py-4 bg-white dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 rounded-2xl font-bold text-lg shadow-sm hover:shadow-md flex items-center justify-center gap-2 group transition-all transform hover:-translate-y-0.5"
          >
            <span>게임 참여</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-8 text-center">
        <p className="text-sm text-gray-400 font-medium tracking-wide">
          © {new Date().getFullYear()} Gemini Quiz Platform.
        </p>
      </footer>
    </main>
  );
}
