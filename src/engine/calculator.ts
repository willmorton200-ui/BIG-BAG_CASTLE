import catalogData from '../data/catalog.json';
import fillersData from '../data/fillers.json';
import {
  BigBagCatalogItem,
  CalculationInput,
  CalculationResult,
  CheckStatus,
  EngineeringCheck,
  FillerCatalogItem,
} from '../types/calculator';

export const DEFAULT_CATALOG: BigBagCatalogItem[] = catalogData as BigBagCatalogItem[];
export const DEFAULT_FILLERS: FillerCatalogItem[] = fillersData as FillerCatalogItem[];

export function roundHalfToEven(value: number): number {
  const floorVal = Math.floor(value);
  const frac = value - floorVal;
  if (Math.abs(frac - 0.5) < 1e-9) {
    return floorVal % 2 === 0 ? floorVal : floorVal + 1;
  }
  return Math.round(value);
}

export function getAllowedMaxTiersByVolume(nominalVolumeM3: number): number {
  if (nominalVolumeM3 <= 1.0 + 1e-9) return 4;
  if (nominalVolumeM3 <= 1.5 + 1e-9) return 3;
  return 2;
}

export function resolveContourGeometry(input: CalculationInput): {
  baseWidthM: number;
  minHeightM: number;
  avgPerimeterM: number;
} {
  if (input.mode === 'trapezoid') {
    return {
      baseWidthM: Math.max(0.5, input.baseWidthM),
      minHeightM: Math.max(0.5, input.minHeightM),
      avgPerimeterM: Math.max(0.5, input.avgPerimeterM),
    };
  }

  const { shape, lengthM, widthM, polygonSides, offsetM, ratio } = input.objectContour;
  const minHeightM = Math.max(0.5, input.minHeightM);
  const ratioMultiplier = ratio === '3:1' ? 3 : 2;
  const baseWidthM = ratioMultiplier * minHeightM;
  const safeOffset = Math.max(0, offsetM);
  const centerlineShift = safeOffset + baseWidthM / 2;

  let avgPerimeterM = 0;
  if (shape === 'rectangle') {
    const L = Math.max(0.5, lengthM);
    const W = Math.max(0.5, widthM);
    avgPerimeterM = 2 * (L + 2 * centerlineShift) + 2 * (W + 2 * centerlineShift);
  } else if (shape === 'cylinder') {
    const D = Math.max(0.5, lengthM);
    avgPerimeterM = Math.PI * (D + 2 * centerlineShift);
  } else {
    const n = Math.max(3, Math.round(polygonSides));
    const side = Math.max(0.5, lengthM);
    avgPerimeterM = n * side + 2 * n * Math.tan(Math.PI / n) * centerlineShift;
  }

  return {
    baseWidthM,
    minHeightM,
    avgPerimeterM,
  };
}

function estimateEmptyWeightKg(bag: BigBagCatalogItem): number {
  if (bag.emptyWeightKg !== null && bag.emptyWeightKg > 0) {
    return bag.emptyWeightKg;
  }
  const loops = Array.isArray(bag.loopsCount)
    ? bag.loopsCount[bag.loopsCount.length - 1]
    : bag.loopsCount;
  if (loops === 1) return 0.775;
  if (loops === 2) return 0.9;
  return 1.75; // 4-стропный ориентир по п. 3.1 (1,4–2,1 кг)
}

export function calculateVariant(
  bag: BigBagCatalogItem,
  input: CalculationInput,
  filler: FillerCatalogItem
): CalculationResult {
  const { baseWidthM, minHeightM, avgPerimeterM } = resolveContourGeometry(input);

  // Ориентация МКР: стандартная (вертикальная) или плашмя
  const rawLengthM = bag.dimensionsCm.length / 100;
  const rawWidthM = bag.dimensionsCm.width / 100;
  const rawHeightM = bag.dimensionsCm.height / 100;

  const a = input.orientation === 'vertical' ? rawWidthM : rawHeightM;
  const b = rawLengthM;
  const hNom = input.orientation === 'vertical' ? rawHeightM : rawWidthM;

  const densityTM3 = Math.max(0.05, input.fillerDensityKgM3 / 1000);
  const kH = Math.min(0.85, Math.max(0.5, input.fillHeightRatio));
  const kLoss = Math.max(1.0, input.lossFactor);

  // Этап 1. Характеристики единичного МКР
  const vNominalM3 =
    bag.nominalVolumeM3 > 0 ? bag.nominalVolumeM3 : a * b * hNom;
  const v85M3 = a * b * (kH * hNom);

  const effectiveSwlKg = bag.swlKg;
  const missingSwl = effectiveSwlKg === null || effectiveSwlKg <= 0;
  const vSwlM3 = !missingSwl ? (effectiveSwlKg / 1000) / densityTM3 : null;

  const vAllowedBaseM3 = vSwlM3 !== null ? Math.min(v85M3, vSwlM3) : v85M3;
  const hFactUnadjustedM = vAllowedBaseM3 / (a * b);

  // Этап 2. Дискретизация трапеции по ярусам
  const tiersCount = Math.max(1, Math.ceil(minHeightM / hFactUnadjustedM - 1e-9));

  let hFactM = hFactUnadjustedM;
  let vAllowedM3 = vAllowedBaseM3;

  if (input.heightMode === 'fit_h_min') {
    const hAdjusted = minHeightM / tiersCount;
    if (hAdjusted <= hFactUnadjustedM + 1e-9) {
      hFactM = Math.min(hAdjusted, hFactUnadjustedM);
      vAllowedM3 = a * b * hFactM;
    }
  }

  const hTotalFactM = tiersCount * hFactM;
  const heightDeltaM = hTotalFactM - minHeightM;
  const mBagKg = vAllowedM3 * input.fillerDensityKgM3;
  const swlUsagePct =
    !missingSwl && effectiveSwlKg ? (mBagKg / effectiveSwlKg) * 100 : null;

  // Ширина верхнего среза W_верх = n_верх * a
  let crestRowsCount = 1;
  if (input.crestRule === '2x') {
    crestRowsCount = 2;
  } else if (input.crestRule === 'auto') {
    const requiredThickness = filler.minBarrierThicknessM ?? 0;
    crestRowsCount = requiredThickness > 0 && a < requiredThickness - 1e-9 ? 2 : 1;
  }
  const crestWidthM = crestRowsCount * a;

  const rowsPerTier: number[] = [];
  const tierWidthsM: number[] = [];

  for (let k = 1; k <= tiersCount; k++) {
    let wk: number;
    if (tiersCount === 1) {
      wk = baseWidthM;
    } else {
      wk = baseWidthM - ((baseWidthM - crestWidthM) * (k - 1)) / (tiersCount - 1);
    }
    tierWidthsM.push(wk);

    let mk: number;
    if (k === tiersCount) {
      mk = crestRowsCount;
    } else if (k === 1) {
      mk =
        input.baseTierRounding === 'floor'
          ? Math.max(1, Math.floor(baseWidthM / a + 1e-9))
          : Math.max(1, roundHalfToEven(baseWidthM / a));
    } else {
      mk = Math.max(1, roundHalfToEven(wk / a));
    }
    rowsPerTier.push(mk);
  }

  // Этап 3. Итоговые объёмы, сопоставление методов и допработы
  const sectionBagsCount = rowsPerTier.reduce((acc, v) => acc + v, 0);
  const bagsPerMeter = sectionBagsCount / b;
  const nBagsDiscrete = Math.ceil(avgPerimeterM * bagsPerMeter - 1e-9);

  const trapezoidAreaM2 = ((baseWidthM + crestWidthM) / 2) * minHeightM;
  const geometricVolumeM3 =
    input.targetVolumeM3 !== null && input.targetVolumeM3 > 0
      ? input.targetVolumeM3
      : trapezoidAreaM2 * avgPerimeterM;

  const nBagsVolume = Math.ceil(geometricVolumeM3 / vAllowedM3 - 1e-9);
  const methodDiffPct =
    nBagsVolume > 0 ? ((nBagsDiscrete - nBagsVolume) / nBagsVolume) * 100 : 0;

  const totalFillerM3 = nBagsDiscrete * vAllowedM3 * kLoss;
  const totalFillerTons = totalFillerM3 * densityTM3;
  const singleEmptyKg = estimateEmptyWeightKg(bag);
  const totalEmptyBagsTons = (nBagsDiscrete * singleEmptyKg) / 1000;
  const totalGrossTons = totalFillerTons + totalEmptyBagsTons;

  const trenchVolumeM3 =
    hTotalFactM > 1.0 ? 0.15 * baseWidthM * avgPerimeterM : 0;

  const horizontalRunM = Math.max(0, (baseWidthM - crestWidthM) / 2);
  const slopeLengthM = Math.hypot(horizontalRunM, hTotalFactM);
  const rawTarpAreaM2 = (2 * slopeLengthM + crestWidthM) * avgPerimeterM;
  const tarpAreaM2 = input.includeTarp ? rawTarpAreaM2 : 0;

  const actualRatioWH = baseWidthM / hTotalFactM;

  // Расчёт физического угла уклона штабеля:
  // Нижний ярус является плоской опорной плитой (подошвой на грунте/в траншее).
  // Наклонный откос формируется уступами вышележащих ярусов — от верха 1-го яруса до верха верхнего гребня.
  const tier1WidthM = (rowsPerTier[0] ?? 1) * a;
  const topTierWidthM = (rowsPerTier[rowsPerTier.length - 1] ?? 1) * a;
  const slopeRiseM = tiersCount > 1 ? (tiersCount - 1) * hFactM : hTotalFactM;
  const slopeRunM = Math.max(0.01, (tier1WidthM - topTierWidthM) / 2);
  const slopeAngleDeg =
    tiersCount > 1
      ? (Math.atan2(slopeRiseM, slopeRunM) * 180) / Math.PI
      : 90;

  // Этап 4. Матрица автоматических инженерных проверок
  const allowedMaxTiers = 5;
  const checks: EngineeringCheck[] = [];

  // 1. Проверка предельной ярусности для мягких геооболочек в связанной трапеции:
  // - До 4 ярусов включительно: стандартная штатная ярусность ЗОК (боковой распор в пределах прочности ткани 160-180 г/м²).
  // - 5 ярусов: предельная ярусность для стандартных МКР (WARNING).
  // - Более 5 ярусов: недопустимо для стандартных МКР (INVALID: риск разрыва ткани нижнего яруса от бокового распора).
  if (tiersCount > 5) {
    checks.push({
      code: 'CHK_STACK_LIMIT',
      level: 'INVALID',
      message: `Сверхвысокая ярусность (${tiersCount} яр. > 5 яр., H = ${hTotalFactM.toFixed(2)} м): превышен предел прочности стандартной полипропиленовой ткани на боковой распор грунтового массива (T > 20 кН/м по СП 22.13330 / механике грунтов). Стандартные упаковочные МКР неприменимы — требуются тяжёлые геоконтейнеры (ткань >= 300 г/м², разрыв >= 60 кН/м) либо разделение насыпи на бермы.`,
    });
  } else if (tiersCount === 5) {
    checks.push({
      code: 'CHK_STACK_HIGH',
      level: 'WARNING',
      message: `Предельная ярусность (5 ярусов, H = ${hTotalFactM.toFixed(2)} м): повышенное распирающее давление на основание. Обязательны плотность ткани не менее 180–200 г/м², перевязка швов на 1/2 длины и связующая траншея 15 см.`,
    });
  }

  // Предупреждение о превышении заводского складского лимита штабелирования (если в паспорте МКР он указан)
  if (bag.maxStackTiers > 0 && tiersCount > bag.maxStackTiers && tiersCount <= 5) {
    checks.push({
      code: 'CHK_STACK_HIGH',
      level: 'WARNING',
      message: `Паспортный складской лимит одиночного штабелирования (${bag.maxStackTiers} яр.) превышен: требуется ${tiersCount} яр. В связанной трапеции ЗОК устойчивость обеспечивается откосами и перевязкой, но необходим контроль целостности швов нижнего яруса.`,
    });
  }

  // 2. Проверка проектного профиля основания к целевой высоте
  const projectRatioWH = baseWidthM / minHeightM;
  if (projectRatioWH < 2.0 - 1e-6) {
    checks.push({
      code: 'CHK_TRAP_RATIO',
      level: 'INVALID',
      message: `Нарушено минимальное соотношение основания к проектной высоте 2:1 (проект ${projectRatioWH.toFixed(2)}:1 < 2:1 — опасность опрокидывания стены). Увеличьте ширину основания W_осн.`,
    });
  }

  // 3. Проверка фактической устойчивости с учётом дискретности ярусов
  if (actualRatioWH < 2.0 - 1e-6) {
    checks.push({
      code: 'CHK_CONSTRAINED_MODE',
      level: 'WARNING',
      message: `Фактическая высота стены (${hTotalFactM.toFixed(2)} м) из-за целых ярусов превышает H_min (${minHeightM.toFixed(2)} м), соотношение W:H = ${actualRatioWH.toFixed(2)}:1. Рекомендуется включить «Подгонку под H_min» или расширить W_осн до ${(hTotalFactM * 2.0).toFixed(1)} м.`,
    });
  } else if (actualRatioWH < 3.0 - 1e-6) {
    checks.push({
      code: 'CHK_CONSTRAINED_MODE',
      level: 'WARNING',
      message: `Профиль стеснённых условий (${actualRatioWH.toFixed(2)}:1 < 3:1): обязательны перевязка швов на 1/2 длины и связующая траншея 10–15 см.`,
    });
  }

  if (hNom > 1.5 * a + 1e-6 || hFactM > 1.5 * a + 1e-6) {
    checks.push({
      code: 'CHK_SINGLE_BAG_RATIO',
      level: 'WARNING',
      message: `Высота МКР (${(hNom * 100).toFixed(0)} см) превышает 1,5 размера основания (${(1.5 * a * 100).toFixed(0)} см): укладка допустима только в связанном пирамидальном массиве.`,
    });
  }

  if (
    filler.minBarrierThicknessM !== null &&
    crestWidthM < filler.minBarrierThicknessM - 1e-6
  ) {
    checks.push({
      code: 'CHK_CREST_BALLISTIC',
      level: 'WARNING',
      message: `Толщина верхнего среза ${crestWidthM.toFixed(2)} м меньше баллистического порога ${filler.minBarrierThicknessM.toFixed(2)} м для наполнителя «${filler.shortName}»: рекомендуется 2 ряда на гребне или МКР с основанием >= 0,90 м.`,
    });
  }

  // 4. Проверка степени наполнения мешка по высоте (проблема «мешка-чулка» при ограничении БРН)
  const fillHeightRatioActual = hNom > 0 ? hFactM / hNom : 1.0;
  if (missingSwl) {
    checks.push({
      code: 'CHK_MISSING_SWL',
      level: 'WARNING',
      message:
        'Паспортная БРН (SWL) отсутствует в справочнике (______________): расчёт выполнен только по геометрическому пределу 85%; требуется ручной ввод БРН.',
    });
  } else if (fillHeightRatioActual < 0.65 - 1e-6) {
    const emptyFabricCm = Math.round((hNom - hFactM) * 100);
    checks.push({
      code: 'CHK_UNDERFILLED_BAG',
      level: 'WARNING',
      message: `Недозаполнение по высоте: мешок заполнен всего на ${(fillHeightRatioActual * 100).toFixed(0)}% (${(hFactM * 100).toFixed(0)} см из ${(hNom * 100).toFixed(0)} см) из-за лимита БРН (${(effectiveSwlKg / 1000).toFixed(2)} т). Избыток пустой ткани (${emptyFabricCm} см) вызовет смятие складок и повышенную осадку ярусов. Рекомендуется МКР меньшей высоты либо с большей БРН (1.5–2.0 т).`,
    });
  } else if (vSwlM3 !== null && vSwlM3 < v85M3 - 1e-6) {
    checks.push({
      code: 'CHK_SWL_BOTTLENECK',
      level: 'INFO',
      message: `Заполнение ограничено паспортной БРН (${(effectiveSwlKg / 1000).toFixed(2)} т): мешок заполнен на ${(fillHeightRatioActual * 100).toFixed(0)}% высоты (${(hFactM * 100).toFixed(1)} см).`,
    });
  }

  if (input.hazardZone === 'explosive') {
    checks.push({
      code: 'CHK_HAZARD_ZONE',
      level: 'INFO',
      message:
        'Взрывоопасная зона (НПЗ/ГСМ, зоны 1 и 2): обязательно применение антистатических МКР Типа C (с заземлением каждого мешка контуром, R < 10^7 Ом) или Типа D (IEC 61340-4-4).',
    });
  }

  let status: CheckStatus = 'VALID';
  if (checks.some((c) => c.level === 'INVALID')) {
    status = 'INVALID';
  } else if (checks.some((c) => c.level === 'WARNING')) {
    status = 'WARNING';
  }

  // Сметная стоимость
  const bagsCostRub = nBagsDiscrete * input.costs.bagPriceRub;
  const fillerCostRub = totalFillerM3 * input.costs.fillerPriceRubM3;
  const tarpCostRub = input.includeTarp ? tarpAreaM2 * input.costs.tarpPriceRubM2 : 0;
  const cost = {
    bagsCostRub,
    fillerCostRub,
    tarpCostRub,
    totalCostRub: bagsCostRub + fillerCostRub + tarpCostRub,
  };

  // Оптимальность для сортировки: сначала проходящие (0), затем WARNING (1), затем INVALID (2),
  // внутри — минимизация расхода наполнителя и перерасхода высоты
  const statusWeight = status === 'VALID' ? 0 : status === 'WARNING' ? 100000 : 200000;
  const optimalityScore =
    statusWeight + totalFillerM3 + Math.abs(heightDeltaM) * 150 + nBagsDiscrete * 0.05;

  return {
    bag,
    effectiveDimsM: { a, b, hNom },
    effectiveSwlKg,
    missingSwl,
    vNominalM3,
    v85M3,
    vSwlM3,
    vAllowedBaseM3,
    vAllowedM3,
    hFactM,
    hFactUnadjustedM,
    mBagKg,
    swlUsagePct,
    tiersCount,
    hTotalFactM,
    heightDeltaM,
    crestRowsCount,
    crestWidthM,
    rowsPerTier,
    tierWidthsM,
    sectionBagsCount,
    bagsPerMeter,
    trapezoidAreaM2,
    geometricVolumeM3,
    nBagsVolume,
    nBagsDiscrete,
    methodDiffPct,
    totalFillerM3,
    totalFillerTons,
    totalEmptyBagsTons,
    totalGrossTons,
    trenchVolumeM3,
    tarpAreaM2,
    actualRatioWH,
    slopeAngleDeg,
    allowedMaxTiers,
    checks,
    status,
    cost,
    optimalityScore,
  };
}

export function calculateCatalog(
  catalog: BigBagCatalogItem[],
  input: CalculationInput,
  fillers: FillerCatalogItem[] = DEFAULT_FILLERS
): CalculationResult[] {
  const filler =
    fillers.find((f) => f.id === input.fillerId) ?? fillers[0];

  const items =
    input.selectionMode === 'single' && input.selectedBagId
      ? catalog.filter((b) => b.id === input.selectedBagId)
      : catalog;

  const results = items.map((bag) => calculateVariant(bag, input, filler));
  return results.sort((x, y) => x.optimalityScore - y.optimalityScore);
}

export function createDefaultInput(): CalculationInput {
  return {
    mode: 'trapezoid',
    baseWidthM: 6.0,
    minHeightM: 3.0,
    avgPerimeterM: 60.0,
    targetVolumeM3: null,
    crestRule: '1x',
    objectContour: {
      shape: 'cylinder',
      lengthM: 15.0,
      widthM: 10.0,
      polygonSides: 6,
      offsetM: 2.0,
      ratio: '2:1',
    },
    selectionMode: 'all',
    selectedBagId: 'riaplast_fort_95_95_150',
    fillHeightRatio: 0.85,
    heightMode: 'max_fill',
    orientation: 'vertical',
    lossFactor: 1.0,
    baseTierRounding: 'round',
    fillerId: 'quartz_sand',
    fillerDensityKgM3: 1550,
    hazardZone: 'normal',
    includeTarp: true,
    costs: {
      bagPriceRub: 350,
      fillerPriceRubM3: 650,
      tarpPriceRubM2: 120,
    },
  };
}
