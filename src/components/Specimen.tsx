import { useReducedMotion } from '@mantine/hooks';
import { useSurface } from '../theme';

interface Node {
  id: string;
  x: number;
  y: number;
  color: string;
  label?: string;
}

const NODES: Node[] = [
  { id: 'a', x: 62, y: 118, color: 'web', label: 'Forum post' },
  { id: 'b', x: 120, y: 190, color: 'press' },
  { id: 'c', x: 150, y: 214, color: 'press' },
  { id: 'd', x: 196, y: 186, color: 'press' },
  { id: 'e', x: 232, y: 232, color: 'press' },
  { id: 'f', x: 292, y: 58, color: 'verify', label: 'Official notice' },
  { id: 'g', x: 330, y: 112, color: 'check', label: 'Fact check' },
  { id: 'h', x: 360, y: 190, color: 'press' }
];

const EDGES: [string, string][] = [
  ['a', 'b'],
  ['a', 'c'],
  ['b', 'd'],
  ['c', 'e'],
  ['d', 'h'],
  ['f', 'g']
];

/** Static illustration of a trace, shown on the first screen. */
export default function Specimen() {
  const s = useSurface();
  const reduce = useReducedMotion();
  const byId = new Map(NODES.map((n) => [n.id, n]));

  return (
    <svg viewBox="0 0 420 300" width="100%" role="img" aria-label="Example of a claim trace: a forum post spreads to news outlets, then an official notice and a fact check appear">
      {[58, 112, 190].map((y) => (
        <line key={y} x1={20} x2={400} y1={y} y2={y} style={{ stroke: s.edge, strokeDasharray: '3 5' }} />
      ))}
      {EDGES.map(([from, to], i) => {
        const a = byId.get(from)!;
        const b = byId.get(to)!;
        const path = `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 24} ${b.x} ${b.y}`;
        return (
          <path
            key={`${from}${to}`}
            d={path}
            fill="none"
            pathLength={1}
            style={{ stroke: s.muted, strokeWidth: 1.6, opacity: 0.55, strokeDasharray: reduce ? undefined : 1, strokeDashoffset: reduce ? undefined : 1 }}
          >
            {!reduce && <animate attributeName="stroke-dashoffset" from="1" to="0" dur="0.7s" begin={`${0.5 + i * 0.12}s`} fill="freeze" />}
          </path>
        );
      })}
      {NODES.map((n, i) => (
        <g key={n.id}>
          {n.id === 'a' && (
            <circle cx={n.x} cy={n.y} r={reduce ? 17 : 0} fill="none" style={{ stroke: 'var(--mantine-color-signal-6)', strokeWidth: 3 }}>
              {!reduce && <animate attributeName="r" from="0" to="17" dur="0.5s" begin="0.2s" fill="freeze" />}
            </circle>
          )}
          <circle cx={n.x} cy={n.y} r={reduce ? 9 : 0} style={{ fill: `var(--mantine-color-${n.color}-6)` }}>
            {!reduce && <animate attributeName="r" from="0" to="9" dur="0.4s" begin={`${0.1 + i * 0.08}s`} fill="freeze" />}
          </circle>
          {n.label && (
            <text x={n.x} y={n.y - 24} textAnchor="middle" style={{ fill: s.muted, fontSize: 12 }}>
              {n.label}
            </text>
          )}
        </g>
      ))}
      <text x={20} y={282} style={{ fill: s.muted, fontSize: 12 }}>
        Earlier
      </text>
      <text x={400} y={282} textAnchor="end" style={{ fill: s.muted, fontSize: 12 }}>
        Later
      </text>
    </svg>
  );
}
