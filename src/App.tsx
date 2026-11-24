import { useCallback, useEffect, useState } from 'react';
import { Volume2, VolumeX, Trash2, ShieldAlert, Music, Sparkles } from 'lucide-react';
import { FlappyCanvas } from './components/FlappyCanvas';
import { PixelBirdPreview } from './components/PixelBirdPreview';
import { soundEngine } from './game/sound';
import {
  DIFFICULTIES,
  DifficultyId,
  FLYER_OPTIONS,
  FlyerId,
  GamePhase,
  getMedalForScore,
  RIVAL_ASSET_URL,
  RunRecord,
  SKY_THEMES,
  SkyThemeId,
} from './game/types';

const STORAGE_KEYS = {
  BEST: 'pixelflap_best_score_v1',
  RUNS: 'pixelflap_recent_runs_v1',
  FLYER: 'pixelflap_flyer_v1',
  THEME: 'pixelflap_theme_v1',
  DIFFICULTY: 'pixelflap_difficulty_v1',
  MUTED: 'pixelflap_muted_v1',
  MUSIC: 'pixelflap_music_v1',
  SFX: 'pixelflap_sfx_v1',
  RIVALS: 'pixelflap_rivals_v1',
};

function loadStoredNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function loadStoredValue<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = localStorage.getItem(key) as T | null;
    return raw && allowed.includes(raw) ? raw : fallback;
  } catch {
    return fallback;
  }
}

function loadStoredBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

function loadStoredRuns(): RunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RUNS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [flyer, setFlyer] = useState<FlyerId>(() =>
    loadStoredValue(STORAGE_KEYS.FLYER, ['photo', 'canary', 'cardinal', 'jay'], 'photo')
  );
  const [theme, setTheme] = useState<SkyThemeId>(() =>
    loadStoredValue(STORAGE_KEYS.THEME, ['meadow', 'sunset', 'night'], 'meadow')
  );
  const [difficulty, setDifficulty] = useState<DifficultyId>(() =>
    loadStoredValue(STORAGE_KEYS.DIFFICULTY, ['breezy', 'classic', 'turbo'], 'classic')
  );
  const [muted, setMuted] = useState<boolean>(() => loadStoredBool(STORAGE_KEYS.MUTED, false));
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() =>
    loadStoredBool(STORAGE_KEYS.MUSIC, true)
  );
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() =>
    loadStoredBool(STORAGE_KEYS.SFX, true)
  );
  const [rivalsEnabled, setRivalsEnabled] = useState<boolean>(() =>
    loadStoredBool(STORAGE_KEYS.RIVALS, true)
  );
  const [rivalThumbError, setRivalThumbError] = useState(false);

  const [phase, setPhase] = useState<GamePhase>('TITLE_MENU');
  const [liveScore, setLiveScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() =>
    loadStoredNumber(STORAGE_KEYS.BEST, 0)
  );
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>(() => loadStoredRuns());

  useEffect(() => {
    soundEngine.setMuted(muted);
    try {
      localStorage.setItem(STORAGE_KEYS.MUTED, String(muted));
    } catch {
      // ignore storage errors
    }
  }, [muted]);

  useEffect(() => {
    soundEngine.setMusicEnabled(musicEnabled);
    try {
      localStorage.setItem(STORAGE_KEYS.MUSIC, String(musicEnabled));
    } catch {
      // ignore
    }
  }, [musicEnabled]);

  useEffect(() => {
    soundEngine.setSfxEnabled(sfxEnabled);
    try {
      localStorage.setItem(STORAGE_KEYS.SFX, String(sfxEnabled));
    } catch {
      // ignore
    }
  }, [sfxEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RIVALS, String(rivalsEnabled));
    } catch {
      // ignore
    }
  }, [rivalsEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FLYER, flyer);
    } catch {
      // ignore
    }
  }, [flyer]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DIFFICULTY, difficulty);
    } catch {
      // ignore
    }
  }, [difficulty]);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      if (finalScore > bestScore) {
        setBestScore(finalScore);
        try {
          localStorage.setItem(STORAGE_KEYS.BEST, String(finalScore));
        } catch {
          // ignore
        }
      }

      const record: RunRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        score: finalScore,
        flyer,
        theme,
        difficulty,
        timestamp: Date.now(),
      };

      setRecentRuns((prev) => {
        const next = [record, ...prev].slice(0, 5);
        try {
          localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [bestScore, difficulty, flyer, theme]
  );

  const handleClearRuns = () => {
    setRecentRuns([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.RUNS);
    } catch {
      // ignore
    }
  };

  const bestMedal = getMedalForScore(bestScore);
  const isPlaying = phase === 'PLAYING' || phase === 'DYING';

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      {/* Clean Single-Row Top Bar */}
      <header className="border-b border-slate-800/90 bg-[#0F172A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <span className="font-pixel text-lg sm:text-xl tracking-tight text-white whitespace-nowrap shrink-0">
            Pixel Flap
          </span>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute all audio' : 'Mute all audio'}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span>{muted ? 'Muted' : 'Audio On'}</span>
          </button>
        </div>
      </header>

      {/* Main Arcade Stage & Control Sidebar */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_1fr] gap-8 items-start">
          {/* Primary Visual Anchor: Pixel Art Game Canvas */}
          <section aria-label="Game Stage">
            <FlappyCanvas
              flyer={flyer}
              theme={theme}
              difficulty={difficulty}
              rivalsEnabled={rivalsEnabled}
              bestScore={bestScore}
              phase={phase}
              onPhaseChange={setPhase}
              onScoreChange={setLiveScore}
              onGameOver={handleGameOver}
            />
          </section>

          {/* Arcade Scoreboard & Customization Panel */}
          <aside className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            {/* Live Score & Best Score Counter */}
            <div className="grid grid-cols-2 gap-4 pb-5 border-b border-slate-800">
              <div>
                <div className="text-xs font-medium text-slate-400">Current Score</div>
                <div className="mt-1.5 font-pixel text-3xl text-white font-mono-num">
                  {liveScore}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400">Personal Best</div>
                <div className="mt-1.5 flex items-baseline gap-2.5">
                  <span className="font-pixel text-3xl text-amber-400 font-mono-num">
                    {Math.max(bestScore, liveScore)}
                  </span>
                  {bestMedal && (
                    <span className="text-xs font-medium text-slate-300">
                      {bestMedal.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Flyer Picker */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-semibold text-slate-100">Choose Flyer</h2>
                {isPlaying && (
                  <span className="text-xs text-slate-400">Active in flight</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FLYER_OPTIONS.map((opt) => {
                  const selected = flyer === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFlyer(opt.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                        selected
                          ? 'bg-slate-800 border-amber-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <PixelBirdPreview flyer={opt.id} size={40} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{opt.name}</div>
                        <div className="text-xs text-slate-400 truncate">{opt.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* World Sky Palette */}
            <div>
              <h2 className="text-sm font-semibold text-slate-100 mb-2">Pixel World</h2>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-slate-950 border border-slate-800">
                {SKY_THEMES.map((item) => {
                  const active = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTheme(item.id)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-sm shrink-0 border border-slate-950"
                        style={{
                          background: `linear-gradient(to bottom, ${item.swatchTop}, ${item.swatchBottom})`,
                        }}
                        aria-hidden="true"
                      />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flight Pace / Difficulty */}
            <div>
              <h2 className="text-sm font-semibold text-slate-100 mb-2">Flight Pace</h2>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-slate-950 border border-slate-800">
                {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((diffKey) => {
                  const cfg = DIFFICULTIES[diffKey];
                  const active = difficulty === diffKey;
                  return (
                    <button
                      key={diffKey}
                      type="button"
                      onClick={() => setDifficulty(diffKey)}
                      className={`px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cfg.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rival Hazards & Dual Audio Controls */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {rivalThumbError ? (
                    <div className="w-9 h-9 rounded-md bg-slate-800 border border-red-500/60 flex items-center justify-center text-red-400 shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-md overflow-hidden border-2 border-red-500 bg-slate-950 shrink-0">
                      <img
                        src={RIVAL_ASSET_URL}
                        alt="Rival Flyer obstacle"
                        referrerPolicy="no-referrer"
                        onError={() => setRivalThumbError(true)}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-100 truncate">Rival Flyer Obstacle</div>
                    <div className="text-xs text-slate-400 truncate">Patrols sky lanes between pipes</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRivalsEnabled((v) => !v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    rivalsEnabled
                      ? 'bg-red-500/15 border-red-500/50 text-red-300 hover:bg-red-500/25'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rivalsEnabled ? 'Enabled' : 'Off'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMusicEnabled((v) => !v)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    musicEnabled
                      ? 'bg-slate-800 border-amber-500/60 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Music className={`w-3.5 h-3.5 ${musicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>Track: {musicEnabled ? 'On' : 'Off'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSfxEnabled((v) => !v)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    sfxEnabled
                      ? 'bg-slate-800 border-amber-500/60 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${sfxEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>8-Bit SFX: {sfxEnabled ? 'On' : 'Off'}</span>
                </button>
              </div>
            </div>

            {/* Recent Runs */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-100">Recent Flights</h2>
                {recentRuns.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRuns}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {recentRuns.length === 0 ? (
                <p className="text-xs text-slate-400 py-1.5">
                  No completed flights yet. Press Space or tap the canvas to start.
                </p>
              ) : (
                <ul className="divide-y divide-slate-800/80">
                  {recentRuns.map((run) => {
                    const flyerName =
                      FLYER_OPTIONS.find((f) => f.id === run.flyer)?.name ?? run.flyer;
                    const diffName = DIFFICULTIES[run.difficulty]?.name ?? run.difficulty;
                    return (
                      <li
                        key={run.id}
                        className="py-2 flex items-center justify-between text-xs gap-4"
                      >
                        <div className="flex items-center gap-1.5 text-slate-300 truncate">
                          <span className="font-medium text-slate-200">{flyerName}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-400">{diffName}</span>
                        </div>
                        <span className="font-mono-num font-semibold text-amber-400 shrink-0">
                          {run.score} pts
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Quiet Controls Line */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Flap: Space, W, Up, or Tap</span>
              <span>Pause: P or Esc</span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
