'use client';

import React from 'react';
import { ExtractedLabItem } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { Activity } from 'lucide-react';

interface FishboneViewerProps {
  labs: ExtractedLabItem[];
  selectedLabId: string | null;
  onSelectLab: (labId: string) => void;
}

const FishboneViewer: React.FC<FishboneViewerProps> = ({
  labs,
  selectedLabId,
  onSelectLab,
}) => {
  const { t } = useI18n();

  const getLabByLoincOrName = (pattern: string) => {
    return labs.find(
      (l) => l.name.toLowerCase().includes(pattern.toLowerCase()) || l.loinc.includes(pattern)
    );
  };

  const na = getLabByLoincOrName('sodium') || getLabByLoincOrName('na');
  const k = getLabByLoincOrName('potassium') || getLabByLoincOrName('k');
  const cl = getLabByLoincOrName('chloride') || getLabByLoincOrName('cl');
  const hco3 = getLabByLoincOrName('bicarbonate') || getLabByLoincOrName('hco3') || getLabByLoincOrName('carbon dioxide');
  const bun = getLabByLoincOrName('urea') || getLabByLoincOrName('bun');
  const cr = getLabByLoincOrName('creatinine') || getLabByLoincOrName('cr');
  const glu = getLabByLoincOrName('glucose') || getLabByLoincOrName('glu');
  const wbc = getLabByLoincOrName('white blood') || getLabByLoincOrName('wbc') || getLabByLoincOrName('leukocyte');
  const hgb = getLabByLoincOrName('hemoglobin') || getLabByLoincOrName('hgb') || getLabByLoincOrName('hb');
  const hct = getLabByLoincOrName('hematocrit') || getLabByLoincOrName('hct') || getLabByLoincOrName('pcv');
  const plt = getLabByLoincOrName('platelet') || getLabByLoincOrName('plt');

  const getStatusColor = (item?: ExtractedLabItem) => {
    if (!item) return 'text-white/60 hover:text-white/75';
    if (item.status === 'CRITICAL_LOW' || item.status === 'CRITICAL_HIGH') return 'text-rose-200 font-semibold';
    if (item.status === 'BORDERLINE_LOW' || item.status === 'BORDERLINE_HIGH') return 'text-amber-200 font-medium';
    return 'text-white font-medium';
  };

  const isSelected = (item?: ExtractedLabItem) => item && item.id === selectedLabId;

  const FishboneButton = ({ item, label, className = '' }: { item?: ExtractedLabItem; label: string; className?: string }) => (
    <button
      type="button"
      onClick={() => item && onSelectLab(item.id)}
      className={`px-2 py-1 rounded-md transition ${isSelected(item) ? 'bg-white/25 ring-1 ring-white/60' : 'hover:bg-white/15'} ${className}`}
      aria-label={`${label}: ${item ? `${item.value} ${item.unit}` : 'not available'}`}
    >
      <div className="text-[9.5px] font-mono text-white/70 uppercase">{label}</div>
      <div className={`font-mono text-sm ${getStatusColor(item)}`}>{item ? (item.name.includes('Platelet') && item.value > 1000 ? `${Math.round(item.value / 1000)}k` : item.value) : '—'}</div>
    </button>
  );

  return (
    <div className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex items-center justify-between border-b border-white/15 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-200" aria-hidden="true" />
          <h3 className="font-serif italic text-base tracking-wide text-white">Medical Fishbone Diagrams (Standard Notation)</h3>
        </div>
        <span className="text-[10.5px] font-mono text-white/70">Click any biomarker value to open OCR provenance bounding box</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* BMP Fishbone */}
        <div className="rounded-xl border glass-soft p-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-white uppercase tracking-wider">Basic Metabolic Panel (Chem-7)</span>
            <span className="text-white/60 text-[10px]">Na | Cl | BUN / K | HCO3 | Cr &lt; Glu</span>
          </div>
          <div className="mt-4 flex items-center justify-center p-3">
            <div className="relative font-mono text-base select-none">
              <svg width="360" height="140" viewBox="0 0 360 140" className="overflow-visible" aria-hidden="true">
                <line x1="20" y1="70" x2="280" y2="70" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="100" y1="20" x2="100" y2="120" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="190" y1="20" x2="190" y2="120" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="280" y1="70" x2="310" y2="30" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="280" y1="70" x2="310" y2="110" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="absolute top-2 left-6"><FishboneButton item={na} label="Na+" /></div>
              <div className="absolute top-2 left-32"><FishboneButton item={cl} label="Cl-" /></div>
              <div className="absolute top-2 left-56"><FishboneButton item={bun} label="BUN" /></div>
              <div className="absolute bottom-2 left-6"><FishboneButton item={k} label="K+" /></div>
              <div className="absolute bottom-2 left-32"><FishboneButton item={hco3} label="HCO3" /></div>
              <div className="absolute bottom-2 left-56"><FishboneButton item={cr} label="Cr" /></div>
              <div className="absolute top-12 right-0"><FishboneButton item={glu} label="Glu" /></div>
            </div>
          </div>
        </div>

        {/* CBC Fishbone */}
        <div className="rounded-xl border glass-soft p-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-white uppercase tracking-wider">Complete Blood Count (CBC)</span>
            <span className="text-white/60 text-[10px]">WBC \ Hgb / Hct / Plt</span>
          </div>
          <div className="mt-4 flex items-center justify-center p-3">
            <div className="relative font-mono text-base select-none">
              <svg width="340" height="140" viewBox="0 0 340 140" className="overflow-visible" aria-hidden="true">
                <line x1="50" y1="20" x2="130" y2="70" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="50" y1="120" x2="130" y2="70" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="130" y1="70" x2="220" y2="70" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="220" y1="70" x2="290" y2="20" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="220" y1="70" x2="290" y2="120" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="absolute top-11 left-0"><FishboneButton item={wbc} label="WBC" /></div>
              <div className="absolute top-3 left-36"><FishboneButton item={hgb} label="Hgb" /></div>
              <div className="absolute bottom-3 left-36"><FishboneButton item={hct} label="Hct" /></div>
              <div className="absolute top-11 right-0"><FishboneButton item={plt} label="Plt" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FishboneViewer);
