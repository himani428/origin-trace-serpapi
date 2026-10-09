import { useMemo, useState } from 'react';
import { Anchor, Badge, Chip, Group, SegmentedControl, Select, Stack, Text, TextInput } from '@mantine/core';
import type { Evidence, SourceKind, Stance } from '../../shared/types';
import { KIND_META, KIND_ORDER, STANCE_META } from '../meta';
import { formatDate } from '../report';
import Panel from './Panel';

interface Props {
  evidence: Evidence[];
  originId: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type SortKey = 'oldest' | 'newest' | 'match';

export default function SourceList({ evidence, originId, selectedId, onSelect }: Props) {
  const [kinds, setKinds] = useState<string[]>(KIND_ORDER);
  const [stance, setStance] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('oldest');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = evidence.filter(
      (e) =>
        kinds.includes(e.kind) &&
        (stance === 'all' || e.stance === stance) &&
        (!q || `${e.title} ${e.outlet} ${e.snippet}`.toLowerCase().includes(q))
    );
    const time = (e: Evidence) => (e.publishedAt ? Date.parse(e.publishedAt) : null);
    return list.sort((a, b) => {
      if (sort === 'match') return b.similarity - a.similarity;
      const ta = time(a);
      const tb = time(b);
      if (ta === null && tb === null) return 0;
      if (ta === null) return 1;
      if (tb === null) return -1;
      return sort === 'oldest' ? ta - tb : tb - ta;
    });
  }, [evidence, kinds, stance, query, sort]);

  return (
    <Stack gap="md">
      <Group gap="sm" align="flex-end">
        <TextInput
          label="Search within sources"
          placeholder="Outlet, headline, or keyword"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <Select
          label="Sort by"
          value={sort}
          onChange={(v) => v && setSort(v as SortKey)}
          allowDeselect={false}
          data={[
            { value: 'oldest', label: 'Oldest first' },
            { value: 'newest', label: 'Newest first' },
            { value: 'match', label: 'Best match' }
          ]}
          w={160}
        />
      </Group>

      <Group gap="md" align="center">
        <Chip.Group multiple value={kinds} onChange={setKinds}>
          <Group gap={6}>
            {KIND_ORDER.map((kind) => (
              <Chip key={kind} value={kind} size="xs" color={KIND_META[kind].color} variant="light">
                {KIND_META[kind].label} ({evidence.filter((e) => e.kind === kind).length})
              </Chip>
            ))}
          </Group>
        </Chip.Group>
        <SegmentedControl
          size="xs"
          value={stance}
          onChange={setStance}
          data={[
            { value: 'all', label: 'All stances' },
            { value: 'supports', label: 'Backs' },
            { value: 'disputes', label: 'Disputes' },
            { value: 'neutral', label: 'Neutral' }
          ]}
        />
      </Group>

      <Text size="sm" c="dimmed">
        Showing {visible.length} of {evidence.length} sources.
      </Text>

      {visible.map((item) => (
        <Panel
          key={item.id}
          id={`source-${item.id}`}
          p="md"
          accent={`var(--mantine-color-${KIND_META[item.kind as SourceKind].color}-6)`}
          onClick={() => onSelect(item.id)}
          style={{ cursor: 'pointer', outline: item.id === selectedId ? '2px solid var(--mantine-color-ink-6)' : undefined }}
        >
          <Group gap="xs" mb={6}>
            <Badge color={KIND_META[item.kind].color} variant="light">
              {KIND_META[item.kind].label}
            </Badge>
            <Badge color={STANCE_META[item.stance as Stance].color} variant="outline">
              {STANCE_META[item.stance as Stance].short}
            </Badge>
            {item.id === originId && (
              <Badge color="signal" variant="filled">
                Origin candidate
              </Badge>
            )}
            <Text size="sm" c="dimmed">
              {item.outlet} | {formatDate(item.publishedAt, item.dateLabel)}
            </Text>
            <Text size="xs" c="dimmed" ml="auto">
              Match {Math.round(item.similarity * 100)} percent
            </Text>
          </Group>
          <Anchor href={item.url} target="_blank" rel="noopener noreferrer" fw={600}>
            {item.title}
          </Anchor>
          {item.snippet && (
            <Text size="sm" c="dimmed" mt={4} lineClamp={3}>
              {item.snippet}
            </Text>
          )}
        </Panel>
      ))}

      {visible.length === 0 && <Text c="dimmed">No sources match these filters.</Text>}
    </Stack>
  );
}
