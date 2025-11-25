'use client';

import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-[#f5f5f7]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-[100px] animate-blob mix-blend-multiply"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-gradient-to-bl from-purple-400/20 to-pink-400/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[70%] h-[70%] bg-gradient-to-t from-indigo-400/20 to-blue-400/20 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
      </div>

      <div className="z-10 max-w-5xl w-full flex flex-col items-center text-center mb-20">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 border border-white/40 backdrop-blur-xl shadow-sm mb-10 hover:scale-105 transition-transform cursor-default">
          <Sparkles size={18} className="text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-semibold text-gray-700">AI 기반 에듀테크 플랫폼</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f] mb-6 leading-tight">
          교실을 깨우는 <br className="md:hidden" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            스마트한 퀴즈 시간
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 max-w-2xl font-medium leading-relaxed mb-12">
          Gemini AI가 선생님을 도와 퀴즈를 만들고,<br className="hidden md:block" />
          학생들은 게임처럼 즐겁게 학습합니다.
        </p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Teacher Card */}
        <div className="group relative bg-white/60 backdrop-blur-xl rounded-[32px] p-10 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative z-10 flex flex-col h-full items-start text-left">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <GraduationCap className="text-blue-600" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-[#1d1d1f] mb-3">선생님</h2>
            <p className="text-gray-500 mb-10 text-lg leading-relaxed">
              AI로 퀴즈를 자동 생성하고<br />
              실시간 학습 현황을 확인하세요.
            </p>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="mt-auto w-full py-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-semibold text-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group-hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {loading ? '로그인 중...' : '시작하기'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </div>
        </div>

        {/* Student Card */}
        <div className="group relative bg-white/60 backdrop-blur-xl rounded-[32px] p-10 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative z-10 flex flex-col h-full items-start text-left">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <Gamepad2 className="text-purple-600" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-[#1d1d1f] mb-3">학생</h2>
            <p className="text-gray-500 mb-10 text-lg leading-relaxed">
              복잡한 가입 없이 PIN 번호만으로<br />
              친구들과 함께 퀴즈 대결을 펼치세요.
            </p>
            <button
              onClick={() => router.push('/play/join')}
              className="mt-auto w-full py-4 bg-white text-[#1d1d1f] border border-gray-200 hover:bg-gray-50 rounded-2xl font-semibold text-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              게임 참여
              <ArrowRight size={20} className="text-gray-400 group-hover:text-[#1d1d1f] transition-colors" />
            </button>
          </div>
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
