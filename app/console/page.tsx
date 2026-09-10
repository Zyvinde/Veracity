import type { Metadata } from 'next';
import ConsoleWorkspace, { ConsoleBackdrop } from '@/components/ConsoleWorkspace';

export const metadata: Metadata = {
  title: 'OT Console — Veracity Surgical Defense',
  description:
    'Veracity OT Console: autonomous pre-operative assessment, anesthesia clearance, and zero-delay operating theatre defense.',
};

export default function ConsolePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#171310] text-white" dir="ltr">
      <ConsoleBackdrop />
      <ConsoleWorkspace />
    </div>
  );
}
