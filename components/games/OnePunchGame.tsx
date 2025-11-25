'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Zap, Flame, Skull, Trophy, Volume2, VolumeX,
    Circle, Square, Triangle, Hexagon, Star, Shield, Target, BicepsFlexed,
    Wind, Heart, XCircle, Loader2, Play, AlertTriangle, ChevronRight
} from 'lucide-react';

// --- Types ---
interface Question {
    id: string;
    question?: string;
    q?: string;
    options: string[];
    answer: string | number;
}

interface OnePunchGameProps {
    questions: Question[];
    onScoreUpdate: (score: number) => void;
}

/**
 * ==========================================
 * [AUDIO] Sound Engine (Web Audio API)
 * ==========================================
 */
class SoundEngine {
    ctx: AudioContext | null = null;
    isMuted = false;
    isPlayingBgm = false;
    bgmInterval: NodeJS.Timeout | null = null;
    themeTimer: NodeJS.Timeout | null = null;
    bgmNoteIndex = 0;
    currentTheme = 0;

    init() {
        if (typeof window === 'undefined') return;
        if (!this.ctx) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMute(mute: boolean) {
        this.isMuted = mute;
        if (mute) {
            this.stopBGM();
        } else if (this.isPlayingBgm) {
            this.startBGM(true);
        }
    }

    // --- SFX ---
    playPunch() {
        if (this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.2);

        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start();
    }

    playMiss() {
        if (this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(100, t + 0.2);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playCorrect() {
        if (this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, t);
        osc.frequency.linearRampToValueAtTime(659.25, t + 0.1);
        osc.frequency.linearRampToValueAtTime(783.99, t + 0.2);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.6);
    }

    playWrong() {
        if (this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(80, t + 0.3);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.4);
    }

    playGameStart() {
        if (this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 1.0);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 1.0);
        setTimeout(() => this.playPunch(), 800);
    }

    playGameEnd() {
        if (this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 2.0);
        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 2.0);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 2.0);
    }

    // --- BGM Logic ---
    startBGM(resume = false) {
        if (this.isMuted || !this.ctx) return;

        if (!resume) {
            this.isPlayingBgm = true;
            this.bgmNoteIndex = 0;
            this.currentTheme = 0;
        } else {
            this.isPlayingBgm = true;
        }

        this.stopBGM(false);

        this.themeTimer = setInterval(() => {
            if (!this.isPlayingBgm) return;
            this.currentTheme = (this.currentTheme + 1) % 6;
        }, 10000);

        const baseTempo = 200;
        this.bgmInterval = setInterval(() => {
            if (!this.isPlayingBgm || this.isMuted) return;
            this.playNextNote();
        }, baseTempo);
    }

    playNextNote() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const themes = [
            [82.41, 110.00, 123.47, 82.41],
            [164.81, 220.00, 246.94, 164.81, 196.00],
            [130.81, 164.81, 196.00, 261.63],
            [92.50, 98.00, 185.00, 92.50],
            [82.41, 123.47, 164.81, 220.00, 329.63],
            [73.42, 73.42, 110.00, 98.00]
        ];

        const currentRiff = themes[this.currentTheme];
        const freq = currentRiff[this.bgmNoteIndex % currentRiff.length];

        osc.type = this.currentTheme % 2 === 0 ? 'sawtooth' : 'square';
        const dist = this.ctx.createWaveShaper();
        dist.curve = this.makeDistortionCurve(this.currentTheme === 4 ? 400 : 100);
        dist.oversample = '4x';

        osc.frequency.setValueAtTime(freq, t);

        const volume = this.currentTheme === 4 ? 0.15 : 0.1;
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc.connect(gain);
        gain.connect(dist);
        dist.connect(this.ctx.destination);

        osc.start();
        osc.stop(t + 0.2);

        this.bgmNoteIndex++;
    }

    makeDistortionCurve(amount: number) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    stopBGM(resetState = true) {
        if (resetState) {
            this.isPlayingBgm = false;
            this.currentTheme = 0;
        }
        if (this.bgmInterval) clearInterval(this.bgmInterval);
        if (this.themeTimer) clearInterval(this.themeTimer);
    }
}

const audioController = new SoundEngine();

// --- Constants ---
const IMAGES = {
    INTRO: "https://i.imgur.com/dkvQ6D0.png",
    RESULT_C: "https://i.imgur.com/TFm98IZ.png",
    RESULT_B: "https://i.imgur.com/V7WfkBA.png",
    RESULT_A: "https://i.imgur.com/Iv5lwQQ.png",
    RESULT_S: "https://i.imgur.com/1UyKA1y.png",
    RESULT_GOD: "https://i.imgur.com/leMjMTI.png",
    CHAR_SAITAMA: "https://i.imgur.com/g1SRPIf.png",
    CHAR_GENOS: "https://i.imgur.com/R8EFdFZ.png",
    CHAR_TATSUMAKI: "https://i.imgur.com/3Npi4cX.png",
    CHAR_KING: "https://i.imgur.com/BmMOWXg.png",
    CHAR_MUMEN: "https://i.imgur.com/Bp3fGrf.png",
    CHAR_BANG: "https://i.imgur.com/aAJTht6.png",
    CHAR_SONIC: "https://i.imgur.com/Txsla3U.png",
    CHAR_FUBUKI: "https://i.imgur.com/vcKTyXg.png",
    CHAR_BOROS: "https://i.imgur.com/pn73vXn.png",
    CHAR_GAROU: "https://i.imgur.com/V3rTeJL.png",
    CHAR_ASSOC: "https://i.imgur.com/fAMyvP7.png",
    CHAR_PRISONER: "https://i.imgur.com/enoEvjN.png",
    CHAR_AMAI: "https://i.imgur.com/zNtf7t8.png",
    CHAR_PIGGOD: "https://i.imgur.com/eByTsYX.png",
    CHAR_CHILD: "https://i.imgur.com/DOodl4w.png"
};

// Asset Pool for Characters
const CHARACTER_ASSETS = [
    { character: "사이타마", rank: "히어로? (B급)", themeColor: "from-yellow-400 to-red-500", icon: Circle, imageUrl: IMAGES.CHAR_SAITAMA },
    { character: "제노스", rank: "S급 14위", themeColor: "from-gray-700 to-orange-500", icon: Zap, imageUrl: IMAGES.CHAR_GENOS },
    { character: "전율의 타츠마키", rank: "S급 2위", themeColor: "from-green-400 to-green-700", icon: Wind, imageUrl: IMAGES.CHAR_TATSUMAKI },
    { character: "킹", rank: "S급 7위", themeColor: "from-yellow-200 to-purple-500", icon: Volume2, imageUrl: IMAGES.CHAR_KING },
    { character: "무면 라이더", rank: "C급 1위", themeColor: "from-green-600 to-gray-600", icon: BicepsFlexed, imageUrl: IMAGES.CHAR_MUMEN },
    { character: "실버 팽", rank: "S급 3위", themeColor: "from-gray-300 to-gray-500", icon: Hexagon, imageUrl: IMAGES.CHAR_BANG },
    { character: "음속의 소닉", rank: "자칭 라이벌", themeColor: "from-purple-600 to-black", icon: Zap, imageUrl: IMAGES.CHAR_SONIC },
    { character: "지옥의 후부키", rank: "B급 1위", themeColor: "from-green-800 to-black", icon: Star, imageUrl: IMAGES.CHAR_FUBUKI },
    { character: "보로스", rank: "우주 패자", themeColor: "from-pink-500 to-blue-600", icon: Skull, imageUrl: IMAGES.CHAR_BOROS },
    { character: "가로", rank: "인간 괴인", themeColor: "from-gray-400 to-red-900", icon: Target, imageUrl: IMAGES.CHAR_GAROU },
];

const RANKS = [
    { score: 0, title: "C급 히어로 (재해레벨 랑)", color: "text-gray-500", desc: "지리는 좀 더 공부해야겠군요.", imageUrl: IMAGES.RESULT_C },
    { score: 50, title: "B급 히어로 (재해레벨 호)", color: "text-green-500", desc: "세계 여행을 다녀오셨나요?", imageUrl: IMAGES.RESULT_B },
    { score: 100, title: "A급 히어로 (재해레벨 귀)", color: "text-blue-500", desc: "지리학 박사 수준의 지식입니다!", imageUrl: IMAGES.RESULT_A },
    { score: 150, title: "S급 히어로 (재해레벨 용)", color: "text-yellow-500", desc: "전 세계 모든 국가를 파악하고 있군요!", imageUrl: IMAGES.RESULT_S },
    { score: 190, title: "등급 외 (리미터 해제)", color: "text-red-600", desc: "당신은 걸어다니는 지구본입니까?", imageUrl: IMAGES.RESULT_GOD }
];

export default function OnePunchGame({ questions, onScoreUpdate }: OnePunchGameProps) {
    const [gameState, setGameState] = useState('LANDING');
    const [gameQuestions, setGameQuestions] = useState<any[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [isMuted, setIsMuted] = useState(false);
    const [punchEffect, setPunchEffect] = useState({ show: false, x: 0, y: 0, type: '' });

    const getRank = () => {
        let currentRank = RANKS[0];
        for (let i = RANKS.length - 1; i >= 0; i--) {
            if (score >= RANKS[i].score) {
                currentRank = RANKS[i];
                break;
            }
        }
        return currentRank;
    };

    // Loading State
    const [loadedCount, setLoadedCount] = useState(0);
    const [totalImages, setTotalImages] = useState(0);

    useEffect(() => {
        audioController.setMute(isMuted);
    }, [isMuted]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'GAME' && timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (gameState === 'GAME' && timeLeft === 0) {
            handleAnswer(null, null);
        }
        return () => clearTimeout(timer);
    }, [timeLeft, gameState]);

    // --- Image Preloader Logic ---
    useEffect(() => {
        if (gameState === 'LOADING') {
            const urlsToLoad = Object.values(IMAGES).filter(url => url && url.length > 0);
            setTotalImages(urlsToLoad.length);
            setLoadedCount(0);

            if (urlsToLoad.length === 0) {
                prepareGameAndGoToIntro();
                return;
            }

            let loaded = 0;
            let minTimePassed = false;

            setTimeout(() => {
                minTimePassed = true;
                if (loaded >= urlsToLoad.length) {
                    prepareGameAndGoToIntro();
                }
            }, 2500);

            urlsToLoad.forEach(url => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    loaded++;
                    setLoadedCount(loaded);
                    if (loaded === urlsToLoad.length && minTimePassed) {
                        prepareGameAndGoToIntro();
                    }
                };
                img.onerror = () => {
                    console.warn(`Failed to load image: ${url}`);
                    loaded++;
                    setLoadedCount(loaded);
                    if (loaded === urlsToLoad.length && minTimePassed) {
                        prepareGameAndGoToIntro();
                    }
                };
            });
        }
    }, [gameState]);

    const handleLandingClick = () => {
        audioController.init();
        audioController.playPunch();
        setGameState('LOADING');
    };

    const prepareGameAndGoToIntro = () => {
        // Map DB questions to Game format with Random Characters
        const mappedQuestions = questions.map((q, index) => {
            // Pick a random character asset
            const charAsset = CHARACTER_ASSETS[index % CHARACTER_ASSETS.length];
            return {
                id: q.id,
                ...charAsset,
                q: q.q || q.question, // Handle both
                options: q.options,
                correctAnswer: typeof q.answer === 'number' ? q.options[q.answer] : q.answer,
                shuffledOptions: [...q.options] // Already shuffled in DB usually, but good to copy
            };
        });

        setGameQuestions(mappedQuestions);
        setGameState('INTRO');
    };

    const handleIntroStartButton = () => {
        audioController.startBGM();
        audioController.playGameStart();
        setCurrentQIndex(0);
        setScore(0);
        setTimeLeft(10);
        setGameState('GAME');
    };

    const handleAnswer = (selectedOption: string | null, e: any) => {
        let clickX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
        let clickY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

        if (e) {
            if (e.touches && e.touches[0]) {
                clickX = e.touches[0].clientX;
                clickY = e.touches[0].clientY;
            } else if (e.clientX) {
                clickX = e.clientX;
                clickY = e.clientY;
            }
        }

        const currentQ = gameQuestions[currentQIndex];
        const isCorrect = selectedOption && currentQ && selectedOption === currentQ.correctAnswer;

        setPunchEffect({
            show: true,
            x: clickX,
            y: clickY,
            type: isCorrect ? 'CORRECT' : 'WRONG'
        });

        setTimeout(() => setPunchEffect({ show: false, x: 0, y: 0, type: '' }), 600);

        if (isCorrect) {
            // Score Calculation
            const points = 10 + timeLeft;
            setScore(prev => {
                const newScore = prev + points;
                onScoreUpdate(newScore); // Sync Score
                return newScore;
            });
            audioController.playPunch();
            audioController.playCorrect();
        } else {
            audioController.playMiss();
            audioController.playWrong();
            // Sync Score even if wrong (no change, but good to keep sync)
            onScoreUpdate(score);
        }

        if (currentQIndex < gameQuestions.length - 1) {
            setTimeout(() => {
                setCurrentQIndex(prev => prev + 1);
                setTimeLeft(10);
            }, 600);
        } else {
            setTimeout(() => {
                audioController.stopBGM();
                audioController.playGameEnd();
                setGameState('RESULT');
            }, 600);
        }
    };

    const restartGame = () => setGameState('INTRO');

    // --- Components ---

    const PunchOverlay = () => {
        if (!punchEffect.show) return null;
        const isCorrect = punchEffect.type === 'CORRECT';
        return (
            <div
                className="fixed pointer-events-none z-50"
                style={{ left: punchEffect.x, top: punchEffect.y, transform: 'translate(-50%, -50%)' }}
            >
                {isCorrect ? (
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-red-600 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute w-[150px] md:w-[200px] h-[150px] md:h-[200px] bg-yellow-400 rounded-full animate-pulse opacity-90 mix-blend-screen"></div>
                        <div className="relative text-5xl md:text-9xl font-black italic text-white drop-shadow-[0_4px_0_#000] rotate-[-12deg] animate-bounce whitespace-nowrap z-20 stroke-black stroke-2">
                            ONE PUNCH!
                        </div>
                        <div className="absolute border-[10px] md:border-[20px] border-white rounded-full w-[250px] md:w-[400px] h-[250px] md:h-[400px] animate-[ping_0.5s_ease-out_infinite] opacity-50"></div>
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center justify-center">
                        <div className="absolute w-[100px] md:w-[150px] h-[100px] md:h-[150px] bg-gray-600 rounded-full animate-ping opacity-40"></div>
                        <XCircle size={80} className="text-gray-300 relative z-10 animate-bounce drop-shadow-lg" />
                        <div className="mt-4 text-3xl md:text-6xl font-bold text-gray-400 animate-pulse whitespace-nowrap">
                            MISS...
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const HeroCard = ({ character, rank, color, icon: Icon, imageUrl }: any) => (
        <div className={`relative w-full h-full min-h-[25vh] md:min-h-[500px] bg-gradient-to-br ${color} rounded-xl shadow-2xl overflow-hidden border-4 border-black/50 flex flex-col`}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="flex-1 relative flex items-center justify-center bg-black/40 group overflow-hidden">
                {imageUrl && imageUrl.length > 0 ? (
                    <img src={imageUrl} alt={character} className="w-full h-full object-cover object-top transform transition-transform duration-700 group-hover:scale-105 opacity-90" />
                ) : (
                    <div className="flex flex-col items-center text-white/50 animate-pulse">
                        <Icon size={120} className="mb-4 drop-shadow-lg text-white" />
                        <span className="text-xl font-black uppercase tracking-widest border-2 border-white/30 px-4 py-1">Image Placeholder</span>
                    </div>
                )}
                <div className="absolute top-4 left-4 bg-black/70 text-yellow-400 px-3 py-1 md:px-4 md:py-2 rounded-br-xl border-l-4 border-yellow-400 shadow-lg z-10 backdrop-blur-sm transform -skew-x-12">
                    <span className="text-[10px] md:text-xs block text-gray-400 font-bold skew-x-12">HERO RANK</span>
                    <span className="text-lg md:text-xl font-black italic skew-x-12">{rank}</span>
                </div>
            </div>
            <div className="p-2 md:p-4 bg-black/80 border-t-4 border-black/50 z-10 relative backdrop-blur-sm transform -skew-x-12 ml-[-10px] w-[110%]">
                <h2 className="text-xl md:text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_2px_0_rgba(255,0,0,1)] truncate skew-x-12 pl-6">
                    {character}
                </h2>
            </div>
        </div>
    );

    // --- Screens ---

    // 0. LANDING SCREEN
    if (gameState === 'LANDING') {
        return (
            <div
                className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans cursor-pointer touch-manipulation"
                onClick={handleLandingClick}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-600 via-red-900 to-black opacity-80 z-0 animate-pulse"></div>

                <div className="z-10 text-center relative px-4">
                    <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
                        <div className="inline-block border-4 md:border-8 border-yellow-400 p-2 mb-4 bg-red-600 transform -rotate-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                            <h1 className="text-5xl md:text-8xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg">
                                ONE PUNCH
                            </h1>
                        </div>
                        <h2 className="text-3xl md:text-6xl font-black text-yellow-400 uppercase tracking-widest drop-shadow-[0_2px_0_rgba(0,0,0,1)] md:drop-shadow-[0_4px_0_rgba(0,0,0,1)] transform -skew-x-12">
                            QUIZ BATTLE
                        </h2>
                    </div>

                    <div className="mt-12 animate-bounce">
                        <p className="text-xl md:text-3xl font-bold text-white blink">
                            터치하여 시작
                        </p>
                        <div className="mt-2 text-xs md:text-sm text-gray-400">
                            (소리 켜기 필수)
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 1. LOADING SCREEN
    if (gameState === 'LOADING') {
        return (
            <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center font-sans">
                <Loader2 size={64} className="animate-spin text-yellow-400 mb-8" />
                <h2 className="text-2xl md:text-4xl font-black italic animate-pulse">LOADING HEROES...</h2>
                <div className="mt-4 w-64 h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-600">
                    <div
                        className="h-full bg-yellow-400 transition-all duration-300"
                        style={{ width: `${(loadedCount / totalImages) * 100}%` }}
                    ></div>
                </div>
                <p className="mt-2 text-gray-500 font-mono">{loadedCount} / {totalImages}</p>
            </div>
        );
    }

    // 2. INTRO SCREEN
    if (gameState === 'INTRO') {
        return (
            <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
                <div className="absolute inset-0 bg-[url('https://i.imgur.com/dkvQ6D0.png')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>

                <div className="z-10 text-center max-w-4xl px-4">
                    <h1 className="text-4xl md:text-7xl font-black italic mb-8 text-yellow-400 drop-shadow-[0_4px_0_#000]">
                        히어로 협회 시험
                    </h1>
                    <div className="bg-black/80 border-4 border-white p-6 md:p-10 transform -skew-x-6 shadow-2xl backdrop-blur-sm">
                        <p className="text-lg md:text-2xl mb-6 leading-relaxed font-bold text-gray-200">
                            "환영합니다, 지원자여. 지식을 증명하고 S급 히어로가 되세요!"
                        </p>
                        <ul className="text-left space-y-4 mb-8 text-gray-300 md:text-xl font-medium">
                            <li className="flex items-center"><ChevronRight className="text-yellow-400 mr-2" /> 빠르게 정답을 맞히면 보너스 점수 획득!</li>
                            <li className="flex items-center"><ChevronRight className="text-yellow-400 mr-2" /> 연속 정답 시 랭크 상승!</li>
                            <li className="flex items-center"><ChevronRight className="text-yellow-400 mr-2" /> 한 방이면 충분하다!</li>
                        </ul>
                        <button
                            onClick={handleIntroStartButton}
                            className="w-full bg-red-600 hover:bg-red-500 text-white text-2xl md:text-4xl font-black py-4 md:py-6 px-8 transform hover:scale-105 transition-all shadow-[0_6px_0_#900] active:shadow-none active:translate-y-2 flex items-center justify-center gap-4"
                        >
                            <Play size={32} fill="currentColor" /> 시험 시작
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. GAME SCREEN
    if (gameState === 'GAME') {
        const currentQ = gameQuestions[currentQIndex];
        if (!currentQ) return null;

        return (
            <div className="min-h-[100dvh] bg-gray-900 text-white font-sans overflow-hidden relative touch-manipulation">
                <PunchOverlay />

                {/* Top Bar */}
                <div className="absolute top-0 left-0 w-full p-2 md:p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-yellow-400 text-black font-black px-2 py-1 text-sm md:text-lg transform -skew-x-12">점수</span>
                            <span className="text-2xl md:text-4xl font-black italic text-yellow-400 drop-shadow-md">{score}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs md:text-sm font-bold">
                            <Trophy size={14} /> 랭크: {getRank().title.split(' ')[0]}
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className={`text-4xl md:text-6xl font-black italic ${timeLeft <= 3 ? 'text-red-500 animate-ping' : 'text-white'} drop-shadow-lg`}>
                            {timeLeft}
                        </div>
                        <div className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">제한 시간</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="h-[100dvh] flex flex-col md:flex-row">
                    {/* Left: Character Visual */}
                    <div className="w-full md:w-1/2 h-[40vh] md:h-full relative p-4 md:p-8 flex items-center justify-center">
                        <HeroCard {...currentQ} />
                    </div>

                    {/* Right: Quiz Area */}
                    <div className="w-full md:w-1/2 h-[60vh] md:h-full bg-black/90 relative flex flex-col p-4 md:p-8 justify-center">
                        {/* Question Bubble */}
                        <div className="mb-4 md:mb-8 relative">
                            <div className="absolute -top-6 -left-2 bg-white text-black font-black px-3 py-1 transform -skew-x-12 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.5)] z-10">
                                Q{currentQIndex + 1}
                            </div>
                            <div className="bg-white text-black p-4 md:p-8 rounded-2xl rounded-tl-none border-4 border-gray-300 shadow-xl relative">
                                <p className="text-lg md:text-3xl font-bold leading-tight break-keep">
                                    "{currentQ.q}"
                                </p>
                                <div className="absolute -left-3 top-0 w-0 h-0 border-t-[20px] border-t-white border-l-[20px] border-l-transparent"></div>
                            </div>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full">
                            {currentQ.shuffledOptions.map((option: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={(e) => handleAnswer(option, e)}
                                    className="relative group overflow-hidden bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-yellow-400 text-left p-4 md:p-6 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
                                >
                                    <div className="absolute inset-0 bg-yellow-400/0 group-hover:bg-yellow-400/10 transition-colors"></div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <span className="text-lg md:text-2xl font-bold text-gray-200 group-hover:text-white">{option}</span>
                                        <ChevronRight className="text-gray-600 group-hover:text-yellow-400 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 4. RESULT SCREEN
    if (gameState === 'RESULT') {
        const rank = getRank();
        return (
            <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans p-4">
                <div className="absolute inset-0 bg-[url('https://i.imgur.com/dkvQ6D0.png')] bg-cover bg-center opacity-20 blur-sm"></div>

                <div className="z-10 w-full max-w-2xl bg-black/80 border-4 border-white p-6 md:p-10 transform -skew-x-3 shadow-[0_0_50px_rgba(255,255,0,0.2)] backdrop-blur-md text-center">
                    <h2 className="text-3xl md:text-5xl font-black italic text-yellow-400 mb-2 uppercase tracking-tighter">
                        임무 완료
                    </h2>
                    <div className="w-full h-1 bg-gray-600 mb-8"></div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-4">
                            <img src={rank.imageUrl} alt="Rank" className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-bounce" />
                        </div>
                        <h3 className={`text-2xl md:text-4xl font-black ${rank.color} mb-2`}>{rank.title}</h3>
                        <p className="text-gray-400 text-lg md:text-xl italic">"{rank.desc}"</p>
                    </div>

                    <div className="bg-gray-900/80 p-6 rounded-xl border-2 border-gray-700 mb-8">
                        <div className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-1">최종 점수</div>
                        <div className="text-5xl md:text-7xl font-black text-white">{score}</div>
                    </div>

                    <div className="text-gray-500 animate-pulse">호스트를 기다리는 중...</div>
                </div>
            </div>
        );
    }

    return null;
}
