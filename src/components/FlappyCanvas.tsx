import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import {
  buildPixelPhotoSprite,
  buildPixelRivalSprite,
  drawPhotoFlyer,
  drawPixelBackground,
  drawPixelBird,
  drawPixelGround,
  drawPixelPipe,
  drawRivalFlyer,
  WingFrame,
} from '../game/pixelSprites';
import { soundEngine } from '../game/sound';
import {
  DIFFICULTIES,
  DifficultyId,
  FlyerId,
  GamePhase,
  getMedalForScore,
  PHOTO_ASSET_URL,
  PLAYABLE_HEIGHT,
  RIVAL_ASSET_URL,
  SkyThemeId,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
} from '../game/types';

interface PipePair {
  x: number;
  gapY: number;
  gapHeight: number;
  width: number;
  passed: boolean;
}

interface RivalFlyer {
  x: number;
  baseY: number;
  y: number;
  speed: number;
  wavePhase: number;
  waveAmp: number;
  waveFreq: number;
  dodged: boolean;
}

interface PixelParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

interface FlappyCanvasProps {
  flyer: FlyerId;
  theme: SkyThemeId;
  difficulty: DifficultyId;
  rivalsEnabled: boolean;
  bestScore: number;
  phase: GamePhase;
  onPhaseChange: (phase: GamePhase) => void;
  onScoreChange: (score: number) => void;
  onGameOver: (finalScore: number) => void;
}

const BIRD_X = 64;
const PIPE_WIDTH = 28;

export function FlappyCanvas({
  flyer,
  theme,
  difficulty,
  rivalsEnabled,
  bestScore,
  phase,
  onPhaseChange,
  onScoreChange,
  onGameOver,
}: FlappyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const photoSpriteRef = useRef<HTMLCanvasElement | null>(null);
  const rivalSpriteRef = useRef<HTMLCanvasElement | null>(null);

  const [displayScore, setDisplayScore] = useState(0);
  const [scorePop, setScorePop] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  // Refs synced with props so RAF loop stays smooth and closure-free
  const phaseRef = useRef<GamePhase>(phase);
  const flyerRef = useRef<FlyerId>(flyer);
  const themeRef = useRef<SkyThemeId>(theme);
  const difficultyRef = useRef<DifficultyId>(difficulty);
  const rivalsEnabledRef = useRef<boolean>(rivalsEnabled);
  const bestScoreRef = useRef<number>(bestScore);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    flyerRef.current = flyer;
  }, [flyer]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    rivalsEnabledRef.current = rivalsEnabled;
  }, [rivalsEnabled]);

  useEffect(() => {
    bestScoreRef.current = bestScore;
  }, [bestScore]);

  // Mutable simulation state
  const simRef = useRef({
    birdY: PLAYABLE_HEIGHT * 0.45,
    birdVy: 0,
    birdRotation: 0,
    pipes: [] as PipePair[],
    rivals: [] as RivalFlyer[],
    particles: [] as PixelParticle[],
    popups: [] as FloatingText[],
    spawnTimer: 0,
    pipesSpawned: 0,
    scrollOffset: 0,
    elapsedTime: 0,
    score: 0,
    flashAlpha: 0,
    shakeTime: 0,
    gameOverTimestamp: 0,
  });

  // Load and pixelate player portrait and rival portrait once
  useEffect(() => {
    const playerImg = new Image();
    playerImg.src = PHOTO_ASSET_URL;
    playerImg.onload = () => {
      photoSpriteRef.current = buildPixelPhotoSprite(playerImg);
    };

    const rivalImg = new Image();
    rivalImg.src = RIVAL_ASSET_URL;
    rivalImg.onload = () => {
      rivalSpriteRef.current = buildPixelRivalSprite(rivalImg);
    };

    return () => {
      soundEngine.stopMusic();
    };
  }, []);

  const spawnFlapParticles = useCallback((x: number, y: number) => {
    const colors = ['#FFFFFF', '#FEF08A', '#BAE6FD'];
    for (let i = 0; i < 4; i++) {
      simRef.current.particles.push({
        x: x - 6 + Math.random() * 4,
        y: y + 2 + Math.random() * 4,
        vx: -24 - Math.random() * 24,
        vy: 15 + Math.random() * 28,
        life: 0.28 + Math.random() * 0.14,
        maxLife: 0.42,
        color: colors[i % colors.length],
        size: i % 2 === 0 ? 2 : 1,
      });
    }
  }, []);

  const spawnMilestoneParticles = useCallback((x: number, y: number) => {
    const colors = ['#FACC15', '#38BDF8', '#F472B6', '#34D399', '#FB923C'];
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const speed = 35 + Math.random() * 45;
      simRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 0.55 + Math.random() * 0.25,
        maxLife: 0.8,
        color: colors[i % colors.length],
        size: 2,
      });
    }
  }, []);

  const resetSimulation = useCallback(() => {
    const s = simRef.current;
    s.birdY = PLAYABLE_HEIGHT * 0.45;
    s.birdVy = 0;
    s.birdRotation = 0;
    s.pipes = [];
    s.rivals = [];
    s.particles = [];
    s.popups = [];
    s.spawnTimer = 0.65;
    s.pipesSpawned = 0;
    s.score = 0;
    s.flashAlpha = 0;
    s.shakeTime = 0;
    setDisplayScore(0);
    setIsNewBest(false);
    onScoreChange(0);
  }, [onScoreChange]);

  const startGame = useCallback(() => {
    resetSimulation();
    const cfg = DIFFICULTIES[difficultyRef.current];
    simRef.current.birdVy = cfg.flapVelocity;
    spawnFlapParticles(BIRD_X, simRef.current.birdY);
    soundEngine.playStart();
    soundEngine.playFlap();
    soundEngine.startMusic();
    phaseRef.current = 'PLAYING';
    onPhaseChange('PLAYING');
  }, [onPhaseChange, resetSimulation, spawnFlapParticles]);

  const triggerFlap = useCallback(() => {
    const currentPhase = phaseRef.current;
    if (currentPhase === 'TITLE_MENU') {
      startGame();
      return;
    }

    if (currentPhase === 'GAME_OVER') {
      if (performance.now() - simRef.current.gameOverTimestamp > 380) {
        startGame();
      }
      return;
    }

    if (currentPhase !== 'PLAYING') {
      return;
    }

    const cfg = DIFFICULTIES[difficultyRef.current];
    simRef.current.birdVy = cfg.flapVelocity;
    spawnFlapParticles(BIRD_X, simRef.current.birdY);
    soundEngine.playFlap();
  }, [spawnFlapParticles, startGame]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'PLAYING') {
      soundEngine.pauseMusic();
      phaseRef.current = 'PAUSED';
      onPhaseChange('PAUSED');
    } else if (phaseRef.current === 'PAUSED') {
      soundEngine.startMusic();
      phaseRef.current = 'PLAYING';
      onPhaseChange('PLAYING');
    }
  }, [onPhaseChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'BUTTON' && e.code === 'Space' && phaseRef.current !== 'PLAYING') {
          return;
        }
        e.preventDefault();
        triggerFlap();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (phaseRef.current === 'PLAYING' || phaseRef.current === 'PAUSED') {
          e.preventDefault();
          togglePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause, triggerFlap]);

  // Main 60fps-normalized RAF game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const triggerCollision = () => {
      const s = simRef.current;
      if (phaseRef.current !== 'PLAYING') return;
      soundEngine.stopMusic();
      soundEngine.playHit();
      s.flashAlpha = 0.85;
      s.shakeTime = 0.22;
      s.birdVy = Math.max(s.birdVy, 20);
      phaseRef.current = 'DYING';
      onPhaseChange('DYING');
    };

    const finalizeGameOver = () => {
      const s = simRef.current;
      soundEngine.stopMusic();
      s.gameOverTimestamp = performance.now();
      if (s.score > bestScoreRef.current && s.score > 0) {
        setIsNewBest(true);
      }
      phaseRef.current = 'GAME_OVER';
      onPhaseChange('GAME_OVER');
      onGameOver(s.score);
    };

    const spawnPipeAndOptionalRival = () => {
      const s = simRef.current;
      const cfg = DIFFICULTIES[difficultyRef.current];
      const margin = 38;
      const minGapY = margin + cfg.pipeGap / 2;
      const maxGapY = PLAYABLE_HEIGHT - margin - cfg.pipeGap / 2;
      const gapY = Math.round(minGapY + Math.random() * (maxGapY - minGapY));
      const pipeX = VIRTUAL_WIDTH + 8;

      s.pipes.push({
        x: pipeX,
        gapY,
        gapHeight: cfg.pipeGap,
        width: PIPE_WIDTH,
        passed: false,
      });

      s.pipesSpawned += 1;

      // Spawn a Rival Flyer cleanly in the open lane between pipes every 2nd pipe after pipe #2
      if (rivalsEnabledRef.current && s.pipesSpawned >= 2 && s.pipesSpawned % 2 === 0) {
        const laneSpacing = cfg.pipeSpeed * cfg.pipeInterval;
        const rivalX = pipeX + PIPE_WIDTH / 2 + Math.round(laneSpacing * 0.5);
        const rivalBaseY = Math.round(58 + Math.random() * (PLAYABLE_HEIGHT - 116));

        s.rivals.push({
          x: rivalX,
          baseY: rivalBaseY,
          y: rivalBaseY,
          speed: cfg.pipeSpeed,
          wavePhase: Math.random() * Math.PI * 2,
          waveAmp: 16,
          waveFreq: 3.1,
          dodged: false,
        });
      }
    };

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.033);

      const s = simRef.current;
      const cfg = DIFFICULTIES[difficultyRef.current];
      const currentPhase = phaseRef.current;

      if (currentPhase !== 'PAUSED') {
        s.elapsedTime += dt;
      }

      if (currentPhase === 'TITLE_MENU') {
        s.scrollOffset += 38 * dt;
        s.birdY = PLAYABLE_HEIGHT * 0.45 + Math.sin(s.elapsedTime * 3.6) * 5;
        s.birdRotation = 0;
      } else if (currentPhase === 'PLAYING') {
        s.scrollOffset += cfg.pipeSpeed * dt;

        // Bird physics
        s.birdVy += cfg.gravity * dt;
        s.birdY += s.birdVy * dt;

        // Smooth pitch angle
        const targetRot = Math.max(-0.48, Math.min(1.25, s.birdVy / 280));
        s.birdRotation += (targetRot - s.birdRotation) * Math.min(1, dt * 12);

        // Pipe & Rival spawning
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          spawnPipeAndOptionalRival();
          s.spawnTimer = cfg.pipeInterval;
        }

        // Forgiving pixel hitbox around bird center
        const hitHalfW = 5.5;
        const hitHalfH = 4.5;

        // Pipe updates & collisions
        for (let i = s.pipes.length - 1; i >= 0; i--) {
          const pipe = s.pipes[i];
          pipe.x -= cfg.pipeSpeed * dt;

          if (!pipe.passed && pipe.x + pipe.width / 2 < BIRD_X) {
            pipe.passed = true;
            s.score += 1;
            setDisplayScore(s.score);
            onScoreChange(s.score);
            setScorePop(true);
            window.setTimeout(() => setScorePop(false), 140);

            s.popups.push({
              x: BIRD_X + 10,
              y: Math.max(24, s.birdY - 12),
              text: '+1',
              life: 0.65,
              color: '#FEF08A',
            });

            if (s.score > 0 && s.score % 10 === 0) {
              soundEngine.playMilestone();
              spawnMilestoneParticles(BIRD_X, s.birdY);
            } else {
              soundEngine.playScore();
            }
          }

          const inPipeX = BIRD_X + hitHalfW > pipe.x && BIRD_X - hitHalfW < pipe.x + pipe.width;
          if (inPipeX) {
            const gapTop = pipe.gapY - pipe.gapHeight / 2;
            const gapBottom = pipe.gapY + pipe.gapHeight / 2;
            if (s.birdY - hitHalfH < gapTop || s.birdY + hitHalfH > gapBottom) {
              triggerCollision();
            }
          }

          if (pipe.x + pipe.width < -16) {
            s.pipes.splice(i, 1);
          }
        }

        // Rival Flyer updates & collisions
        for (let i = s.rivals.length - 1; i >= 0; i--) {
          const rival = s.rivals[i];
          rival.x -= rival.speed * dt;
          rival.wavePhase += rival.waveFreq * dt;
          rival.y = rival.baseY + Math.sin(rival.wavePhase) * rival.waveAmp;

          // Fair inset collision box against 18x18 rival medallion
          if (Math.abs(BIRD_X - rival.x) < 11.5 && Math.abs(s.birdY - rival.y) < 10.5) {
            triggerCollision();
          }

          if (!rival.dodged && rival.x + 10 < BIRD_X) {
            rival.dodged = true;
            s.popups.push({
              x: BIRD_X + 8,
              y: Math.max(24, s.birdY - 14),
              text: 'DODGE!',
              life: 0.55,
              color: '#FCA5A5',
            });
          }

          if (rival.x < -24) {
            s.rivals.splice(i, 1);
          }
        }

        // Ceiling clamp & ground collision
        if (s.birdY - hitHalfH < 0) {
          s.birdY = hitHalfH;
          s.birdVy = 0;
        }
        if (s.birdY + 6 >= PLAYABLE_HEIGHT) {
          s.birdY = PLAYABLE_HEIGHT - 6;
          soundEngine.playHit();
          s.flashAlpha = 0.85;
          s.shakeTime = 0.22;
          finalizeGameOver();
        }
      } else if (currentPhase === 'DYING') {
        s.birdVy += cfg.gravity * 1.15 * dt;
        s.birdY += s.birdVy * dt;
        s.birdRotation = Math.min(1.45, s.birdRotation + dt * 5.5);

        if (s.birdY + 6 >= PLAYABLE_HEIGHT) {
          s.birdY = PLAYABLE_HEIGHT - 6;
          finalizeGameOver();
        }
      }

      // Update particles & floating popups
      if (currentPhase !== 'PAUSED') {
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 120 * dt;
          p.life -= dt;
          if (p.life <= 0) {
            s.particles.splice(i, 1);
          }
        }

        for (let i = s.popups.length - 1; i >= 0; i--) {
          const pop = s.popups[i];
          pop.y -= 24 * dt;
          pop.life -= dt;
          if (pop.life <= 0) {
            s.popups.splice(i, 1);
          }
        }
      }

      if (s.flashAlpha > 0) {
        s.flashAlpha = Math.max(0, s.flashAlpha - dt * 3.8);
      }
      if (s.shakeTime > 0) {
        s.shakeTime = Math.max(0, s.shakeTime - dt);
      }

      // --- RENDER TO VIRTUAL PIXEL CANVAS ---
      ctx.imageSmoothingEnabled = false;
      ctx.save();

      if (s.shakeTime > 0) {
        const shakeX = Math.round((Math.random() - 0.5) * 4);
        const shakeY = Math.round((Math.random() - 0.5) * 4);
        ctx.translate(shakeX, shakeY);
      }

      // Background sky + parallax hills
      drawPixelBackground(ctx, themeRef.current, s.scrollOffset, s.elapsedTime);

      // Pipes
      for (const pipe of s.pipes) {
        drawPixelPipe(ctx, themeRef.current, Math.round(pipe.x), pipe.gapY, pipe.gapHeight, pipe.width);
      }

      // Wing frame helper
      const wingSpeed = currentPhase === 'PLAYING' && s.birdVy < 0 ? 16 : 8;
      const wingCycle = Math.floor(s.elapsedTime * wingSpeed) % 4;
      const wingFrame: WingFrame =
        currentPhase === 'DYING' || currentPhase === 'GAME_OVER'
          ? 1
          : wingCycle === 0
            ? 0
            : wingCycle === 2
              ? 2
              : 1;

      const rivalWingCycle = Math.floor(s.elapsedTime * 11) % 4;
      const rivalWingFrame: WingFrame =
        rivalWingCycle === 0 ? 0 : rivalWingCycle === 2 ? 2 : 1;

      // Rival Flyers & Edge Approach Warning
      for (const rival of s.rivals) {
        if (rival.x > VIRTUAL_WIDTH + 6 && rival.x < VIRTUAL_WIDTH + 48) {
          const blink = Math.floor(s.elapsedTime * 12) % 2 === 0;
          if (blink) {
            const wy = Math.max(20, Math.min(PLAYABLE_HEIGHT - 20, Math.round(rival.y)));
            ctx.fillStyle = '#7F1D1D';
            ctx.fillRect(VIRTUAL_WIDTH - 12, wy - 6, 9, 12);
            ctx.fillStyle = '#EF4444';
            ctx.fillRect(VIRTUAL_WIDTH - 11, wy - 5, 7, 10);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(VIRTUAL_WIDTH - 8, wy - 3, 2, 4);
            ctx.fillRect(VIRTUAL_WIDTH - 8, wy + 2, 2, 2);
          }
        } else {
          ctx.save();
          ctx.translate(Math.round(rival.x), Math.round(rival.y));
          drawRivalFlyer(ctx, rivalSpriteRef.current, rivalWingFrame);
          ctx.restore();
        }
      }

      // Ground
      drawPixelGround(ctx, themeRef.current, s.scrollOffset);

      // Particles
      for (const p of s.particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }

      // Player Bird / Flyer sprite
      ctx.save();
      ctx.translate(BIRD_X, Math.round(s.birdY));
      ctx.rotate(s.birdRotation);

      if (flyerRef.current === 'photo') {
        drawPhotoFlyer(ctx, photoSpriteRef.current, wingFrame);
      } else {
        drawPixelBird(ctx, flyerRef.current, wingFrame, 1, -8.5, -6.5);
      }
      ctx.restore();

      // Floating +1 / DODGE pixel popups
      for (const pop of s.popups) {
        ctx.font = 'bold 9px Silkscreen, monospace';
        ctx.fillStyle = '#0F172A';
        ctx.fillText(pop.text, Math.round(pop.x) + 1, Math.round(pop.y) + 1);
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, Math.round(pop.x), Math.round(pop.y));
      }

      // Impact white flash
      if (s.flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.flashAlpha.toFixed(2)})`;
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      }

      ctx.restore();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onGameOver, onPhaseChange, onScoreChange, spawnMilestoneParticles]);

  const medal = getMedalForScore(displayScore);

  return (
    <div className="relative w-full max-w-[460px] mx-auto aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-2xl select-none">
      {/* Main Pixel Art Canvas */}
      <canvas
        ref={canvasRef}
        width={VIRTUAL_WIDTH}
        height={VIRTUAL_HEIGHT}
        onPointerDown={(e) => {
          e.preventDefault();
          triggerFlap();
        }}
        className="w-full h-full block pixelated cursor-pointer touch-manipulation"
        aria-label="Pixel Flap game canvas. Click, tap, or press Space to flap."
      />

      {/* Live In-Game Pixel Score Counter */}
      {(phase === 'PLAYING' || phase === 'DYING' || phase === 'PAUSED') && (
        <div className="pointer-events-none absolute top-4 inset-x-0 flex items-start justify-center px-4">
          <div
            className={`font-pixel text-4xl sm:text-5xl text-white tracking-tight transition-transform duration-150 ${
              scorePop ? 'scale-125 text-amber-300' : 'scale-100'
            }`}
            style={{
              textShadow: '0 3px 0 #0F172A, 3px 0 0 #0F172A, -2px 0 0 #0F172A, 0 -2px 0 #0F172A',
            }}
          >
            {displayScore}
          </div>
        </div>
      )}

      {/* Top-right Pause Button during Active Play */}
      {(phase === 'PLAYING' || phase === 'PAUSED') && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePause();
          }}
          aria-label={phase === 'PAUSED' ? 'Resume game' : 'Pause game'}
          className="absolute top-3 right-3 z-20 flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-100 hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {phase === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      )}

      {/* Title Menu Overlay */}
      {phase === 'TITLE_MENU' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-8 px-6">
          <div className="text-center mt-2">
            <h2
              className="font-pixel text-3xl sm:text-4xl text-white tracking-tight"
              style={{
                textShadow: '0 3px 0 #0F172A, 3px 0 0 #0F172A, -2px 0 0 #0F172A, 0 -2px 0 #0F172A',
              }}
            >
              PIXEL FLAP
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-medium text-slate-950 bg-white/85 px-3 py-1 rounded-md inline-block">
              Tap canvas or press Space to fly
            </p>
          </div>

          <div className="pointer-events-auto mb-10">
            <button
              type="button"
              onClick={startGame}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-slate-950 font-pixel text-sm border-2 border-slate-950 shadow-[0_4px_0_#0F172A] transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Paused Overlay */}
      {phase === 'PAUSED' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/65 px-6">
          <div className="w-full max-w-[270px] rounded-xl bg-slate-900 border border-slate-700 p-6 text-center shadow-xl">
            <h3 className="font-pixel text-xl text-white">Paused</h3>
            <p className="mt-1.5 text-sm text-slate-400">
              Current score: <span className="font-mono-num text-slate-100">{displayScore}</span>
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={togglePause}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                Resume
              </button>
              <button
                type="button"
                onClick={startGame}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                Restart Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Scoreboard Overlay */}
      {phase === 'GAME_OVER' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 px-5">
          <div className="w-full max-w-[300px] rounded-xl bg-slate-900 border-2 border-slate-700 p-6 shadow-2xl">
            <div className="text-center">
              <h3 className="font-pixel text-xl text-amber-400">Game Over</h3>
              {isNewBest && (
                <p className="mt-1 text-xs font-semibold text-emerald-400">
                  New Personal Best
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 py-4 border-y border-slate-800">
              <div>
                <div className="text-xs text-slate-400">Score</div>
                <div className="mt-1 font-pixel text-2xl text-white font-mono-num">
                  {displayScore}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Best</div>
                <div className="mt-1 font-pixel text-2xl text-amber-400 font-mono-num">
                  {Math.max(bestScore, displayScore)}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-400">Medal Earned</span>
              {medal ? (
                <span className="inline-flex items-center gap-2 font-semibold text-slate-100">
                  <span
                    className="w-3.5 h-3.5 rounded-sm border"
                    style={{ backgroundColor: medal.color, borderColor: medal.rimColor }}
                    aria-hidden="true"
                  />
                  {medal.label}
                </span>
              ) : (
                <span className="text-slate-500">10+ pts for Bronze</span>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={startGame}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-xs border-2 border-slate-950 shadow-[0_3px_0_#0F172A] transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.stopMusic();
                  resetSimulation();
                  phaseRef.current = 'TITLE_MENU';
                  onPhaseChange('TITLE_MENU');
                }}
                className="w-full px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                Back to Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
