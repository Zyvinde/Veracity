'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Stethoscope, Plus, Trash2, Clock } from 'lucide-react';

interface ClinicalNote {
  id: string;
  text: string;
  timestamp: string;
  author: string;
}

interface ClinicalNotesProps {
  patientId: string;
}

const STORAGE_KEY = 'anterior-health-clinical-notes';

function loadNotes(patientId: string): ClinicalNote[] {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return all[patientId] || [];
  } catch {
    return [];
  }
}

function saveNotes(patientId: string, notes: ClinicalNote[]) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    all[patientId] = notes;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export const ClinicalNotes: React.FC<ClinicalNotesProps> = ({ patientId }) => {
  const { t } = useI18n();
  const [notes, setNotes] = useState<ClinicalNote[]>(() => loadNotes(patientId));
  const [newNote, setNewNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: ClinicalNote = {
      id: `note-${Date.now()}`,
      text: newNote.trim(),
      timestamp: new Date().toISOString(),
      author: 'Physician',
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(patientId, updated);
    setNewNote('');
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(patientId, updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddNote();
    }
  };

  return (
    <div className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-sky-200" aria-hidden="true" />
          <h2 className="font-serif italic text-lg tracking-wide text-white">{t('newFeatures.clinicalNotes')}</h2>
          {notes.length > 0 && (
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-white border border-white/30">
              {notes.length}
            </span>
          )}
        </div>
        <span className={`text-xs text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3.5 space-y-3">
          <div className="flex gap-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('newFeatures.notePlaceholder')}
              rows={2}
              className="flex-1 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs text-white placeholder-white/60 focus:border-white/60 focus:bg-white/20 focus:outline-none font-sans resize-none transition"
              aria-label={t('newFeatures.addNote')}
            />
            <button
              type="button"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="self-end rounded-xl bg-white hover:bg-white/85 px-4 py-2 text-xs font-bold text-slate-900 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="h-4 w-4 text-white" />
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="text-xs text-white/60 text-center py-3 font-mono">{t('newFeatures.noNotes')}</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="rounded-xl border glass-soft p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-white/90 font-sans leading-relaxed flex-1">{note.text}</p>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-white/60 hover:text-rose-200 transition shrink-0 cursor-pointer"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-white/60">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(note.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-white font-semibold">{note.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ClinicalNotes);
