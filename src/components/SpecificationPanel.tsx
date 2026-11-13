import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  Info,
  Printer,
  XCircle,
} from 'lucide-react';
import { Abbr } from './Abbr';
import {
  CalculationInput,
  CalculationResult,
  FillerCatalogItem,
} from '../types/calculator';
import { generateExplanatoryNote } from '../utils/explanatoryNote';

interface SpecificationPanelProps {
  result: CalculationResult;
  input: CalculationInput;
  filler: FillerCatalogItem;
  onExportSelectedCsv: () => void;
  onExportMatrixCsv: () => void;
  onExportJson: () => void;
  onPrint: () => void;
}

export const SpecificationPanel: React.FC<SpecificationPanelProps> = ({
  result,
  input,
  filler,
  onExportSelectedCsv,
  onExportMatrixCsv,
  onExportJson,
  onPrint,
}) => {
  const [copied, setCopied] = useState(false);

  const noteText = useMemo(
    () => generateExplanatoryNote(result, input, filler),
    [result, input, filler]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(noteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-3">
      {/* Итоговая ведомость и кнопки экспорта */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Выбранный вариант спецификации
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {result.bag.manufacturer} —{' '}
              <span className="font-mono">
                {result.bag.dimensionsCm.length}×{result.bag.dimensionsCm.width}×
                {result.bag.dimensionsCm.height} см
              </span>
            </h3>
            {result.bag.notes && (
              <p className="mt-0.5 text-xs text-slate-500">{result.bag.notes}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 no-print">
            <button
              type="button"
              onClick={onExportSelectedCsv}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              CSV ведомость
            </button>
            <button
              type="button"
              onClick={onExportMatrixCsv}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV вся матрица
            </button>
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileJson className="h-3.5 w-3.5" />
              JSON проект
            </button>
            <button
              type="button"
              onClick={onPrint}
              title="Сформировать готовый PDF-документ (эскиз сечения, ведомость, обоснование)"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Скачать PDF проекта</span>
            </button>
          </div>
        </div>

        {/* Сетка ключевых показателей */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="text-[11px] text-slate-500"><Abbr text="МКР" /> (дискр. / объём)</div>
            <div className="mt-0.5 font-mono text-base font-bold text-slate-900">
              {result.nBagsDiscrete} <span className="text-xs font-normal">шт.</span>
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              объёмн.: {result.nBagsVolume} шт. ({result.bagsPerMeter.toFixed(1)}/м)
            </div>
          </div>

          <div className="rounded-lg bg-amber-50/70 p-2.5">
            <div className="text-[11px] text-amber-800">
              Объём ({filler.shortName})
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-amber-950">
              {result.totalFillerM3.toFixed(1)}{' '}
              <span className="text-xs font-normal">м³</span>
            </div>
            <div className="font-mono text-[11px] text-amber-800">
              масса: {result.totalFillerTons.toFixed(1)} т
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="text-[11px] text-slate-500">1 <Abbr text="МКР" /> (<Abbr text="V_доп">V<sub>доп</sub></Abbr> / масса)</div>
            <div className="mt-0.5 font-mono text-base font-bold text-slate-900">
              {result.vAllowedM3.toFixed(3)}{' '}
              <span className="text-xs font-normal">м³</span>
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              {result.mBagKg.toFixed(0)} кг (h={result.hFactM.toFixed(2)} м)
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="text-[11px] text-slate-500">Порядовка / <Abbr text="n_z">Ярусы</Abbr></div>
            <div className="mt-0.5 font-mono text-base font-bold text-slate-900">
              {result.rowsPerTier.join('–')}
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              H={result.hTotalFactM.toFixed(2)} м ({result.tiersCount} яр.)
            </div>
          </div>

          <div className={`rounded-lg p-2.5 ${input.includeTarp ? 'bg-sky-50/70' : 'bg-slate-50'}`}>
            <div className={`text-[11px] ${input.includeTarp ? 'text-sky-900' : 'text-slate-500'}`}>
              <Abbr text="УФ">УФ-полог</Abbr> / Траншея
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-slate-900">
              {input.includeTarp ? (
                <>
                  {result.tarpAreaM2.toFixed(0)}{' '}
                  <span className="text-xs font-normal text-slate-600">м²</span>
                </>
              ) : (
                <span className="text-xs font-semibold text-slate-400">Отключён</span>
              )}
            </div>
            <div className={`font-mono text-[11px] ${input.includeTarp ? 'text-sky-800' : 'text-slate-500'}`}>
              траншея: {result.trenchVolumeM3.toFixed(1)} м³ {!input.includeTarp && '(без полога)'}
            </div>
          </div>

          <div className="rounded-lg bg-emerald-50/70 p-2.5">
            <div className="text-[11px] text-emerald-900">Ориент. бюджет</div>
            <div className="mt-0.5 font-mono text-base font-bold text-emerald-950">
              {Math.round(result.cost.totalCostRub).toLocaleString('ru-RU')}{' '}
              <span className="text-xs font-normal">₽</span>
            </div>
            <div className="font-mono text-[10px] text-emerald-800">
              тара {Math.round(result.cost.bagsCostRub / 1000)}т + засыпка{' '}
              {Math.round(result.cost.fillerCostRub / 1000)}т
            </div>
          </div>
        </div>

        {/* Инженерные проверки */}
        <div className="mt-3 space-y-1.5">
          <div className="text-xs font-semibold text-slate-700">
            Автоматические инженерные проверки (Раздел 4.2 ТЗ):
          </div>
          {result.checks.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Все нормативные проверки пройдены без замечаний (предел штабелирования, соотношение W:H &ge; 3:1, геометрия одиночного мешка и толщина гребня).
              </span>
            </div>
          ) : (
            <div className="grid gap-1.5 md:grid-cols-2">
              {result.checks.map((c, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs ${
                    c.level === 'INVALID'
                      ? 'bg-red-50 text-red-900'
                      : c.level === 'WARNING'
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-sky-50 text-sky-900'
                  }`}
                >
                  {c.level === 'INVALID' ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  ) : c.level === 'WARNING' ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  ) : (
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  )}
                  <div>
                    <span className="font-mono text-[10px] font-bold">
                      [{c.code}]
                    </span>{' '}
                    {c.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Пояснительная записка — переносится на отдельный лист при печати в PDF */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print-break-before-page print:mt-2">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Текст для пояснительной записки проектной документации (СП 542.1325800.2024)
            </h3>
            <p className="text-xs text-slate-500">
              Автоматически сформировано по выбранному варианту МКР и наполнителю
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Копировать в ПЗ</span>
              </>
            )}
          </button>
        </div>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 font-sans text-xs leading-relaxed text-slate-700">
          {noteText}
        </pre>
      </div>
    </div>
  );
};
