'use client';

import React, { useState } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { FileCode, Download, Copy, Check } from 'lucide-react';

interface FHIRExportProps {
  patient: PatientCase;
}

function generateFHIRBundle(patient: PatientCase): Record<string, unknown> {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    meta: {
      source: 'House Health PAC Platform v2.5',
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    },
    entry: [
      {
        resource: {
          resourceType: 'Patient',
          id: patient.id,
          identifier: [{ system: 'urn:oid:2.16.840.1.113883.3.2708', value: patient.mrn }],
          name: [{ family: patient.name.split(' ').pop(), given: patient.name.split(' ').slice(0, -1) }],
          gender: patient.gender === 'M' ? 'male' : 'female',
          birthDate: new Date(Date.now() - patient.age * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      },
      {
        resource: {
          resourceType: 'Encounter',
          id: `encounter-${patient.id}`,
          status: 'planned',
          class: { code: 'AMB', display: 'ambulatory' },
          type: [{ coding: [{ system: 'http://snomed.info/sct', code: patient.cptCode, display: patient.procedureName }]}],
          subject: { reference: `Patient/${patient.id}` },
          period: { start: patient.scheduledTimeIso },
        },
      },
      ...patient.labs.map((lab) => ({
        resource: {
          resourceType: 'Observation',
          id: lab.id,
          status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: lab.loinc, display: lab.name }]},
          subject: { reference: `Patient/${patient.id}` },
          valueQuantity: { value: lab.value, unit: lab.unit, system: 'http://unitsofmeasure.org', code: lab.unit },
          referenceRange: [{ low: { value: lab.refLow, unit: lab.unit }, high: { value: lab.refHigh, unit: lab.unit }}],
        },
      })),
      ...patient.medications.map((med) => ({
        resource: {
          resourceType: 'MedicationRequest',
          id: med.id,
          status: med.status === 'CLEARED' ? 'active' : 'on-hold',
          medicationCodeableConcept: { text: med.drugName },
          subject: { reference: `Patient/${patient.id}` },
          note: [{ text: med.clinicalAction }],
        },
      })),
      ...(patient.allergies || []).map((allergy) => ({
        resource: {
          resourceType: 'AllergyIntolerance',
          id: allergy.id,
          clinicalStatus: { coding: [{ code: 'active' }]},
          verificationStatus: { coding: [{ code: 'confirmed' }]},
          type: 'allergy',
          category: [allergy.category.toLowerCase()],
          criticality: allergy.severity === 'ANAPHYLAXIS' || allergy.severity === 'SEVERE' ? 'high' : 'low',
          code: { text: allergy.allergen },
          reaction: [{ manifestation: [{ text: allergy.reaction }], severity: allergy.severity.toLowerCase() }],
          subject: { reference: `Patient/${patient.id}` },
        },
      })),
    ],
  };
}

export const FHIRExport: React.FC<FHIRExportProps> = ({ patient }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const bundle = generateFHIRBundle(patient);
  const jsonStr = JSON.stringify(bundle, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FHIR_PAC_${patient.mrn}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex items-center justify-between mb-3.5 border-b border-white/15 pb-3">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-sky-200" aria-hidden="true" />
          <h2 className="font-serif italic text-lg tracking-wide text-white">{t('newFeatures.exportFhir')}</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs font-mono text-white hover:text-white transition cursor-pointer"
        >
          {showPreview ? '▼' : '▶'} {t('newFeatures.exportJson')}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-white/85 px-4 py-2 text-xs font-bold text-slate-900 transition shadow-sm cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-slate-900" />
          <span>{t('newFeatures.downloadJson')}</span>
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-mono text-white/85 transition hover:bg-white/15 cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-200" /> : <Copy className="h-3.5 w-3.5 text-white/70" />}
          <span>{copied ? t('newFeatures.copiedFhir') : t('common.copy')}</span>
        </button>
      </div>

      {showPreview && (
        <div className="mt-3 rounded-xl border glass-soft p-3.5 max-h-48 overflow-y-auto">
          <pre className="text-[10px] font-mono text-white/85 whitespace-pre-wrap break-all leading-relaxed">
            {jsonStr.substring(0, 2000)}{jsonStr.length > 2000 ? '\n...' : ''}
          </pre>
        </div>
      )}
    </div>
  );
};

export default React.memo(FHIRExport);
