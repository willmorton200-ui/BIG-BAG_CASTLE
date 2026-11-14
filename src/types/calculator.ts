export type CheckStatus = 'VALID' | 'WARNING' | 'INVALID';
export type CheckLevel = 'INVALID' | 'WARNING' | 'INFO';

export interface BigBagDimensionsCm {
  /** Длина b, см (вдоль стены при стандартной укладке) */
  length: number;
  /** Ширина a, см (поперёк стены при стандартной укладке) */
  width: number;
  /** Номинальная высота h_ном, см */
  height: number;
}

export interface BigBagCatalogItem {
  id: string;
  manufacturer: string;
  series?: string;
  dimensionsCm: BigBagDimensionsCm;
  nominalVolumeM3: number;
  swlKg: number | null;
  fabricDensityGsm: number | null;
  loopsCount: number | number[] | null;
  emptyWeightKg: number | null;
  maxStackTiers: number;
  notes?: string;
  isParametric?: boolean;
  isCustom?: boolean;
}

export interface FillerCatalogItem {
  id: string;
  name: string;
  shortName: string;
  densityRangeKgM3: [number, number, number]; // [min, max, default]
  minBarrierThicknessM: number | null;
  bagRecommendation: string;
  ballisticNotes: string;
  requiresTwoLayerOrLiner: boolean;
}

export type InputMode = 'trapezoid' | 'object';
export type ObjectShape = 'rectangle' | 'cylinder' | 'polygon';
export type WallRatio = '3:1' | '2:1';
export type CrestRule = '1x' | '2x' | 'auto';
export type SelectionMode = 'all' | 'single' | 'custom';
export type HeightMode = 'max_fill' | 'fit_h_min';
export type BagOrientation = 'vertical' | 'flat';
export type HazardZone = 'normal' | 'explosive';
export type BaseTierRounding = 'round' | 'floor';

export interface ObjectContourParams {
  shape: ObjectShape;
  /** Длина (прямоугольник) или диаметр (цилиндр) или сторона (n-угольник), м */
  lengthM: number;
  /** Ширина (прямоугольник), м */
  widthM: number;
  /** Число сторон для правильного n-угольника */
  polygonSides: number;
  /** Отступ безопасности d_отст от объекта до внутреннего края стены, м (>= 1.5 м) */
  offsetM: number;
  /** Пропорция трапеции W:H */
  ratio: WallRatio;
}

export interface CostParams {
  bagPriceRub: number;
  fillerPriceRubM3: number;
  tarpPriceRubM2: number;
}

export interface CalculationInput {
  mode: InputMode;
  // Режим А (Трапеция)
  baseWidthM: number; // W_осн, м
  minHeightM: number; // H_min, м
  avgPerimeterM: number; // P_ср, м
  targetVolumeM3: number | null; // V_укр, м³ (если null — считается по трапеции)
  crestRule: CrestRule;
  // Режим Б (Контур объекта)
  objectContour: ObjectContourParams;
  // Параметры укладки и засыпки
  selectionMode: SelectionMode;
  selectedBagId: string | null;
  fillHeightRatio: number; // k_h, 0.50..0.85
  heightMode: HeightMode;
  orientation: BagOrientation;
  lossFactor: number; // k_пот, 1.00..1.05
  baseTierRounding: BaseTierRounding;
  // Наполнитель и среда
  fillerId: string;
  fillerDensityKgM3: number; // кг/м³
  hazardZone: HazardZone;
  /** Включение/отключение защитного УФ-полога (для временных сооружений можно отключить) */
  includeTarp: boolean;
  // Сметный блок
  costs: CostParams;
}

export interface EngineeringCheck {
  code:
    | 'CHK_STACK_LIMIT'
    | 'CHK_STACK_HIGH'
    | 'CHK_UNDERFILLED_BAG'
    | 'CHK_TRAP_RATIO'
    | 'CHK_CONSTRAINED_MODE'
    | 'CHK_SINGLE_BAG_RATIO'
    | 'CHK_CREST_BALLISTIC'
    | 'CHK_SWL_BOTTLENECK'
    | 'CHK_MISSING_SWL'
    | 'CHK_HAZARD_ZONE';
  level: CheckLevel;
  message: string;
}

export interface CostBreakdown {
  bagsCostRub: number;
  fillerCostRub: number;
  tarpCostRub: number;
  totalCostRub: number;
}

export interface CalculationResult {
  bag: BigBagCatalogItem;
  /** Эффективные габариты одного места с учётом ориентации (м): a - поперёк стены, b - вдоль стены, hNom - высота */
  effectiveDimsM: {
    a: number;
    b: number;
    hNom: number;
  };
  /** Принятая БРН (кг), если в справочнике null — помечается флагом missingSwl */
  effectiveSwlKg: number | null;
  missingSwl: boolean;
  vNominalM3: number;
  v85M3: number;
  vSwlM3: number | null;
  /** Допустимый рабочий объём одного МКР (до подгонки высоты), м³ */
  vAllowedBaseM3: number;
  /** Итоговый рабочий объём одного МКР (с учётом режима подгонки), м³ */
  vAllowedM3: number;
  /** Фактическая высота одного яруса (с учётом режима подгонки), м */
  hFactM: number;
  /** Неподогнанная максимальная высота яруса, м */
  hFactUnadjustedM: number;
  /** Масса одного наполненного МКР (без учёта пустой тары), кг */
  mBagKg: number;
  /** Использование паспортной БРН, % */
  swlUsagePct: number | null;
  /** Число ярусов по высоте n_z */
  tiersCount: number;
  /** Итоговая фактическая высота стены H_факт, м */
  hTotalFactM: number;
  /** Отклонение от H_min, м */
  heightDeltaM: number;
  /** Число рядов на гребне n_верх */
  crestRowsCount: number;
  /** Ширина верхнего среза W_верх, м */
  crestWidthM: number;
  /** Массив числа рядов по ярусам снизу вверх [m_1, ..., m_nz] */
  rowsPerTier: number[];
  /** Расчётная ширина трапеции на каждом ярусе, м */
  tierWidthsM: number[];
  /** Сумма рядов в сечении M_сеч */
  sectionBagsCount: number;
  /** Расход МКР на 1 пог. м стены */
  bagsPerMeter: number;
  /** Площадь поперечного сечения трапеции S_трап, м² */
  trapezoidAreaM2: number;
  /** Геометрический объём трапеции V_укр, м³ */
  geometricVolumeM3: number;
  /** Количество МКР по объёмному методу N_объём */
  nBagsVolume: number;
  /** Количество МКР по дискретному (монтажному) методу N_дискр */
  nBagsDiscrete: number;
  /** Расхождение между дискретным и объёмным методом, % */
  methodDiffPct: number;
  /** Суммарный объём наполнителя с учётом потерь V_нап, м³ */
  totalFillerM3: number;
  /** Суммарная масса наполнителя M_нап, т */
  totalFillerTons: number;
  /** Оценочная масса пустой тары, т */
  totalEmptyBagsTons: number;
  /** Полная масса сооружения (наполнитель + тара), т */
  totalGrossTons: number;
  /** Объём выемки грунта под связующую траншею глубиной 0.15 м, м³ */
  trenchVolumeM3: number;
  /** Площадь защитного УФ-полога, м² */
  tarpAreaM2: number;
  /** Фактическое отношение W_осн / H_факт */
  actualRatioWH: number;
  /** Угол откоса стены к горизонту, градусы */
  slopeAngleDeg: number;
  /** Максимально допустимое число ярусов по объёму МКР */
  allowedMaxTiers: number;
  checks: EngineeringCheck[];
  status: CheckStatus;
  cost: CostBreakdown;
  /** Оптимальность (меньше = лучше) для сортировки по умолчанию */
  optimalityScore: number;
}
