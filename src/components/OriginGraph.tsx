import { useMemo } from 'react';
import { Text } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import type { Edge, Evidence, SourceKind } from '../../shared/types';
import { KIND_META, KIND_ORDER, STANCE_META } from '../meta';
import { formatDate } from '../report';
import { useSurface } from '../theme';

export type ColorBy = 'kind' | 'stance';

interface Props {
  evidence: Evidence[];
  edges: Edge[];
  originId: string | null;
  selectedId: string | null;
  colorBy: ColorBy;
  hiddenKinds: SourceKind[];
  onSelect: (id: string) => void;
}

const WIDTH = 960;
const PAD_LEFT = 132;
const PAD_RIGHT = 40;
const PAD_TOP = 34;
const PAD_BOTTOM = 46;
const LANE_HEIGHT = 74;

interface Placed {
  item: Evidence;
  x: number;
  y: number;
  clamped: boolean;
  rank: number;
}

function fillFor(item: Evidence, colorBy: ColorBy): string {
  const color = colorBy === 'kind' ? KIND_META[item.kind].color : STANCE_META[item.stance].color;
  return `var(--mantine-color-${color}-6)`;
}

export default function OriginGraph({ evidence, edges, originId, selectedId, colorBy, hiddenKinds, onSelect }: Props) {
  const s = useSurface();
  const reduce = useReducedMotion();

  const layout = useMemo(() => {
    const visible = evidence.filter((e) => e.publishedAt && !hiddenKinds.includes(e.kind));
    if (visible.length === 0) return null;

    const lanes = KIND_ORDER.filter((kind) => visible.some((e) => e.kind === kind));
    const axisItems = visible.filter((e) => e.kind !== 'scholar');
    const basis = axisItems.length > 0 ? axisItems : visible;

    const times = basis.map((e) => Date.parse(e.publishedAt as string));
    const min = Math.min(...times);
    const max = Math.max(...times);
    const span = Math.max(max - min, 1);
    const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
    const height = PAD_TOP + lanes.length * LANE_HEIGHT + PAD_BOTTOM;

    const placed = new Map<string, Placed>();
    const laneCounters: Record<string, number> = {};
    visible.forEach((item, rank) => {
      const laneIndex = lanes.indexOf(item.kind);
      const t = Date.parse(item.publishedAt as string);
      const rawX = PAD_LEFT + ((t - min) / span) * plotWidth;
      const x = Math.min(Math.max(rawX, PAD_LEFT), WIDTH - PAD_RIGHT);
      const count = laneCounters[item.kind] ?? 0;
      laneCounters[item.kind] = count + 1;
      const offset = ((count % 3) - 1) * 21;
      const y = PAD_TOP + laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2 + offset;
      placed.set(item.id, { item, x, y, clamped: rawX < PAD_LEFT, rank });
    });

    return { placed, lanes, min, max, height };
  }, [evidence, hiddenKinds]);

  if (!layout) {
    return (
      <Text c="dimmed" size="sm">
        None of the visible sources carry a readable date, so no timeline can be drawn. The Sources tab lists every match.
      </Text>
    );
  }

  const { placed, lanes, min, max, height } = layout;
  const ticks = [min, min + (max - min) / 2, max];
  const originPlaced = originId ? placed.get(originId) : undefined;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      width="100%"
      role="img"
      aria-label="Timeline of sources that repeat the claim, grouped by source type"
      style={{ display: 'block' }}
    >
      {lanes.map((lane, index) => {
        const top = PAD_TOP + index * LANE_HEIGHT;
        return (
          <g key={lane}>
            <rect
              x={PAD_LEFT - 12}
              y={top}
              width={WIDTH - PAD_LEFT - PAD_RIGHT + 24}
              height={LANE_HEIGHT}
              rx={6}
              style={{ fill: index % 2 === 0 ? s.soft : 'transparent' }}
            />
            <text x={PAD_LEFT - 22} y={top + LANE_HEIGHT / 2 + 4} textAnchor="end" style={{ fill: s.muted, fontSize: 13, fontWeight: 600 }}>
              {KIND_META[lane].label}
            </text>
          </g>
        );
      })}

      {ticks.map((tick, index) => {
        const x = PAD_LEFT + (index / 2) * (WIDTH - PAD_LEFT - PAD_RIGHT);
        return (
          <g key={index}>
            <line x1={x} x2={x} y1={PAD_TOP} y2={height - PAD_BOTTOM} style={{ stroke: s.edge, strokeDasharray: '3 5' }} />
            <text
              x={x}
              y={height - PAD_BOTTOM + 24}
              textAnchor={index === 0 ? 'start' : index === 2 ? 'end' : 'middle'}
              style={{ fill: s.muted, fontSize: 12 }}
            >
              {formatDate(new Date(tick).toISOString())}
            </text>
          </g>
        );
      })}

      {edges.map((edge) => {
        const a = placed.get(edge.from);
        const b = placed.get(edge.to);
        if (!a || !b) return null;
        const half = Math.max((b.x - a.x) / 2, 24);
        const path = `M ${a.x} ${a.y} C ${a.x + half} ${a.y}, ${b.x - half} ${b.y}, ${b.x} ${b.y}`;
        const related = selectedId === edge.from || selectedId === edge.to;
        return (
          <path
            key={`${edge.from}-${edge.to}`}
            d={path}
            fill="none"
            pathLength={1}
            style={{
              stroke: related ? s.ink : s.muted,
              strokeWidth: (related ? 1.8 : 1) + edge.weight * 2,
              opacity: related ? 0.85 : 0.4,
              strokeDasharray: reduce ? undefined : 1,
              strokeDashoffset: reduce ? undefined : 1
            }}
          >
            {!reduce && <animate attributeName="stroke-dashoffset" from="1" to="0" dur="0.6s" begin={`${0.3 + b.rank * 0.07}s`} fill="freeze" />}
          </path>
        );
      })}

      {[...placed.values()].map(({ item, x, y, clamped, rank }) => {
        const isOrigin = item.id === originId;
        const isSelected = item.id === selectedId;
        return (
          <g
            key={item.id}
            tabIndex={0}
            role="button"
            aria-label={`${item.outlet}, ${formatDate(item.publishedAt, item.dateLabel)}: ${item.title}`}
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
            <circle cx={x} cy={y} r={20} fill="transparent" />
            {isOrigin && (
              <circle cx={x} cy={y} r={reduce ? 17 : 0} fill="none" style={{ stroke: 'var(--mantine-color-signal-6)', strokeWidth: 3 }}>
                {!reduce && <animate attributeName="r" from="0" to="17" dur="0.5s" begin={`${0.1 + rank * 0.07}s`} fill="freeze" />}
              </circle>
            )}
            {isSelected && <circle cx={x} cy={y} r={isOrigin ? 22 : 16} fill="none" style={{ stroke: s.ink, strokeWidth: 1.5 }} />}
            <circle cx={x} cy={y} r={reduce ? 9 : 0} style={{ fill: fillFor(item, colorBy) }}>
              {!reduce && <animate attributeName="r" from="0" to="9" dur="0.4s" begin={`${rank * 0.07}s`} fill="freeze" />}
            </circle>
            {clamped && (
              <text x={x - 15} y={y + 4} textAnchor="end" style={{ fill: s.muted, fontSize: 11 }}>
                earlier
              </text>
            )}
          </g>
        );
      })}

      {originPlaced && (
        <text
          x={Math.min(Math.max(originPlaced.x, PAD_LEFT + 52), WIDTH - PAD_RIGHT - 52)}
          y={originPlaced.y - 28}
          textAnchor="middle"
          style={{ fill: 'var(--mantine-color-signal-6)', fontSize: 13, fontWeight: 700 }}
        >
          Origin candidate
        </text>
      )}
    </svg>
  );
}
