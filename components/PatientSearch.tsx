'use client';

import React, { useState, useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { Search, X, User } from 'lucide-react';

interface PatientSearchProps {
  patients: PatientCase[];
  currentPatientId: string;
  onSelectPatient: (patient: PatientCase) => void;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  patients,
  currentPatientId,
  onSelectPatient,
}) => {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.procedureName.toLowerCase().includes(q)
    );
  }, [query, patients]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8D8781]" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('newFeatures.searchPlaceholder')}
          className="w-full rounded-[4px] border border-white/[0.08] bg-[#000000] pl-9 pr-8 py-2 text-xs text-[#F0ECE5] placeholder-[#6F6A64] focus:border-[#E1AD66] focus:outline-none font-sans"
          aria-label={t('newFeatures.searchPatients')}
          role="combobox"
          aria-expanded={isOpen && filtered.length > 0}
          aria-controls="patient-search-results"
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#8D8781] hover:text-[#F0ECE5]"
            aria-label={t('common.close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && query && filtered.length > 0 && (
        <div role="listbox" aria-label={t('newFeatures.searchPatients')} className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-[4px] border border-white/[0.08] bg-[#111215] p-1 shadow-none z-50">
          {filtered.map((p) => (
            <button
              key={p.id}
              role="option"
              aria-selected={p.id === currentPatientId}
              onClick={() => { onSelectPatient(p); setQuery(''); setIsOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 rounded-[3px] text-xs transition flex items-center gap-2.5 ${
                p.id === currentPatientId
                  ? 'bg-white/10 border border-white/30 text-white font-semibold'
                  : 'hover:bg-white/[0.04] text-[#E2E8F0]'
              }`}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-[#000000] border border-white/[0.08] shrink-0">
                <User className="h-3 w-3 text-[#8D8781]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#F0ECE5] truncate">{p.name}</div>
                <div className="text-[10px] text-[#8D8781] font-mono truncate">
                  {p.mrn} • {p.procedureName}
                </div>
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border shrink-0 ${
                p.overallStatus === 'GREEN_CLEARED'
                  ? 'bg-white/10 text-white border-white/30 font-bold'
                  : p.overallStatus === 'AMBER_CONDITIONAL'
                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                  : 'bg-red-950/40 text-red-300 border-red-500/40 font-bold'
              }`}>
                {p.overallStatus.replace('_', ' ')}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-[4px] border border-white/[0.08] bg-[#111215] p-3 shadow-none z-50 text-center">
          <p className="text-xs text-[#8D8781] font-mono">{t('newFeatures.noPatientsFound')}</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(PatientSearch);
