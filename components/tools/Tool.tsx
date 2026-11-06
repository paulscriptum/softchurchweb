'use client';

import type { ReactNode } from 'react';
import type { ToolId } from '@/content/types';
import { Godrays } from './Godrays';

const tools = {
  godrays: Godrays,
} satisfies Record<ToolId, unknown>;

export function Tool({ id, title, intro }: { id: ToolId; title: string; intro: ReactNode }) {
  const Component = tools[id];
  return <Component title={title} intro={intro} />;
}
