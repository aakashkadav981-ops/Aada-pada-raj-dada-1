export type GamePhase = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'DYING' | 'GAME_OVER';

export type FlyerId = 'photo' | 'canary' | 'cardinal' | 'jay';

export type SkyThemeId = 'meadow' | 'sunset' | 'night';

export type DifficultyId = 'breezy' | 'classic' | 'turbo';

export interface FlyerOption {
  id: FlyerId;
  name: string;
  subtitle: string;
  accentColor: string;
  imageUrl?: string;
}

export interface SkyThemeOption {
  id: SkyThemeId;
  name: string;
  swatchTop: string;
  swatchBottom: string;
  pipeColor: string;
}

export interface DifficultyConfig {
  id: DifficultyId;
  name: string;
  gravity: number;
  flapVelocity: number;
  pipeSpeed: number;
  pipeGap: number;
  pipeInterval: number;
}

export interface RunRecord {
  id: string;
  score: number;
  flyer: FlyerId;
  theme: SkyThemeId;
  difficulty: DifficultyId;
  timestamp: number;
}

export const VIRTUAL_WIDTH = 240;
export const VIRTUAL_HEIGHT = 320;
export const GROUND_HEIGHT = 44;
export const PLAYABLE_HEIGHT = VIRTUAL_HEIGHT - GROUND_HEIGHT;

export const PHOTO_ASSET_URL = '/assets/aistudio/IMG_20261124_225951_0d1148e1.jpg';
export const RIVAL_ASSET_URL = '/assets/aistudio/31332_0d32a951.jpg';
export const SOUNDTRACK_URL = '/assets/aistudio/raj_2_9a520801.mp3';

export const FLYER_OPTIONS: FlyerOption[] = [
  {
    id: 'photo',
    name: 'Photo Flyer',
    subtitle: 'Custom pixelated portrait',
    accentColor: '#38BDF8',
    imageUrl: PHOTO_ASSET_URL,
  },
  {
    id: 'canary',
    name: 'Sunny Canary',
    subtitle: 'Classic golden wing',
    accentColor: '#FACC15',
  },
  {
    id: 'cardinal',
    name: 'Crimson Crest',
    subtitle: 'Swift ruby plumage',
    accentColor: '#EF4444',
  },
  {
    id: 'jay',
    name: 'Cobalt Jay',
    subtitle: 'Sky-blue glider',
    accentColor: '#3B82F6',
  },
];

export const SKY_THEMES: SkyThemeOption[] = [
  {
    id: 'meadow',
    name: 'Meadow',
    swatchTop: '#4EC0CA',
    swatchBottom: '#9DE6EC',
    pipeColor: '#73BF2E',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    swatchTop: '#EA580C',
    swatchBottom: '#FDBA74',
    pipeColor: '#D97706',
  },
  {
    id: 'night',
    name: 'Starlight',
    swatchTop: '#1E1B4B',
    swatchBottom: '#312E81',
    pipeColor: '#10B981',
  },
];

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  breezy: {
    id: 'breezy',
    name: 'Breezy',
    gravity: 480,
    flapVelocity: -178,
    pipeSpeed: 68,
    pipeGap: 78,
    pipeInterval: 1.55,
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    gravity: 590,
    flapVelocity: -198,
    pipeSpeed: 82,
    pipeGap: 66,
    pipeInterval: 1.32,
  },
  turbo: {
    id: 'turbo',
    name: 'Turbo',
    gravity: 690,
    flapVelocity: -214,
    pipeSpeed: 102,
    pipeGap: 58,
    pipeInterval: 1.08,
  },
};

export interface MedalInfo {
  label: string;
  color: string;
  rimColor: string;
}

export function getMedalForScore(score: number): MedalInfo | null {
  if (score >= 40) {
    return { label: 'Platinum', color: '#E2E8F0', rimColor: '#38BDF8' };
  }
  if (score >= 30) {
    return { label: 'Gold', color: '#FACC15', rimColor: '#CA8A04' };
  }
  if (score >= 20) {
    return { label: 'Silver', color: '#CBD5E1', rimColor: '#64748B' };
  }
  if (score >= 10) {
    return { label: 'Bronze', color: '#D97706', rimColor: '#92400E' };
  }
  return null;
}
