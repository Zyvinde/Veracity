'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Calculator, Scale } from 'lucide-react';

export const BMICalculator: React.FC = () => {
  const { t } = useI18n();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const bmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || h <= 0) return null;
    return w / Math.pow(h / 100, 2);
  }, [weight, height]);

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: t('newFeatures.underweight'), color: 'text-yellow-400 bg-yellow-950/20 border-yellow-500/30' };
    if (bmi < 25) return { label: t('newFeatures.normalWeight'), color: 'text-white bg-white/10 border-white/30 font-semibold' };
    if (bmi < 30) return { label: t('newFeatures.overweight'), color: 'text-orange-400 bg-orange-950/20 border-orange-500/30' };
    if (bmi < 35) return { label: t('newFeatures.obeseClass1'), color: 'text-orange-400 bg-orange-950/30 border-orange-500/40' };
    if (bmi < 40) return { label: t('newFeatures.obeseClass2'), color: 'text-[#EF4444] bg-red-950/30 border-red-500/40' };
    return { label: t('newFeatures.obeseClass3'), color: 'text-white bg-red-600 border-red-500 font-bold' };
  };

  return (
    <div className="rounded-[6px] border border-white/[0.08] bg-[#111215] p-5 shadow-none">
      <div className="flex items-center gap-2 mb-3.5 border-b border-white/[0.06] pb-3">
        <Calculator className="h-4 w-4 text-[#EF4444]" aria-hidden="true" />
        <h2 className="font-serif text-lg tracking-wide text-white">{t('newFeatures.bmiCalculator')}</h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8D8781] mb-1">{t('newFeatures.weightKg')}</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="70"
            min="1"
            max="300"
            className="w-full rounded-[3px] border border-white/[0.08] bg-[#000000] px-3 py-1.5 text-xs text-[#F0ECE5] placeholder-[#6F6A64] focus:border-[#E1AD66] focus:outline-none font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8D8781] mb-1">{t('newFeatures.heightCm')}</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="170"
            min="50"
            max="250"
            className="w-full rounded-[3px] border border-white/[0.08] bg-[#000000] px-3 py-1.5 text-xs text-[#F0ECE5] placeholder-[#6F6A64] focus:border-[#E1AD66] focus:outline-none font-mono"
          />
        </div>
      </div>

      {bmi !== null && (
        <div className="mt-3.5 rounded-[4px] border border-white/[0.08] bg-[#000000] p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-3.5 w-3.5 text-[#E1AD66]" aria-hidden="true" />
              <span className="text-[10.5px] font-mono text-[#8D8781]">{t('newFeatures.bmiResult')}</span>
            </div>
            <span className="font-mono text-base font-semibold text-[#F0ECE5]">{bmi.toFixed(1)}</span>
          </div>
          <div className="mt-1.5">
            {(() => {
              const cat = getBmiCategory(bmi);
              return (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.2 font-mono text-[9.5px] font-medium ${cat.color}`}>
                  {cat.label}
                </span>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(BMICalculator);
