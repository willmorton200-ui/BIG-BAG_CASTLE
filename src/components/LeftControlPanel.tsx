import React, { useState } from 'react';
import {
  AlertTriangle,
  Box,
  Calculator,
  ChevronDown,
  ChevronUp,
  Plus,
  ShieldAlert,
  Sliders,
  Upload,
} from 'lucide-react';
import { Abbr } from './Abbr';
import { resolveContourGeometry } from '../engine/calculator';
import {
  BigBagCatalogItem,
  CalculationInput,
  FillerCatalogItem,
} from '../types/calculator';

interface LeftControlPanelProps {
  input: CalculationInput;
  fillers: FillerCatalogItem[];
  glintehBag: BigBagCatalogItem | undefined;
  onChangeInput: (updater: (prev: CalculationInput) => CalculationInput) => void;
  onUpdateGlinteh: (heightCm: number, swlKg: number, nominalVolumeM3: number) => void;
  onOpenCustomModal: () => void;
  onImportJson: (file: File) => void;
}

export const LeftControlPanel: React.FC<LeftControlPanelProps> = ({
  input,
  fillers,
  glintehBag,
  onChangeInput,
  onUpdateGlinteh,
  onOpenCustomModal,
  onImportJson,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCosts, setShowCosts] = useState(false);
  const [showGlinteh, setShowGlinteh] = useState(false);

  const selectedFiller = fillers.find((f) => f.id === input.fillerId) ?? fillers[0];
  const resolvedGeom = resolveContourGeometry(input);

  const applyPreset = (presetId: string) => {
    if (presetId === 'tz_reference') {
      onChangeInput((prev) => ({
        ...prev,
        mode: 'trapezoid',
        baseWidthM: 6.0,
        minHeightM: 3.0,
        avgPerimeterM: 60.0,
        targetVolumeM3: null,
        crestRule: '1x',
        fillHeightRatio: 0.85,
        heightMode: 'max_fill',
        orientation: 'vertical',
        lossFactor: 1.0,
        baseTierRounding: 'round',
        fillerId: 'quartz_sand',
        fillerDensityKgM3: 1550,
        hazardZone: 'normal',
      }));
    } else if (presetId === 'rvs_5000') {
      onChangeInput((prev) => ({
        ...prev,
        mode: 'object',
        minHeightM: 3.0,
        crestRule: 'auto',
        heightMode: 'fit_h_min',
        objectContour: {
          shape: 'cylinder',
          lengthM: 22.8,
          widthM: 22.8,
          polygonSides: 8,
          offsetM: 2.5,
          ratio: '2:1',
        },
        fillerId: 'quartz_sand',
        fillerDensityKgM3: 1550,
        hazardZone: 'explosive',
      }));
    } else if (presetId === 'tmn_6300') {
      onChangeInput((prev) => ({
        ...prev,
        mode: 'object',
        minHeightM: 3.0,
        crestRule: 'auto',
        heightMode: 'fit_h_min',
        objectContour: {
          shape: 'rectangle',
          lengthM: 6.0,
          widthM: 4.0,
          polygonSides: 6,
          offsetM: 2.0,
          ratio: '3:1',
        },
        fillerId: 'quartz_sand',
        fillerDensityKgM3: 1550,
        hazardZone: 'normal',
      }));
    } else if (presetId === 'roof_clay') {
      onChangeInput((prev) => ({
        ...prev,
        mode: 'trapezoid',
        baseWidthM: 4.5,
        minHeightM: 2.0,
        avgPerimeterM: 40.0,
        targetVolumeM3: null,
        crestRule: '1x',
        heightMode: 'max_fill',
        fillerId: 'expanded_clay',
        fillerDensityKgM3: 350,
        hazardZone: 'normal',
      }));
    }
  };

  return (
    <aside className="flex flex-col gap-3">
      {/* Пресеты и импорт */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Быстрые сценарии
          </span>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">
            <Upload className="h-3.5 w-3.5" />
            <span>JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportJson(f);
                e.currentTarget.value = '';
              }}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            title="Эталонная трапеция 6х3 м по Таблице 2.3 Технического Задания"
            onClick={() => applyPreset('tz_reference')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
          >
            Эталон 6×3 м (<Abbr text="ТЗ" /> 2.3)
          </button>
          <button
            type="button"
            title="Резервуар Вертикальный Стальной (РВС) на Нефтеперерабатывающем Заводе (взрывоопасная зона 1)"
            onClick={() => applyPreset('rvs_5000')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
          >
            <Abbr text="РВС" />-5000 (<Abbr text="НПЗ" />)
          </button>
          <button
            type="button"
            title="Масляный трансформатор подстанции ТМН-6300 (пропорция W:H = 3:1)"
            onClick={() => applyPreset('tmn_6300')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
          >
            ТМН-6300 (3:1)
          </button>
          <button
            type="button"
            title="Облегчённая защита на перекрытиях и эстакадах керамзитом плотностью 350 кг/м³"
            onClick={() => applyPreset('roof_clay')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
          >
            Эстакада (керамзит)
          </button>
        </div>
      </div>

      {/* Режим ввода геометрии */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Calculator className="h-4 w-4 text-blue-600" />
          <span>1. Геометрия укрепления</span>
        </div>

        <div className="mb-3 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() =>
              onChangeInput((prev) => ({ ...prev, mode: 'trapezoid' }))
            }
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              input.mode === 'trapezoid'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Режим А: Трапеция
          </button>
          <button
            type="button"
            onClick={() => onChangeInput((prev) => ({ ...prev, mode: 'object' }))}
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              input.mode === 'object'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Режим Б: Объект
          </button>
        </div>

        {input.mode === 'trapezoid' ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  Ширина осн. W<sub>осн</sub>, м
                </span>
                <input
                  type="number"
                  min={0.5}
                  max={30}
                  step={0.1}
                  value={input.baseWidthM}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      baseWidthM: Math.max(0.5, Number(e.target.value) || 0.5),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  Высота H<sub>min</sub>, м
                </span>
                <input
                  type="number"
                  min={0.5}
                  max={6.0}
                  step={0.1}
                  value={input.minHeightM}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      minHeightM: Math.min(
                        6.0,
                        Math.max(0.5, Number(e.target.value) || 0.5)
                      ),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  Периметр P<sub>ср</sub>, м
                </span>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  step={1}
                  value={input.avgPerimeterM}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      avgPerimeterM: Math.max(0.5, Number(e.target.value) || 1),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  Объём V<sub>укр</sub>, м³ (опц.)
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Авто по трап."
                  value={input.targetVolumeM3 ?? ''}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      targetVolumeM3:
                        e.target.value === ''
                          ? null
                          : Math.max(0.1, Number(e.target.value)),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm placeholder:font-sans placeholder:text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">
                Форма защищаемого объекта
              </span>
              <select
                value={input.objectContour.shape}
                onChange={(e) =>
                  onChangeInput((prev) => ({
                    ...prev,
                    objectContour: {
                      ...prev.objectContour,
                      shape: e.target.value as CalculationInput['objectContour']['shape'],
                    },
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="cylinder">Цилиндр (резервуар РВС)</option>
                <option value="rectangle">Прямоугольник (здание / трансф.)</option>
                <option value="polygon">Правильный n-угольник</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  {input.objectContour.shape === 'cylinder'
                    ? 'Диаметр D, м'
                    : input.objectContour.shape === 'rectangle'
                      ? 'Длина L, м'
                      : 'Сторона a, м'}
                </span>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={input.objectContour.lengthM}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      objectContour: {
                        ...prev.objectContour,
                        lengthM: Math.max(0.5, Number(e.target.value) || 0.5),
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
                />
              </label>

              {input.objectContour.shape === 'rectangle' ? (
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">
                    Ширина B, м
                  </span>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={input.objectContour.widthM}
                    onChange={(e) =>
                      onChangeInput((prev) => ({
                        ...prev,
                        objectContour: {
                          ...prev.objectContour,
                          widthM: Math.max(0.5, Number(e.target.value) || 0.5),
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
                  />
                </label>
              ) : input.objectContour.shape === 'polygon' ? (
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">
                    Число сторон n
                  </span>
                  <input
                    type="number"
                    min={3}
                    max={24}
                    step={1}
                    value={input.objectContour.polygonSides}
                    onChange={(e) =>
                      onChangeInput((prev) => ({
                        ...prev,
                        objectContour: {
                          ...prev.objectContour,
                          polygonSides: Math.max(3, Math.round(Number(e.target.value) || 6)),
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">
                    Высота H<sub>min</sub>, м
                  </span>
                  <input
                    type="number"
                    min={0.5}
                    max={6.0}
                    step={0.1}
                    value={input.minHeightM}
                    onChange={(e) =>
                      onChangeInput((prev) => ({
                        ...prev,
                        minHeightM: Math.min(6, Math.max(0.5, Number(e.target.value) || 0.5)),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  Отступ d<sub>отст</sub>, м (&ge;1,5)
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={input.objectContour.offsetM}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      objectContour: {
                        ...prev.objectContour,
                        offsetM: Math.max(0, Number(e.target.value) || 0),
                      },
                    }))
                  }
                  className={`mt-1 w-full rounded-lg border px-2.5 py-1.5 font-mono text-sm ${
                    input.objectContour.offsetM < 1.5
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-300'
                  }`}
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  Пропорция W:H
                </span>
                <select
                  value={input.objectContour.ratio}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      objectContour: {
                        ...prev.objectContour,
                        ratio: e.target.value as '3:1' | '2:1',
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                >
                  <option value="2:1">2:1 (стеснённые усл.)</option>
                  <option value="3:1">3:1 (открытая площ.)</option>
                </select>
              </label>
            </div>

            {input.objectContour.shape !== 'cylinder' && (
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  Целевая высота H<sub>min</sub>, м
                </span>
                <input
                  type="number"
                  min={0.5}
                  max={6.0}
                  step={0.1}
                  value={input.minHeightM}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      minHeightM: Math.min(6, Math.max(0.5, Number(e.target.value) || 0.5)),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
                />
              </label>
            )}

            {input.objectContour.offsetM < 1.5 && (
              <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Отступ менее 1,5 м нарушает пп. 3.1.13 и 9.5.3 СП 542.1325800.2024
                  (для РВС типовой вынос 2,0–3,0 м).
                </span>
              </div>
            )}

            <div className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
              Расчётный контур: W<sub>осн</sub> ={' '}
              <strong className="font-mono text-slate-900">
                {resolvedGeom.baseWidthM.toFixed(2)} м
              </strong>
              , P<sub>ср</sub> ={' '}
              <strong className="font-mono text-slate-900">
                {resolvedGeom.avgPerimeterM.toFixed(2)} м
              </strong>
            </div>
          </div>
        )}

        {/* Правило верхнего среза */}
        <div className="mt-3 border-t border-slate-100 pt-2.5">
          <span className="text-xs font-medium text-slate-600">
            Правило верхнего среза W<sub>верх</sub>
          </span>
          <div className="mt-1 grid grid-cols-3 gap-1">
            {(
              [
                { id: '1x', label: '1 × шир.' },
                { id: '2x', label: '2 × шир.' },
                { id: 'auto', label: 'Авто ≥0.8м' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  onChangeInput((prev) => ({ ...prev, crestRule: opt.id }))
                }
                className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                  input.crestRule === opt.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Наполнитель и среда */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Box className="h-4 w-4 text-amber-600" />
          <span>2. Наполнитель и среда</span>
        </div>

        <div className="space-y-2.5">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Вид инертного наполнителя
            </span>
            <select
              value={input.fillerId}
              onChange={(e) => {
                const nextFiller =
                  fillers.find((f) => f.id === e.target.value) ?? fillers[0];
                onChangeInput((prev) => ({
                  ...prev,
                  fillerId: nextFiller.id,
                  fillerDensityKgM3: nextFiller.densityRangeKgM3[2],
                }));
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {fillers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">
                Насыпная плотность ρ<sub>нап</sub>, кг/м³
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                норм. {selectedFiller.densityRangeKgM3[0]}–
                {selectedFiller.densityRangeKgM3[1]}
              </span>
            </div>
            <input
              type="number"
              min={150}
              max={2500}
              step={10}
              value={input.fillerDensityKgM3}
              onChange={(e) =>
                onChangeInput((prev) => ({
                  ...prev,
                  fillerDensityKgM3: Math.max(
                    150,
                    Number(e.target.value) || selectedFiller.densityRangeKgM3[2]
                  ),
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
            />
          </label>

          <div className="rounded-lg bg-amber-50/70 p-2 text-[11px] leading-relaxed text-amber-900">
            <strong>Тара:</strong> {selectedFiller.bagRecommendation}
          </div>

          <div>
            <span className="text-xs font-medium text-slate-600">
              Категория взрывоопасности зоны
            </span>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onChangeInput((prev) => ({ ...prev, hazardZone: 'normal' }))
                }
                className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                  input.hazardZone === 'normal'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Обычная (<Abbr text="Тип A" />)
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeInput((prev) => ({ ...prev, hazardZone: 'explosive' }))
                }
                className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                  input.hazardZone === 'explosive'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <Abbr text="НПЗ" />/<Abbr text="ГСМ" /> (<Abbr text="Тип C" />/<Abbr text="Тип D" />)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Параметры укладки и засыпки */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Sliders className="h-4 w-4 text-emerald-600" />
          <span>3. Режим укладки и засыпки</span>
        </div>

        <div className="space-y-2.5">
          <div>
            <span className="text-xs font-medium text-slate-600">
              Высота яруса (подгонка под H<sub>min</sub>)
            </span>
            <div className="mt-1 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() =>
                  onChangeInput((prev) => ({ ...prev, heightMode: 'max_fill' }))
                }
                className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                  input.heightMode === 'max_fill'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Макс. (85% / <Abbr text="БРН" />)
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeInput((prev) => ({ ...prev, heightMode: 'fit_h_min' }))
                }
                className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                  input.heightMode === 'fit_h_min'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Подгонка под <Abbr text="H_min">H<sub>min</sub></Abbr>
              </button>
            </div>
          </div>

          <label className="block">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-600">
                Предел заполнения по высоте k<sub>h</sub>
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {Math.round(input.fillHeightRatio * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={0.85}
              step={0.01}
              value={input.fillHeightRatio}
              onChange={(e) =>
                onChangeInput((prev) => ({
                  ...prev,
                  fillHeightRatio: Number(e.target.value),
                }))
              }
              className="mt-1 w-full accent-blue-600"
            />
          </label>

          {/* Переключатель УФ-полога */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Защитный УФ-полог (СП 542 п. 9.5.3)
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={input.includeTarp}
                onClick={() =>
                  onChangeInput((prev) => ({
                    ...prev,
                    includeTarp: !prev.includeTarp,
                  }))
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  input.includeTarp ? 'bg-sky-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    input.includeTarp ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="mt-1 text-[11px] leading-tight text-slate-500">
              {input.includeTarp
                ? 'Включён: водонепроницаемый полог с люверсами для защиты полипропилена от солнечной радиации и осадков.'
                : 'Отключён: для временных/краткосрочных ЗОК (смета и эскиз пересчитаны без полога).'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <span>Дополнительные настройки укладки</span>
            {showAdvanced ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showAdvanced && (
            <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
              <div>
                <span className="text-xs font-medium text-slate-600">
                  Ориентация МКР
                </span>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onChangeInput((prev) => ({ ...prev, orientation: 'vertical' }))
                    }
                    className={`rounded border px-2 py-1 text-xs ${
                      input.orientation === 'vertical'
                        ? 'border-blue-600 bg-white font-semibold text-blue-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Вертикально (станд.)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeInput((prev) => ({ ...prev, orientation: 'flat' }))
                    }
                    className={`rounded border px-2 py-1 text-xs ${
                      input.orientation === 'flat'
                        ? 'border-blue-600 bg-white font-semibold text-blue-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Плашмя (закрытый)
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  Коэффициент запаса на потери k<sub>пот</sub>
                </span>
                <input
                  type="number"
                  min={1.0}
                  max={1.15}
                  step={0.01}
                  value={input.lossFactor}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      lossFactor: Math.min(1.15, Math.max(1.0, Number(e.target.value) || 1.0)),
                    }))
                  }
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs"
                />
              </label>

              <div>
                <span className="text-xs font-medium text-slate-600">
                  Округление 1-го яруса (подошвы)
                </span>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onChangeInput((prev) => ({
                        ...prev,
                        baseTierRounding: 'round',
                      }))
                    }
                    className={`rounded border px-2 py-1 text-[11px] ${
                      input.baseTierRounding === 'round'
                        ? 'border-blue-600 bg-white font-semibold text-blue-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    round (Табл. 2.3)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeInput((prev) => ({
                        ...prev,
                        baseTierRounding: 'floor',
                      }))
                    }
                    className={`rounded border px-2 py-1 text-[11px] ${
                      input.baseTierRounding === 'floor'
                        ? 'border-blue-600 bg-white font-semibold text-blue-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    floor (&le; W<sub>осн</sub>)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Свой МКР + Настройка ГлинТех */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <button
          type="button"
          onClick={onOpenCustomModal}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить свой типоразмер МКР</span>
        </button>

        {glintehBag && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setShowGlinteh((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <span>Параметры линейки ООО «ГлинТех»</span>
              {showGlinteh ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showGlinteh && (
              <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                <label className="block">
                  <span className="text-slate-600">
                    Высота (90–200 см): {glintehBag.dimensionsCm.height} см
                  </span>
                  <input
                    type="range"
                    min={90}
                    max={200}
                    step={5}
                    value={glintehBag.dimensionsCm.height}
                    onChange={(e) =>
                      onUpdateGlinteh(
                        Number(e.target.value),
                        glintehBag.swlKg ?? 1000,
                        Number(
                          (0.9 * 0.9 * (Number(e.target.value) / 100)).toFixed(2)
                        )
                      )
                    }
                    className="w-full accent-blue-600"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-600">
                    БРН (1000–3000 кг): {glintehBag.swlKg ?? 1000} кг
                  </span>
                  <input
                    type="range"
                    min={1000}
                    max={3000}
                    step={100}
                    value={glintehBag.swlKg ?? 1000}
                    onChange={(e) =>
                      onUpdateGlinteh(
                        glintehBag.dimensionsCm.height,
                        Number(e.target.value),
                        glintehBag.nominalVolumeM3
                      )
                    }
                    className="w-full accent-blue-600"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Сметный блок */}
        <div className="mt-2.5 border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={() => setShowCosts((v) => !v)}
            className="flex w-full items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            <span>Сметный блок (₽, опционально)</span>
            {showCosts ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showCosts && (
            <div className="mt-2 space-y-2">
              <label className="block">
                <span className="text-[11px] text-slate-500">
                  Пустой МКР (ориент. 250–430 ₽/шт.)
                </span>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={input.costs.bagPriceRub}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      costs: {
                        ...prev.costs,
                        bagPriceRub: Math.max(0, Number(e.target.value) || 0),
                      },
                    }))
                  }
                  className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                />
              </label>
              <label className="block">
                <span className="text-[11px] text-slate-500">
                  Наполнитель (песок от 650 ₽/м³)
                </span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={input.costs.fillerPriceRubM3}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      costs: {
                        ...prev.costs,
                        fillerPriceRubM3: Math.max(0, Number(e.target.value) || 0),
                      },
                    }))
                  }
                  className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                />
              </label>
              <label className={`block ${!input.includeTarp ? 'opacity-50' : ''}`}>
                <span className="text-[11px] text-slate-500">
                  Защитный УФ-полог (₽/м²) {!input.includeTarp && '(отключён выше)'}
                </span>
                <input
                  type="number"
                  min={0}
                  step={10}
                  disabled={!input.includeTarp}
                  value={input.costs.tarpPriceRubM2}
                  onChange={(e) =>
                    onChangeInput((prev) => ({
                      ...prev,
                      costs: {
                        ...prev.costs,
                        tarpPriceRubM2: Math.max(0, Number(e.target.value) || 0),
                      },
                    }))
                  }
                  className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
