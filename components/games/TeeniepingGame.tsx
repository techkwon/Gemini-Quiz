'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Sparkles, RefreshCcw, Play, MessageCircle, CloudSun, Heart, Home, Image as ImageIcon, Loader2, Volume2, VolumeX, Music, Trophy, Calculator, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// --- Types ---
interface Question {
    id: string;
    question?: string;
    q?: string;
    options: string[];
    answer: string | number;
}

interface TeeniepingGameProps {
    questions: Question[];
    onScoreUpdate: (score: number) => void;
}

/**
 * ------------------------------------------------------------------
 * 1. Data & Utils
 * ------------------------------------------------------------------
 */
const LANE_WIDTH = 11;
const TILE_SIZE = 30;
const STEP_TIME = 150;
const OBSTACLE_SPEED_FACTOR = 0.6;
const TARGET_CORRECT_ANSWERS = 10;

const CHAR_DATA = {
    hachu: {
        name: '하츄핑', color: 0xFFB7C5, accColor: 0xFF69B4, theme: 'from-pink-400 to-rose-400', img: 'https://imgur.com/uLw8gyC.png',
        script: { start: "웃음 구름을 찾으러 가자츄!", quiz: "문제 나간다츄! 준비됐츄?", correct: "역시 센스쟁이츄!", wrong: "으항항! 틀렸지만 재밌다츄!" }
    },
    baro: {
        name: '바로핑', color: 0x87CEEB, accColor: 0x1E90FF, theme: 'from-sky-400 to-blue-500', img: 'https://imgur.com/SdrjFQa.png',
        script: { start: "바르게 웃음 에너지를 모아보자핑!", quiz: "집중해라, 문제 나간다핑!", correct: "정확하다핑!", wrong: "논리적이지 않지만 웃기다핑!" }
    },
    aza: {
        name: '아자핑', color: 0xFFD700, accColor: 0x333333, theme: 'from-yellow-400 to-amber-500', img: 'https://imgur.com/oPYOn2H.png',
        script: { start: "용기 있게 웃겨보는 거야핑!", quiz: "자, 덤벼라 퀴즈다핑!", correct: "훌륭하다핑!", wrong: "틀려도 기죽지 마라핑!" }
    },
    chacha: {
        name: '차차핑', color: 0x98FB98, accColor: 0x008000, theme: 'from-green-400 to-emerald-500', img: 'https://imgur.com/iRtsagB.png',
        script: { start: "희망의 웃음꽃을 피우자핑!", quiz: "이 문제 알 수 있을까핑?", correct: "대단해핑!", wrong: "괜찮아, 하트가 남았다핑!" }
    },
    lala: {
        name: '라라핑', color: 0xDDA0DD, accColor: 0x800080, theme: 'from-purple-400 to-fuchsia-500', img: 'https://imgur.com/TKVRxBy.png',
        script: { start: "즐겁게 노래하며 가자핑!", quiz: "랄랄라~ 문제 들어보라핑!", correct: "흥이 난다핑!", wrong: "어머, 엉뚱해서 더 재밌다핑!" }
    }
};

class SimpleSynth {
    ctx: AudioContext | null = null;
    isPlaying = false;
    loopId: NodeJS.Timeout | null = null;

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq: number, duration: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine', time: number | null = null) {
        if (!this.ctx) this.init();
        if (!this.ctx) return;

        try {
            const t = time || this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.01, t);
            gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
            gain.gain.linearRampToValueAtTime(0.01, t + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + duration + 0.1);
        } catch (e) {
            console.error("Audio error:", e);
        }
    }

    playMelody(notes: { freq: number; dur: number }[]) {
        if (this.isPlaying) return;
        this.init();
        this.isPlaying = true;

        if (!this.ctx) return;

        let currentTime = this.ctx.currentTime + 0.1;
        let totalDuration = 0;

        notes.forEach(note => {
            if (note.freq > 0) {
                this.playTone(note.freq, note.dur, 'sine', currentTime);
            }
            currentTime += note.dur;
            totalDuration += note.dur;
        });

        this.loopId = setTimeout(() => {
            this.isPlaying = false;
            // Loop if needed
        }, totalDuration * 1000);
    }

    stop() {
        if (this.loopId) clearTimeout(this.loopId);
        this.isPlaying = false;
    }
}

const TEENIEPING_THEME = [
    { freq: 784, dur: 0.2 }, { freq: 784, dur: 0.2 }, { freq: 880, dur: 0.2 }, { freq: 784, dur: 0.2 },
    { freq: 1046, dur: 0.4 }, { freq: 987, dur: 0.4 },
    { freq: 784, dur: 0.2 }, { freq: 784, dur: 0.2 }, { freq: 880, dur: 0.2 }, { freq: 784, dur: 0.2 },
    { freq: 1175, dur: 0.4 }, { freq: 1046, dur: 0.4 },
    { freq: 784, dur: 0.2 }, { freq: 784, dur: 0.2 }, { freq: 1568, dur: 0.4 }, { freq: 1318, dur: 0.4 },
    { freq: 1046, dur: 0.2 }, { freq: 987, dur: 0.2 }, { freq: 880, dur: 0.4 },
    { freq: 1397, dur: 0.2 }, { freq: 1397, dur: 0.2 }, { freq: 1318, dur: 0.4 }, { freq: 1046, dur: 0.2 },
    { freq: 1175, dur: 0.4 }, { freq: 1046, dur: 0.8 },
    { freq: 0, dur: 0.5 }
];

const imageCache: { [key: string]: HTMLImageElement } = {};

function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export default function TeeniepingGame({ questions, onScoreUpdate }: TeeniepingGameProps) {
    const [gameState, setGameState] = useState('title');
    const gameStateRef = useRef('title'); // Ref to track state in animation loop

    const [score, setScore] = useState(0);
    const [selectedChar, setSelectedChar] = useState<keyof typeof CHAR_DATA>('hachu');
    const selectedCharRef = useRef<keyof typeof CHAR_DATA>('hachu');

    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const [hearts, setHearts] = useState(3);
    const [correctCount, setCorrectCount] = useState(0);
    const [attemptCount, setAttemptCount] = useState(0);

    const [currentQuiz, setCurrentQuiz] = useState<any>(null);
    const [shuffledQuizzes, setShuffledQuizzes] = useState<any[]>([]);
    const shuffledQuizzesRef = useRef<any[]>([]); // Ref for access in loop

    const [dialogue, setDialogue] = useState("");
    const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [warningMsg, setWarningMsg] = useState(false);

    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const playerRef = useRef<THREE.Group | null>(null);
    const lanesRef = useRef<THREE.Group[]>([]);
    const requestRef = useRef<number | null>(null);
    const lightRef = useRef<THREE.DirectionalLight | null>(null);

    const synthRef = useRef(new SimpleSynth());

    const timeVars = useRef({
        totalPausedTime: 0,
        pauseStartTime: 0,
        lastFrameTime: 0
    });

    const gameVars = useRef({
        currentLane: 0,
        currentColumn: 0,
        moves: [] as { dir: string; nLane: number; nCol: number }[],
        stepStartTimestamp: null as number | null,
        isGameActive: false,
        score: 0,
        nextQuizLane: 10,
        quizIndex: 0
    });

    // Keep Ref updated with State
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        selectedCharRef.current = selectedChar;
    }, [selectedChar]);

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (!isMuted) {
            synthRef.current.stop();
        } else {
            if (gameState === 'playing' || gameState === 'title') {
                // Optional
            }
        }
    };

    // --- Preload ---
    useEffect(() => {
        if (gameState !== 'loading') return;

        const imageUrls = Object.values(CHAR_DATA).map(char => char.img);
        let loadedCount = 0;
        const total = imageUrls.length;

        // Simple preload logic
        const preload = async () => {
            for (const url of imageUrls) {
                await new Promise(r => {
                    const img = new Image();
                    img.src = url;
                    img.referrerPolicy = "no-referrer";
                    img.onload = r;
                    img.onerror = r;
                });
                loadedCount++;
                setLoadingProgress(Math.floor((loadedCount / total) * 100));
            }
            setGameState('menu');
        }
        preload();
    }, [gameState]);


    // --- Game Loop Initialization (ONCE) ---
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!mountRef.current) return;

        // 1. Setup Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        scene.fog = new THREE.Fog(0x87CEEB, 500, 1200);
        sceneRef.current = scene;

        const aspect = window.innerWidth / window.innerHeight;
        const d = 350;
        const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 10000);
        camera.position.set(200, 200, 200);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        // FORCE STYLES
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.zIndex = '1'; // Above z-0 div, below z-20 UI
        rendererRef.current = renderer;

        mountRef.current.appendChild(renderer.domElement);

        // Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(100, 200, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.left = -400;
        dirLight.shadow.camera.right = 400;
        dirLight.shadow.camera.top = 400;
        dirLight.shadow.camera.bottom = -400;
        scene.add(dirLight);
        scene.add(dirLight.target);
        lightRef.current = dirLight;

        resetMap(scene);

        // 2. Animate Loop
        const animate = (rawTime: number) => {
            requestRef.current = requestAnimationFrame(animate);
            renderer.render(scene, camera);
            if (rawTime < 2000) console.log("DEBUG Render Frame", scene.children.length);

            // Sync refs
            const currentGS = gameStateRef.current;

            // Ensure player is in scene when needed
            if (['playing', 'gameover', 'gameclear'].includes(currentGS)) {
                if (playerRef.current && playerRef.current.parent !== scene) {
                    scene.add(playerRef.current);
                }
            } else {
                if (playerRef.current && playerRef.current.parent === scene) {
                    scene.remove(playerRef.current);
                }
            }

            const player = playerRef.current;

            if (['title', 'loading', 'menu'].includes(currentGS)) {
                camera.position.x = 200 + Math.sin(rawTime * 0.0005) * 50;
                camera.lookAt(0, 0, 0);
                return;
            }

            if (currentGS === 'gameover' || currentGS === 'gameclear') {
                if (player) {
                    camera.position.x = (player.position.x + 200) + Math.sin(rawTime * 0.0005) * 20;
                    camera.lookAt(player.position.x, 0, player.position.z - 120);
                }
                return;
            }

            if (currentGS === 'quiz') {
                if (timeVars.current.pauseStartTime === 0) {
                    timeVars.current.pauseStartTime = rawTime;
                }
                return;
            }
            if (timeVars.current.pauseStartTime !== 0) {
                const pauseDuration = rawTime - timeVars.current.pauseStartTime;
                timeVars.current.totalPausedTime += pauseDuration;
                timeVars.current.pauseStartTime = 0;
            }

            const time = rawTime - timeVars.current.totalPausedTime;
            if (!gameVars.current.isGameActive) return;

            // Update Game Logic
            updateGameLogic(time, scene, camera);
        };

        requestRef.current = requestAnimationFrame(animate);

        // Cleanup
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            scene.clear();
            renderer.dispose();
        };

    }, []); // Run ONCE


    // Logic separated from animate loop for clarity
    const updateGameLogic = (time: number, scene: THREE.Scene, camera: THREE.Camera) => {
        const vars = gameVars.current;
        const player = playerRef.current;

        // Move player logic
        if (vars.moves.length > 0) {
            const m = vars.moves[0];
            if (!vars.stepStartTimestamp) vars.stepStartTimestamp = time;

            const progress = Math.min((time - vars.stepStartTimestamp) / STEP_TIME, 1);

            const startX = (m.nCol + (m.dir === 'left' ? 1 : (m.dir === 'right' ? -1 : 0))) * TILE_SIZE;
            const endX = m.nCol * TILE_SIZE;
            const startZ = -(m.nLane + (m.dir === 'forward' ? -1 : (m.dir === 'backward' ? 1 : 0))) * TILE_SIZE;
            const endZ = -m.nLane * TILE_SIZE;

            if (player) {
                player.position.x = startX + (endX - startX) * progress;
                player.position.z = startZ + (endZ - startZ) * progress;
                player.position.y = Math.sin(progress * Math.PI) * 12;

                if (m.dir === 'forward') player.rotation.y = Math.PI;
                else if (m.dir === 'backward') player.rotation.y = 0;
                else if (m.dir === 'left') player.rotation.y = -Math.PI / 2;
                else if (m.dir === 'right') player.rotation.y = Math.PI / 2;
            }

            if (progress >= 1) {
                vars.moves.shift();
                vars.stepStartTimestamp = null;
                if (player) player.position.y = 0;
                checkRiverSafety();
                checkBalloonCollision();
                checkQuizPass();
            }
        } else {
            checkRiverSafety();
        }

        // Camera Follow
        if (player) {
            const targetZ = player.position.z + 200;
            const targetX = player.position.x + 200;
            camera.position.z += (targetZ - camera.position.z) * 0.1;
            camera.position.x += (targetX - camera.position.x) * 0.1;
            const lookAtOffsetZ = -150;
            camera.lookAt(player.position.x, 0, player.position.z + lookAtOffsetZ);

            if (lightRef.current) {
                lightRef.current.position.set(player.position.x + 100, player.position.y + 200, player.position.z + 50);
                lightRef.current.target.position.copy(player.position);
                lightRef.current.target.updateMatrixWorld();
            }
        }

        updateObstacles(time);
    };

    const resetMap = (scene: THREE.Scene) => {
        lanesRef.current.forEach(lane => scene.remove(lane));
        lanesRef.current = [];
        for (let i = 0; i < 30; i++) {
            createLane(scene, i, i < 5 ? 'grass' : null);
        }
    };

    const createLane = (scene: THREE.Scene, index: number, typeOverride: string | null = null) => {
        const laneGroup = new THREE.Group();
        let type = typeOverride;
        let floorColor = 0x93E9BE; // Default Grass

        if (!type) {
            if (index > 0 && index % 10 === 0) type = 'grass_quiz';
            else if ((index + 1) % 10 === 0 || (index - 1) % 10 === 0) type = 'grass';
            else {
                const rand = Math.random();
                if (rand < 0.45) type = 'grass';
                else if (rand < 0.75) type = 'road';
                else {
                    if (gameVars.current.quizIndex >= 5) type = 'river';
                    else type = 'grass';
                }
            }
        }

        laneGroup.userData = { type: type, obstacles: [], speed: 0, lastSpawnTime: 0, quizSolved: false };
        const floorGeo = new THREE.BoxGeometry(LANE_WIDTH * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        if (type === 'road') floorColor = 0x555555;
        if (type === 'river') floorColor = 0x4FB3E8;
        if (type === 'grass_quiz') floorColor = 0xFFD1DC;

        const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.8 }));

        if (type === 'river') {
            floor.position.y = -TILE_SIZE / 2 - 5;
            floor.receiveShadow = false;
        } else {
            floor.position.y = -TILE_SIZE / 2;
            floor.receiveShadow = true;
        }
        laneGroup.add(floor);

        if (type === 'road' || type === 'river') {
            laneGroup.userData.speed = (Math.random() * 0.5 + 0.3) * (Math.random() < 0.5 ? 1 : -1) * OBSTACLE_SPEED_FACTOR;
        }
        else if (type === 'grass_quiz') {
            const positions = [-3, -1, 1, 3];
            positions.forEach((pos, i) => {
                const balloon = createBalloon(i + 1);
                balloon.position.set(pos * TILE_SIZE, 15, 0);
                laneGroup.add(balloon);
                // @ts-ignore
                laneGroup.userData.obstacles.push({ mesh: balloon, type: 'balloon', answerIdx: i });
            });
        }
        else if (type === 'grass') {
            const treeCount = Math.floor(Math.random() * 2);
            for (let i = 0; i < treeCount; i++) {
                const col = Math.floor(Math.random() * LANE_WIDTH) - Math.floor(LANE_WIDTH / 2);
                if (index === 0 && col === 0) continue;
                const tree = createTree();
                tree.position.set(col * TILE_SIZE, 0, 0);
                laneGroup.add(tree);
                // @ts-ignore
                laneGroup.userData.obstacles.push({ mesh: tree, col: col, type: 'tree' });
            }
        }
        laneGroup.position.z = -index * TILE_SIZE;
        scene.add(laneGroup);
        lanesRef.current.push(laneGroup);
    };

    const createPlayer = () => {
        const scene = sceneRef.current;
        if (!scene) return;
        if (playerRef.current) scene.remove(playerRef.current);

        const charInfo = CHAR_DATA[selectedCharRef.current]; // Use Ref here
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: charInfo.color, roughness: 0.4 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(22, 22, 22), bodyMat);
        body.position.y = 11; body.castShadow = true; group.add(body);
        const eyeGeo = new THREE.BoxGeometry(4, 4, 2);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat); leftEye.position.set(-6, 16, 11.5);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat); rightEye.position.set(6, 16, 11.5);
        group.add(leftEye); group.add(rightEye);

        // Accessories
        const accMat = new THREE.MeshStandardMaterial({ color: charInfo.accColor, roughness: 0.4 });
        let acc;
        const sChar = selectedCharRef.current;
        if (sChar === 'hachu') { acc = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 4), accMat); acc.position.set(0, 24, 0); }
        else if (sChar === 'baro') { acc = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 2), accMat); acc.position.set(0, 16, 12); }
        else if (sChar === 'aza') { acc = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 6), accMat); acc.position.set(0, 10, 12); }
        else if (sChar === 'chacha') { acc = new THREE.Mesh(new THREE.ConeGeometry(4, 12, 8), accMat); acc.position.set(0, 26, 0); }
        else if (sChar === 'lala') { acc = new THREE.Mesh(new THREE.SphereGeometry(5, 8, 8), accMat); acc.position.set(12, 12, 5); }
        if (acc) group.add(acc);

        scene.add(group);
        playerRef.current = group;
        group.rotation.y = Math.PI;
    };

    const updateObstacles = (time: number) => {
        const player = playerRef.current;
        if (!player) return;

        lanesRef.current.forEach(lane => {
            if (Math.abs(lane.position.z - player.position.z) > 600) return;
            const { type, speed, obstacles, lastSpawnTime } = lane.userData;

            if (type === 'grass_quiz') {
                // @ts-ignore
                obstacles.forEach(obs => {
                    if (obs.type === 'balloon') {
                        obs.mesh.position.y = 15 + Math.sin(time * 0.003 + obs.mesh.position.x) * 3;
                    }
                });
                return;
            }

            if (type === 'road' || type === 'river') {
                const spawnCooldown = type === 'road' ? 2000 : 1500;
                if (time - lastSpawnTime > spawnCooldown) {
                    // @ts-ignore
                    if (Math.random() < 0.05 && obstacles.length < 4) {
                        let mesh;
                        if (type === 'road') { mesh = createCar(); mesh.rotation.y = speed > 0 ? 0 : Math.PI; }
                        else { mesh = createLog(); }
                        mesh.position.x = speed > 0 ? -400 : 400;
                        lane.add(mesh);
                        // @ts-ignore
                        obstacles.push({ mesh });
                        lane.userData.lastSpawnTime = time;
                    }
                }
                for (let i = obstacles.length - 1; i >= 0; i--) {
                    const obs = obstacles[i];
                    obs.mesh.position.x += speed * 2.5;
                    if (obs.mesh.position.x > 450 || obs.mesh.position.x < -450) {
                        lane.remove(obs.mesh); obstacles.splice(i, 1);
                    }
                    if (type === 'road' && Math.abs(lane.position.z - player.position.z) < 5) {
                        if (Math.abs(player.position.x - obs.mesh.position.x) < 20) { handleDamage(); }
                    }
                }
            }
        });
    };

    const checkRiverSafety = () => {
        if (!gameVars.current.isGameActive || !playerRef.current) return;
        const pZ = Math.round(playerRef.current.position.z);
        const currentLaneObj = lanesRef.current.find(l => Math.abs(l.position.z - pZ) < 5);

        if (currentLaneObj && currentLaneObj.userData.type === 'river') {
            let onLog = false;
            // @ts-ignore
            currentLaneObj.userData.obstacles.forEach(obs => {
                const width = obs.mesh.userData.width || 40;
                if (Math.abs(playerRef.current!.position.x - obs.mesh.position.x) < width / 2 + 5) {
                    onLog = true;
                    if (gameVars.current.moves.length === 0) {
                        playerRef.current!.position.x += currentLaneObj.userData.speed * 2.5;
                        gameVars.current.currentColumn = Math.round(playerRef.current!.position.x / TILE_SIZE);
                    }
                }
            });
            if (!onLog && gameVars.current.moves.length === 0) { handleDamage(); }
        }
    };

    const checkBalloonCollision = () => {
        // ... logic ...
        if (!gameVars.current.isGameActive || !playerRef.current) return;
        const currentLaneIdx = gameVars.current.currentLane;
        const lanesToCheck = [currentLaneIdx - 1, currentLaneIdx];

        lanesToCheck.forEach(laneIdx => {
            if (laneIdx < 0) return;
            const laneObj = lanesRef.current[laneIdx];

            if (laneObj && laneObj.userData.type === 'grass_quiz' && !laneObj.userData.quizSolved) {
                const obstacles = laneObj.userData.obstacles;
                // @ts-ignore
                obstacles.forEach(obs => {
                    if (obs.type === 'balloon') {
                        const dx = Math.abs(playerRef.current!.position.x - obs.mesh.position.x);
                        const dz = Math.abs(playerRef.current!.position.z - laneObj.position.z);

                        if (dx < 30 && dz < 30) {
                            handleQuizBalloonHit(obs.answerIdx, laneObj);
                        }
                    }
                });
            }
        });
    };

    const handleQuizBalloonHit = (answerIdx: number, laneObj: THREE.Group) => {
        if (laneObj.userData.quizSolved) return;
        laneObj.userData.quizSolved = true;

        // @ts-ignore
        laneObj.userData.obstacles.forEach(o => {
            if (o.type === 'balloon') o.mesh.visible = false;
        });

        const quizzes = shuffledQuizzesRef.current;
        if (!quizzes || quizzes.length === 0) return;

        const quizIdx = gameVars.current.quizIndex % quizzes.length;
        const quiz = quizzes[quizIdx];

        if (!quiz) return;

        setAttemptCount(prev => prev + 1);

        let isCorrect = false;
        if (typeof quiz.a === 'number') {
            isCorrect = answerIdx === quiz.a;
        } else {
            isCorrect = answerIdx === quiz.a;
        }

        if (isCorrect) {
            synthRef.current.playTone(880, 0.1, 'sine');
            setTimeout(() => synthRef.current.playTone(1100, 0.2, 'sine'), 100);
            setShowFeedback('correct');
            setDialogue("정답이다츄! " + CHAR_DATA[selectedCharRef.current].script.correct);

            setScore(prev => {
                const newScore = prev + 50;
                onScoreUpdate(newScore);
                return newScore;
            });
            setCorrectCount(prev => {
                const newCount = prev + 1;
                if (newCount >= questions.length) {
                    setTimeout(() => handleGameClear(), 1500);
                }
                return newCount;
            });

        } else {
            synthRef.current.playTone(200, 0.3, 'sawtooth');
            setShowFeedback('wrong');
            setDialogue("땡! " + CHAR_DATA[selectedCharRef.current].script.wrong);
            setHearts(prev => {
                const newHearts = prev - 1;
                if (newHearts <= 0) {
                    setTimeout(() => handleGameOver(), 1000);
                    return 0;
                }
                return newHearts;
            });
        }

        setTimeout(() => {
            setShowFeedback(null);
            setDialogue("");
            nextQuiz();
        }, 1500);
    };

    const checkQuizPass = () => {
        const vars = gameVars.current;
        const passedLaneIdx = vars.currentLane - 1;

        if (passedLaneIdx >= 0) {
            const laneObj = lanesRef.current[passedLaneIdx];
            if (laneObj && laneObj.userData.type === 'grass_quiz' && !laneObj.userData.quizSolved) {
                laneObj.userData.quizSolved = true;

                // @ts-ignore
                laneObj.userData.obstacles.forEach(o => {
                    if (o.type === 'balloon') o.mesh.visible = false;
                });

                setWarningMsg(true);
                setAttemptCount(prev => prev + 1);
                synthRef.current.playTone(150, 0.5, 'sawtooth');

                setHearts(prev => {
                    const newHearts = prev - 1;
                    if (newHearts <= 0) {
                        setTimeout(() => handleGameOver(), 1000);
                        return 0;
                    }
                    setTimeout(() => {
                        setWarningMsg(false);
                        nextQuiz();
                    }, 1500);
                    return newHearts;
                });
            }
        }
    };

    const nextQuiz = () => {
        gameVars.current.quizIndex += 1;
        const quizzes = shuffledQuizzesRef.current;
        if (quizzes.length > 0) {
            const nextQ = quizzes[gameVars.current.quizIndex % quizzes.length];
            setCurrentQuiz(nextQ);
        }
        gameVars.current.nextQuizLane += 10;
    };

    const handleDamage = () => {
        synthRef.current.playTone(150, 0.3, 'sawtooth');
        setHearts(prev => {
            const newHearts = prev - 1;
            if (newHearts <= 0) {
                handleGameOver();
                return 0;
            }

            const currentLaneIdx = gameVars.current.currentLane;
            let safeLaneIdx = currentLaneIdx - 1;
            while (safeLaneIdx >= 0) {
                if (lanesRef.current[safeLaneIdx]?.userData.type === 'grass') break;
                safeLaneIdx--;
            }
            if (safeLaneIdx < 0) safeLaneIdx = 0;

            const player = playerRef.current;
            gameVars.current.currentLane = safeLaneIdx;
            gameVars.current.currentColumn = 0;
            gameVars.current.moves = [];

            if (player) {
                player.position.z = -safeLaneIdx * TILE_SIZE;
                player.position.x = 0;
            }

            if (cameraRef.current && player) {
                cameraRef.current.position.z = player.position.z + 200;
                cameraRef.current.position.x = player.position.x + 200;
            }

            return newHearts;
        });
    };

    const move = (dir: string) => {
        synthRef.current.playTone(400 + Math.random() * 200, 0.1, 'sine');

        const vars = gameVars.current;
        let nLane = vars.currentLane;
        let nCol = vars.currentColumn;

        if (dir === 'forward') nLane++;
        if (dir === 'backward') nLane--;
        if (dir === 'left') nCol--;
        if (dir === 'right') nCol++;

        if (nCol < -Math.floor(LANE_WIDTH / 2) || nCol > Math.floor(LANE_WIDTH / 2)) return;
        if (nLane < 0) return;

        if (lanesRef.current[nLane]) {
            const obs = lanesRef.current[nLane].userData.obstacles;
            // @ts-ignore
            if (obs.some(o => o.type === 'tree' && o.col === nCol)) return;
        }

        vars.moves.push({ dir, nLane, nCol });
        vars.currentLane = nLane;
        vars.currentColumn = nCol;

        if (nLane > vars.score) {
            vars.score = nLane;
            // Note: 점수는 퀴즈 정답으로만 획득하므로 여기서 setScore 호출 제거
            if (sceneRef.current) {
                createLane(sceneRef.current, lanesRef.current.length);
            }
        }
    };

    // Input Handling
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (gameStateRef.current !== 'playing') return;
        if (gameVars.current.moves.length > 0) return;

        if (e.key === 'ArrowUp') move('forward');
        else if (e.key === 'ArrowDown') move('backward');
        else if (e.key === 'ArrowLeft') move('left');
        else if (e.key === 'ArrowRight') move('right');
    }, []); // E.g., no deps needed as we use Refs

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const touchStartRef = useRef({ x: 0, y: 0 });
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (gameStateRef.current !== 'playing') return;
        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        const dy = e.changedTouches[0].clientY - touchStartRef.current.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 30) move(dx > 0 ? 'right' : 'left');
        } else {
            if (Math.abs(dy) > 30) move(dy > 0 ? 'backward' : 'forward');
            else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) move('forward');
        }
    };

    const handleTitleClick = () => {
        synthRef.current.init();
        synthRef.current.playTone(0, 0.01);
        setGameState('loading');
    };

    const handleStart = () => {
        // Map Platform Questions
        const mappedQuestions = questions.map(q => ({
            q: q.q || q.question || "",
            options: q.options,
            a: typeof q.answer === 'number' ? q.answer : 0
        }));

        const shuffled = shuffleArray(mappedQuestions);
        setShuffledQuizzes(shuffled);
        shuffledQuizzesRef.current = shuffled; // Update Ref
        setCurrentQuiz(shuffled[0]);

        gameVars.current = {
            currentLane: 0,
            currentColumn: 0,
            moves: [],
            stepStartTimestamp: null,
            isGameActive: true,
            score: 0,
            nextQuizLane: 10,
            quizIndex: 0
        };

        timeVars.current = { totalPausedTime: 0, pauseStartTime: 0, lastFrameTime: 0 };

        setScore(0);
        setHearts(3);
        setCorrectCount(0);
        setAttemptCount(0);
        setGameState('playing');
        setDialogue(CHAR_DATA[selectedCharRef.current].script.start);

        if (sceneRef.current) resetMap(sceneRef.current);
        createPlayer();

        if (!isMuted) {
            synthRef.current.init();
            synthRef.current.playMelody(TEENIEPING_THEME);
        }

        setTimeout(() => setDialogue(""), 2500);
    };

    const handleGoToMenu = () => {
        setGameState('menu');
        setWarningMsg(false);
        synthRef.current.stop();
    };

    const handleGameOver = () => {
        gameVars.current.isGameActive = false;
        setWarningMsg(false);
        setGameState('gameover');
        // 최종 점수를 서버에 전송 (현재 score 상태 사용)
        setScore(currentScore => {
            onScoreUpdate(currentScore);
            return currentScore;
        });
    };

    const handleGameClear = () => {
        gameVars.current.isGameActive = false;
        setGameState('gameclear');
        synthRef.current.stop();
        // 최종 점수를 서버에 전송 (현재 score 상태 사용)
        setScore(currentScore => {
            onScoreUpdate(currentScore);
            return currentScore;
        });
    };

    // Objects creators like createTree, createCar, createLog, createBalloon remain same.
    const createTree = () => {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(10, 20, 10), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
        trunk.position.y = 10; trunk.castShadow = true; g.add(trunk);
        const leaves = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshStandardMaterial({ color: 0x32CD32 }));
        leaves.position.y = 25; leaves.castShadow = true; g.add(leaves);
        return g;
    };
    const createCar = () => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(26, 14, 14), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));
        body.position.y = 7; body.castShadow = true; g.add(body);
        return g;
    };
    const createLog = () => {
        const len = 45 + Math.random() * 30;
        const m = new THREE.Mesh(new THREE.BoxGeometry(len, 8, 12), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
        m.position.y = -4;
        m.userData.width = len; return m;
    };
    const createBalloon = (num: number) => {
        const g = new THREE.Group();
        const balloonGeo = new THREE.SphereGeometry(10, 16, 16);
        const colors = [0xFF69B4, 0x1E90FF, 0xFFD700, 0x32CD32];
        const balloonMat = new THREE.MeshStandardMaterial({ color: colors[num - 1], roughness: 0.3, metalness: 0.1 });
        const balloon = new THREE.Mesh(balloonGeo, balloonMat);
        balloon.position.y = 10;
        g.add(balloon);

        const stringGeo = new THREE.CylinderGeometry(0.5, 0.5, 15);
        const stringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const string = new THREE.Mesh(stringGeo, stringMat);
        string.position.y = 0;
        g.add(string);

        return g;
    };

    return (
        <div
            className="relative w-full h-screen overflow-hidden bg-sky-300 select-none touch-none font-sans"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div ref={mountRef} className="absolute inset-0 z-0" />

            {/* Screen: Title */}
            {gameState === 'title' && (
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-50 cursor-pointer"
                    onClick={handleTitleClick}
                >
                    <div className="bg-white/90 p-10 rounded-3xl shadow-2xl text-center animate-bounce">
                        <h1 className="text-5xl font-black text-pink-500 mb-4 drop-shadow-lg leading-tight tracking-tighter">
                            캐치! 티니핑<br />
                            <span className="text-4xl text-blue-400">넌센스 로드</span>
                        </h1>
                        <div className="text-gray-500 text-lg font-bold animate-pulse mt-8">
                            화면을 터치해서 시작하기! 👆
                        </div>
                    </div>
                    <div className="absolute bottom-10 text-white/80 text-sm font-bold">
                        🎵 Sound ON 권장
                    </div>
                </div>
            )}

            {/* Screen: Loading */}
            {gameState === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-sky-300 z-50 animate-pulse">
                    <div className="text-white text-3xl font-black mb-4 flex items-center gap-3">
                        <Loader2 className="animate-spin" size={32} />
                        티니핑을 부르는 중...핑!
                    </div>
                    <div className="w-64 h-4 bg-black/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>
                    <div className="mt-2 text-white font-bold">{loadingProgress}%</div>
                </div>
            )}

            {/* 상시 퀴즈 UI */}
            {gameState === 'playing' && currentQuiz && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md pointer-events-none z-20">
                    <div className="bg-white/90 p-3 rounded-2xl shadow-xl backdrop-blur-sm border-2 border-pink-200">
                        <div className="flex items-center gap-2 mb-1 text-pink-500 font-bold">
                            <MessageCircle size={16} />
                            <span className="text-xs">퀴즈 ({correctCount}/{questions.length})</span>
                        </div>
                        <h3 className="text-lg font-black text-gray-800 mb-2 leading-snug break-keep text-center">
                            {currentQuiz.q}
                        </h3>
                        <div className="grid grid-cols-2 gap-1.5">
                            {currentQuiz.options.map((opt: string, idx: number) => {
                                const colors = ["bg-pink-100 text-pink-600", "bg-blue-100 text-blue-600", "bg-yellow-100 text-yellow-600", "bg-green-100 text-green-600"];
                                return (
                                    <div key={idx} className={`${colors[idx]} px-2 py-1.5 rounded-lg font-bold text-xs shadow-sm flex items-center gap-1.5`}>
                                        <span className="bg-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-sm">{idx + 1}</span>
                                        {opt}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 풍선 무시 경고 메시지 */}
            {warningMsg && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className="bg-red-500/90 text-white px-6 py-4 rounded-2xl shadow-2xl animate-bounce flex items-center gap-2">
                        <AlertTriangle size={32} />
                        <span className="text-2xl font-black">문제를 풀어야지핑! 😡</span>
                    </div>
                </div>
            )}

            {/* 정답/오답 피드백 오버레이 */}
            {showFeedback && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className={`text-6xl font-black drop-shadow-2xl animate-[popIn_0.3s_ease-out] ${showFeedback === 'correct' ? 'text-green-400' : 'text-orange-400'}`}>
                        {showFeedback === 'correct' ? '정답!! 🎉' : '땡! 하트 -1 💔'}
                    </div>
                </div>
            )}

            {/* HUD: Score & Hearts & Mute */}
            <div className={`absolute top-0 left-0 w-full p-4 flex justify-between items-start z-30 transition-opacity duration-500 ${['title', 'loading', 'menu'].includes(gameState) ? 'opacity-0' : 'opacity-100'}`}>
                <div className="flex flex-col">
                    <div className="text-4xl font-black text-white drop-shadow-md">
                        {score}
                    </div>
                    <div className="text-sm font-bold text-white drop-shadow-sm">정답 {correctCount}/{questions.length}</div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={toggleMute} className="bg-white/20 p-2 rounded-full text-white backdrop-blur-sm hover:bg-white/40">
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <Heart
                                key={i}
                                fill={i <= hearts ? "#ff4444" : "#cccccc"}
                                color={i <= hearts ? "#cc0000" : "#999999"}
                                size={32}
                                className="drop-shadow-md transition-colors duration-300"
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* HUD: Dialogue Box */}
            {dialogue && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white/90 px-6 py-3 rounded-2xl shadow-lg z-10 animate-[popIn_0.3s_ease-out] flex items-center gap-3 max-w-[90%]">
                    {CHAR_DATA[selectedChar].img ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden shadow-inner bg-white">
                            <img
                                src={CHAR_DATA[selectedChar].img}
                                alt={CHAR_DATA[selectedChar].name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    // @ts-ignore
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner"
                            style={{ background: `#${CHAR_DATA[selectedChar].color.toString(16)}` }}>
                            {CHAR_DATA[selectedChar].name.slice(0, 2)}
                        </div>
                    )}

                    <p className="text-gray-800 font-bold text-sm md:text-base whitespace-nowrap">
                        {dialogue}
                    </p>
                </div>
            )}

            {/* Screen: Menu */}
            {gameState === 'menu' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white/40 backdrop-blur-sm p-4">
                    <div className="bg-white/95 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-[popIn_0.5s_ease-out]">
                        <h1 className="text-3xl font-extrabold text-pink-500 mb-2 drop-shadow-sm leading-tight">
                            캐릭터 선택<br />
                            <span className="text-xl text-gray-500">함께할 친구를 골라줘!</span>
                        </h1>

                        <div className="flex justify-center gap-3 mb-8 flex-wrap">
                            {Object.entries(CHAR_DATA).map(([key, data]) => (
                                <button
                                    key={key}
                                    // @ts-ignore
                                    onClick={() => setSelectedChar(key)}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all duration-200 border-4 overflow-hidden relative bg-white
                    ${selectedChar === key
                                            ? 'scale-110 border-gray-700 shadow-xl -translate-y-1'
                                            : 'border-transparent hover:scale-105'}`}
                                >
                                    {data.img ? (
                                        <>
                                            <img
                                                src={data.img}
                                                alt={data.name}
                                                className="w-full h-full object-cover z-10 relative"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                    // @ts-ignore
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white z-0" style={{ background: `#${data.color.toString(16)}` }}>
                                                {data.name.slice(0, 2)}
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-xs font-bold text-white drop-shadow-md" style={{ background: `#${data.color.toString(16)}`, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {data.name.slice(0, 2)}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleStart}
                            className={`w-full py-4 rounded-full text-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r ${CHAR_DATA[selectedChar].theme}`}
                        >
                            <Play fill="currentColor" size={24} />
                            모험 시작!
                        </button>
                    </div>
                </div>
            )}

            {/* Screen: Game Over */}
            {gameState === 'gameover' && (
                <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 backdrop-blur-[2px]">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-[90%] animate-[shake_0.5s_ease-in-out]">
                        <h2 className="text-2xl font-bold text-red-500 mb-2">아야! 쾅했어핑 😭</h2>

                        <div className="bg-gray-100 rounded-xl p-4 my-4 space-y-2">
                            <div className="flex justify-between items-center text-gray-600 font-bold">
                                <span>최종 점수</span>
                                <span className="text-2xl text-black">{score}점</span>
                            </div>
                            <div className="w-full h-[1px] bg-gray-300 my-2"></div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">맞힌 문제</span>
                                <span className="text-green-600 font-bold">{correctCount}개</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">푼 문제</span>
                                <span className="text-blue-600 font-bold">{attemptCount}개</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">정답률</span>
                                <span className="text-pink-500 font-bold">
                                    {attemptCount > 0 ? Math.floor((correctCount / attemptCount) * 100) : 0}%
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoToMenu}
                            className="w-full py-3 rounded-full text-lg font-bold text-white bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Home size={20} />
                            처음 화면으로
                        </button>
                    </div>
                </div>
            )}

            {/* Screen: Game Clear */}
            {gameState === 'gameclear' && (
                <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 backdrop-blur-[2px]">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-[90%] animate-[popIn_0.5s_ease-out]">
                        <h2 className="text-3xl font-black text-yellow-500 mb-2 drop-shadow-md">축하해츄! 🎉</h2>
                        <p className="text-gray-500 text-sm mb-4">모든 퀴즈를 정복했어!</p>

                        <div className="bg-yellow-50 rounded-xl p-4 mb-6 space-y-2 border-2 border-yellow-100">
                            <div className="flex justify-center my-2">
                                <Trophy size={48} className="text-yellow-400 drop-shadow-lg animate-bounce" />
                            </div>
                            <div className="text-center text-4xl font-black text-pink-500 drop-shadow-sm mb-4">
                                {score}점
                            </div>
                            <div className="flex justify-between text-sm px-2">
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-400 text-xs">정답</span>
                                    <span className="font-bold text-green-500">{correctCount}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-400 text-xs">시도</span>
                                    <span className="font-bold text-blue-500">{attemptCount}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-400 text-xs">정답률</span>
                                    <span className="font-bold text-pink-500">
                                        {attemptCount > 0 ? Math.floor((correctCount / attemptCount) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGoToMenu}
                            className="w-full py-3 rounded-full text-lg font-bold text-white bg-gradient-to-r from-pink-400 to-yellow-400 shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Home size={20} />
                            처음 화면으로
                        </button>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
      `}</style>
        </div>
    );
}
