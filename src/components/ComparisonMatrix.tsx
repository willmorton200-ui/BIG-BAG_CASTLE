import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Filter,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Abbr } from './Abbr';
import {
  CalculationResult,
  FillerCatalogItem,
} from '../types/calculator';

export type SortKey =
  | 'optimal'
  | 'filler'
  | 'bags'
  | 'heightDelta'
  | 'cost';

interface ComparisonMatrixProps {
  results: CalculationResult[];
  selectedId: string | null;
  filler: FillerCatalogItem;
  onSelect: (id: string) => void;
  onDeleteCustomBag: (id: string) => void;
  onAssignMissingSwl: (id: string, swlKg: number) => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  results,
  selectedId,
  filler,
  onSelect,
  onDeleteCustomBag,
  onAssignMissingSwl,
}) => {
  const [onlyPassing, setOnlyPassing] = useState(false);
  const [manufacturerFilter, setManufacturerFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('optimal');
  const [sortAsc, setSortAsc] = useState(true);

  const manufacturers = useMemo(() => {
    const set = new Set(results.map((r) => r.bag.manufacturer));
    return Array.from(set);
  }, [results]);

  const counts = useMemo(() => {
    let valid = 0;
    let warning = 0;
    let invalid = 0;
    for (const r of results) {
      if (r.status === 'VALID') valid++;
      else if (r.status === 'WARNING') warning++;
      else invalid++;
    }
    return { valid, warning, invalid };
  }, [results]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = results.filter((r) => {
      if (onlyPassing && r.status === 'INVALID') return false;
      if (
        manufacturerFilter !== 'ALL' &&
        r.bag.manufacturer !== manufacturerFilter
      ) {
        return false;
      }
      if (q) {
        const dimStr = `${r.bag.dimensionsCm.length}x${r.bag.dimensionsCm.width}x${r.bag.dimensionsCm.height}`;
        const dimRus = `${r.bag.dimensionsCm.length}×${r.bag.dimensionsCm.width}×${r.bag.dimensionsCm.height}`;
        const hay =
          `${r.bag.manufacturer} ${r.bag.series ?? ''} ${dimStr} ${dimRus} ${r.bag.notes ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'optimal') {
        diff = a.optimalityScore - b.optimalityScore;
      } else if (sortKey === 'filler') {
        diff = a.totalFillerM3 - b.totalFillerM3;
      } else if (sortKey === 'bags') {
        diff = a.nBagsDiscrete - b.nBagsDiscrete;
      } else if (sortKey === 'heightDelta') {
        diff = Math.abs(a.heightDeltaM) - Math.abs(b.heightDeltaM);
      } else if (sortKey === 'cost') {
        diff = a.cost.totalCostRub - b.cost.totalCostRub;
      }
      return sortAsc ? diff : -diff;
    });

    return sorted;
  }, [results, onlyPassing, manufacturerFilter, searchQuery, sortKey, sortAsc]);

  const handleSortClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Заголовок и фильтры */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Матрица сравнения типоразмеров <Abbr text="МКР" /> ({filteredAndSorted.length} из{' '}
            {results.length})
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Норма: {counts.valid}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              С оговорками: {counts.warning}
            </span>
            <span className="inline-flex items-center gap-1 text-red-700">
              <XCircle className="h-3.5 w-3.5" />
              Не проходят: {counts.invalid}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск (95x95, РиаПласт)..."
              className="w-44 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={manufacturerFilter}
            onChange={(e) => setManufacturerFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">Все производители</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOnlyPassing((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              onlyPassing
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Только проходящие</span>
          </button>
        </div>
      </div>

      {/* Панель быстрой сортировки */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-xs">
        <span className="mr-1 font-medium text-slate-500">Сортировка:</span>
        {(
          [
            { key: 'optimal', label: 'Оптимальность' },
            { key: 'filler', label: `Объём (${filler.shortName})` },
            { key: 'bags', label: 'Кол-во МКР' },
            { key: 'heightDelta', label: 'Отклонение от H_min' },
            { key: 'cost', label: 'Бюджет' },
          ] as const
        ).map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => handleSortClick(s.key)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              sortKey === s.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{s.label}</span>
            {sortKey === s.key && <ArrowUpDown className="h-3 w-3" />}
          </button>
        ))}
      </div>

      {/* Таблица */}
      <div className="max-h-[470px] overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2.5">Статус</th>
              <th className="px-3 py-2.5">Производитель / Типоразмер</th>
              <th className="px-2.5 py-2.5 text-right"><Abbr text="БРН" />, т</th>
              <th className="px-2.5 py-2.5 text-right"><Abbr text="V_доп">V<sub>доп</sub></Abbr> / <Abbr text="h_факт">h<sub>яруса</sub></Abbr></th>
              <th className="px-2.5 py-2.5 text-center"><Abbr text="n_z">Ярусы</Abbr> (<Abbr text="H_факт">H<sub>факт</sub></Abbr>)</th>
              <th className="px-2.5 py-2.5 text-center">Порядовка</th>
              <th className="px-2.5 py-2.5 text-right"><Abbr text="N_объём">N<sub>объём</sub></Abbr> / <Abbr text="N_дискр">N<sub>дискр</sub></Abbr></th>
              <th className="px-2.5 py-2.5 text-right">Наполнитель</th>
              <th className="px-3 py-2.5 text-right">Бюджет</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSorted.map((r) => {
              const isSelected = r.bag.id === selectedId;
              const rowBg = isSelected
                ? 'bg-blue-50/90 ring-1 ring-inset ring-blue-300'
                : r.status === 'INVALID'
                  ? 'bg-red-50/30 hover:bg-red-50/60'
                  : 'hover:bg-slate-50';

              return (
                <tr
                  key={r.bag.id}
                  onClick={() => onSelect(r.bag.id)}
                  className={`cursor-pointer transition ${rowBg}`}
                >
                  {/* Статус */}
                  <td className="px-3 py-2 align-top">
                    <div className="group relative inline-flex items-center">
                      {r.status === 'VALID' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Норма
                        </span>
                      )}
                      {r.status === 'WARNING' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          <AlertTriangle className="h-3 w-3" />
                          Огов.
                        </span>
                      )}
                      {r.status === 'INVALID' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                          <XCircle className="h-3 w-3" />
                          Блок
                        </span>
                      )}

                      {r.checks.length > 0 && (
                        <div className="pointer-events-none absolute left-0 top-6 z-20 hidden w-72 rounded-lg border border-slate-200 bg-slate-900 p-2.5 text-[11px] text-slate-100 shadow-xl group-hover:block">
                          <ul className="space-y-1">
                            {r.checks.map((c, idx) => (
                              <li key={idx} className="leading-snug">
                                <span
                                  className={
                                    c.level === 'INVALID'
                                      ? 'font-bold text-red-300'
                                      : c.level === 'WARNING'
                                        ? 'font-bold text-amber-300'
                                        : 'font-bold text-sky-300'
                                  }
                                >
                                  [{c.code}]
                                </span>{' '}
                                {c.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Производитель / Типоразмер */}
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="font-mono text-xs font-bold text-slate-900">
                          {r.bag.dimensionsCm.length}×{r.bag.dimensionsCm.width}×
                          {r.bag.dimensionsCm.height} см
                          {r.bag.isCustom && (
                            <span className="ml-1.5 rounded bg-indigo-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-indigo-700">
                              Свой
                            </span>
                          )}
                          {r.bag.isParametric && (
                            <span className="ml-1.5 rounded bg-sky-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-sky-700">
                              Парам.
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {r.bag.manufacturer}
                        </div>
                      </div>
                      {r.bag.isCustom && (
                        <button
                          type="button"
                          title="Удалить свой МКР"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomBag(r.bag.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* БРН */}
                  <td className="px-2.5 py-2 text-right align-top font-mono">
                    {r.effectiveSwlKg !== null ? (
                      <div>
                        <div className="font-semibold text-slate-800">
                          {(r.effectiveSwlKg / 1000).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {r.swlUsagePct?.toFixed(0)}%
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const raw = window.prompt(
                            'Укажите БРН (SWL) для этой модели в кг (например, 1000):',
                            '1000'
                          );
                          if (raw) {
                            const val = Number(raw);
                            if (Number.isFinite(val) && val > 0) {
                              onAssignMissingSwl(r.bag.id, val);
                            }
                          }
                        }}
                        title="В источнике БРН не указана — нажмите для ручного ввода"
                        className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-800 underline decoration-dotted hover:bg-amber-100"
                      >
                        ______________
                      </button>
                    )}
                  </td>

                  {/* V_доп / h_факт */}
                  <td className="px-2.5 py-2 text-right align-top font-mono">
                    <div className="font-semibold text-slate-800">
                      {r.vAllowedM3.toFixed(3)} м³
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {r.hFactM.toFixed(3)} м
                    </div>
                  </td>

                  {/* Ярусы (H_факт) */}
                  <td className="px-2.5 py-2 text-center align-top font-mono">
                    <div
                      className={`font-semibold ${
                        r.tiersCount > r.allowedMaxTiers
                          ? 'text-red-700'
                          : 'text-slate-800'
                      }`}
                    >
                      {r.tiersCount} / {r.allowedMaxTiers} макс.
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {r.hTotalFactM.toFixed(2)} м
                    </div>
                  </td>

                  {/* Порядовка */}
                  <td className="px-2.5 py-2 text-center align-top font-mono">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-800">
                      {r.rowsPerTier.join('–')}
                    </span>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      гребень {r.crestWidthM.toFixed(2)} м
                    </div>
                  </td>

                  {/* N_объём / N_дискр */}
                  <td className="px-2.5 py-2 text-right align-top font-mono">
                    <div className="font-bold text-slate-900">
                      {r.nBagsDiscrete} шт.
                    </div>
                    <div className="text-[10px] text-slate-500">
                      объёмн. {r.nBagsVolume} ({r.methodDiffPct >= 0 ? '+' : ''}
                      {r.methodDiffPct.toFixed(0)}%)
                    </div>
                  </td>

                  {/* Наполнитель */}
                  <td className="px-2.5 py-2 text-right align-top font-mono">
                    <div className="font-semibold text-slate-800">
                      {r.totalFillerM3.toFixed(1)} м³
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {r.totalFillerTons.toFixed(1)} т
                    </div>
                  </td>

                  {/* Бюджет */}
                  <td className="px-3 py-2 text-right align-top font-mono">
                    <div className="font-semibold text-slate-800">
                      {(r.cost.totalCostRub / 1000).toFixed(0)} тыс. ₽
                    </div>
                    <div className="text-[10px] text-slate-400">
                      W:H {r.actualRatioWH.toFixed(2)}:1
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredAndSorted.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  Нет вариантов, удовлетворяющих текущим фильтрам. Снимите фильтр
                  «Только проходящие» или измените поисковый запрос.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
