import { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  Printer,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { CrossSectionSvg } from './components/CrossSectionSvg';
import { CustomBagModal } from './components/CustomBagModal';
import { LeftControlPanel } from './components/LeftControlPanel';
import { SpecificationPanel } from './components/SpecificationPanel';
import {
  DEFAULT_CATALOG,
  DEFAULT_FILLERS,
  calculateCatalog,
  createDefaultInput,
} from './engine/calculator';
import { BigBagCatalogItem, CalculationInput } from './types/calculator';
import {
  ProjectSavePayload,
  exportMatrixToCsv,
  exportProjectJson,
  exportSelectedBillToCsv,
} from './utils/exportUtils';

const NOTEBOOKLM_REF_URL = 'https://notebooklm.link.google/QOmNCtgBqeIx';

export function App() {
  const [input, setInput] = useState<CalculationInput>(createDefaultInput);
  const [catalog, setCatalog] = useState<BigBagCatalogItem[]>(DEFAULT_CATALOG);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(
    'riaplast_fort_95_95_150'
  );
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isNormativeOpen, setIsNormativeOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);

  const selectedFiller = useMemo(
    () =>
      DEFAULT_FILLERS.find((f) => f.id === input.fillerId) ?? DEFAULT_FILLERS[0],
    [input.fillerId]
  );

  const results = useMemo(
    () => calculateCatalog(catalog, input, DEFAULT_FILLERS),
    [catalog, input]
  );

  const selectedResult = useMemo(() => {
    const found = results.find((r) => r.bag.id === selectedBagId);
    return found ?? results[0];
  }, [results, selectedBagId]);

  const glintehBag = useMemo(
    () => catalog.find((b) => b.id === 'glinteh_parametric_90_90'),
    [catalog]
  );

  const handleUpdateGlinteh = (
    heightCm: number,
    swlKg: number,
    nominalVolumeM3: number
  ) => {
    setCatalog((prev) =>
      prev.map((item) =>
        item.id === 'glinteh_parametric_90_90'
          ? {
              ...item,
              dimensionsCm: { ...item.dimensionsCm, height: heightCm },
              swlKg,
              nominalVolumeM3,
              maxStackTiers:
                nominalVolumeM3 <= 1.0 ? 4 : nominalVolumeM3 <= 1.5 ? 3 : 2,
            }
          : item
      )
    );
  };

  const handleAddCustomBag = (newBag: BigBagCatalogItem) => {
    setCatalog((prev) => [newBag, ...prev]);
    setSelectedBagId(newBag.id);
  };

  const handleDeleteCustomBag = (id: string) => {
    setCatalog((prev) => prev.filter((b) => b.id !== id));
    if (selectedBagId === id) {
      setSelectedBagId('riaplast_fort_95_95_150');
    }
  };

  const handleAssignMissingSwl = (id: string, swlKg: number) => {
    setCatalog((prev) =>
      prev.map((b) => (b.id === id ? { ...b, swlKg } : b))
    );
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<ProjectSavePayload>;
      if (parsed.input) {
        setInput(parsed.input);
      }
      if (Array.isArray(parsed.customBags) && parsed.customBags.length > 0) {
        setCatalog([...parsed.customBags, ...DEFAULT_CATALOG]);
      }
      if (parsed.selectedResultId) {
        setSelectedBagId(parsed.selectedResultId);
      }
    } catch {
      window.alert('Не удалось прочитать JSON-файл проекта.');
    }
  };

  const handleReset = () => {
    setInput(createDefaultInput());
    setCatalog(DEFAULT_CATALOG);
    setSelectedBagId('riaplast_fort_95_95_150');
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900">
      {/* Верхняя инженерная панель */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-amber-400 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                  BIG-BAG_CASTLE
                </h1>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  СП 542.1325800.2024 (Изм. № 1)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Инженерный калькулятор подбора типоразмеров МКР и расчёта укрепительных сооружений
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              title="Сформировать готовый PDF-отчёт: эскиз трапеции, ведомость объёмов и обоснование для ПЗ"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Скачать PDF проекта</span>
            </button>

            <a
              href={NOTEBOOKLM_REF_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
              <span>База источников (NotebookLM)</span>
            </a>

            <button
              type="button"
              onClick={() => setIsInstructionsOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isInstructionsOpen
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
              <span>Инструкция</span>
              {isInstructionsOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsNormativeOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-600" />
              <span>Справочник норм</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Сброс</span>
            </button>
          </div>
        </div>
      </header>

      {/* Краткая интерактивная инструкция под шапкой */}
      {isInstructionsOpen && (
        <section className="border-b border-blue-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-amber-50/60 px-4 py-3 shadow-xs no-print">
          <div className="mx-auto max-w-[1640px]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  i
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  Краткая инструкция по работе с калькулятором BIG-BAG_CASTLE
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsInstructionsOpen(false)}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
              >
                Скрыть подсказку [×]
              </button>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="rounded-lg border border-slate-200/80 bg-white/90 p-2.5 shadow-2xs">
                <div className="font-bold text-blue-700 mb-1">
                  1. Исходные данные (слева)
                </div>
                <p className="text-slate-600 leading-snug">
                  Выберите <strong>Режим А</strong> (готовая трапеция: W<sub>осн</sub>, H<sub>min</sub>, P<sub>ср</sub>) или <strong>Режим Б</strong> (авторасчёт вокруг объекта: РВС, здания или многоугольника с отступом &ge; 1,5 м).
                </p>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white/90 p-2.5 shadow-2xs">
                <div className="font-bold text-amber-700 mb-1">
                  2. Наполнитель и зона
                </div>
                <p className="text-slate-600 leading-snug">
                  Укажите материал (кварцевый песок, щебень, грунт, керамзит). Для НПЗ включите режим <strong>«НПЗ/ГСМ»</strong> — калькулятор назначит антистатические МКР Типа C (с заземлением) или Типа D.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white/90 p-2.5 shadow-2xs">
                <div className="font-bold text-emerald-700 mb-1">
                  3. Матрица сравнения (в центре)
                </div>
                <p className="text-slate-600 leading-snug">
                  Система на лету просчитывает <strong>все 32 типоразмера РФ</strong>. Кликните по любой строке: зелёные — норма, жёлтые — с оговорками (наведите курсор для расшифровки проверки).
                </p>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white/90 p-2.5 shadow-2xs">
                <div className="font-bold text-indigo-700 mb-1">
                  4. Чертёж и экспорт (внизу)
                </div>
                <p className="text-slate-600 leading-snug">
                  Смотрите векторный чертёж сечения, раскладку перевязки на 1/2 длины. Скачивайте ведомости в <strong>CSV/Excel</strong>, сохраняйте <strong>JSON</strong> или печатайте готовую <strong>PDF-карточку</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Заголовок для печати PDF */}
      <div className="hidden border-b border-slate-300 pb-2 mb-4 print-only">
        <h1 className="text-lg font-bold">
          BIG-BAG_CASTLE — Ведомость расчёта ЗОК из МКР по СП 542.1325800.2024 (Изм. № 1)
        </h1>
        <p className="text-xs text-slate-600">
          Дата формирования: {new Date().toLocaleDateString('ru-RU')} | Наполнитель: {selectedFiller.name} ({input.fillerDensityKgM3} кг/м³)
        </p>
      </div>

      {/* Основная 3-зонная рабочая область */}
      <main className="mx-auto grid max-w-[1640px] grid-cols-1 gap-4 p-4 lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* Левая панель управления */}
        <div className="no-print">
          <LeftControlPanel
            input={input}
            fillers={DEFAULT_FILLERS}
            glintehBag={glintehBag}
            onChangeInput={setInput}
            onUpdateGlinteh={handleUpdateGlinteh}
            onOpenCustomModal={() => setIsCustomModalOpen(true)}
            onImportJson={handleImportJson}
          />
        </div>

        {/* Центральная матрица + Правая/нижняя панель чертежа и спецификации */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="no-print">
            <ComparisonMatrix
              results={results}
              selectedId={selectedResult?.bag.id ?? null}
              filler={selectedFiller}
              onSelect={(id) => setSelectedBagId(id)}
              onDeleteCustomBag={handleDeleteCustomBag}
              onAssignMissingSwl={handleAssignMissingSwl}
            />
          </div>

          {selectedResult && (
            <>
              <CrossSectionSvg
                result={selectedResult}
                input={input}
                filler={selectedFiller}
              />

              <SpecificationPanel
                result={selectedResult}
                input={input}
                filler={selectedFiller}
                onExportSelectedCsv={() =>
                  exportSelectedBillToCsv(selectedResult, selectedFiller, input)
                }
                onExportMatrixCsv={() =>
                  exportMatrixToCsv(results, selectedFiller, input)
                }
                onExportJson={() =>
                  exportProjectJson(
                    input,
                    catalog.filter((b) => b.isCustom),
                    selectedResult.bag.id
                  )
                }
                onPrint={() => window.print()}
              />
            </>
          )}
        </div>
      </main>

      {/* Модалка добавления пользовательского МКР */}
      <CustomBagModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAdd={handleAddCustomBag}
      />

      {/* Модалка справочника нормативов */}
      {isNormativeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-base font-bold text-slate-900">
                Нормативная и методическая база расчёта
              </h3>
              <button
                type="button"
                onClick={() => setIsNormativeOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900">
                  1. СП 542.1325800.2024 (с Изменением № 1 от 25.08.2026 № 566/пр)
                </h4>
                <p>
                  Пункт 9.5.1 допускает защиту жизненно важных агрегатов оболочками с
                  наполнителем (песок, глина). Уровень ответственности ЗОК со сроком службы до 10 лет не нормируется (п. 9.1.1.3). Отступ от объекта &ge; 1,5 м (для РВС типовой вынос 2,0–3,0 м). Перевязка швов на 1/2 длины (п. 9.5.3).
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  2. Геотехническая пропорция W : H
                </h4>
                <p>
                  Открытые площадки: W:H = 3:1 (откос ~33°, угол естественного откоса песка 25–35°). Стеснённые условия (НПЗ, промплощадки): минимально допустимая пропорция 2:1 при обязательной перевязке швов, связующей траншее 10–15 см и дренажной отмостке.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  3. Четыре ограничения подбора МКР
                </h4>
                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    <strong>Правило 85%:</strong> наполнение по высоте не более 85% (остаток на утяжку и опорную площадку).
                  </li>
                  <li>
                    <strong>Лимит БРН (SWL):</strong> масса груза m<sub>МКР</sub> &le; M<sub>SWL</sub>.
                  </li>
                  <li>
                    <strong>Предел штабелирования (ООО «РиаПласт»):</strong> до 1,0 м³ — макс. 4 яруса; до 1,5 м³ — макс. 3 яруса; 2,0–3,0 м³ — макс. 2 яруса.
                  </li>
                  <li>
                    <strong>Устойчивость и гребень («БИГБАГТАРА»):</strong> h &le; 1,5·a для одиночного МКР; толщина песчаного барьера на гребне &ge; 0,8–1,0 м.
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <strong>Электростатическая безопасность (IEC 61340-4-4):</strong> вне взрывоопасных зон — Тип A; в зонах 1 и 2 (НПЗ, склады ГСМ) — только Тип C (сопротивление &lt; 10⁷ Ом с заземлением каждого мешка контуром) или Тип D.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
