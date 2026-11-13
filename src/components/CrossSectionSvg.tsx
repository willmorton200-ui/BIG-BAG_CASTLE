import React, { useState } from 'react';
import { Layers, Maximize2 } from 'lucide-react';
import { resolveContourGeometry } from '../engine/calculator';
import {
  CalculationInput,
  CalculationResult,
  FillerCatalogItem,
} from '../types/calculator';

interface CrossSectionSvgProps {
  result: CalculationResult;
  input: CalculationInput;
  filler: FillerCatalogItem;
}

const FILLER_COLORS: Record<string, { fill: string; stroke: string }> = {
  quartz_sand: { fill: '#f59e0b', stroke: '#b45309' },
  mineral_soil: { fill: '#a16207', stroke: '#713f12' },
  granite_crushed_stone: { fill: '#64748b', stroke: '#334155' },
  expanded_clay: { fill: '#c2410c', stroke: '#7c2d12' },
};

export const CrossSectionSvg: React.FC<CrossSectionSvgProps> = ({
  result,
  input,
  filler,
}) => {
  const [viewTab, setViewTab] = useState<'section' | 'bond'>('section');

  const geom = resolveContourGeometry(input);
  const { baseWidthM, minHeightM } = geom;
  const {
    effectiveDimsM,
    hFactM,
    hTotalFactM,
    tiersCount,
    rowsPerTier,
    crestWidthM,
    trenchVolumeM3,
    slopeAngleDeg,
  } = result;

  const bagWidthM = effectiveDimsM.a;
  const bagLengthM = effectiveDimsM.b;
  const fillerStyle = FILLER_COLORS[filler.id] ?? FILLER_COLORS.quartz_sand;

  // Размеры SVG canvas
  const svgW = 760;
  const svgH = 380;
  const padLeft = 80;
  const padRight = 100;
  const padTop = 44;
  const padBottom = 68;

  const maxTierWidthM = Math.max(
    baseWidthM,
    ...rowsPerTier.map((cnt) => cnt * bagWidthM)
  );
  const totalDrawWidthM = maxTierWidthM + 1.8; // + отмостка по бокам
  const totalDrawHeightM = Math.max(minHeightM, hTotalFactM) + 0.55;

  const scaleX = (svgW - padLeft - padRight) / totalDrawWidthM;
  const scaleY = (svgH - padTop - padBottom) / totalDrawHeightM;
  const scale = Math.min(scaleX, scaleY);

  const centerX = svgW / 2 - 10;
  const groundY = svgH - padBottom;
  const trenchDepthM = trenchVolumeM3 > 0 ? 0.15 : 0;
  const trenchDepthPx = trenchDepthM * scale;

  const toPx = (meters: number) => meters * scale;

  // Контур проектной трапеции (пунктир)
  const trapLeftBotX = centerX - toPx(baseWidthM / 2);
  const trapRightBotX = centerX + toPx(baseWidthM / 2);
  const trapLeftTopX = centerX - toPx(crestWidthM / 2);
  const trapRightTopX = centerX + toPx(crestWidthM / 2);
  const trapTopY = groundY - toPx(minHeightM);

  // Геометрия физической касательной трапеции:
  // Нижний ярус — опорная подошва. Касательная строится от верхнего уступа 1-го яруса (высота hFactM)
  // до верхнего края верхнего яруса (высота hTotalFactM).
  const tier1HalfW = ((rowsPerTier[0] ?? 1) * bagWidthM) / 2;
  const topTierHalfW = ((rowsPerTier[rowsPerTier.length - 1] ?? 1) * bagWidthM) / 2;
  const tier1TopY = groundY - toPx(hFactM);

  const tangLeftTier1X = centerX - toPx(tier1HalfW);
  const tangRightTier1X = centerX + toPx(tier1HalfW);
  const tangLeftTopX = centerX - toPx(topTierHalfW);
  const tangRightTopX = centerX + toPx(topTierHalfW);

  // Координаты УФ-полога по фактическому штабелю
  const botStackHalfW = ((rowsPerTier[0] ?? 1) * bagWidthM) / 2;
  const topStackHalfW =
    ((rowsPerTier[rowsPerTier.length - 1] ?? 1) * bagWidthM) / 2;
  const factTopY = groundY - toPx(hTotalFactM);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      {/* Переключатель вкладок только для экранного просмотра */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-2">
          <Maximize2 className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Векторная схема конструкции (масштабная)
          </h3>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewTab('section')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              viewTab === 'section'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Поперечное сечение
          </button>
          <button
            type="button"
            onClick={() => setViewTab('bond')}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
              viewTab === 'bond'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Перевязка 1/2 и план
          </button>
        </div>
      </div>

      {/* 1. Блок поперечного сечения (на экране если viewTab === 'section', при печати ВСЕГДА) */}
      <div className={viewTab === 'section' ? 'block' : 'hidden print:block'}>
        <div className="hidden print:block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
          1. Поперечное сечение защитной стены (масштабный профиль с касательной откоса)
        </div>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="h-auto w-full min-w-[540px] rounded-lg border border-slate-100 bg-slate-50/60"
          >
            <defs>
              <pattern
                id="soilHatch"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeOpacity="0.35"
                />
              </pattern>
              <pattern
                id="gravelPattern"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="3" cy="3" r="1.3" fill="#64748b" fillOpacity="0.45" />
                <circle cx="8" cy="7" r="1.1" fill="#475569" fillOpacity="0.45" />
              </pattern>
            </defs>

            {/* Грунт */}
            <rect
              x={16}
              y={groundY}
              width={svgW - 32}
              height={svgH - groundY - 8}
              fill="url(#soilHatch)"
            />
            <line
              x1={16}
              y1={groundY}
              x2={svgW - 16}
              y2={groundY}
              stroke="#475569"
              strokeWidth={1.5}
            />

            {/* Щебёночная дренажная отмостка по бокам */}
            <rect
              x={trapLeftBotX - toPx(0.7)}
              y={groundY - 5}
              width={toPx(0.7)}
              height={5}
              fill="url(#gravelPattern)"
              stroke="#64748b"
              strokeWidth={0.7}
            />
            <rect
              x={trapRightBotX}
              y={groundY - 5}
              width={toPx(0.7)}
              height={5}
              fill="url(#gravelPattern)"
              stroke="#64748b"
              strokeWidth={0.7}
            />

            {/* Связующая (анкерная) траншея 15 см */}
            {trenchDepthM > 0 && (
              <g>
                <rect
                  x={trapLeftBotX}
                  y={groundY}
                  width={toPx(baseWidthM)}
                  height={Math.max(6, trenchDepthPx)}
                  fill="#fef3c7"
                  stroke="#d97706"
                  strokeWidth={1}
                  strokeDasharray="3 2"
                />
                <text
                  x={centerX}
                  y={groundY + Math.max(6, trenchDepthPx) + 12}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#92400e"
                  fontWeight="600"
                >
                  Связующая траншея 10–15 см (уплотнённое основание по СП 22.13330)
                </text>
              </g>
            )}

            {/* Ярусы МКР снизу вверх */}
            {rowsPerTier.map((rowCount, tierIdx) => {
              const tierBottomY = groundY - tierIdx * toPx(hFactM);
              const tierHeightPx = toPx(hFactM);
              const tierTopY = tierBottomY - tierHeightPx;
              const bagWpx = toPx(bagWidthM);
              const rowStartX = centerX - (rowCount * bagWpx) / 2;
              const isOddTier = tierIdx % 2 === 1;

              return (
                <g key={tierIdx}>
                  {Array.from({ length: rowCount }).map((_, bagIdx) => {
                    const bx = rowStartX + bagIdx * bagWpx;

                    return (
                      <g key={bagIdx}>
                        {/* Корпус наполненного МКР в ярусе (уплотнённое ядро засыпки h_факт) */}
                        <rect
                          x={bx + 0.8}
                          y={tierTopY + 0.5}
                          width={Math.max(2, bagWpx - 1.6)}
                          height={Math.max(2, tierHeightPx - 1)}
                          rx={3}
                          fill={fillerStyle.fill}
                          fillOpacity={isOddTier ? 0.38 : 0.48}
                          stroke="#334155"
                          strokeWidth={1.2}
                        />
                        {/* Текстура сыпучего наполнителя */}
                        <rect
                          x={bx + 1.5}
                          y={tierTopY + 1.2}
                          width={Math.max(1, bagWpx - 3)}
                          height={Math.max(2, tierHeightPx - 2.4)}
                          rx={2}
                          fill="url(#gravelPattern)"
                          fillOpacity={0.08}
                        />
                        {/* Верхняя площадка / стянутая горловина под вышележащий ярус */}
                        <line
                          x1={bx + bagWpx * 0.2}
                          y1={tierTopY + 2.5}
                          x2={bx + bagWpx * 0.8}
                          y2={tierTopY + 2.5}
                          stroke="#334155"
                          strokeWidth={1.2}
                        />
                        {/* Узел / завязка горловины по центру */}
                        <circle
                          cx={bx + bagWpx / 2}
                          cy={tierTopY + 2.5}
                          r={1.8}
                          fill="#475569"
                        />
                      </g>
                    );
                  })}
                  {/* Подпись яруса */}
                  <text
                    x={rowStartX - 8}
                    y={tierTopY + tierHeightPx / 2 + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#475569"
                    fontFamily="monospace"
                  >
                    Я{tierIdx + 1}: {rowCount}
                  </text>
                </g>
              );
            })}

            {/* Проектный контур трапеции (пунктир) */}
            <polygon
              points={`${trapLeftBotX},${groundY} ${trapLeftTopX},${trapTopY} ${trapRightTopX},${trapTopY} ${trapRightBotX},${groundY}`}
              fill="none"
              stroke="#2563eb"
              strokeWidth={1.4}
              strokeDasharray="6 4"
            />

            {/* Физическая касательная откоса от верха 1-го яруса (опорной подошвы) до верха верхнего яруса */}
            {tiersCount > 1 && (
              <g>
                {/* Касательная левого откоса */}
                <line
                  x1={tangLeftTier1X}
                  y1={tier1TopY}
                  x2={tangLeftTopX}
                  y2={factTopY}
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
                {/* Касательная правого откоса */}
                <line
                  x1={tangRightTier1X}
                  y1={tier1TopY}
                  x2={tangRightTopX}
                  y2={factTopY}
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
                {/* Точки касания на уступах 1-го яруса */}
                <circle cx={tangLeftTier1X} cy={tier1TopY} r={3} fill="#dc2626" />
                <circle cx={tangRightTier1X} cy={tier1TopY} r={3} fill="#dc2626" />
                {/* Точки касания на верхнем гребне */}
                <circle cx={tangLeftTopX} cy={factTopY} r={3} fill="#dc2626" />
                <circle cx={tangRightTopX} cy={factTopY} r={3} fill="#dc2626" />
              </g>
            )}

            {/* УФ-полог поверх фактического штабеля */}
            {input.includeTarp && (
              <polyline
                points={`${centerX - toPx(botStackHalfW) - 3},${groundY} ${
                  centerX - toPx(topStackHalfW) - 2
                },${factTopY - 3} ${centerX + toPx(topStackHalfW) + 2},${
                  factTopY - 3
                } ${centerX + toPx(botStackHalfW) + 3},${groundY}`}
                fill="none"
                stroke="#0284c7"
                strokeWidth={2.2}
              />
            )}

            {/* Размерная линия H_min (синий пунктир слева) */}
            <g>
              <line
                x1={trapLeftBotX - 28}
                y1={groundY}
                x2={trapLeftBotX - 28}
                y2={trapTopY}
                stroke="#2563eb"
                strokeWidth={1.2}
              />
              <line
                x1={trapLeftBotX - 33}
                y1={trapTopY}
                x2={trapLeftTopX}
                y2={trapTopY}
                stroke="#2563eb"
                strokeWidth={0.7}
                strokeDasharray="2 2"
              />
              <text
                x={trapLeftBotX - 32}
                y={(groundY + trapTopY) / 2}
                textAnchor="end"
                fontSize="10"
                fill="#1d4ed8"
                fontWeight="700"
                fontFamily="monospace"
              >
                Hmin={minHeightM.toFixed(2)}м
              </text>
            </g>

            {/* Размерная линия H_факт (справа) */}
            <g>
              <line
                x1={trapRightBotX + 28}
                y1={groundY}
                x2={trapRightBotX + 28}
                y2={factTopY}
                stroke="#0f172a"
                strokeWidth={1.3}
              />
              <line
                x1={centerX + toPx(topStackHalfW)}
                y1={factTopY}
                x2={trapRightBotX + 34}
                y2={factTopY}
                stroke="#0f172a"
                strokeWidth={0.8}
                strokeDasharray="2 2"
              />
              <line
                x1={trapRightBotX + 23}
                y1={groundY}
                x2={trapRightBotX + 33}
                y2={groundY}
                stroke="#0f172a"
                strokeWidth={1.2}
              />
              <line
                x1={trapRightBotX + 23}
                y1={factTopY}
                x2={trapRightBotX + 33}
                y2={factTopY}
                stroke="#0f172a"
                strokeWidth={1.2}
              />
              <text
                x={trapRightBotX + 36}
                y={(groundY + factTopY) / 2}
                textAnchor="start"
                fontSize="10.5"
                fill="#0f172a"
                fontWeight="700"
                fontFamily="monospace"
              >
                Hфакт={hTotalFactM.toFixed(2)}м
              </text>
              <text
                x={trapRightBotX + 36}
                y={(groundY + factTopY) / 2 + 13}
                textAnchor="start"
                fontSize="9.5"
                fill="#475569"
                fontFamily="monospace"
              >
                ({tiersCount}×{hFactM.toFixed(2)}м)
              </text>
            </g>

            {/* Размерная линия W_верх */}
            <g>
              <line
                x1={centerX - toPx(topStackHalfW)}
                y1={factTopY - 16}
                x2={centerX + toPx(topStackHalfW)}
                y2={factTopY - 16}
                stroke="#0f172a"
                strokeWidth={1.2}
              />
              <text
                x={centerX}
                y={factTopY - 21}
                textAnchor="middle"
                fontSize="10.5"
                fill="#0f172a"
                fontWeight="700"
                fontFamily="monospace"
              >
                Wверх = {crestWidthM.toFixed(2)} м ({result.crestRowsCount} ряд.)
              </text>
            </g>

            {/* Размерная линия W_осн внизу */}
            <g>
              <line
                x1={trapLeftBotX}
                y1={svgH - 22}
                x2={trapRightBotX}
                y2={svgH - 22}
                stroke="#0f172a"
                strokeWidth={1.3}
              />
              <line
                x1={trapLeftBotX}
                y1={groundY}
                x2={trapLeftBotX}
                y2={svgH - 18}
                stroke="#64748b"
                strokeWidth={0.8}
                strokeDasharray="2 2"
              />
              <line
                x1={trapRightBotX}
                y1={groundY}
                x2={trapRightBotX}
                y2={svgH - 18}
                stroke="#64748b"
                strokeWidth={0.8}
                strokeDasharray="2 2"
              />
              <text
                x={centerX}
                y={svgH - 8}
                textAnchor="middle"
                fontSize="11"
                fill="#0f172a"
                fontWeight="700"
                fontFamily="monospace"
              >
                Wосн = {baseWidthM.toFixed(2)} м | Уклон ступеней α = {slopeAngleDeg.toFixed(1)}° (от Я1 к гребню) | W:H ={' '}
                {result.actualRatioWH.toFixed(2)}:1
              </text>
            </g>
          </svg>

          {/* Легенда чертежа */}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-4 border border-dashed border-blue-600" />
              Проектный контур трапеции
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 bg-red-600" />
              Касательная откоса (от верха Я1 до гребня, α = {slopeAngleDeg.toFixed(1)}°)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-4 rounded-sm border"
                style={{
                  backgroundColor: fillerStyle.fill,
                  borderColor: fillerStyle.stroke,
                  opacity: 0.75,
                }}
              />
              МКР с наполнителем ({filler.shortName}, шаг яруса h<sub>факт</sub> = {hFactM.toFixed(2)} м)
            </span>
            {input.includeTarp ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 bg-sky-600" />
                УФ-полог (водонепроницаемый)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <span className="inline-block h-0.5 w-4 bg-slate-300 stroke-dash" />
                УФ-полог: отключён
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-4 border border-dashed border-amber-600 bg-amber-100" />
              Связующая траншея 15 см
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500">
              (угол откоса α измерен по линии опирания ступеней: от верха 1-го яруса до гребня)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Блок продольной развёртки и схемы в плане (на экране если viewTab === 'bond', при печати ВСЕГДА) */}
      <div className={viewTab === 'bond' ? 'block' : 'hidden print:block print:mt-4 print-break-inside-avoid'}>
        <div className="hidden print:block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
          2. Продольная развёртка стены (перевязка швов на 1/2 длины) и схема в плане
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {/* Перевязка швов на 1/2 длины (продольная развёртка стены) */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 flex flex-col justify-between">
            <div className="mb-2 text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>Продольная развёртка: перевязка на 1/2 длины (п. 9.5.3)</span>
              <span className="text-[11px] font-normal text-slate-500 font-mono">
                {tiersCount} ярус(а) | b = {bagLengthM.toFixed(2)} м (сдвиг { (bagLengthM / 2).toFixed(2) } м)
              </span>
            </div>
            
            {/* Динамический расчёт viewBox под фактическое число ярусов tiersCount */}
            {(() => {
              const numTiers = Math.max(1, tiersCount);
              const svgTotalW = 440;
              const wallW = 340;
              const blockW = wallW / 4; // 85 px
              const halfBlockW = blockW / 2; // 42.5 px
              const startX = (svgTotalW - wallW) / 2; // 50 px (строго по центру)

              const blockH = numTiers === 1 ? 46 : numTiers === 2 ? 40 : numTiers === 3 ? 34 : 28;
              const tierGap = 3;
              const totalBlocksH = numTiers * blockH + (numTiers - 1) * tierGap;
              const padTopSvg = 24;
              const padBotSvg = 32;
              const svgTotalH = totalBlocksH + padTopSvg + padBotSvg;
              const groundLineY = svgTotalH - padBotSvg + 2;

              return (
                <div className="flex-1 flex items-center justify-center py-1">
                  <svg
                    viewBox={`0 0 ${svgTotalW} ${svgTotalH}`}
                    className="w-full max-w-[440px] rounded-lg bg-white border border-slate-200 shadow-2xs"
                  >
                    {/* Линия основания / подготовленного грунта */}
                    <line
                      x1={startX - 20}
                      y1={groundLineY}
                      x2={startX + wallW + 20}
                      y2={groundLineY}
                      stroke="#475569"
                      strokeWidth={1.6}
                    />

                    {/* Отрисовка всех tiersCount ярусов снизу вверх */}
                    {Array.from({ length: numTiers }).map((_, tierIdx) => {
                      // tierIdx = 0 (Я1 - нижний ярус), tierIdx = numTiers - 1 (верхний)
                      const tierY = groundLineY - 2 - (tierIdx + 1) * blockH - tierIdx * tierGap;
                      const isShifted = tierIdx % 2 === 1; // нечётный ярус смещается на 1/2 длины блока

                      return (
                        <g key={tierIdx}>
                          {/* Маркер яруса слева: Я1, Я2, ... */}
                          <text
                            x={startX - 10}
                            y={tierY + blockH / 2 + 3.5}
                            textAnchor="end"
                            fontSize="10"
                            fill="#475569"
                            fontWeight="700"
                            fontFamily="monospace"
                          >
                            Я{tierIdx + 1}
                          </text>

                          {!isShifted ? (
                            // Чётный ярус (Я1, Я3): 4 целых блока
                            [0, 1, 2, 3].map((idx) => {
                              const bx = startX + idx * blockW;
                              return (
                                <g key={idx}>
                                  <rect
                                    x={bx + 1}
                                    y={tierY}
                                    width={blockW - 2}
                                    height={blockH}
                                    rx={2.5}
                                    fill={fillerStyle.fill}
                                    fillOpacity={0.52}
                                    stroke="#334155"
                                    strokeWidth={1.2}
                                  />
                                  <rect
                                    x={bx + 2}
                                    y={tierY + 1}
                                    width={blockW - 4}
                                    height={blockH - 2}
                                    rx={1.5}
                                    fill="url(#gravelPattern)"
                                    fillOpacity={0.07}
                                  />
                                  <text
                                    x={bx + blockW / 2}
                                    y={tierY + blockH / 2 + 3.5}
                                    textAnchor="middle"
                                    fontSize={blockH < 30 ? '9' : '10'}
                                    fill="#0f172a"
                                    fontWeight="600"
                                    fontFamily="monospace"
                                  >
                                    b={bagLengthM.toFixed(2)}м
                                  </text>
                                </g>
                              );
                            })
                          ) : (
                            // Нечётный ярус (Я2, Я4): полублок + 3 целых блока + полублок (перевязка 1/2)
                            <g>
                              {/* Левый полублок */}
                              <rect
                                x={startX + 1}
                                y={tierY}
                                width={halfBlockW - 2}
                                height={blockH}
                                rx={2.5}
                                fill={fillerStyle.fill}
                                fillOpacity={0.44}
                                stroke="#334155"
                                strokeWidth={1.2}
                              />
                              <text
                                x={startX + halfBlockW / 2}
                                y={tierY + blockH / 2 + 3}
                                textAnchor="middle"
                                fontSize="8.5"
                                fill="#475569"
                                fontWeight="600"
                                fontFamily="monospace"
                              >
                                b/2
                              </text>

                              {/* 3 целых промежуточных блока */}
                              {[0, 1, 2].map((idx) => {
                                const bx = startX + halfBlockW + idx * blockW;
                                return (
                                  <g key={idx}>
                                    <rect
                                      x={bx + 1}
                                      y={tierY}
                                      width={blockW - 2}
                                      height={blockH}
                                      rx={2.5}
                                      fill={fillerStyle.fill}
                                      fillOpacity={0.44}
                                      stroke="#334155"
                                      strokeWidth={1.2}
                                    />
                                    <rect
                                      x={bx + 2}
                                      y={tierY + 1}
                                      width={blockW - 4}
                                      height={blockH - 2}
                                      rx={1.5}
                                      fill="url(#gravelPattern)"
                                      fillOpacity={0.07}
                                    />
                                    <text
                                      x={bx + blockW / 2}
                                      y={tierY + blockH / 2 + 3.5}
                                      textAnchor="middle"
                                      fontSize={blockH < 30 ? '9' : '10'}
                                      fill="#0f172a"
                                      fontWeight="600"
                                      fontFamily="monospace"
                                    >
                                      b={bagLengthM.toFixed(2)}м
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Правый полублок */}
                              <rect
                                x={startX + halfBlockW + 3 * blockW + 1}
                                y={tierY}
                                width={halfBlockW - 2}
                                height={blockH}
                                rx={2.5}
                                fill={fillerStyle.fill}
                                fillOpacity={0.44}
                                stroke="#334155"
                                strokeWidth={1.2}
                              />
                              <text
                                x={startX + halfBlockW + 3 * blockW + halfBlockW / 2}
                                y={tierY + blockH / 2 + 3}
                                textAnchor="middle"
                                fontSize="8.5"
                                fill="#475569"
                                fontWeight="600"
                                fontFamily="monospace"
                              >
                                b/2
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Размерная линия перевязки швов b/2 внизу под стеной */}
                    {numTiers >= 2 && (
                      <g>
                        <line
                          x1={startX + blockW}
                          y1={groundLineY + 8}
                          x2={startX + blockW + halfBlockW}
                          y2={groundLineY + 8}
                          stroke="#2563eb"
                          strokeWidth={1.2}
                        />
                        <line
                          x1={startX + blockW}
                          y1={groundLineY + 4}
                          x2={startX + blockW}
                          y2={groundLineY + 12}
                          stroke="#2563eb"
                          strokeWidth={1.2}
                        />
                        <line
                          x1={startX + blockW + halfBlockW}
                          y1={groundLineY + 4}
                          x2={startX + blockW + halfBlockW}
                          y2={groundLineY + 12}
                          stroke="#2563eb"
                          strokeWidth={1.2}
                        />
                        <text
                          x={startX + blockW + halfBlockW / 2}
                          y={groundLineY + 20}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#1d4ed8"
                          fontWeight="700"
                          fontFamily="monospace"
                        >
                          сдвиг b/2 = {(bagLengthM / 2).toFixed(2)} м
                        </text>
                      </g>
                    )}
                  </svg>
                </div>
              );
            })()}

            <div className="mt-2 text-center text-xs text-slate-600 bg-white/70 py-1 px-2 rounded border border-slate-200">
              По высоте: <strong>{tiersCount} {tiersCount === 1 ? 'ярус' : tiersCount < 5 ? 'яруса' : 'ярусов'}</strong> | Смещение швов на <strong>b/2 = {(bagLengthM / 2).toFixed(2)} м</strong> (без сквозных швов)
            </div>
          </div>

          {/* Схема защитного периметра в плане */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
            <div className="mb-1.5 text-xs font-semibold text-slate-700">
              Схема контура защиты (P<sub>ср</sub> = {geom.avgPerimeterM.toFixed(1)} м)
            </div>
            <svg viewBox="0 0 360 170" className="w-full rounded bg-white">
              {input.mode === 'object' &&
              input.objectContour.shape === 'cylinder' ? (
                <g>
                  <circle
                    cx={180}
                    cy={82}
                    r={68}
                    fill="#fef3c7"
                    fillOpacity={0.65}
                    stroke="#d97706"
                    strokeWidth={14}
                  />
                  <circle
                    cx={180}
                    cy={82}
                    r={68}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={1.2}
                    strokeDasharray="4 3"
                  />
                  <circle
                    cx={180}
                    cy={82}
                    r={38}
                    fill="#e2e8f0"
                    stroke="#475569"
                    strokeWidth={1.5}
                  />
                  <text
                    x={180}
                    y={85}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#0f172a"
                  >
                    Объект D={input.objectContour.lengthM}м
                  </text>
                </g>
              ) : (
                <g>
                  <rect
                    x={75}
                    y={24}
                    width={210}
                    height={116}
                    rx={6}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth={14}
                    strokeOpacity={0.55}
                  />
                  <rect
                    x={75}
                    y={24}
                    width={210}
                    height={116}
                    rx={6}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={1.2}
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={118}
                    y={52}
                    width={124}
                    height={60}
                    rx={3}
                    fill="#e2e8f0"
                    stroke="#475569"
                    strokeWidth={1.5}
                  />
                  <text
                    x={180}
                    y={86}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#0f172a"
                  >
                    Защищаемый объект
                  </text>
                </g>
              )}
              <text
                x={180}
                y={162}
                textAnchor="middle"
                fontSize="10"
                fill="#475569"
              >
                Отступ безопасности d ≥ 1,5 м; ширина подошвы Wосн = {baseWidthM.toFixed(2)} м
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
