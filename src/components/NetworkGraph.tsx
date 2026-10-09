import { useMemo } from 'react';
import { Text } from '@mantine/core';
import type { Edge, Evidence } from '../../shared/types';
import { KIND_META } from '../meta';
import { useSurface } from '../theme';

interface Props {
  evidence: Evidence[];
  edges: Edge[];
  originId: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const SIZE = 640;
const CENTER = SIZE / 2;
const STEP = 74;

/** Radial view. The origin candidate sits in the middle and each ring is one repetition further away. */
export default function NetworkGraph({ evidence, edges, originId, selectedId, onSelect }: Props) {
  const s = useSurface();

  const layout = useMemo(() => {
    if (!originId) return null;

    const children = new Map<string, string[]>();
    for (const edge of edges) {
      children.set(edge.from, [...(children.get(edge.from) ?? []), edge.to]);
    }

    const depth = new Map<string, number>([[originId, 0]]);
    const queue = [originId];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const next of children.get(current) ?? []) {
        if (!depth.has(next)) {
          depth.set(next, (depth.get(current) as number) + 1);
          queue.push(next);
        }
      }
    }

    const maxDepth = Math.max(...depth.values());
    const unlinkedRing = maxDepth + 1;
    const rings = new Map<number, Evidence[]>();
    for (const item of evidence) {
      const ring = depth.get(item.id) ?? unlinkedRing;
      rings.set(ring, [...(rings.get(ring) ?? []), item]);
    }

    const positions = new Map<string, { x: number; y: number }>();
    for (const [ring, items] of rings) {
      if (ring === 0) {
        positions.set(items[0].id, { x: CENTER, y: CENTER });
        continue;
      }
      const radius = ring * STEP;
      items.forEach((item, index) => {
        const angle = (index / items.length) * Math.PI * 2 - Math.PI / 2 + ring * 0.35;
        positions.set(item.id, { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) });
      });
    }

    const hasUnlinked = (rings.get(unlinkedRing) ?? []).length > 0;
    return { positions, maxDepth, unlinkedRing, hasUnlinked };
  }, [evidence, edges, originId]);

  if (!layout) {
    return (
      <Text c="dimmed" size="sm">
        No origin candidate was found, so the network cannot be centred. Check the Sources tab.
      </Text>
    );
  }

  const { positions, maxDepth, unlinkedRing, hasUnlinked } = layout;
  const ringCount = hasUnlinked ? unlinkedRing : maxDepth;
  const viewSize = Math.max(SIZE, (ringCount * STEP + 60) * 2);
  const offset = (viewSize - SIZE) / 2;

  return (
    <svg
      viewBox={`${-offset} ${-offset} ${viewSize} ${viewSize}`}
      width="100%"
      style={{ display: 'block', maxHeight: 700 }}
      role="img"
      aria-label="Network of sources around the origin candidate, grouped by how many repetitions away they are"
    >
      {Array.from({ length: ringCount }, (_, i) => i + 1).map((ring) => (
        <g key={ring}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ring * STEP}
            fill="none"
            style={{ stroke: s.edge, strokeDasharray: ring === unlinkedRing && hasUnlinked ? '2 6' : '3 5' }}
          />
          <text x={CENTER + 6} y={CENTER - ring * STEP - 6} style={{ fill: s.muted, fontSize: 15 }}>
            {ring === unlinkedRing && hasUnlinked ? 'No clear link' : `Repeated ${ring} step${ring > 1 ? 's' : ''} away`}
          </text>
        </g>
      ))}

      {edges.map((edge) => {
        const a = positions.get(edge.from);
        const b = positions.get(edge.to);
        if (!a || !b) return null;
        const active = selectedId === edge.from || selectedId === edge.to;
        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            style={{ stroke: active ? s.ink : s.muted, strokeWidth: active ? 2.6 : 1.4, opacity: active ? 0.9 : 0.35 }}
          />
        );
      })}

      {evidence.map((item) => {
        const pos = positions.get(item.id);
        if (!pos) return null;
        const isOrigin = item.id === originId;
        const isSelected = item.id === selectedId;
        return (
          <g
            key={item.id}
            tabIndex={0}
            role="button"
            aria-label={`${item.outlet}: ${item.title}`}
            onClick={() => onSelect(item.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(item.id);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <title>{`${item.outlet}\n${item.title}`}</title>
            <circle cx={pos.x} cy={pos.y} r={20} fill="transparent" />
            {isOrigin && <circle cx={pos.x} cy={pos.y} r={23} fill="none" style={{ stroke: 'var(--mantine-color-signal-6)', strokeWidth: 3.5 }} />}
            {isSelected && <circle cx={pos.x} cy={pos.y} r={isOrigin ? 28 : 18} fill="none" style={{ stroke: s.ink, strokeWidth: 1.5 }} />}
            <circle cx={pos.x} cy={pos.y} r={isOrigin ? 15 : 11} style={{ fill: `var(--mantine-color-${KIND_META[item.kind].color}-6)` }} />
          </g>
        );
      })}

      <text x={CENTER} y={CENTER + 48} textAnchor="middle" style={{ fill: 'var(--mantine-color-signal-6)', fontSize: 16, fontWeight: 700 }}>
        Origin candidate
      </text>
    </svg>
  );
}
