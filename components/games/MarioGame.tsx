'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Audio Synthesizer (SFX & FULL BGM) ---
const NOTES: { [key: string]: number } = {
    G3: 196.00, C4: 261.63, E4: 329.63, F4: 349.23, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
    C5: 523.25, Cs5: 554.37, D5: 587.33, Dss5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77, C6: 1046.50
};

const BGM_SEQUENCE = [
    // --- INTRO ---
    { n: 'E5', d: 0.15 }, { n: 'E5', d: 0.15 }, { n: null, d: 0.15 }, { n: 'E5', d: 0.15 },
    { n: null, d: 0.15 }, { n: 'C5', d: 0.15 }, { n: 'E5', d: 0.3 },
    { n: 'G5', d: 0.3 }, { n: null, d: 0.3 }, { n: 'G4', d: 0.3 }, { n: null, d: 0.3 },

    // --- THEME A (Repeat x2) ---
    // Bar 1
    { n: 'C5', d: 0.45 }, { n: 'G4', d: 0.45 }, { n: 'E4', d: 0.45 },
    // Bar 2
    { n: 'A4', d: 0.3 }, { n: 'B4', d: 0.3 }, { n: 'As4', d: 0.15 }, { n: 'A4', d: 0.3 },
    // Bar 3
    { n: 'G4', d: 0.2 }, { n: 'E5', d: 0.2 }, { n: 'G5', d: 0.2 }, { n: 'A5', d: 0.3 }, { n: 'F5', d: 0.15 }, { n: 'G5', d: 0.3 },
    // Bar 4
    { n: 'E5', d: 0.3 }, { n: 'C5', d: 0.15 }, { n: 'D5', d: 0.15 }, { n: 'B4', d: 0.3 }, { n: null, d: 0.3 },

    // Bar 1 (Repeat)
    { n: 'C5', d: 0.45 }, { n: 'G4', d: 0.45 }, { n: 'E4', d: 0.45 },
    // Bar 2 (Repeat)
    { n: 'A4', d: 0.3 }, { n: 'B4', d: 0.3 }, { n: 'As4', d: 0.15 }, { n: 'A4', d: 0.3 },
    // Bar 3 (Repeat)
    { n: 'G4', d: 0.2 }, { n: 'E5', d: 0.2 }, { n: 'G5', d: 0.2 }, { n: 'A5', d: 0.3 }, { n: 'F5', d: 0.15 }, { n: 'G5', d: 0.3 },
    // Bar 4 (Repeat)
    { n: 'E5', d: 0.3 }, { n: 'C5', d: 0.15 }, { n: 'D5', d: 0.15 }, { n: 'B4', d: 0.3 }, { n: null, d: 0.3 },

    // --- THEME B (Repeat x2 approx) ---
    { n: null, d: 0.3 },
    { n: 'G5', d: 0.15 }, { n: 'Fs5', d: 0.15 }, { n: 'F5', d: 0.15 }, { n: 'Dss5', d: 0.3 }, { n: 'E5', d: 0.3 },
    { n: null, d: 0.15 }, { n: 'Gs4', d: 0.15 }, { n: 'A4', d: 0.15 }, { n: 'C5', d: 0.15 }, { n: null, d: 0.15 }, { n: 'A4', d: 0.15 }, { n: 'C5', d: 0.15 }, { n: 'D5', d: 0.3 },

    { n: null, d: 0.3 },
    { n: 'G5', d: 0.15 }, { n: 'Fs5', d: 0.15 }, { n: 'F5', d: 0.15 }, { n: 'Dss5', d: 0.3 }, { n: 'E5', d: 0.3 },
    { n: null, d: 0.15 }, { n: 'C6', d: 0.15 }, { n: null, d: 0.15 }, { n: 'C6', d: 0.15 }, { n: 'C6', d: 0.3 }, { n: null, d: 0.3 },

    { n: null, d: 0.3 },
    { n: 'G5', d: 0.15 }, { n: 'Fs5', d: 0.15 }, { n: 'F5', d: 0.15 }, { n: 'Dss5', d: 0.3 }, { n: 'E5', d: 0.3 },
    { n: null, d: 0.15 }, { n: 'Gs4', d: 0.15 }, { n: 'A4', d: 0.15 }, { n: 'C5', d: 0.15 }, { n: null, d: 0.15 }, { n: 'A4', d: 0.15 }, { n: 'C5', d: 0.15 }, { n: 'D5', d: 0.3 },

    { n: null, d: 0.3 },
    { n: 'Dss5', d: 0.4 }, { n: null, d: 0.2 }, { n: 'D5', d: 0.4 }, { n: null, d: 0.2 }, { n: 'C5', d: 0.4 }, { n: null, d: 0.8 },

    // Loop gap
    { n: null, d: 0.5 }
];

// --- SVG Components ---
const MarioSprite = ({ frame, facing, isJumping, isDead }: any) => {
    const color = isDead ? "#555" : "#E52521";
    const overalls = "#0046AD";
    const skin = "#FED5A5";
    const hair = "#6B4423";

    if (isDead) {
        return (
            <svg width="32" height="32" viewBox="0 0 16 16">
                <rect x="4" y="10" width="8" height="2" fill={overalls} />
                <rect x="2" y="8" width="12" height="2" fill={overalls} />
                <rect x="5" y="4" width="6" height="4" fill={color} />
                <rect x="5" y="2" width="6" height="2" fill={skin} />
                <rect x="3" y="10" width="2" height="2" fill={skin} />
                <rect x="11" y="10" width="2" height="2" fill={skin} />
            </svg>
        )
    }

    const transform = facing === 'left' ? 'scale(-1, 1) translate(-16, 0)' : '';

    return (
        <svg width="32" height="32" viewBox="0 0 16 16" style={{ overflow: 'visible' }}>
            <g transform={transform}>
                <rect x="3" y="0" width="10" height="2" fill={color} />
                <rect x="8" y="0" width="5" height="1" fill={color} />
                <rect x="3" y="2" width="7" height="3" fill={skin} />
                <rect x="3" y="2" width="2" height="1" fill={hair} />
                <rect x="4" y="3" width="1" height="1" fill={hair} />
                <rect x="8" y="3" width="1" height="1" fill="#000" />
                <rect x="9" y="4" width="2" height="1" fill="#000" />
                <rect x="10" y="3" width="1" height="1" fill={skin} />
                <rect x="4" y="5" width="6" height="4" fill={overalls} />
                <rect x="2" y="6" width="3" height="2" fill={color} />
                <rect x="9" y="6" width="3" height="2" fill={color} />
                {isJumping ? (
                    <>
                        <rect x="2" y="10" width="4" height="3" fill={overalls} />
                        <rect x="9" y="8" width="4" height="3" fill={overalls} />
                    </>
                ) : frame === 0 ? (
                    <>
                        <rect x="3" y="9" width="3" height="3" fill={overalls} />
                        <rect x="8" y="9" width="3" height="3" fill={overalls} />
                        <rect x="2" y="12" width="3" height="2" fill={hair} />
                        <rect x="9" y="12" width="3" height="2" fill={hair} />
                    </>
                ) : (
                    <>
                        <rect x="4" y="9" width="2" height="3" fill={overalls} />
                        <rect x="7" y="9" width="5" height="2" fill={overalls} />
                        <rect x="3" y="12" width="3" height="2" fill={hair} />
                        <rect x="8" y="11" width="3" height="2" fill={hair} />
                    </>
                )}
            </g>
        </svg>
    );
};

const GoombaSprite = ({ frame, isDead }: any) => {
    const body = "#8B4513";
    const skin = "#FED5A5";
    const black = "#000000";

    if (isDead) {
        return (
            <svg width="32" height="16" viewBox="0 0 16 8">
                <rect x="2" y="2" width="12" height="6" fill={body} />
                <rect x="4" y="4" width="8" height="2" fill={skin} />
            </svg>
        );
    }

    return (
        <svg width="32" height="32" viewBox="0 0 16 16">
            <rect x="4" y="4" width="8" height="8" fill={body} />
            <rect x="3" y="5" width="1" height="5" fill={body} />
            <rect x="12" y="5" width="1" height="5" fill={body} />
            <rect x="5" y="6" width="2" height="3" fill="#fff" />
            <rect x="6" y="7" width="1" height="2" fill={black} />
            <rect x="9" y="6" width="2" height="3" fill="#fff" />
            <rect x="9" y="7" width="1" height="2" fill={black} />
            <rect x="6" y="10" width="4" height="1" fill={skin} />
            {frame === 0 ? (
                <>
                    <rect x="2" y="12" width="4" height="2" fill={black} />
                    <rect x="11" y="12" width="4" height="2" fill={black} />
                </>
            ) : (
                <>
                    <rect x="1" y="12" width="4" height="2" fill={black} />
                    <rect x="10" y="12" width="4" height="2" fill={black} />
                </>
            )}
        </svg>
    );
};

const BlockSprite = ({ type, frame }: any) => {
    if (type === 'BRICK') {
        return (
            <div style={{ width: '32px', height: '32px', background: '#D87536', border: '2px solid #9C4A1A', boxSizing: 'border-box', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 4, left: 0, width: '100%', height: 2, background: '#000', opacity: 0.2 }}></div>
                <div style={{ position: 'absolute', top: 16, left: 0, width: '100%', height: 2, background: '#000', opacity: 0.2 }}></div>
                <div style={{ position: 'absolute', top: 0, left: 14, width: 2, height: 16, background: '#000', opacity: 0.2 }}></div>
                <div style={{ position: 'absolute', top: 16, left: 6, width: 2, height: 16, background: '#000', opacity: 0.2 }}></div>
                <div style={{ position: 'absolute', top: 16, left: 22, width: 2, height: 16, background: '#000', opacity: 0.2 }}></div>
            </div>
        );
    }
    if (type === 'Q') {
        const color = frame % 2 === 0 ? '#FFD700' : '#EAC100'; // Blink
        return (
            <div style={{ width: '32px', height: '32px', background: color, border: '2px solid #B8860B', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 2px 2px 0 #FFF, inset -2px -2px 0 #DAA520' }}>
                <span style={{ fontFamily: '"Press Start 2P", cursive', fontSize: '20px', color: '#000', marginTop: '2px' }}>?</span>
                <div style={{ position: 'absolute', top: 2, right: 2, width: 2, height: 2, background: '#000', opacity: 0.5 }}></div>
                <div style={{ position: 'absolute', bottom: 2, left: 2, width: 2, height: 2, background: '#000', opacity: 0.5 }}></div>
                <div style={{ position: 'absolute', top: 2, left: 2, width: 2, height: 2, background: '#000', opacity: 0.5 }}></div>
                <div style={{ position: 'absolute', bottom: 2, right: 2, width: 2, height: 2, background: '#000', opacity: 0.5 }}></div>
            </div>
        );
    }
    if (type === 'EMPTY') {
        return (
            <div style={{ width: '32px', height: '32px', background: '#6B4423', border: '2px solid #3d2613', boxSizing: 'border-box' }}>
                <div style={{ width: '100%', height: '100%', border: '2px solid #8B4513' }}></div>
            </div>
        );
    }
    if (type === 'GROUND') {
        return (
            <div style={{ width: '32px', height: '32px', background: '#8B4513', borderTop: '4px solid #00AA00', boxSizing: 'border-box', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, left: 4, width: 4, height: 4, background: '#654321', opacity: 0.5 }}></div>
                <div style={{ position: 'absolute', top: 12, right: 8, width: 6, height: 4, background: '#654321', opacity: 0.5 }}></div>
            </div>
        );
    }
    return null;
};

interface MarioGameProps {
    questions: any[];
    onScoreUpdate: (score: number) => void;
}



export default function MarioGame({ questions, onScoreUpdate }: MarioGameProps) {
    // --- Game Constants ---
    const GRAVITY = 0.4;
    const FRICTION = 0.8;
    const MOVE_ACCEL = 0.5;
    const JUMP_FORCE = -10;
    const GROUND_Y = 500;

    // --- State ---
    const [screen, setScreen] = useState('TITLE');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [coins, setCoins] = useState(0);
    const [hearts, setHearts] = useState(3);
    const [timeLeft, setTimeLeft] = useState(120);

    // Quiz State
    const [quizIdx, setQuizIdx] = useState(0);
    const [feedback, setFeedback] = useState<any>(null);
    const [showPipe, setShowPipe] = useState(false);


    // --- Refs ---
    const marioRef = useRef({
        x: 100, y: 300, vx: 0, vy: 0,
        width: 32, height: 32,
        grounded: false, facing: 'right', animFrame: 0, state: 'IDLE', invincible: 0, enteringPipe: false
    });
    const entitiesRef = useRef<any[]>([]);
    const particlesRef = useRef<any[]>([]);
    const keysRef = useRef<any>({});
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);

    const gameStateRef = useRef({
        screen: 'TITLE',
        feedback: null,
        showPipe: false
    });

    const quizIdxRef = useRef(0);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // --- BGM Logic ---
    const bgmTimeoutRef = useRef<any>(null);
    const bgmIndexRef = useRef(0);

    const playSound = useCallback((type: string) => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;

        // Special Handling for Stage Clear Sequence
        if (type === 'stage_clear') {
            const now = ctx.currentTime;
            const notes = [
                { f: 392.00, t: 0.0, d: 0.08 }, // G4
                { f: 523.25, t: 0.08, d: 0.08 }, // C5
                { f: 659.25, t: 0.16, d: 0.08 }, // E5
                { f: 783.99, t: 0.24, d: 0.08 }, // G5
                { f: 1046.50, t: 0.32, d: 0.08 }, // C6
                { f: 1318.51, t: 0.40, d: 0.08 }, // E6
                { f: 1567.98, t: 0.48, d: 0.08 }, // G6
                { f: 1318.51, t: 0.56, d: 0.4 }, // E6
                // Victory Cadence
                { f: 830.61, t: 1.1, d: 0.1 }, // Gs5
                { f: 932.33, t: 1.25, d: 0.1 }, // As5
                { f: 987.77, t: 1.4, d: 0.1 }, // B5
                { f: 1046.50, t: 1.6, d: 0.6 }  // C6 (Final)
            ];

            notes.forEach(n => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = n.f;
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + n.t);
                gain.gain.setValueAtTime(0.1, now + n.t);
                gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);
                osc.stop(now + n.t + n.d);
            });
            return;
        }

        // Standard SFX
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
            case 'jump':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(300, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'coin':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(900, now);
                osc.frequency.setValueAtTime(1200, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'bump':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(50, now);
                osc.frequency.linearRampToValueAtTime(30, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'stomp':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(20, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'pipe': // Enhanced Pipe Sound
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.4);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            case 'gameover':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(100, now + 2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 2);
                osc.start(now);
                osc.stop(now + 2);
                break;
            default:
                break;
        }
    }, []);

    const playBGM = useCallback(() => {
        if (gameStateRef.current.screen !== 'GAME' || !audioCtxRef.current) return;
        const ctx = audioCtxRef.current;

        const noteData = BGM_SEQUENCE[bgmIndexRef.current];

        let nextIndex = bgmIndexRef.current + 1;
        if (nextIndex >= BGM_SEQUENCE.length) {
            nextIndex = 11;
        }
        bgmIndexRef.current = nextIndex;

        if (noteData.n) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square'; // 8-bit style
            osc.frequency.value = NOTES[noteData.n];

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            gain.gain.setValueAtTime(0.05, ctx.currentTime); // Low volume
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + noteData.d * 0.9);
            osc.stop(ctx.currentTime + noteData.d);
        }

        bgmTimeoutRef.current = setTimeout(playBGM, noteData.d * 1000);
    }, []);

    const stopBGM = useCallback(() => {
        if (bgmTimeoutRef.current) clearTimeout(bgmTimeoutRef.current);
    }, []);

    // --- Initialization ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=DungGeunMo&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            stopBGM();
        };
    }, [stopBGM]);

    // Sync refs & Manage BGM
    useEffect(() => {
        gameStateRef.current = { screen, feedback, showPipe };

        if (screen === 'GAME') {
            if (!bgmTimeoutRef.current) {
                bgmIndexRef.current = 0;
                playBGM();
            }
        } else {
            stopBGM();
            bgmTimeoutRef.current = null;
        }
    }, [screen, feedback, showPipe, playBGM, stopBGM]);

    useEffect(() => {
        quizIdxRef.current = quizIdx;
    }, [quizIdx]);

    useEffect(() => {
        onScoreUpdate(score);
    }, [score, onScoreUpdate]);

    const handleKeyDown = (e: KeyboardEvent) => {
        keysRef.current[e.code] = true;
        if ((e.code === 'Space' || e.code === 'Enter') && gameStateRef.current.screen !== 'GAME') {
            if (e.code === 'Space') e.preventDefault();
            startGame();
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };

    // --- Level Generation ---
    const initLevel = (qIndex: number) => {
        marioRef.current = {
            x: 50, y: GROUND_Y - 32, vx: 0, vy: 0,
            width: 32, height: 32, grounded: true,
            facing: 'right', animFrame: 0, state: 'IDLE', invincible: 0, enteringPipe: false
        };

        const newEntities = [];
        const startX = 250;
        const gap = 100;
        for (let i = 0; i < 4; i++) {
            newEntities.push({
                id: `qblock-${i}`, type: 'BLOCK', subtype: 'Q',
                x: startX + (i * gap), y: 350, width: 32, height: 32,
                value: i, active: true, bumpY: 0
            });
        }
        for (let i = 0; i < 25; i++) {
            newEntities.push({ id: `g-${i}`, type: 'BLOCK', subtype: 'GROUND', x: i * 32, y: GROUND_Y + 32, width: 32, height: 32 });
            newEntities.push({ id: `g2-${i}`, type: 'BLOCK', subtype: 'GROUND', x: i * 32, y: GROUND_Y + 64, width: 32, height: 32 });
        }
        newEntities.push({ id: 'pipe', type: 'PIPE', x: 700, y: GROUND_Y - 16, width: 64, height: 64 });

        entitiesRef.current = newEntities;
        particlesRef.current = [];
        setFeedback(null);
        setShowPipe(false);
    };

    const startGame = () => {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        setScore(0);
        setCoins(0);
        setHearts(3);
        setQuizIdx(0);
        setLevel(1);
        setTimeLeft(120);
        initLevel(0);
        setScreen('GAME');
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    // --- Refs for Game Loop Access (Fix Stale Closure) ---
    const scoreRef = useRef(score);
    const coinsRef = useRef(coins);
    const heartsRef = useRef(hearts);
    const timeLeftRef = useRef(timeLeft);

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { coinsRef.current = coins; }, [coins]);
    useEffect(() => { heartsRef.current = hearts; }, [hearts]);
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

    const nextLevel = () => {
        const currentIdx = quizIdxRef.current;

        if (currentIdx + 1 >= questions.length) {
            setScreen('CLEAR');
            playSound('stage_clear');

            // Calculate Final Score with Bonuses using REFS (to avoid stale closure)
            const bonusScore = coinsRef.current * 50 + heartsRef.current * 200 + timeLeftRef.current;
            const finalTotalScore = scoreRef.current + bonusScore;

            // Sync Final Score to Server
            onScoreUpdate(finalTotalScore);
            return;
        }

        const nextIdx = currentIdx + 1;
        setQuizIdx(nextIdx);
        setLevel(prev => prev + 1);
        initLevel(nextIdx);
    };



    // --- Game Loop ---
    const gameLoop = () => {
        // Update Timer
        if (frameCountRef.current % 60 === 0 && gameStateRef.current.screen === 'GAME' && !gameStateRef.current.feedback && !marioRef.current.enteringPipe) {
            setTimeLeft(t => {
                if (t <= 1) {
                    setScreen('GAMEOVER');
                    playSound('gameover');
                    return 0;
                }
                return t - 1;
            });
        }

        if (gameStateRef.current.screen === 'GAME') {
            updatePhysics();
        }

        frameCountRef.current++;

        requestRef.current = requestAnimationFrame(gameLoop);
    };

    // --- Physics & Logic ---
    const updatePhysics = () => {
        const mario = marioRef.current;
        const { feedback, showPipe } = gameStateRef.current;

        if (mario.enteringPipe) {
            mario.y += 1;
            if (mario.y > GROUND_Y + 32) {
                nextLevel();
            }
            return;
        }

        if (gameStateRef.current.screen === 'GAME') {
            if (keysRef.current['ArrowRight']) {
                mario.vx += MOVE_ACCEL;
                mario.facing = 'right';
                mario.state = 'WALK';
            } else if (keysRef.current['ArrowLeft']) {
                mario.vx -= MOVE_ACCEL;
                mario.facing = 'left';
                mario.state = 'WALK';
            } else {
                mario.state = 'IDLE';
            }

            if ((keysRef.current['Space'] || keysRef.current['ArrowUp']) && mario.grounded) {
                mario.vy = JUMP_FORCE;
                mario.grounded = false;
                mario.state = 'JUMP';
                playSound('jump');
            }

            // Pipe Entry Check (Automatic)
            if (showPipe) {
                const pipe = entitiesRef.current.find(e => e.type === 'PIPE');
                if (pipe && Math.abs((mario.x + 16) - (pipe.x + 32)) < 20 && Math.abs(mario.y + 32 - pipe.y) < 5) {
                    mario.enteringPipe = true;
                    playSound('pipe');
                }
            }
        }

        mario.vx *= FRICTION;
        mario.vy += GRAVITY;
        mario.x += mario.vx;
        mario.y += mario.vy;

        if (mario.x < 0) mario.x = 0;
        if (mario.x > 768) mario.x = 768;

        mario.grounded = false;
        if (mario.y >= GROUND_Y - mario.height) {
            mario.y = GROUND_Y - mario.height;
            mario.vy = 0;
            mario.grounded = true;
        }

        if (mario.invincible > 0) mario.invincible--;

        entitiesRef.current.forEach(entity => {
            if (
                mario.x < entity.x + entity.width &&
                mario.x + mario.width > entity.x &&
                mario.y < entity.y + entity.height &&
                mario.y + mario.height > entity.y
            ) {
                if (entity.type === 'BLOCK') {
                    const dx = (mario.x + mario.width / 2) - (entity.x + entity.width / 2);
                    const dy = (mario.y + mario.height / 2) - (entity.y + entity.height / 2);
                    const width = (mario.width + entity.width) / 2;
                    const height = (mario.height + entity.height) / 2;
                    const crossWidth = width * dy;
                    const crossHeight = height * dx;

                    if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
                        if (crossWidth > crossHeight) {
                            if (crossWidth > -crossHeight) {
                                mario.y = entity.y + entity.height;
                                mario.vy = 0;
                                if (entity.subtype === 'Q' && entity.active && !feedback) {
                                    hitBlock(entity);
                                } else {
                                    playSound('bump');
                                }
                            } else {
                                mario.x = entity.x - mario.width;
                                mario.vx = 0;
                            }
                        } else {
                            if (crossWidth > -crossHeight) {
                                mario.x = entity.x + entity.width;
                                mario.vx = 0;
                            } else {
                                if (mario.vy > 0) {
                                    mario.y = entity.y - mario.height;
                                    mario.vy = 0;
                                    mario.grounded = true;
                                }
                            }
                        }
                    }
                }

                if (entity.type === 'GOOMBA' && !entity.dead && mario.invincible === 0) {
                    if (mario.vy > 0 && mario.y + mario.height < entity.y + entity.height / 2) {
                        entity.dead = true;
                        mario.vy = -5;
                        setScore(s => s + 50);
                        playSound('stomp');
                        setTimeout(() => {
                            entitiesRef.current = entitiesRef.current.filter(e => e !== entity);
                        }, 500);
                    } else {
                        mario.invincible = 120;
                        setHearts(h => {
                            const next = h - 1;
                            if (next <= 0) {
                                setScreen('GAMEOVER');
                                playSound('gameover');
                            } else {
                                playSound('bump');
                            }
                            return next;
                        });
                    }
                }
            }

            if (entity.type === 'GOOMBA' && !entity.dead) {
                entity.x += entity.vx;
                if (entity.x < 0 || entity.x > 780) entity.vx *= -1;
                entity.frame = Math.floor(frameCountRef.current / 15) % 2;
            }

            if (entity.bumpY && entity.bumpY > 0) {
                entity.bumpY -= 1;
            }
        });
    };

    const hitBlock = (block: any) => {
        block.active = false;
        block.subtype = 'EMPTY';
        block.bumpY = 10;

        const ansIdx = block.value;
        const currentQuiz = questions[quizIdxRef.current];

        if (ansIdx === currentQuiz.answer) {
            playSound('coin');
            setScore(s => s + 100);
            setCoins(c => c + 1);
            setFeedback({ type: 'CORRECT', msg: 'Correct!' });
            setShowPipe(true);

            particlesRef.current.push({
                type: 'COIN', x: block.x + 8, y: block.y - 32, vy: -5, life: 30
            });

            entitiesRef.current.forEach(e => {
                if (e.type === 'BLOCK' && e.subtype === 'Q' && e !== block) {
                    e.active = false; e.subtype = 'EMPTY'; e.y = -1000;
                }
            });

        } else {
            playSound('bump');
            setFeedback({ type: 'WRONG', msg: 'Wrong!' });
            setShowPipe(true);

            setTimeout(() => {
                if (gameStateRef.current.screen !== 'GAME') return;

                entitiesRef.current.push({
                    id: `goomba-${Date.now()}`, type: 'GOOMBA',
                    x: block.x, y: GROUND_Y - 32, width: 32, height: 32,
                    vx: -1, frame: 0, dead: false
                });
                playSound('bump');
            }, 1000);

            entitiesRef.current.forEach(e => {
                if (e.type === 'BLOCK' && e.subtype === 'Q' && e !== block) {
                    e.active = false; e.subtype = 'EMPTY'; e.y = -1000;
                }
            });
        }
    };



    const [tick, setTick] = useState(0);
    useEffect(() => {
        if (screen === 'GAME') {
            const loop = () => {
                setTick(t => t + 1);
                requestAnimationFrame(loop);
            };
            const id = requestAnimationFrame(loop);
            return () => cancelAnimationFrame(id);
        }
    }, [screen]);

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-900 font-sans select-none overflow-hidden">

            {/* --- CSS STYLES --- */}
            <style>{`
        .nes-font { font-family: 'Press Start 2P', monospace; }
        .pixel-font { font-family: 'DungGeunMo', monospace; }
        .game-container {
          position: relative;
          width: 800px;
          height: 600px;
          background-color: #5C94FC;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
          image-rendering: pixelated;
        }
        .sky-cloud {
            position: absolute;
            background: #fff;
            border-radius: 20px;
            opacity: 0.8;
        }
        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
        }
        .blink { animation: blink 1s infinite; }
      `}</style>

            {/* --- MAIN GAME CONTAINER --- */}
            <div className="game-container">

                {/* --- TITLE SCREEN --- */}
                {screen === 'TITLE' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#5C94FC]">
                        <div className="mb-10 text-center">
                            <h1 className="nes-font text-6xl text-[#E52521] drop-shadow-[4px_4px_0_#000] mb-4">SUPER MARIO</h1>
                            <h2 className="pixel-font text-4xl text-white drop-shadow-[2px_2px_0_#000]">퀴즈 게임</h2>
                        </div>
                        <div className="mt-20">
                            <button
                                onClick={startGame}
                                className="nes-font text-2xl text-white blink hover:text-[#FFD700]"
                            >
                                PRESS START BUTTON
                            </button>
                        </div>
                        <div className="absolute bottom-0 w-full h-16 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IiNEODc1MzYiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzIiIGhlaWdodD0iMiIgZmlsbD0iIzlDNEExQSIvPjwvc3ZnPg==')]"></div>
                        <div style={{ position: 'absolute', bottom: 64, left: 100 }}>
                            <MarioSprite frame={0} facing="right" />
                        </div>
                    </div>
                )}

                {/* --- GAME SCREEN --- */}
                {screen === 'GAME' && questions[quizIdx] && (
                    <>
                        {/* HUD */}
                        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start nes-font text-white text-xl z-20 drop-shadow-md">
                            <div className="flex flex-col">
                                <span>MARIO</span>
                                <span>{score.toString().padStart(6, '0')}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span>WORLD</span>
                                <span>1-{level}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span>TIME</span>
                                <span>{timeLeft.toString().padStart(3, '0')}</span>
                            </div>
                        </div>
                        <div className="absolute top-16 left-4 flex gap-2 z-20 text-white nes-font text-lg">
                            <span>❤ {hearts}</span>
                            <span className="ml-4 text-[#FFD700]">🪙 x {coins.toString().padStart(2, '0')}</span>
                        </div>

                        {/* Clouds Decoration */}
                        <div className="sky-cloud w-32 h-12 top-20 left-20"></div>
                        <div className="sky-cloud w-24 h-10 top-40 right-40"></div>

                        {/* QUIZ BOX */}
                        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 border-4 border-white p-4 rounded text-white text-center w-3/4 z-10">
                            <p className="text-yellow-400 mb-2 nes-font">QUESTION {quizIdx + 1}/{questions.length}</p>
                            <p className="pixel-font text-2xl leading-relaxed whitespace-pre-line">{questions[quizIdx].q}</p>
                        </div>

                        {/* FEEDBACK BOX */}
                        {feedback && (
                            <div className="absolute top-56 left-1/2 transform -translate-x-1/2 bg-blue-900 border-4 border-white p-4 w-3/4 text-center z-30 shadow-lg">
                                <p className={`pixel-font text-3xl mb-2 ${feedback.type === 'CORRECT' ? 'text-green-400' : 'text-red-400'}`}>
                                    {feedback.type === 'CORRECT' ? '정답입니다! ⭕' : '오답입니다! ❌'}
                                </p>
                                <p className="pixel-font text-xl text-white whitespace-pre-line">{feedback.msg}</p>
                                {showPipe && <p className="mt-2 text-yellow-300 nes-font blink">GO TO PIPE &rarr;</p>}
                            </div>
                        )}



                        // ... inside MarioGame component ...

                        // ...
                        {/* GAME FIELD RENDER */}
                        <div className="absolute w-full h-full">
                            {/* Dynamic Entities */}
                            {entitiesRef.current.map(ent => {
                                if (ent.type === 'BLOCK') {
                                    return (
                                        <div key={ent.id} style={{
                                            position: 'absolute', left: ent.x, top: ent.y - (ent.bumpY || 0),
                                            width: ent.width, height: ent.height
                                        }}>
                                            <BlockSprite type={ent.subtype} frame={Math.floor(frameCountRef.current / 30)} />
                                            {ent.subtype === 'Q' && (
                                                <div className="absolute -bottom-8 w-full text-center text-white nes-font font-bold drop-shadow-md">
                                                    {ent.value + 1}
                                                </div>
                                            )}
                                            {ent.subtype === 'Q' && (
                                                <div className="absolute -top-8 w-24 left-1/2 -translate-x-1/2 text-center text-white pixel-font text-sm bg-black bg-opacity-50 rounded px-1">
                                                    {questions[quizIdx].options[ent.value]}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                if (ent.type === 'GOOMBA') {
                                    return (
                                        <div key={ent.id} style={{
                                            position: 'absolute', left: ent.x, top: ent.y,
                                            width: ent.width, height: ent.height,
                                            transition: ent.dead ? 'opacity 0.2s' : 'none',
                                            opacity: ent.dead ? 0 : 1
                                        }}>
                                            <GoombaSprite frame={ent.frame} isDead={ent.dead} />
                                        </div>
                                    );
                                }
                                if (ent.type === 'PIPE') {
                                    return (
                                        <div key={ent.id} style={{
                                            position: 'absolute', left: ent.x, top: ent.y,
                                            width: ent.width, height: ent.height,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                                        }}>
                                            {showPipe && (
                                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-[#FF0000] nes-font text-sm blink font-bold flex flex-col items-center z-20 pointer-events-none">
                                                    <span>HERE</span>
                                                    <span>↓</span>
                                                </div>
                                            )}
                                            <div style={{ width: 64, height: 32, background: '#00A800', border: '4px solid #000', boxSizing: 'border-box' }}></div>
                                            <div style={{ width: 56, height: 32, background: '#00A800', border: '4px solid #000', borderTop: 'none', boxSizing: 'border-box' }}></div>
                                        </div>
                                    );
                                }
                                return null;
                            })}

                            {/* Particles & Mario ... */}

                            {particlesRef.current.map((p, i) => (
                                <div key={i} style={{
                                    position: 'absolute', left: p.x, top: p.y - (30 - p.life) * 2,
                                    width: 16, height: 16, background: '#FFD700', borderRadius: '50%',
                                    border: '2px solid #DAA520'
                                }}>
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">$</div>
                                </div>
                            ))}

                            <div style={{
                                position: 'absolute',
                                left: marioRef.current.x,
                                top: marioRef.current.y,
                                width: 32, height: 32,
                                opacity: marioRef.current.invincible % 4 < 2 ? 1 : 0.5,
                                zIndex: 100
                            }}>
                                <MarioSprite
                                    frame={Math.floor(marioRef.current.x / 10) % 2}
                                    facing={marioRef.current.facing}
                                    isJumping={!marioRef.current.grounded}
                                    isDead={false}
                                />
                            </div>
                        </div>

                        <div className="absolute bottom-0 w-full h-[100px] bg-[#D87536] border-t-4 border-[#9C4A1A] z-0"
                            style={{ backgroundImage: 'linear-gradient(45deg, #C06020 25%, transparent 25%, transparent 75%, #C06020 75%, #C06020), linear-gradient(45deg, #C06020 25%, transparent 25%, transparent 75%, #C06020 75%, #C06020)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 8px 8px' }}>
                        </div>
                    </>
                )}

                {/* --- GAME OVER --- */}
                {screen === 'GAMEOVER' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                        <h1 className="nes-font text-5xl text-white mb-8">GAME OVER</h1>
                        <p className="nes-font text-2xl text-red-500 mb-4">FINAL SCORE: {score}</p>
                        <div className="mb-12 text-center text-gray-400 pixel-font">
                            <p>다시 도전해보세요!</p>
                        </div>
                        <button onClick={startGame} className="nes-font text-white border-2 border-white p-4 hover:bg-white hover:text-black">RETRY</button>
                    </div>
                )}

                {/* --- CLEAR SCREEN --- */}
                {screen === 'CLEAR' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#5C94FC]">
                        <div className="bg-black bg-opacity-50 p-8 rounded-lg text-center border-4 border-white">
                            <h1 className="nes-font text-3xl text-yellow-400 mb-8">CONGRATULATIONS!</h1>
                            <div className="pixel-font text-white text-xl text-left space-y-4 font-bold">
                                <p>정답 : {score / 100} x 100 = {score}</p>
                                <p>동전 : {coins} x 50 = {coins * 50}</p>
                                <p>하트 : {hearts} x 200 = {hearts * 200}</p>
                                <p>남은 시간 : {timeLeft} x 1 = {timeLeft}</p>
                                <div className="border-t-2 border-white my-2"></div>
                                <p className="text-2xl text-yellow-300">TOTAL SCORE = {score + coins * 50 + hearts * 200 + timeLeft}</p>
                            </div>
                            <button onClick={startGame} className="mt-8 nes-font text-white border-2 border-white p-2 hover:bg-white hover:text-black">PLAY AGAIN</button>
                        </div>
                        <div className="absolute top-10 left-10 text-4xl animate-bounce">🎆</div>
                        <div className="absolute top-20 right-20 text-4xl animate-bounce">✨</div>
                    </div>
                )}

            </div>

            {/* Instructions */}
            <div className="mt-4 text-gray-400 text-sm pixel-font text-center">
                <p>이동: ← → | 점프: 스페이스바/↑ | 파이프 입장: 파이프 위로 점프!</p>
                <p>정답 블럭을 머리로 치세요! 오답이면 굼바가 나타납니다.</p>
            </div>
        </div>
    );
}
