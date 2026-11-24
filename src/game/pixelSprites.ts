import { FlyerId, GROUND_HEIGHT, PLAYABLE_HEIGHT, SkyThemeId, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './types';

export type WingFrame = 0 | 1 | 2;

export interface BirdPalette {
  outline: string;
  body: string;
  highlight: string;
  shadow: string;
  belly: string;
  wing: string;
  beakTop: string;
  beakBottom: string;
}

export const BIRD_PALETTES: Record<Exclude<FlyerId, 'photo'>, BirdPalette> = {
  canary: {
    outline: '#1E1B4B',
    body: '#FACC15',
    highlight: '#FEF08A',
    shadow: '#CA8A04',
    belly: '#FEF9C3',
    wing: '#FFFBEB',
    beakTop: '#FB923C',
    beakBottom: '#EA580C',
  },
  cardinal: {
    outline: '#1E1B4B',
    body: '#EF4444',
    highlight: '#FCA5A5',
    shadow: '#B91C1C',
    belly: '#FECACA',
    wing: '#FEE2E2',
    beakTop: '#FBBF24',
    beakBottom: '#D97706',
  },
  jay: {
    outline: '#1E1B4B',
    body: '#3B82F6',
    highlight: '#93C5FD',
    shadow: '#1D4ED8',
    belly: '#EFF6FF',
    wing: '#DBEAFE',
    beakTop: '#F59E0B',
    beakBottom: '#B45309',
  },
};

// 17w x 13h pixel art bird matrices for 3 wing animation frames
const BIRD_FRAMES: Record<WingFrame, string[]> = {
  0: [
    '......OOOOOO.....',
    '....OOHHHHHHOO...',
    '...OHHBBBBBWWO...',
    '..OHBBBBBBWWPO...',
    '..OBBBBBBBWWPO...',
    '.OFFFFFFOBBBBBOK.',
    '.OFWWWWFOBBBBOOKK',
    '..OFFFFOOBBBBOKK.',
    '...OBBBBBSSBBOD..',
    '...OSSSSSSSOOOD..',
    '....OSSSSSO......',
    '.....OOOOOO......',
    '.................',
  ],
  1: [
    '......OOOOOO.....',
    '....OOHHHHHHOO...',
    '...OHHBBBBBWWO...',
    '..OHBBBBBBWWPO...',
    '..OBBBBBBBWWPO...',
    '..OBBBBBBBBBBBOK.',
    '.OFFFFFFOBBBBOOKK',
    '.OFWWWWFOBBBBOKK.',
    '..OFFFFOOBBBBOD..',
    '...OSSSSSSSOOOD..',
    '....OSSSSSO......',
    '.....OOOOOO......',
    '.................',
  ],
  2: [
    '......OOOOOO.....',
    '....OOHHHHHHOO...',
    '...OHHBBBBBWWO...',
    '..OHBBBBBBWWPO...',
    '..OBBBBBBBWWPO...',
    '..OBBBBBBBBBBBOK.',
    '..OBBBBBBBBBBOOKK',
    '.OFFFFFFOBBBBOKK.',
    '.OFWWWWFOBBBBOD..',
    '..OFFFFOSSSOOOD..',
    '....OSSSSSO......',
    '.....OOOOOO......',
    '.................',
  ],
};

export function drawPixelBird(
  ctx: CanvasRenderingContext2D,
  flyer: Exclude<FlyerId, 'photo'>,
  wingFrame: WingFrame,
  pixelSize = 1,
  offsetX = -8.5,
  offsetY = -6.5
): void {
  const palette = BIRD_PALETTES[flyer];
  const grid = BIRD_FRAMES[wingFrame];

  for (let row = 0; row < grid.length; row++) {
    const line = grid[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '.') continue;
      let color = palette.outline;
      switch (ch) {
        case 'O':
          color = palette.outline;
          break;
        case 'B':
          color = palette.body;
          break;
        case 'H':
          color = palette.highlight;
          break;
        case 'S':
          color = palette.shadow;
          break;
        case 'W':
          color = '#FFFFFF';
          break;
        case 'P':
          color = '#0F172A';
          break;
        case 'F':
          color = palette.wing;
          break;
        case 'K':
          color = palette.beakTop;
          break;
        case 'D':
          color = palette.beakBottom;
          break;
      }
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round((col + offsetX) * pixelSize),
        Math.round((row + offsetY) * pixelSize),
        pixelSize,
        pixelSize
      );
    }
  }

  // Cardinal and Jay crest feather
  if (flyer === 'cardinal' || flyer === 'jay') {
    ctx.fillStyle = palette.outline;
    ctx.fillRect(Math.round((5 + offsetX) * pixelSize), Math.round((-1 + offsetY) * pixelSize), pixelSize * 3, pixelSize);
    ctx.fillStyle = palette.highlight;
    ctx.fillRect(Math.round((6 + offsetX) * pixelSize), Math.round((0 + offsetY) * pixelSize), pixelSize * 2, pixelSize);
  }
}

export function buildPixelPhotoSprite(img: HTMLImageElement): HTMLCanvasElement {
  const size = 18;
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const octx = offscreen.getContext('2d');
  if (!octx) return offscreen;

  octx.imageSmoothingEnabled = false;

  // Crop centered on the portrait head & glasses in the attached photo
  const sx = img.naturalWidth * 0.25;
  const sy = img.naturalHeight * 0.03;
  const side = Math.min(img.naturalWidth * 0.56, img.naturalHeight * 0.56);

  octx.drawImage(img, sx, sy, side, side, 1, 1, size - 2, size - 2);

  // Crisp pixel-art rounded corners + 1px arcade outline
  octx.fillStyle = '#1E1B4B';
  // Top and bottom border
  octx.fillRect(2, 0, size - 4, 1);
  octx.fillRect(2, size - 1, size - 4, 1);
  // Left and right border
  octx.fillRect(0, 2, 1, size - 4);
  octx.fillRect(size - 1, 2, 1, size - 4);
  // Corner pixels
  octx.fillRect(1, 1, 1, 1);
  octx.fillRect(size - 2, 1, 1, 1);
  octx.fillRect(1, size - 2, 1, 1);
  octx.fillRect(size - 2, size - 2, 1, 1);

  // Clear outer 4 corner pixels for rounded pixel medallion look
  octx.clearRect(0, 0, 2, 1);
  octx.clearRect(0, 0, 1, 2);
  octx.clearRect(size - 2, 0, 2, 1);
  octx.clearRect(size - 1, 0, 1, 2);
  octx.clearRect(0, size - 1, 2, 1);
  octx.clearRect(0, size - 2, 1, 2);
  octx.clearRect(size - 2, size - 1, 2, 1);
  octx.clearRect(size - 1, size - 2, 1, 2);

  // Restore diagonal inner corner pixels
  octx.fillStyle = '#1E1B4B';
  octx.fillRect(1, 1, 1, 1);
  octx.fillRect(size - 2, 1, 1, 1);
  octx.fillRect(1, size - 2, 1, 1);
  octx.fillRect(size - 2, size - 2, 1, 1);

  return offscreen;
}

export function drawPhotoFlyer(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement | null,
  wingFrame: WingFrame
): void {
  if (sprite) {
    ctx.drawImage(sprite, -9, -9);
  } else {
    // Fallback pixel badge while photo loads
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(-7, -7, 14, 14);
  }

  // Animated colorful pixel wing attached to left side of the portrait
  const wingOffsetY = wingFrame === 0 ? -3 : wingFrame === 1 ? 0 : 3;
  ctx.fillStyle = '#1E1B4B';
  ctx.fillRect(-13, wingOffsetY - 2, 6, 5);
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(-12, wingOffsetY - 1, 4, 3);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-11, wingOffsetY - 1, 2, 1);
}

export function buildPixelRivalSprite(img: HTMLImageElement): HTMLCanvasElement {
  const size = 18;
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const octx = offscreen.getContext('2d');
  if (!octx) return offscreen;

  octx.imageSmoothingEnabled = false;

  // Crop centered on the face & round glasses in the rival portrait
  const sx = img.naturalWidth * 0.28;
  const sy = img.naturalHeight * 0.06;
  const side = Math.min(img.naturalWidth * 0.50, img.naturalHeight * 0.56);

  octx.drawImage(img, sx, sy, side, side, 1, 1, size - 2, size - 2);

  // Fiery crimson 1px pixel hazard border
  octx.fillStyle = '#DC2626';
  octx.fillRect(2, 0, size - 4, 1);
  octx.fillRect(2, size - 1, size - 4, 1);
  octx.fillRect(0, 2, 1, size - 4);
  octx.fillRect(size - 1, 2, 1, size - 4);

  // Clear outer 4 corner pixels for rounded pixel medallion look
  octx.clearRect(0, 0, 2, 1);
  octx.clearRect(0, 0, 1, 2);
  octx.clearRect(size - 2, 0, 2, 1);
  octx.clearRect(size - 1, 0, 1, 2);
  octx.clearRect(0, size - 1, 2, 1);
  octx.clearRect(0, size - 2, 1, 2);
  octx.clearRect(size - 2, size - 1, 2, 1);
  octx.clearRect(size - 1, size - 2, 1, 2);

  // Diagonal crimson corner pixels
  octx.fillStyle = '#7F1D1D';
  octx.fillRect(1, 1, 1, 1);
  octx.fillRect(size - 2, 1, 1, 1);
  octx.fillRect(1, size - 2, 1, 1);
  octx.fillRect(size - 2, size - 2, 1, 1);

  return offscreen;
}

export function drawRivalFlyer(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement | null,
  wingFrame: WingFrame
): void {
  if (sprite) {
    ctx.drawImage(sprite, -9, -9);
  } else {
    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-7, -7, 14, 14);
  }

  // Animated crimson-orange rival wing on the trailing right side
  const wingOffsetY = wingFrame === 0 ? -3 : wingFrame === 1 ? 0 : 3;
  ctx.fillStyle = '#450A0A';
  ctx.fillRect(7, wingOffsetY - 2, 6, 5);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(8, wingOffsetY - 1, 4, 3);
  ctx.fillStyle = '#FCA5A5';
  ctx.fillRect(9, wingOffsetY - 1, 2, 1);
}

interface ThemeColors {
  skyBands: string[];
  sunOrMoon: 'sun' | 'sunset' | 'moon';
  cloudMain: string;
  cloudShadow: string;
  farHill: string;
  farHillHighlight: string;
  midBush: string;
  midBushHighlight: string;
  pipeOutline: string;
  pipeHighlight: string;
  pipeMain: string;
  pipeMid: string;
  pipeShadow: string;
  grassTop: string;
  grassStripeA: string;
  grassStripeB: string;
  grassBottom: string;
  dirtMain: string;
  dirtSpeck: string;
}

const THEME_PALETTES: Record<SkyThemeId, ThemeColors> = {
  meadow: {
    skyBands: ['#4EC0CA', '#62CCD5', '#7BE0E6', '#9DECF0', '#C2F6F8'],
    sunOrMoon: 'sun',
    cloudMain: '#FFFFFF',
    cloudShadow: '#D4EFF5',
    farHill: '#7BC96F',
    farHillHighlight: '#9BE082',
    midBush: '#46A349',
    midBushHighlight: '#67C45A',
    pipeOutline: '#1B3B1A',
    pipeHighlight: '#B4F36D',
    pipeMain: '#73BF2E',
    pipeMid: '#589C22',
    pipeShadow: '#3D7516',
    grassTop: '#9CE659',
    grassStripeA: '#73BF2E',
    grassStripeB: '#558C22',
    grassBottom: '#3E6B17',
    dirtMain: '#DED895',
    dirtSpeck: '#C8BD75',
  },
  sunset: {
    skyBands: ['#9A3412', '#C2410C', '#EA580C', '#FB923C', '#FDBA74'],
    sunOrMoon: 'sunset',
    cloudMain: '#FFEDD5',
    cloudShadow: '#FDBA74',
    farHill: '#7C2D12',
    farHillHighlight: '#9A3412',
    midBush: '#4C1D95',
    midBushHighlight: '#6D28D9',
    pipeOutline: '#2A1810',
    pipeHighlight: '#FDE047',
    pipeMain: '#EAB308',
    pipeMid: '#CA8A04',
    pipeShadow: '#A16207',
    grassTop: '#FB923C',
    grassStripeA: '#EA580C',
    grassStripeB: '#C2410C',
    grassBottom: '#7C2D12',
    dirtMain: '#D6B48F',
    dirtSpeck: '#B8926A',
  },
  night: {
    skyBands: ['#0F172A', '#1E1B4B', '#272463', '#312E81', '#3730A3'],
    sunOrMoon: 'moon',
    cloudMain: '#6366F1',
    cloudShadow: '#4338CA',
    farHill: '#1E293B',
    farHillHighlight: '#334155',
    midBush: '#0F766E',
    midBushHighlight: '#14B8A6',
    pipeOutline: '#06261E',
    pipeHighlight: '#6EE7B7',
    pipeMain: '#10B981',
    pipeMid: '#059669',
    pipeShadow: '#047857',
    grassTop: '#34D399',
    grassStripeA: '#10B981',
    grassStripeB: '#059669',
    grassBottom: '#065F46',
    dirtMain: '#334155',
    dirtSpeck: '#1E293B',
  },
};

export function drawPixelBackground(
  ctx: CanvasRenderingContext2D,
  themeId: SkyThemeId,
  scrollOffset: number,
  elapsedTime: number
): void {
  const theme = THEME_PALETTES[themeId];
  const bandHeight = Math.ceil(PLAYABLE_HEIGHT / theme.skyBands.length);

  // 1. Dithered pixel sky bands
  for (let i = 0; i < theme.skyBands.length; i++) {
    const y = i * bandHeight;
    ctx.fillStyle = theme.skyBands[i];
    ctx.fillRect(0, y, VIRTUAL_WIDTH, bandHeight);

    // 2px checkerboard dither transition between bands
    if (i < theme.skyBands.length - 1) {
      ctx.fillStyle = theme.skyBands[i + 1];
      const ditherY = y + bandHeight - 2;
      for (let x = 0; x < VIRTUAL_WIDTH; x += 2) {
        ctx.fillRect(x, ditherY, 1, 1);
        ctx.fillRect(x + 1, ditherY + 1, 1, 1);
      }
    }
  }

  // 2. Celestial features (Sun, Sunset Orb, or Twinkling Stars + Pixel Moon)
  if (theme.sunOrMoon === 'sun') {
    const sx = 186;
    const sy = 36;
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(sx - 9, sy - 9, 18, 18);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(sx - 7, sy - 7, 14, 14);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx - 4, sy - 4, 4, 4);
  } else if (theme.sunOrMoon === 'sunset') {
    const sx = 120;
    const sy = 136;
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(sx - 18, sy - 18, 36, 36);
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(sx - 14, sy - 14, 28, 28);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(sx - 10, sy - 10, 20, 20);
  } else {
    // Twinkling pixel stars
    const stars = [
      [22, 24], [54, 42], [88, 18], [118, 52], [148, 28],
      [174, 64], [212, 22], [38, 78], [134, 88], [226, 72],
    ];
    stars.forEach(([sx, sy], idx) => {
      const twinkle = Math.sin(elapsedTime * 3 + idx * 1.7) > 0.2;
      ctx.fillStyle = twinkle ? '#FEF08A' : '#94A3B8';
      ctx.fillRect(sx, sy, twinkle ? 2 : 1, twinkle ? 2 : 1);
    });
    // Pixel crescent moon
    ctx.fillStyle = '#FEF9C3';
    ctx.fillRect(184, 28, 14, 14);
    ctx.fillStyle = theme.skyBands[0];
    ctx.fillRect(190, 26, 10, 12);
  }

  // 3. Parallax Pixel Clouds
  const cloudScroll = Math.floor(scrollOffset * 0.18);
  const cloudPositions = [18, 96, 178, 258];
  for (let i = 0; i < cloudPositions.length; i++) {
    const cx = ((cloudPositions[i] - cloudScroll) % 280 + 280) % 280 - 38;
    const cy = 48 + (i % 2) * 26;
    drawPixelCloud(ctx, cx, cy, theme.cloudMain, theme.cloudShadow);
  }

  // 4. Far Parallax Pixel Hills
  const farScroll = Math.floor(scrollOffset * 0.3);
  for (let x = -48; x < VIRTUAL_WIDTH + 48; x += 48) {
    const hx = x - (farScroll % 48);
    drawPixelHill(ctx, hx, PLAYABLE_HEIGHT - 22, theme.farHill, theme.farHillHighlight);
  }

  // 5. Midground Pixel Bushes / Foliage
  const midScroll = Math.floor(scrollOffset * 0.52);
  for (let x = -32; x < VIRTUAL_WIDTH + 32; x += 32) {
    const bx = x - (midScroll % 32);
    drawPixelBush(ctx, bx, PLAYABLE_HEIGHT - 10, theme.midBush, theme.midBushHighlight);
  }
}

function drawPixelCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  main: string,
  shadow: string
): void {
  ctx.fillStyle = shadow;
  ctx.fillRect(x + 2, y + 6, 30, 6);
  ctx.fillRect(x + 6, y + 2, 20, 6);

  ctx.fillStyle = main;
  ctx.fillRect(x + 2, y + 5, 28, 5);
  ctx.fillRect(x + 6, y + 1, 18, 6);
  ctx.fillRect(x + 10, y - 2, 10, 4);
}

function drawPixelHill(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  fill: string,
  highlight: string
): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, baseY, 48, 24);
  ctx.fillRect(x + 6, baseY - 8, 36, 8);
  ctx.fillRect(x + 14, baseY - 14, 20, 6);

  ctx.fillStyle = highlight;
  ctx.fillRect(x + 14, baseY - 14, 16, 2);
  ctx.fillRect(x + 8, baseY - 8, 12, 2);
}

function drawPixelBush(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  fill: string,
  highlight: string
): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, baseY - 4, 32, 14);
  ctx.fillRect(x + 4, baseY - 10, 12, 8);
  ctx.fillRect(x + 16, baseY - 12, 12, 10);

  ctx.fillStyle = highlight;
  ctx.fillRect(x + 6, baseY - 10, 8, 2);
  ctx.fillRect(x + 18, baseY - 12, 8, 2);
}

export function drawPixelPipe(
  ctx: CanvasRenderingContext2D,
  themeId: SkyThemeId,
  x: number,
  gapY: number,
  gapHeight: number,
  pipeWidth: number
): void {
  const theme = THEME_PALETTES[themeId];
  const capHeight = 12;
  const capOverhang = 2;
  const topPipeBottom = Math.round(gapY - gapHeight / 2);
  const bottomPipeTop = Math.round(gapY + gapHeight / 2);

  // Top pipe shaft
  if (topPipeBottom > capHeight) {
    drawPipeColumn(ctx, theme, x, 0, pipeWidth, topPipeBottom - capHeight);
  }
  // Top pipe cap
  drawPipeColumn(
    ctx,
    theme,
    x - capOverhang,
    topPipeBottom - capHeight,
    pipeWidth + capOverhang * 2,
    capHeight
  );

  // Bottom pipe cap
  drawPipeColumn(
    ctx,
    theme,
    x - capOverhang,
    bottomPipeTop,
    pipeWidth + capOverhang * 2,
    capHeight
  );
  // Bottom pipe shaft
  const bottomShaftHeight = PLAYABLE_HEIGHT - (bottomPipeTop + capHeight);
  if (bottomShaftHeight > 0) {
    drawPipeColumn(
      ctx,
      theme,
      x,
      bottomPipeTop + capHeight,
      pipeWidth,
      bottomShaftHeight
    );
  }
}

function drawPipeColumn(
  ctx: CanvasRenderingContext2D,
  theme: ThemeColors,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (h <= 0) return;

  // Outline box
  ctx.fillStyle = theme.pipeOutline;
  ctx.fillRect(x, y, w, h);

  // Main body fill
  const innerX = x + 1;
  const innerW = w - 2;
  ctx.fillStyle = theme.pipeMain;
  ctx.fillRect(innerX, y + 1, innerW, Math.max(0, h - 2));

  // Cylindrical pixel shading bands
  ctx.fillStyle = theme.pipeHighlight;
  ctx.fillRect(innerX + 2, y + 1, 3, Math.max(0, h - 2));
  ctx.fillRect(innerX + 6, y + 1, 1, Math.max(0, h - 2));

  ctx.fillStyle = theme.pipeMid;
  ctx.fillRect(innerX + innerW - 7, y + 1, 3, Math.max(0, h - 2));

  ctx.fillStyle = theme.pipeShadow;
  ctx.fillRect(innerX + innerW - 4, y + 1, 4, Math.max(0, h - 2));
}

export function drawPixelGround(
  ctx: CanvasRenderingContext2D,
  themeId: SkyThemeId,
  scrollOffset: number
): void {
  const theme = THEME_PALETTES[themeId];
  const y = PLAYABLE_HEIGHT;

  // Top dark outline
  ctx.fillStyle = theme.pipeOutline;
  ctx.fillRect(0, y, VIRTUAL_WIDTH, 2);

  // Bright grass lip
  ctx.fillStyle = theme.grassTop;
  ctx.fillRect(0, y + 2, VIRTUAL_WIDTH, 2);

  // Scrolling diagonal pixel grass stripes
  const stripePeriod = 12;
  const offset = Math.floor(scrollOffset) % stripePeriod;
  ctx.fillStyle = theme.grassStripeA;
  ctx.fillRect(0, y + 4, VIRTUAL_WIDTH, 8);

  ctx.fillStyle = theme.grassStripeB;
  for (let gx = -stripePeriod; gx < VIRTUAL_WIDTH + stripePeriod; gx += stripePeriod) {
    const startX = gx - offset;
    for (let row = 0; row < 8; row++) {
      ctx.fillRect(startX + 4 - Math.floor(row / 2), y + 4 + row, 5, 1);
    }
  }

  // Grass bottom border
  ctx.fillStyle = theme.grassBottom;
  ctx.fillRect(0, y + 12, VIRTUAL_WIDTH, 2);

  // Earth base
  ctx.fillStyle = theme.dirtMain;
  ctx.fillRect(0, y + 14, VIRTUAL_WIDTH, GROUND_HEIGHT - 14);

  // Scrolling pixel pebbles / earth texture
  ctx.fillStyle = theme.dirtSpeck;
  const pebblePeriod = 24;
  const pebbleOffset = Math.floor(scrollOffset) % pebblePeriod;
  for (let px = -pebblePeriod; px < VIRTUAL_WIDTH + pebblePeriod; px += pebblePeriod) {
    const bx = px - pebbleOffset;
    ctx.fillRect(bx + 3, y + 19, 4, 2);
    ctx.fillRect(bx + 14, y + 25, 5, 2);
    ctx.fillRect(bx + 7, y + 33, 3, 2);
    ctx.fillRect(bx + 18, y + 37, 4, 2);
  }
}
