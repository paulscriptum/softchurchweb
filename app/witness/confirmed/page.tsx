import type { Metadata } from 'next';
import { WitnessState } from '@/components/WitnessState';

export const metadata: Metadata = { title: 'you are a witness', robots: { index: false } };

export default function Confirmed() {
  return <WitnessState title="you are a witness." line="one letter every seventh day. nothing else." back="/" />;
}
