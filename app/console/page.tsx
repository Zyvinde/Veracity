import type { Metadata } from 'next';
import ConsoleWorkspace, { ConsoleBackdrop } from '@/components/ConsoleWorkspace';

export const metadata: Metadata = {
  title: 'OT Console (Private Beta) — House Health Clinical Decision Support',
  description:
    'House Health OT Console (Private Beta): Pre-operative assessment, anesthesia decision support, and surgical delay prevention under DHA § 3060(a) CDS guidelines.',
};

export default function ConsolePage() {
  return (
    <div className="veracity-canvas relative w-full min-h-screen overflow-x-hidden text-white selection:bg-sky-500 selection:text-white" dir="ltr">
      <ConsoleBackdrop />
      <ConsoleWorkspace />
    </div>
  );
}
