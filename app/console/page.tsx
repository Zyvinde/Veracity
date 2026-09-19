import type { Metadata } from 'next';
import ConsoleWorkspace, { ConsoleBackdrop } from '@/components/ConsoleWorkspace';

export const metadata: Metadata = {
  title: 'OT Console (MVP Prototype) — House Health Demo',
  description:
    'House Health OT Console MVP prototype: mock pre-op cases for pilot evaluation discussions only. Not a medical device, not for clinical use.',
};

export default function ConsolePage() {
  return (
    <div className="harvey-dashboard relative w-full min-h-screen overflow-x-hidden text-[#1a1a1a] selection:bg-[#1a1a1a] selection:text-white" dir="ltr">
      <ConsoleBackdrop />
      <ConsoleWorkspace />
    </div>
  );
}
