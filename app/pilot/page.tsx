import type { Metadata } from 'next';
import PilotWorkspace from '@/components/PilotWorkspace';

export const metadata: Metadata = {
  title: 'Pilot Toolkit (MVP Demo) — House Health',
  description:
    'MVP demo pilot toolkit: baseline metrics, coordinator call queue, day-before checklist, OT-list cross-check. Mock data, not for clinical use.',
};

export default function PilotPage() {
  return (
    <div className="harvey-dashboard relative w-full min-h-screen overflow-x-hidden text-[#1a1a1a]" dir="ltr">
      <PilotWorkspace />
    </div>
  );
}
