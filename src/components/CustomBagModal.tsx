import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getAllowedMaxTiersByVolume } from '../engine/calculator';
import { BigBagCatalogItem } from '../types/calculator';

interface CustomBagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bag: BigBagCatalogItem) => void;
}

export const CustomBagModal: React.FC<CustomBagModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [manufacturer, setManufacturer] = useState('Индивидуальный заказ (РФ)');
  const [lengthCm, setLengthCm] = useState(95);
  const [widthCm, setWidthCm] = useState(95);
  const [heightCm, setHeightCm] = useState(140);
  const [swlKg, setSwlKg] = useState(1500);
  const [fabricDensityGsm, setFabricDensityGsm] = useState(180);
  const [loopsCount, setLoopsCount] = useState(4);
  const [notes, setNotes] = useState(
    'Спецзаказ (партия от 100 шт.), УФ-стабилизация HALS, двухслойная ткань под песок'
  );

  if (!isOpen) return null;

  const nominalVol = Number(
    ((lengthCm / 100) * (widthCm / 100) * (heightCm / 100)).toFixed(3)
  );
  const maxTiers = getAllowedMaxTiersByVolume(nominalVol);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBag: BigBagCatalogItem = {
      id: `custom_${Date.now()}`,
      manufacturer: manufacturer.trim() || 'Пользовательский МКР',
      series: 'Индивидуальный типоразмер',
      dimensionsCm: {
        length: Math.max(30, lengthCm),
        width: Math.max(30, widthCm),
        height: Math.max(40, heightCm),
      },
      nominalVolumeM3: nominalVol,
      swlKg: Math.max(100, swlKg),
      fabricDensityGsm: Math.max(80, fabricDensityGsm),
      loopsCount,
      emptyWeightKg: null,
      maxStackTiers: maxTiers,
      notes,
      isCustom: true,
    };
    onAdd(newBag);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Добавить пользовательский МКР
            </h3>
            <p className="text-xs text-slate-500">
              Для нестандартных партий под заказ (ООО «РиаПласт» и др. от 100 шт.)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <label className="block">
            <span className="font-medium text-slate-700">
              Производитель / наименование
            </span>
            <input
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="font-medium text-slate-700">Длина b, см</span>
              <input
                type="number"
                min={30}
                max={200}
                step={0.5}
                value={lengthCm}
                onChange={(e) => setLengthCm(Number(e.target.value) || 90)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700">Ширина a, см</span>
              <input
                type="number"
                min={30}
                max={200}
                step={0.5}
                value={widthCm}
                onChange={(e) => setWidthCm(Number(e.target.value) || 90)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700">Высота h, см</span>
              <input
                type="number"
                min={40}
                max={250}
                step={1}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value) || 120)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="font-medium text-slate-700">БРН (SWL), кг</span>
              <input
                type="number"
                min={200}
                max={5000}
                step={50}
                value={swlKg}
                onChange={(e) => setSwlKg(Number(e.target.value) || 1000)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700">Ткань, г/м²</span>
              <input
                type="number"
                min={80}
                max={300}
                step={10}
                value={fabricDensityGsm}
                onChange={(e) => setFabricDensityGsm(Number(e.target.value) || 160)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm"
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700">Стропы, шт.</span>
              <select
                value={loopsCount}
                onChange={(e) => setLoopsCount(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-sm"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={4}>4</option>
              </select>
            </label>
          </div>

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
            Номинальный объём: <strong className="font-mono">{nominalVol} м³</strong> |
            Предел штабелирования (РиаПласт):{' '}
            <strong className="font-mono">до {maxTiers} ярусов</strong>
          </div>

          <label className="block">
            <span className="font-medium text-slate-700">Примечание</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-600 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Добавить в матрицу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
