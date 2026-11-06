import { Hanken_Grotesk } from 'next/font/google';

// The brand font lives here only. Swap this file to change it everywhere.
export const brandFont = Hanken_Grotesk({
  weight: ['300', '400'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-brand',
});
