import { Group, Text } from '@mantine/core';
import { useSurface } from '../theme';

export function BrandMark({ size = 30 }: { size?: number }) {
  const s = useSurface();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="Origin Trace logo">
      <rect x="1" y="1" width="30" height="30" rx="8" style={{ fill: s.dark ? '#E8EDF5' : '#14213D' }} />
      <path d="M9 22 L16 11 L23 20" fill="none" style={{ stroke: s.dark ? '#14213D' : '#E8EDF5', strokeWidth: 1.8 }} />
      <circle cx="9" cy="22" r="2.6" style={{ fill: s.dark ? '#14213D' : '#E8EDF5' }} />
      <circle cx="23" cy="20" r="2.6" style={{ fill: s.dark ? '#14213D' : '#E8EDF5' }} />
      <circle cx="16" cy="11" r="3.2" style={{ fill: '#E8452C' }} />
    </svg>
  );
}

export default function Brand() {
  return (
    <Group gap={10} wrap="nowrap">
      <BrandMark />
      <Text ff="var(--mantine-font-family-headings)" fw={700} fz={20} lh={1}>
        Origin Trace
      </Text>
    </Group>
  );
}
