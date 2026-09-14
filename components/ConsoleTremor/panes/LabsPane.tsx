'use client';

import React, { useMemo } from 'react';
import type { PatientCase, LabStatus } from '@/lib/types';
import { Card } from '@/components/ui/tremor/components/Card/Card';
import { Badge } from '@/components/ui/tremor/components/Badge/Badge';
import { Button } from '@/components/ui/tremor/components/Button/Button';
import { DonutChart } from '@/components/ui/tremor/components/DonutChart/DonutChart';
import {
  Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell,
} from '@/components/ui/tremor/components/Table/Table';
import FishboneViewer from '@/components/FishboneViewer';

function bucketOf(status: LabStatus): 'Normal' | 'Borderline' | 'Critical' {
  if (status === 'NORMAL') return 'Normal';
  if (status === 'BORDERLINE_LOW' || status === 'BORDERLINE_HIGH') return 'Borderline';
  return 'Critical';
}

function badgeFor(status: LabStatus): 'success' | 'warning' | 'error' {
  const b = bucketOf(status);
  return b === 'Normal' ? 'success' : b === 'Borderline' ? 'warning' : 'error';
}

interface LabsPaneProps {
  patient: PatientCase;
  selectedLabId: string | null;
  onSelectLab: (id: string) => void;
  onOpenProvenance: () => void;
}

export function LabsPane({ patient, selectedLabId, onSelectLab, onOpenProvenance }: LabsPaneProps) {
  const dist = useMemo(() => {
    const counts: Record<string, number> = { Normal: 0, Borderline: 0, Critical: 0 };
    patient.labs.forEach((l) => {
      counts[bucketOf(l.status)] += 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [patient.labs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-2 p-5">
          <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Status Mix</h3>
          <p className="font-mono text-[11px] text-gray-500 dark:text-sky-200/60">
            {patient.labs.length} biomarkers extracted
          </p>
          <DonutChart
            className="mt-3 h-52"
            data={dist}
            category="status"
            value="count"
            colors={['emerald', 'amber', 'pink']}
            showLabel
            label={`${patient.labs.length} labs`}
            valueFormatter={(v) => `${v}`}
          />
          <div className="mt-3">
            <Button variant="secondary" onClick={onOpenProvenance} className="w-full">
              Open Provenance Inspector
            </Button>
          </div>
        </Card>

        <Card className="xl:col-span-3 p-0 overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Laboratory Audit</h3>
            <p className="font-mono text-[11px] text-gray-500 dark:text-sky-200/60">click a row to inspect biomarker</p>
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Biomarker</TableHeaderCell>
                <TableHeaderCell>Result</TableHeaderCell>
                <TableHeaderCell>Ref Range</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patient.labs.map((lab) => (
                <TableRow
                  key={lab.id}
                  className={`cursor-pointer ${lab.id === selectedLabId ? 'bg-sky-50 dark:bg-sky-400/10' : ''}`}
                  onClick={() => onSelectLab(lab.id)}
                >
                  <TableCell>
                    <span className="block font-medium">{lab.name}</span>
                    <span className="block font-mono text-[10px] text-gray-500 dark:text-white/45">LOINC {lab.loinc}</span>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {lab.value} <span className="font-normal text-gray-500">{lab.unit}</span>
                  </TableCell>
                  <TableCell className="font-mono text-[11px]">
                    {lab.refLow} – {lab.refHigh}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeFor(lab.status)}>{lab.status.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Fishbone Diagram</h3>
        <div className="mt-2">
          <FishboneViewer labs={patient.labs} selectedLabId={selectedLabId} onSelectLab={onSelectLab} />
        </div>
      </Card>
    </div>
  );
}
