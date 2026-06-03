/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ToothState } from '../types';

interface DentalChartProps {
  chartData: Record<number, ToothState['status']>;
  onChange?: (toothNumber: number, status: ToothState['status']) => void;
  readOnly?: boolean;
}

const toothStatusInfo = {
  healthy: { label: 'سليم', color: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300' },
  decay: { label: 'تسوس', color: 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300' },
  treated: { label: 'علاج عصب', color: 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300' },
  missing: { label: 'مفقود', color: 'bg-slate-200 hover:bg-slate-300 text-slate-600 border-slate-400 border-dashed' },
  crown: { label: 'تلبيسة / جسر', color: 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300' },
  implant: { label: 'زراعة', color: 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300' },
};

export default function DentalChart({ chartData, onChange, readOnly = false }: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = React.useState<number | null>(null);

  const upperTeeth = [
    // Quadrant 1 (Upper Right)
    18, 17, 16, 15, 14, 13, 12, 11,
    // Quadrant 2 (Upper Left)
    21, 22, 23, 24, 25, 26, 27, 28
  ];

  const lowerTeeth = [
    // Quadrant 4 (Lower Right)
    48, 47, 46, 45, 44, 43, 42, 41,
    // Quadrant 3 (Lower Left)
    31, 32, 33, 34, 35, 36, 37, 38
  ];

  const handleToothClick = (num: number) => {
    if (readOnly) return;
    setSelectedTooth(selectedTooth === num ? null : num);
  };

  const handleStatusSelect = (num: number, status: ToothState['status']) => {
    if (onChange) {
      onChange(num, status);
    }
    setSelectedTooth(null);
  };

  const renderTooth = (num: number) => {
    const status = chartData[num] || 'healthy';
    const styleObj = toothStatusInfo[status];
    const isSelected = selectedTooth === num;

    return (
      <div key={num} className="relative flex flex-col items-center m-1">
        <button
          type="button"
          onClick={() => handleToothClick(num)}
          disabled={readOnly}
          className={`w-11 h-11 rounded-t-xl rounded-b-md border-2 flex flex-col items-center justify-center text-xs font-mono font-bold transition-all duration-200 cursor-pointer shadow-xs ${styleObj.color} ${
            isSelected ? 'ring-4 ring-sky-400 scale-110 z-10' : ''
          }`}
          title={`السن #${num} - (${toothStatusInfo[status].label})`}
        >
          <span className="text-[10px] opacity-70">#{num}</span>
          <span className="text-[9px] truncate max-w-full font-serif font-extrabold">
            {status === 'healthy' ? '🦷' : status === 'decay' ? '👾' : status === 'treated' ? '⚡' : status === 'missing' ? '❌' : status === 'crown' ? '👑' : '🔩'}
          </span>
        </button>

        {/* Mini status selection popup */}
        {isSelected && !readOnly && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 w-44">
            <p className="text-[11px] font-bold text-slate-800 text-center mb-1.5 border-b pb-1">تعديل حالة السن #{num}</p>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {(Object.keys(toothStatusInfo) as Array<ToothState['status']>).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusSelect(num, st)}
                  className={`w-full px-1.5 py-1 text-center rounded border transition-colors cursor-pointer ${
                    status === st ? 'bg-sky-500 text-white font-bold border-sky-500' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {toothStatusInfo[st].label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
      <div className="flex flex-wrap items-center justify-center gap-4 mb-4 text-xs border-b pb-3 text-slate-600 no-print">
        <span className="font-bold border-r pr-2">الحالة:</span>
        {Object.entries(toothStatusInfo).map(([key, value]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-3.5 h-3.5 rounded border border-slate-300 ${value.color.split(' ')[0]}`} />
            <span>{value.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto py-2">
        <div className="min-w-[620px] flex flex-col gap-6">
          {/* Upper Jaw */}
          <div>
            <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center justify-center gap-2">
              <span>الفك العلوي</span>
              <span className="text-[10px] bg-sky-100 text-sky-800 py-0.5 px-1.5 rounded-full uppercase">Upper Jaw</span>
            </div>
            <div className="flex justify-center flex-row-reverse">
              {upperTeeth.map(renderTooth)}
            </div>
          </div>

          <div className="border-t border-slate-200/60 my-1 border-dashed"></div>

          {/* Lower Jaw */}
          <div>
            <div className="flex justify-center flex-row-reverse">
              {lowerTeeth.map(renderTooth)}
            </div>
            <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wide mt-2 flex items-center justify-center gap-2">
              <span>الفك السفلي</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 py-0.5 px-1.5 rounded-full uppercase">Lower Jaw</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
