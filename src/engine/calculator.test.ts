import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CATALOG,
  DEFAULT_FILLERS,
  calculateCatalog,
  calculateVariant,
  createDefaultInput,
  resolveContourGeometry,
} from './calculator';

const findBag = (id: string) => {
  const bag = DEFAULT_CATALOG.find((b) => b.id === id);
  if (!bag) throw new Error(`Missing catalog bag ${id}`);
  return bag;
};

const quartzSand = DEFAULT_FILLERS[0];

describe('BIG-BAG_CASTLE Calculator — Verification against Section 2.3 Table', () => {
  it('contains all 32 catalog items and 4 fillers', () => {
    expect(DEFAULT_CATALOG).toHaveLength(32);
    expect(DEFAULT_FILLERS).toHaveLength(4);
  });

  it('Row 1: 95x95x150 (РиаПласт, 85% fill) matches 544 / 695, 799.7 m3, 1239.6 t, 6-4-1', () => {
    const input = createDefaultInput();
    const res = calculateVariant(findBag('riaplast_fort_95_95_150'), input, quartzSand);

    expect(res.vAllowedM3).toBeCloseTo(1.151, 3);
    expect(res.hFactM).toBeCloseTo(1.275, 3);
    expect(res.tiersCount).toBe(3);
    expect(res.hTotalFactM).toBeCloseTo(3.825, 2);
    expect(res.rowsPerTier).toEqual([6, 4, 1]);
    expect(res.nBagsVolume).toBe(544);
    expect(res.nBagsDiscrete).toBe(695);
    expect(res.totalFillerM3).toBeCloseTo(799.7, 1);
    expect(res.totalFillerTons).toBeCloseTo(1239.6, 1);
    expect(res.checks.some((c) => c.code === 'CHK_CONSTRAINED_MODE')).toBe(true);
    expect(res.checks.some((c) => c.code === 'CHK_SINGLE_BAG_RATIO')).toBe(true);
  });

  it('Row 2: 95x95x150 (РиаПласт, fit_h_min H=3.0m) matches 695 discrete, 627.2 m3, 972.2 t, 6-4-1', () => {
    const input = {
      ...createDefaultInput(),
      heightMode: 'fit_h_min' as const,
    };
    const res = calculateVariant(findBag('riaplast_fort_95_95_150'), input, quartzSand);

    expect(res.vAllowedM3).toBeCloseTo(0.9025, 3);
    expect(res.hFactM).toBeCloseTo(1.0, 3);
    expect(res.tiersCount).toBe(3);
    expect(res.hTotalFactM).toBeCloseTo(3.0, 2);
    expect(res.rowsPerTier).toEqual([6, 4, 1]);
    expect(res.nBagsDiscrete).toBe(695);
    expect(res.nBagsVolume).toBeGreaterThanOrEqual(693);
    expect(res.nBagsVolume).toBeLessThanOrEqual(694);
    expect(res.totalFillerM3).toBeCloseTo(627.2, 1);
    expect(res.totalFillerTons).toBeCloseTo(972.2, 1);
    expect(res.checks.some((c) => c.code === 'CHK_STACK_LIMIT')).toBe(false);
    expect(res.checks.some((c) => c.code === 'CHK_TRAP_RATIO')).toBe(false);
    expect(res.status).toBe('WARNING'); // constrained mode 2:1 & h_nom > 1.5a
  });

  it('Row 3: 90x90x120 (БИГБАГТАРА, SWL 1.1t) matches 876 / 1067, 757.2 m3, 1173.7 t, 7-5-3-1', () => {
    const input = createDefaultInput();
    const res = calculateVariant(findBag('bigbagtara_90_90_120'), input, quartzSand);

    expect(res.vAllowedM3).toBeCloseTo(0.710, 3);
    expect(res.hFactM).toBeCloseTo(0.876, 3);
    expect(res.tiersCount).toBe(4);
    expect(res.hTotalFactM).toBeCloseTo(3.505, 2);
    expect(res.rowsPerTier).toEqual([7, 5, 3, 1]);
    expect(res.nBagsVolume).toBe(876);
    expect(res.nBagsDiscrete).toBe(1067);
    expect(res.totalFillerM3).toBeCloseTo(757.2, 1);
    expect(res.totalFillerTons).toBeCloseTo(1173.7, 1);
    expect(res.checks.some((c) => c.code === 'CHK_STACK_LIMIT')).toBe(false);
  });

  it('Row 4: 75x75x140 (РиаПласт, 85%) matches 908 / 1040, 696.15 m3, 1079.0 t, 8-4-1', () => {
    const input = createDefaultInput();
    const res = calculateVariant(findBag('riaplast_fort_75_75_140'), input, quartzSand);

    expect(res.vAllowedM3).toBeCloseTo(0.669, 3);
    expect(res.hFactM).toBeCloseTo(1.190, 3);
    expect(res.tiersCount).toBe(3);
    expect(res.hTotalFactM).toBeCloseTo(3.57, 2);
    expect(res.rowsPerTier).toEqual([8, 4, 1]);
    expect(res.nBagsVolume).toBe(908);
    expect(res.nBagsDiscrete).toBe(1040);
    expect(res.totalFillerM3).toBeCloseTo(696.15, 1);
    expect(res.totalFillerTons).toBeCloseTo(1079.0, 1);
    expect(res.checks.some((c) => c.code === 'CHK_CREST_BALLISTIC')).toBe(true);
  });

  it('Row 5: 72.5x72.5x125 (РиаПласт, 85%) matches 1084 / 1159, 647.3 m3, 1003.3 t, 8-5-1', () => {
    const input = createDefaultInput();
    const res = calculateVariant(findBag('riaplast_fort_725_725_125'), input, quartzSand);

    expect(res.vAllowedM3).toBeCloseTo(0.558, 3);
    expect(res.hFactM).toBeCloseTo(1.0625, 3);
    expect(res.tiersCount).toBe(3);
    expect(res.hTotalFactM).toBeCloseTo(3.1875, 2);
    expect(res.rowsPerTier).toEqual([8, 5, 1]);
    expect(res.nBagsVolume).toBe(1084);
    expect(res.nBagsDiscrete).toBe(1159);
    expect(res.totalFillerM3).toBeCloseTo(647.3, 1);
    expect(res.totalFillerTons).toBeCloseTo(1003.3, 1);
    expect(res.checks.some((c) => c.code === 'CHK_CREST_BALLISTIC')).toBe(true);
  });

  it('Row 6: 100x100x100 (БИГБАГТАРА, SWL 1.0t) yields 5 tiers with WARNING (CHK_STACK_HIGH & CHK_UNDERFILLED_BAG)', () => {
    const input = createDefaultInput();
    const res = calculateVariant(findBag('bigbagtara_100_100_100'), input, quartzSand);

    expect(res.vAllowedM3).toBeCloseTo(0.645, 3);
    expect(res.hFactM).toBeCloseTo(0.645, 3);
    expect(res.tiersCount).toBe(5);
    expect(res.hTotalFactM).toBeCloseTo(3.226, 2);
    expect(res.rowsPerTier).toEqual([6, 5, 4, 2, 1]);
    expect(res.nBagsVolume).toBe(977);
    expect(res.nBagsDiscrete).toBe(1080);
    expect(res.totalFillerM3).toBeCloseTo(696.8, 1);
    expect(res.totalFillerTons).toBeCloseTo(1080.0, 1);
    expect(res.status).toBe('WARNING');
    expect(res.checks.some((c) => c.code === 'CHK_STACK_HIGH')).toBe(true);
    expect(res.checks.some((c) => c.code === 'CHK_UNDERFILLED_BAG')).toBe(true);
  });

  it('supports object contour mode (Mode B) and calculates centerline perimeter correctly', () => {
    const input = {
      ...createDefaultInput(),
      mode: 'object' as const,
      minHeightM: 3.0,
      objectContour: {
        shape: 'cylinder' as const,
        lengthM: 20.0,
        widthM: 10.0,
        polygonSides: 6,
        offsetM: 2.0,
        ratio: '2:1' as const,
      },
    };
    const geom = resolveContourGeometry(input);
    expect(geom.baseWidthM).toBe(6.0);
    // D = 20, offset = 2.0, W_осн = 6.0 => D_mid = 20 + 2*2 + 6 = 30 => P_ср = pi * 30
    expect(geom.avgPerimeterM).toBeCloseTo(Math.PI * 30, 4);
  });

  it('calculates all 32 catalog items without NaN or errors', () => {
    const input = createDefaultInput();
    const results = calculateCatalog(DEFAULT_CATALOG, input);
    expect(results).toHaveLength(32);
    for (const r of results) {
      expect(Number.isFinite(r.nBagsDiscrete)).toBe(true);
      expect(Number.isFinite(r.totalFillerM3)).toBe(true);
      expect(r.rowsPerTier.length).toBe(r.tiersCount);
    }
  });
});
