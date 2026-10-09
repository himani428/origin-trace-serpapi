import { Paper } from '@mantine/core';
import type { PaperProps } from '@mantine/core';
import type { MouseEventHandler, ReactNode } from 'react';
import { useSurface } from '../theme';

interface Props extends PaperProps {
  children: ReactNode;
  /** CSS color for a left edge that marks what the panel is about. */
  accent?: string;
  id?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

/** Surface used for every block in the case file. */
export default function Panel({ children, accent, style, p = 'lg', ...rest }: Props) {
  const s = useSurface();
  return (
    <Paper
      p={p}
      radius="lg"
      style={{
        background: s.card,
        borderTop: `1px solid ${s.edge}`,
        borderRight: `1px solid ${s.edge}`,
        borderBottom: `1px solid ${s.edge}`,
        borderLeft: accent ? `5px solid ${accent}` : `1px solid ${s.edge}`,
        ...style
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
}
