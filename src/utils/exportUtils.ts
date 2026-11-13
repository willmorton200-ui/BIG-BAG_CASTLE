import {
  BigBagCatalogItem,
  CalculationInput,
  CalculationResult,
  FillerCatalogItem,
} from '../types/calculator';

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '______________';
  const str = String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportMatrixToCsv(
  results: CalculationResult[],
  filler: FillerCatalogItem,
  input: CalculationInput
): void {
  const headers = [
    'Производитель',
    'Типоразмер (ДxШxВ см)',
    'Номинальный объём, м3',
    'БРН (SWL), кг',
    'Плотность ткани, г/м2',
    'V_доп (1 МКР), м3',
    'h_факт яруса, м',
    'm_МКР, кг',
    'Ярусов n_z',
    'H_факт, м',
    'Порядовка (снизу вверх)',
    'N_объём, шт',
    'N_дискр, шт',
    'Расхождение, %',
    `Объём (${filler.shortName}), м3`,
    `Масса (${filler.shortName}), т`,
    'Траншея (0.15 м), м3',
    'Полог УФ, м2',
    'Соотношение W:H',
    'Статус',
    'Бюджет итого, руб',
    'Примечания / проверки',
  ];

  const rows = results.map((r) => [
    r.bag.manufacturer,
    `${r.bag.dimensionsCm.length}x${r.bag.dimensionsCm.width}x${r.bag.dimensionsCm.height}`,
    r.vNominalM3.toFixed(3),
    r.effectiveSwlKg ?? '______________',
    r.bag.fabricDensityGsm ?? '______________',
    r.vAllowedM3.toFixed(3),
    r.hFactM.toFixed(3),
    r.mBagKg.toFixed(1),
    r.tiersCount,
    r.hTotalFactM.toFixed(2),
    r.rowsPerTier.join('-'),
    r.nBagsVolume,
    r.nBagsDiscrete,
    r.methodDiffPct.toFixed(1),
    r.totalFillerM3.toFixed(1),
    r.totalFillerTons.toFixed(1),
    r.trenchVolumeM3.toFixed(1),
    r.tarpAreaM2.toFixed(1),
    `${r.actualRatioWH.toFixed(2)}:1`,
    r.status,
    Math.round(r.cost.totalCostRub),
    r.checks.map((c) => `${c.code}: ${c.message}`).join(' | '),
  ]);

  const metaLine = `BIG-BAG_CASTLE;Режим=${input.mode};Наполнитель=${filler.name} (${input.fillerDensityKgM3} кг/м3);H_min=${input.minHeightM} м`;
  const csvLines = [
    metaLine,
    headers.map(escapeCsvCell).join(';'),
    ...rows.map((row) => row.map(escapeCsvCell).join(';')),
  ];

  // UTF-8 BOM для корректного открытия кириллицы в Excel
  downloadBlob(
    '\uFEFF' + csvLines.join('\r\n'),
    `bigbag_castle_matrix_${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv;charset=utf-8;'
  );
}

export function exportSelectedBillToCsv(
  r: CalculationResult,
  filler: FillerCatalogItem,
  input: CalculationInput
): void {
  const lines: string[][] = [
    ['Позиция спецификации BIG-BAG_CASTLE', 'Значение', 'Ед. изм.', 'Примечание'],
    ['Производитель МКР', r.bag.manufacturer, '-', r.bag.series ?? ''],
    [
      'Типоразмер МКР (ДxШxВ)',
      `${r.bag.dimensionsCm.length}×${r.bag.dimensionsCm.width}×${r.bag.dimensionsCm.height}`,
      'см',
      input.orientation === 'flat' ? 'Укладка плашмя' : 'Стандартная вертикальная укладка',
    ],
    [
      'БРН (SWL)',
      r.effectiveSwlKg !== null ? String(r.effectiveSwlKg) : '______________',
      'кг',
      r.swlUsagePct !== null ? `Загрузка ${r.swlUsagePct.toFixed(1)}%` : 'Требуется уточнение',
    ],
    [
      'Плотность ткани',
      r.bag.fabricDensityGsm !== null ? String(r.bag.fabricDensityGsm) : '______________',
      'г/м²',
      input.hazardZone === 'explosive' ? 'Требуется Тип C (заземление) или Тип D' : 'УФ-стабилизация HALS',
    ],
    ['Рабочий объём 1 МКР (V_доп)', r.vAllowedM3.toFixed(3), 'м³', 'min(V_85, V_SWL)'],
    ['Масса 1 наполненного МКР', r.mBagKg.toFixed(1), 'кг', filler.name],
    ['Число ярусов / высота яруса', `${r.tiersCount} / ${r.hFactM.toFixed(3)}`, 'яр. / м', `Макс. норма ${r.allowedMaxTiers} яр.`],
    ['Фактическая высота стены H_факт', r.hTotalFactM.toFixed(2), 'м', `Отклонение от H_min: ${r.heightDeltaM >= 0 ? '+' : ''}${r.heightDeltaM.toFixed(2)} м`],
    ['Порядовка по ярусам (снизу вверх)', r.rowsPerTier.join('–'), 'рядов', `В сечении ${r.sectionBagsCount} шт.`],
    ['Ширина верхнего среза W_верх', r.crestWidthM.toFixed(2), 'м', `${r.crestRowsCount} ряд(а) на гребне`],
    ['Количество МКР (дискретный метод N_дискр)', String(r.nBagsDiscrete), 'шт.', `Объёмный N_объём = ${r.nBagsVolume} шт.`],
    [`Объём наполнителя (${filler.shortName})`, r.totalFillerM3.toFixed(1), 'м³', `Коэфф. потерь ${input.lossFactor.toFixed(2)}`],
    [`Масса наполнителя (${filler.shortName})`, r.totalFillerTons.toFixed(1), 'т', `С пустой тарой ~${r.totalGrossTons.toFixed(1)} т`],
    ['Связующая траншея (h=0.15 м)', r.trenchVolumeM3.toFixed(1), 'м³', 'Выемка грунта под основание'],
    [
      'Защитный УФ-полог',
      input.includeTarp ? r.tarpAreaM2.toFixed(1) : '0 (Отключен)',
      'м²',
      input.includeTarp ? 'Два откоса + гребень × P_ср' : 'Не включён в смету (временное сооружение)',
    ],
    ['Ориентировочная стоимость МКР', String(Math.round(r.cost.bagsCostRub)), 'руб.', `${input.costs.bagPriceRub} руб./шт.`],
    ['Ориентировочная стоимость наполнителя', String(Math.round(r.cost.fillerCostRub)), 'руб.', `${input.costs.fillerPriceRubM3} руб./м³`],
    ['Ориентировочная стоимость полога', String(Math.round(r.cost.tarpCostRub)), 'руб.', `${input.costs.tarpPriceRubM2} руб./м²`],
    ['ИТОГО ориентировочный бюджет', String(Math.round(r.cost.totalCostRub)), 'руб.', 'Без учёта доставки и СМР'],
  ];

  downloadBlob(
    '\uFEFF' + lines.map((row) => row.map(escapeCsvCell).join(';')).join('\r\n'),
    `bigbag_castle_spec_${r.bag.dimensionsCm.length}x${r.bag.dimensionsCm.width}x${r.bag.dimensionsCm.height}.csv`,
    'text/csv;charset=utf-8;'
  );
}

export interface ProjectSavePayload {
  version: '1.0';
  savedAt: string;
  input: CalculationInput;
  customBags: BigBagCatalogItem[];
  selectedResultId: string | null;
}

export function exportProjectJson(
  input: CalculationInput,
  customBags: BigBagCatalogItem[],
  selectedResultId: string | null
): void {
  const payload: ProjectSavePayload = {
    version: '1.0',
    savedAt: new Date().toISOString(),
    input,
    customBags,
    selectedResultId,
  };
  downloadBlob(
    JSON.stringify(payload, null, 2),
    `bigbag_castle_project_${new Date().toISOString().slice(0, 10)}.json`,
    'application/json;charset=utf-8;'
  );
}
