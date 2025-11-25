'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Zap, Skull } from 'lucide-react';

// --- Types ---
interface Question {
    id: string;
    question?: string;
    q?: string;
    options: string[];
    answer: string | number;
}

interface BattleGameProps {
    questions: Question[];
    onScoreUpdate: (score: number) => void;
}

/**
 * ==========================================
 * [DATA] Assets & Constants
 * ==========================================
 */
const IMG_SOURCES = {
    bg: "https://i.imgur.com/2LLsNyo.jpg",
    intro_tanjiro: "https://i.imgur.com/f5A8RgG.png",
    intro_gojo: "https://i.imgur.com/0hYV1Mj.png",
    tanjiro_idle: "https://i.imgur.com/2BK6plS.png",
    tanjiro_attack: "https://i.imgur.com/XXGcNf3.png",
    gojo_idle: "https://i.imgur.com/UGQiUKz.png",
    gojo_attack: "https://i.imgur.com/8d3vKmP.png",
    effect_water: "https://i.imgur.com/5jmRU4b.png",
    effect_red: "https://i.imgur.com/WrnKcsb.png"
};

const COLORS = {
    tanjiro: '#00ff88', // Neon Green
    gojo: '#a29bfe',    // Neon Purple
    p1_gradient: 'linear-gradient(90deg, #00b09b, #96c93d)',
    p2_gradient: 'linear-gradient(90deg, #8e44ad, #c0392b)',
    accent: '#f1c40f',
    danger: '#ff003c',
    dark: '#050505'
};

/**
 * ==========================================
 * [AUDIO] Sound Manager (Web Audio API)
 * ==========================================
 */
class SoundManager {
    ctx: AudioContext | null = null;
    bgmTimer: NodeJS.Timeout | null = null;
    muted = false;

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

    playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.1) {
        if (!this.ctx || this.muted) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(vol, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start();
        o.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration: number, vol = 0.2) {
        if (!this.ctx || this.muted) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playTheme(char: string) {
        this.playTone(char === 'Tanjiro' ? 392 : 150, 0.3, char === 'Tanjiro' ? 'square' : 'sawtooth', 0.1);
    }

    stopTheme() { }

    startBattleBgm() {
        if (!this.ctx) return;
        this.stopBattleBgm();
        let beat = 0;
        this.bgmTimer = setInterval(() => {
            if (this.muted) return;
            if (beat % 4 === 0) this.playTone(60, 0.1, 'square', 0.2);
            if (beat % 2 === 0) this.playNoise(0.05, 0.05);
            if (beat % 8 === 0) this.playTone(40, 0.2, 'sawtooth', 0.1);
            if (beat % 8 === 4) this.playTone(45, 0.2, 'sawtooth', 0.1);
            beat++;
        }, 125);
    }

    stopBattleBgm() {
        if (this.bgmTimer) clearInterval(this.bgmTimer);
    }

    sfxCorrect() {
        this.playTone(523.25, 0.1, 'square', 0.1);
        setTimeout(() => this.playTone(659.25, 0.2, 'square', 0.1), 100);
    }

    sfxWrong() {
        this.playTone(100, 0.3, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(80, 0.3, 'sawtooth', 0.2), 150);
    }

    sfxAttack() {
        this.playNoise(0.1, 0.1);
        this.playTone(300, 0.1, 'triangle', 0.05);
    }

    sfxHit() {
        this.playNoise(0.3, 0.4);
        this.playTone(50, 0.2, 'sawtooth', 0.3);
    }
}

const soundMgr = new SoundManager();

/**
 * ==========================================
 * [MAIN] React Component
 * ==========================================
 */
export default function BattleGame({ questions, onScoreUpdate }: BattleGameProps) {
    // --- Game States ---
    const [gameState, setGameState] = useState('START'); // START, LOADING, SELECT, VS, BATTLE, RESULT
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [selectedHero, setSelectedHero] = useState<string | null>(null);

    // Battle Data
    const [hp, setHp] = useState({ p1: 100, p2: 100 });
    const [damageHp, setDamageHp] = useState({ p1: 100, p2: 100 });
    const [timer, setTimer] = useState(10);

    // Quiz State
    const [gameQuizList, setGameQuizList] = useState<any[]>([]);
    const [quizIndex, setQuizIndex] = useState(0);
    const [currentQuiz, setCurrentQuiz] = useState<any>(null);

    const [scoreData, setScoreData] = useState({ correct: 0, wrong: 0, combo: 0, maxCombo: 0 });
    const [gameResult, setGameResult] = useState({ winner: false, score: 0, msg: '' });

    // UI Feedback States
    const [feedbackState, setFeedbackState] = useState({ show: false, isCorrect: false, selectedIdx: -1 });
    const [screenShake, setScreenShake] = useState(false);
    const [showCombo, setShowCombo] = useState(false);

    // Refs for Canvas Game Loop
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const imagesRef = useRef<Record<string, HTMLImageElement>>({});
    const gameLogicRef = useRef<any>({
        p1: null, p2: null,
        particles: [], shockwaves: [],
        shakeIntensity: 0,
        hitStop: 0,
        isProcessing: false,
        groundY: 220,
    });

    // --- Utilities ---
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    // --- 1. Init & Asset Loading ---
    const startPreloading = async () => {
        soundMgr.init();
        setGameState('LOADING');

        const keys = Object.keys(IMG_SOURCES);
        const total = keys.length;
        let loaded = 0;

        const promises = keys.map(key => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = IMG_SOURCES[key as keyof typeof IMG_SOURCES];
                img.onload = () => { imagesRef.current[key] = img; loaded++; setLoadingProgress((loaded / total) * 100); resolve(); };
                img.onerror = () => { console.warn(`Failed: ${key}`); loaded++; setLoadingProgress((loaded / total) * 100); resolve(); };
            });
        });

        await Promise.all(promises);
        await wait(300);
        setGameState('SELECT');
    };

    // --- 2. Game Setup Logic ---
    const initializeGameData = () => {
        // Map DB questions to Game format
        // Game format: { q: string, a: string[], c: number }
        const mappedQuizzes = questions.map(q => ({
            q: q.q || q.question, // Handle both 'q' and 'question' just in case
            a: q.options,
            c: typeof q.answer === 'number' ? q.answer : q.options.indexOf(q.answer)
        }));

        // Shuffle if needed, or just take first 10 if there are many
        // For now, take up to 10
        const selectedQuizzes = mappedQuizzes.slice(0, 10);

        setGameQuizList(selectedQuizzes);
        setQuizIndex(0);
        setCurrentQuiz(selectedQuizzes[0]);

        setHp({ p1: 100, p2: 100 });
        setDamageHp({ p1: 100, p2: 100 });
        setScoreData({ correct: 0, wrong: 0, combo: 0, maxCombo: 0 });
        setTimer(10);
        setFeedbackState({ show: false, isCorrect: false, selectedIdx: -1 });
        gameLogicRef.current.isProcessing = false;
    };

    // --- 3. Character Select & Start ---
    const selectCharacter = (hero: string) => {
        setSelectedHero(hero);
        soundMgr.stopTheme();
        soundMgr.startBattleBgm();

        initializeGameData();

        // Canvas Characters Init
        const logic = gameLogicRef.current;
        if (hero === 'Tanjiro') {
            logic.p1 = createFighter({ pos: { x: 200, y: logic.groundY }, name: 'Tanjiro', color: COLORS.tanjiro, facing: 1 });
            logic.p2 = createFighter({ pos: { x: 750, y: logic.groundY }, name: 'Gojo', color: COLORS.gojo, facing: -1 });
        } else {
            logic.p1 = createFighter({ pos: { x: 200, y: logic.groundY }, name: 'Gojo', color: COLORS.gojo, facing: 1 });
            logic.p2 = createFighter({ pos: { x: 750, y: logic.groundY }, name: 'Tanjiro', color: COLORS.tanjiro, facing: -1 });
        }

        setGameState('VS');
        setTimeout(() => {
            setGameState('BATTLE');
        }, 2000);
    };

    const resetRound = () => {
        setTimer(10);
        setFeedbackState({ show: false, isCorrect: false, selectedIdx: -1 });
        gameLogicRef.current.isProcessing = false;
    };

    // --- 4. Timer Logic ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'BATTLE' && !gameLogicRef.current.isProcessing) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 0) {
                        handleAnswer(-1); // Timeout
                        return 0;
                    }
                    return prev - 0.1;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [gameState, currentQuiz, feedbackState.show]);

    useEffect(() => {
        if (currentQuiz) {
            console.log("Current Quiz Data:", currentQuiz);
        }
    }, [currentQuiz]);

    // --- 5. Answer Handling ---
    const handleAnswer = async (selectedIdx: number) => {
        if (gameLogicRef.current.isProcessing) return;
        gameLogicRef.current.isProcessing = true;

        const isCorrect = selectedIdx === currentQuiz.c;
        const logic = gameLogicRef.current;
        const attacker = isCorrect ? logic.p1 : logic.p2;
        const defender = isCorrect ? logic.p2 : logic.p1;

        setFeedbackState({ show: true, isCorrect, selectedIdx });

        if (isCorrect) {
            soundMgr.sfxCorrect();
            setScoreData(prev => {
                const newData = {
                    ...prev,
                    correct: prev.correct + 1,
                    combo: prev.combo + 1,
                    maxCombo: Math.max(prev.maxCombo, prev.combo + 1)
                };
                // Calculate intermediate score
                const currentScore = (newData.correct * 100) - (newData.wrong * 50) + (newData.maxCombo * 30);
                onScoreUpdate(Math.max(0, currentScore));
                return newData;
            });
            setShowCombo(true);
            setTimeout(() => setShowCombo(false), 1500);
        } else {
            soundMgr.sfxWrong();
            setScoreData(prev => {
                const newData = { ...prev, wrong: prev.wrong + 1, combo: 0 };
                // Calculate intermediate score
                const currentScore = (newData.correct * 100) - (newData.wrong * 50) + (newData.maxCombo * 30);
                onScoreUpdate(Math.max(0, currentScore));
                return newData;
            });
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 500);
        }

        await performAttackSequence(attacker, defender);

        const damage = 15;
        const newHp = { ...hp };
        if (isCorrect) newHp.p2 = Math.max(0, newHp.p2 - damage);
        else newHp.p1 = Math.max(0, newHp.p1 - damage);

        setHp(newHp);
        setTimeout(() => setDamageHp(newHp), 600);

        const nextIdx = quizIndex + 1;
        const isHpZero = newHp.p1 <= 0 || newHp.p2 <= 0;
        const isQuizEnd = nextIdx >= gameQuizList.length;

        if (isHpZero || isQuizEnd) {
            await wait(1000);
            endGame(newHp);
        } else {
            await wait(500);
            setQuizIndex(nextIdx);
            setCurrentQuiz(gameQuizList[nextIdx]);
            resetRound();
        }
    };

    const performAttackSequence = async (attacker: any, defender: any) => {
        const logic = gameLogicRef.current;

        attacker.state = 'DASH';
        soundMgr.sfxAttack();
        const targetX = defender.pos.x - (250 * attacker.facing);
        const startX = attacker.startPos.x;

        for (let i = 0; i < 10; i++) {
            attacker.pos.x += (targetX - startX) / 10;
            await wait(16);
        }

        attacker.state = 'ATTACK';
        logic.shakeIntensity = 20;
        logic.hitStop = 8;
        soundMgr.sfxHit();

        const hitColor = attacker.name === 'Tanjiro' ? '#3498db' : '#ff3333';
        addExplosion(defender.pos.x + 60, defender.pos.y + 100, hitColor);
        defender.state = 'HIT';

        await wait(400);

        attacker.state = 'DASH';
        defender.state = 'IDLE';
        for (let i = 0; i < 15; i++) {
            attacker.pos.x += (startX - attacker.pos.x) * 0.2;
            await wait(16);
        }
        attacker.pos.x = startX;
        attacker.state = 'IDLE';
    };

    // --- 6. End & Restart ---
    const endGame = (finalHp: typeof hp) => {
        soundMgr.stopBattleBgm();

        const isAlive = finalHp.p1 > 0;
        const isEnemyDead = finalHp.p2 <= 0;
        const isScoreWin = finalHp.p1 > finalHp.p2;

        const winState = isAlive && (isEnemyDead || isScoreWin);

        let finalScore = (scoreData.correct * 100) - (scoreData.wrong * 50) + (scoreData.maxCombo * 30);
        if (finalScore < 0) finalScore = 0;

        // Final Sync
        onScoreUpdate(finalScore);

        let msg = "";
        if (winState) {
            msg = selectedHero === 'Tanjiro'
                ? "세계 정복 완료! 지리는 나의 힘이다!"
                : "이 정도 상식은 기본이지. 시시해.";
        } else {
            msg = selectedHero === 'Tanjiro'
                ? "공부가 더 필요해... 다시 도전하자!"
                : "세계 상식이 부족했나? 믿을 수 없어.";
        }

        setGameResult({ winner: winState, score: finalScore, msg });
        setGameState('RESULT');
    };

    const restartGame = () => {
        setGameState('SELECT');
    };

    // --- 7. Canvas Loop ---
    const createFighter = ({ pos, name, color, facing }: any) => ({
        pos: { ...pos }, startPos: { ...pos },
        name, color, facing,
        width: 140, height: 220,
        state: 'IDLE', frame: 0, trail: [] as any[],
        update: function () {
            this.frame++;
            if (this.state !== 'IDLE' && this.frame % 2 === 0) {
                this.trail.push({ x: this.pos.x, y: this.pos.y, a: 0.5 });
            }
            this.trail.forEach((t: any) => t.a -= 0.08);
            this.trail = this.trail.filter((t: any) => t.a > 0);
            if (this.state === 'IDLE') {
                this.pos.y = this.startPos.y + Math.sin(this.frame * 0.08) * 3;
            }
        },
        draw: function (ctx: CanvasRenderingContext2D, imgs: any) {
            this.trail.forEach((t: any) => {
                ctx.save();
                ctx.globalAlpha = t.a;
                ctx.translate(t.x + (this.facing === -1 ? this.width : 0), t.y);
                ctx.scale(this.name === 'Gojo' ? -this.facing : this.facing, 1);
                this.drawBody(ctx, imgs, true);
                ctx.restore();
            });
            ctx.save();
            const scaleX = this.name === 'Gojo' ? -this.facing : this.facing;
            ctx.translate(this.pos.x + (scaleX === -1 ? this.width : 0), this.pos.y);
            ctx.scale(scaleX, 1);
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.beginPath();
            ctx.ellipse(this.width / 2, this.height - 10, 50, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            if (this.state === 'ATTACK') this.drawSkill(ctx, imgs);
            this.drawBody(ctx, imgs, false);
            ctx.restore();
        },
        drawBody: function (ctx: CanvasRenderingContext2D, imgs: any, isSil: boolean) {
            let key = this.name === 'Tanjiro' ? 'tanjiro' : 'gojo';
            key += this.state === 'ATTACK' ? '_attack' : '_idle';
            const img = imgs[key];
            if (img && !isSil) {
                ctx.drawImage(img, 0, 0, this.width, this.height);
            } else {
                ctx.fillStyle = isSil ? this.color : '#fff';
                ctx.fillRect(0, 0, this.width, this.height);
            }
        },
        drawSkill: function (ctx: CanvasRenderingContext2D, imgs: any) {
            const key = this.name === 'Tanjiro' ? 'effect_water' : 'effect_red';
            const img = imgs[key];
            if (img) {
                const offX = this.name === 'Tanjiro' ? -150 : -100;
                const offY = this.name === 'Tanjiro' ? -50 : -80;
                ctx.drawImage(img, offX, offY, 300, 300);
            }
        }
    });

    const addExplosion = (x: number, y: number, c: string) => {
        const logic = gameLogicRef.current;
        for (let i = 0; i < 15; i++) {
            logic.particles.push({
                x, y,
                dx: (Math.random() - 0.5) * 15, dy: (Math.random() - 0.5) * 15,
                c, s: Math.random() * 8 + 4, l: 30
            });
        }
        logic.shockwaves.push({ x, y, r: 10, c, a: 1 });
    };

    const drawLoop = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const logic = gameLogicRef.current;
        const imgs = imagesRef.current;

        if (!ctx || !canvas) return;

        if (logic.hitStop > 0) {
            logic.hitStop--;
            requestRef.current = requestAnimationFrame(drawLoop);
            return;
        }

        let sx = 0, sy = 0;
        if (logic.shakeIntensity > 0) {
            sx = (Math.random() - 0.5) * logic.shakeIntensity;
            sy = (Math.random() - 0.5) * logic.shakeIntensity;
            logic.shakeIntensity *= 0.9;
            if (logic.shakeIntensity < 0.5) logic.shakeIntensity = 0;
        }

        ctx.save();
        ctx.translate(sx, sy);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imgs.bg) ctx.drawImage(imgs.bg, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        if (logic.p1 && logic.p2) {
            if (logic.p1.state === 'ATTACK') { logic.p2.update(); logic.p2.draw(ctx, imgs); logic.p1.update(); logic.p1.draw(ctx, imgs); }
            else { logic.p1.update(); logic.p1.draw(ctx, imgs); logic.p2.update(); logic.p2.draw(ctx, imgs); }
        }

        logic.particles = logic.particles.filter((p: any) => p.l > 0);
        logic.particles.forEach((p: any) => {
            p.x += p.dx; p.y += p.dy; p.l--; p.s *= 0.9;
            ctx.globalAlpha = p.l / 30; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        });

        logic.shockwaves = logic.shockwaves.filter((s: any) => s.a > 0);
        logic.shockwaves.forEach((s: any) => {
            s.r += 20; s.a -= 0.1;
            if (s.a > 0) {
                ctx.save(); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.strokeStyle = s.c; ctx.lineWidth = 8; ctx.globalAlpha = s.a; ctx.stroke(); ctx.restore();
            }
        });

        ctx.restore();
        requestRef.current = requestAnimationFrame(drawLoop);
    }, []);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(drawLoop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [drawLoop]);

    // --- Render Helpers ---
    const isTanjiroP1 = selectedHero === 'Tanjiro';
    const p1Name = isTanjiroP1 ? 'TANJIRO' : (selectedHero ? 'GOJO' : 'PLAYER');
    const p2Name = isTanjiroP1 ? 'GOJO' : (selectedHero ? 'TANJIRO' : 'ENEMY');
    const p1Color = isTanjiroP1 ? COLORS.tanjiro : COLORS.gojo;
    const p2Color = isTanjiroP1 ? COLORS.gojo : COLORS.tanjiro;
    const healthBarShake = screenShake ? "animate-shake" : "";

    return (
        <div className="flex justify-center items-center h-screen bg-[#050505] overflow-hidden font-sans select-none text-white p-2">
            <style>
                {`
          @import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Do+Hyeon&family=Teko:wght@600&display=swap');
          .font-hs { font-family: 'Black Han Sans', sans-serif; }
          .font-dh { font-family: 'Do Hyeon', sans-serif; }
          .font-teko { font-family: 'Teko', sans-serif; }
          .crt-overlay {
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
          }
          .skew-ui { transform: skewX(-15deg); }
          .skew-ui-rev { transform: skewX(15deg); }
          @keyframes glitch {
            0% { transform: translate(0) }
            20% { transform: translate(-2px, 2px) }
            40% { transform: translate(-2px, -2px) }
            60% { transform: translate(2px, 2px) }
            80% { transform: translate(2px, -2px) }
            100% { transform: translate(0) }
          }
          .animate-glitch { animation: glitch 0.2s cubic-bezier(.25, .46, .45, .94) both infinite; }
          @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
          }
          .animate-shake { animation: shake 0.5s; }
        `}
            </style>

            <div className={`relative w-full h-full max-w-[1280px] max-h-[720px] aspect-video bg-black shadow-2xl border-2 md:border-4 border-[#333] overflow-hidden flex items-center justify-center ${screenShake ? 'animate-shake' : ''}`}>
                <canvas ref={canvasRef} width={1024} height={576} className="absolute inset-0 w-full h-full object-contain block z-0" />

                <div className="absolute inset-0 crt-overlay z-10 opacity-40"></div>
                <div className={`absolute inset-0 bg-red-600 mix-blend-overlay transition-opacity duration-100 z-20 pointer-events-none ${gameLogicRef.current.hitStop > 0 ? 'opacity-40' : 'opacity-0'}`}></div>

                {/* START SCREEN */}
                {gameState === 'START' && (
                    <div className="absolute inset-0 bg-black/90 z-50 flex flex-col justify-center items-center cursor-pointer p-4" onClick={startPreloading}>
                        <h1 className="font-hs text-5xl md:text-9xl text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-600 mb-4 animate-pulse filter drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] italic transform -skew-x-12 leading-tight">
                            WORLD<br />QUIZ BATTLE
                        </h1>
                        <div className="mt-8 border-2 border-white/50 bg-white/10 px-8 py-3 md:px-10 md:py-4 rounded-none skew-ui hover:bg-white/20 transition-all group">
                            <span className="font-dh text-2xl md:text-3xl animate-pulse group-hover:text-yellow-400">TOUCH TO START</span>
                        </div>
                    </div>
                )}

                {/* LOADING SCREEN */}
                {gameState === 'LOADING' && (
                    <div className="absolute inset-0 bg-black z-50 flex flex-col justify-center items-center p-4">
                        <div className="font-teko text-4xl md:text-6xl tracking-[0.2em] mb-6 text-white animate-pulse text-center">LOADING SYSTEM...</div>
                        <div className="w-4/5 md:w-2/3 h-2 bg-gray-800 skew-ui overflow-hidden border border-gray-600">
                            <div className="h-full bg-[#00ff88] transition-all duration-200" style={{ width: `${loadingProgress}%` }}></div>
                        </div>
                    </div>
                )}

                {/* CHARACTER SELECT */}
                {gameState === 'SELECT' && (
                    <div className="absolute inset-0 z-40 flex flex-col md:flex-row">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                            <span className="font-hs text-6xl md:text-9xl italic text-white drop-shadow-[0_0_30px_#ff003c] animate-glitch block">VS</span>
                        </div>
                        <div className="flex-1 relative cursor-pointer overflow-hidden group border-b-4 md:border-b-0 md:border-r-4 border-black transition-all hover:flex-[1.2]" onClick={() => selectCharacter('Tanjiro')} onMouseEnter={() => soundMgr.playTheme('Tanjiro')}>
                            <div className="absolute inset-0 bg-cover bg-center filter grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110" style={{ backgroundImage: `url(${IMG_SOURCES.intro_tanjiro})` }}></div>
                            <div className="absolute inset-0 bg-green-900/30 group-hover:bg-green-900/0 transition-colors"></div>
                            <div className="absolute bottom-4 left-4 md:bottom-10 md:left-10 z-10">
                                <h2 className="font-hs text-4xl md:text-6xl text-[#00ff88] skew-ui drop-shadow-md translate-y-4 group-hover:translate-y-0 transition-transform">탄지로</h2>
                                <p className="font-dh text-lg md:text-xl text-gray-200 mt-1 md:mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">"세계 상식을 마스터하겠어!"</p>
                            </div>
                        </div>
                        <div className="flex-1 relative cursor-pointer overflow-hidden group transition-all hover:flex-[1.2]" onClick={() => selectCharacter('Gojo')} onMouseEnter={() => soundMgr.playTheme('Gojo')}>
                            <div className="absolute inset-0 bg-cover bg-center filter grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110" style={{ backgroundImage: `url(${IMG_SOURCES.intro_gojo})` }}></div>
                            <div className="absolute inset-0 bg-purple-900/30 group-hover:bg-purple-900/0 transition-colors"></div>
                            <div className="absolute top-4 right-4 md:top-auto md:bottom-10 md:right-10 z-10 text-right">
                                <h2 className="font-hs text-4xl md:text-6xl text-[#a29bfe] skew-ui drop-shadow-md translate-y-4 group-hover:translate-y-0 transition-transform">고죠 사토루</h2>
                                <p className="font-dh text-lg md:text-xl text-gray-200 mt-1 md:mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">"내가 모르는 나라는 없어."</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* BATTLE UI */}
                {(gameState === 'BATTLE' || gameState === 'RESULT') && (
                    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-2 md:p-4">
                        {/* Top HUD */}
                        <div className="w-full flex justify-between items-start pt-1 md:pt-2">
                            <div className={`w-[40%] flex flex-col ${healthBarShake}`}>
                                <div className="flex items-end gap-1 md:gap-2 mb-1">
                                    <div className="w-8 h-8 md:w-12 md:h-12 border border-white overflow-hidden bg-black skew-ui relative">
                                        <img src={isTanjiroP1 ? IMG_SOURCES.intro_tanjiro : IMG_SOURCES.intro_gojo} className="w-full h-full object-cover object-top scale-125 md:scale-150" alt="p1" />
                                    </div>
                                    <span className="font-hs text-xl md:text-3xl skew-ui" style={{ color: p1Color, textShadow: `0 0 10px ${p1Color}` }}>{p1Name}</span>
                                </div>
                                <div className="w-full h-4 md:h-8 bg-black/80 border md:border-2 border-gray-600 skew-ui relative overflow-hidden shadow-lg">
                                    <div className="absolute top-0 left-0 w-full h-full skew-ui-rev overflow-hidden z-0">
                                        <img src={isTanjiroP1 ? IMG_SOURCES.intro_tanjiro : IMG_SOURCES.intro_gojo} className="w-full h-full object-cover object-top scale-125 opacity-50" alt="p1-bg" />
                                    </div>
                                    <div className="absolute top-0 bottom-0 right-0 left-0 bg-white transition-all duration-500 ease-out z-10" style={{ width: `${damageHp.p1}%` }}></div>
                                    <div className="absolute top-0 bottom-0 left-0 transition-all duration-150 ease-linear z-20" style={{ width: `${hp.p1}%`, background: p1Color, boxShadow: `0 0 20px ${p1Color}` }}>
                                        <div className="absolute top-0 left-0 w-full h-[50%] bg-white/30"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative top-[-5px] md:top-[-10px]">
                                <div className="w-12 h-12 md:w-20 md:h-20 bg-black border-2 md:border-4 border-white transform rotate-45 flex items-center justify-center shadow-2xl z-20">
                                    <div className="transform -rotate-45 font-teko text-3xl md:text-6xl text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">
                                        {Math.ceil(timer)}
                                    </div>
                                </div>
                            </div>

                            <div className={`w-[40%] flex flex-col items-end ${healthBarShake}`}>
                                <div className="flex items-end gap-1 md:gap-2 mb-1 flex-row-reverse">
                                    <div className="w-8 h-8 md:w-12 md:h-12 border border-white overflow-hidden bg-black skew-ui-rev relative">
                                        <img src={isTanjiroP1 ? IMG_SOURCES.intro_gojo : IMG_SOURCES.intro_tanjiro} className="w-full h-full object-cover object-top scale-125 md:scale-150 scale-x-[-1]" alt="p2" />
                                    </div>
                                    <span className="font-hs text-xl md:text-3xl skew-ui-rev" style={{ color: p2Color, textShadow: `0 0 10px ${p2Color}` }}>{p2Name}</span>
                                </div>
                                <div className="w-full h-4 md:h-8 bg-black/80 border md:border-2 border-gray-600 skew-ui-rev relative overflow-hidden shadow-lg">
                                    <div className="absolute top-0 right-0 w-full h-full skew-ui overflow-hidden z-0">
                                        <img src={isTanjiroP1 ? IMG_SOURCES.intro_gojo : IMG_SOURCES.intro_tanjiro} className="w-full h-full object-cover object-top scale-125 scale-x-[-1] opacity-50" alt="p2-bg" />
                                    </div>
                                    <div className="absolute top-0 bottom-0 right-0 bg-white transition-all duration-500 ease-out z-10" style={{ width: `${damageHp.p2}%` }}></div>
                                    <div className="absolute top-0 bottom-0 right-0 transition-all duration-150 ease-linear z-20" style={{ width: `${hp.p2}%`, background: p2Color, boxShadow: `0 0 20px ${p2Color}` }}>
                                        <div className="absolute top-0 left-0 w-full h-[50%] bg-white/30"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showCombo && (
                            <div className="absolute top-1/4 right-4 md:top-1/3 md:right-10 flex flex-col items-end z-50 pointer-events-none">
                                <span className="font-hs text-5xl md:text-7xl italic text-red-500 drop-shadow-[5px_5px_0_#fff] animate-bounce">{scoreData.combo}</span>
                                <span className="font-teko text-2xl md:text-4xl text-white tracking-widest">HITS!</span>
                            </div>
                        )}

                        {/* QUIZ DECK */}
                        <div className={`w-full max-w-4xl mx-auto mb-2 md:mb-4 transition-all duration-300 transform ${gameState === 'BATTLE' ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} pointer-events-auto`}>
                            <div className="bg-black/80 border md:border-2 border-white/30 backdrop-blur-md p-3 md:p-6 skew-ui relative mb-3 md:mb-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                                <div className="absolute -top-3 -left-3 bg-yellow-400 text-black font-teko px-2 py-0.5 md:px-3 md:py-1 text-sm md:text-xl border border-white skew-ui-rev">
                                    ROUND {quizIndex + 1} / {gameQuizList.length}
                                </div>
                                <h2 className="text-center font-dh text-xl md:text-4xl text-white drop-shadow-md skew-ui-rev break-keep relative z-50 min-h-[3rem] flex items-center justify-center">
                                    {currentQuiz?.q || "Question Loading Error..."}
                                </h2>
                                <div className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-100 ease-linear" style={{ width: `${(timer / 10) * 100}%` }}></div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 md:gap-4">
                                {currentQuiz?.a.map((option: string, idx: number) => {
                                    let btnStyle = "bg-gray-900/80 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-white hover:text-white hover:scale-[1.02]";
                                    let icon = null;
                                    if (feedbackState.show) {
                                        if (feedbackState.selectedIdx === idx) {
                                            if (feedbackState.isCorrect) {
                                                btnStyle = "bg-green-600 border-green-400 text-white shadow-[0_0_20px_#00ff00]";
                                                icon = <Zap className="inline mr-1 md:mr-2 animate-pulse w-4 h-4 md:w-5 md:h-5" />;
                                            } else {
                                                btnStyle = "bg-red-600 border-red-400 text-white shadow-[0_0_20px_#ff0000] animate-shake";
                                                icon = <Skull className="inline mr-1 md:mr-2 w-4 h-4 md:w-5 md:h-5" />;
                                            }
                                        } else {
                                            btnStyle = "bg-gray-900/50 border-gray-800 text-gray-600 opacity-50";
                                        }
                                    }
                                    return (
                                        <button key={idx} onClick={() => handleAnswer(idx)} disabled={feedbackState.show} className={`min-h-[3.5rem] md:h-16 skew-ui border md:border-2 transition-all duration-100 font-dh text-lg md:text-2xl flex items-center justify-center relative overflow-hidden ${btnStyle}`}>
                                            <span className="skew-ui-rev flex items-center px-1 break-keep text-center leading-tight">{icon}{option}</span>
                                            <div className="absolute top-0 left-0 w-full h-[40%] bg-white/10 pointer-events-none"></div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* RESULT SCREEN */}
                {gameState === 'RESULT' && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 animate-fadeIn p-4">
                        <div className="flex flex-col items-center gap-4 md:gap-6 relative p-6 md:p-10 border-2 md:border-4 border-white skew-ui bg-gray-900/90 shadow-[0_0_50px_rgba(255,255,255,0.2)] w-full max-w-2xl">
                            <div className="skew-ui-rev text-center w-full">
                                <h1 className={`font-hs text-5xl md:text-8xl mb-2 drop-shadow-[0_5px_0px_rgba(0,0,0,1)] ${gameResult.winner ? 'text-yellow-400' : 'text-gray-500'}`}>
                                    {gameResult.winner ? 'YOU WIN' : 'GAME OVER'}
                                </h1>
                                <div className="flex gap-4 md:gap-8 justify-center my-4 md:my-6">
                                    <div className="text-center">
                                        <p className="font-teko text-lg md:text-xl text-gray-400">SCORE</p>
                                        <p className="font-hs text-2xl md:text-4xl text-white">{Math.floor(gameResult.score)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-teko text-lg md:text-xl text-gray-400">MAX COMBO</p>
                                        <p className="font-hs text-2xl md:text-4xl text-red-500">{scoreData.maxCombo}</p>
                                    </div>
                                </div>
                                <p className="font-dh text-base md:text-xl text-gray-300 italic mb-6 md:mb-8 px-4 py-2 bg-black/50 border-l-4 border-white break-keep">"{gameResult.msg}"</p>
                                {/* Removed Restart Button - Teacher controls restart */}
                                <div className="text-gray-400 animate-pulse">Waiting for host...</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
