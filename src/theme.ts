import { Badge, Button, createTheme, useComputedColorScheme } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
}

function mix(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const channel = (i: number) => Math.round(a[i] + (b[i] - a[i]) * amount);
  return `#${[0, 1, 2].map((i) => channel(i).toString(16).padStart(2, '0')).join('')}`;
}

/** Builds a ten step Mantine ramp where shade 6 is the base color. */
function ramp(base: string): MantineColorsTuple {
  const tints = [0.93, 0.84, 0.7, 0.52, 0.32, 0.14].map((t) => mix(base, '#ffffff', t));
  const shades = [0.14, 0.3, 0.46].map((t) => mix(base, '#070b12', t));
  return [...tints, base, ...shades] as unknown as MantineColorsTuple;
}

export const theme = createTheme({
  primaryColor: 'ink',
  primaryShade: { light: 6, dark: 3 },
  autoContrast: true,
  defaultRadius: 'md',
  fontFamily: '"Public Sans Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: '"Bricolage Grotesque Variable", "Public Sans Variable", system-ui, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '3.6rem', lineHeight: '1.02' },
      h2: { fontSize: '2.2rem', lineHeight: '1.1' },
      h3: { fontSize: '1.5rem', lineHeight: '1.2' },
      h4: { fontSize: '1.15rem', lineHeight: '1.3' }
    }
  },
  colors: {
    ink: ramp('#14213D'),
    signal: ramp('#E8452C'),
    verify: ramp('#0E7C86'),
    check: ramp('#C27C0E'),
    press: ramp('#3B4BA8'),
    scholar: ramp('#8A4F9E'),
    web: ramp('#6B7A8F')
  },
  components: {
    Button: Button.extend({ defaultProps: { radius: 'md' } }),
    Badge: Badge.extend({
      defaultProps: { radius: 'sm' },
      styles: { label: { textTransform: 'none', letterSpacing: 0 } }
    })
  }
});

export interface Surface {
  page: string;
  card: string;
  soft: string;
  edge: string;
  ink: string;
  muted: string;
  dark: boolean;
}

/** Surface colors for the case file look. Mantine tokens cover everything else. */
export function useSurface(): Surface {
  const scheme = useComputedColorScheme('light');
  if (scheme === 'dark') {
    return { page: '#0B1220', card: '#111B2E', soft: '#16233B', edge: '#233350', ink: '#E8EDF5', muted: '#93A1B7', dark: true };
  }
  return { page: '#EEF1F5', card: '#FFFFFF', soft: '#F5F7FA', edge: '#D9DFE8', ink: '#0E1A2B', muted: '#5B6B80', dark: false };
}
