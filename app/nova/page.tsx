import type { Metadata } from 'next';
import NovaCinematicLanding from '@/components/NovaCinematicLanding';

export const metadata: Metadata = {
  title: 'Veracity — Clear. Precise. Defended.',
  description:
    'Veracity cinematic experience: how autonomous clearance works — smart intake, mobile blood triage and 1-tap attestation for zero-delay surgery.',
};

export default function NovaPage() {
  return <NovaCinematicLanding />;
}
