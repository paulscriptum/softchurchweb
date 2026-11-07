import type { Metadata } from 'next';
import { WitnessState } from '@/components/WitnessState';

export const metadata: Metadata = { robots: { index: false } };

export default function Expired() {
  return <WitnessState title="this link has faded." line="leave your address once more." back="/#witness" />;
}
