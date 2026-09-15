import type { Metadata } from 'next';
import NovaCinematicLanding from '@/components/NovaCinematicLanding';

export const metadata: Metadata = {
  title: 'House Health — Clear. Precise. Defended.',
  description:
    'House Health cinematic experience: how autonomous clearance works — smart intake, mobile blood triage and 1-tap attestation for zero-delay surgery.',
};

export default function NovaPage() {
  return <NovaCinematicLanding />;
}
