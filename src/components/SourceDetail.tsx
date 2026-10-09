import { Anchor, Badge, Button, Group, Text } from '@mantine/core';
import type { Edge, Evidence } from '../../shared/types';
import { KIND_META, STANCE_META } from '../meta';
import { formatDate } from '../report';
import Panel from './Panel';

interface Props {
  selected: Evidence | null;
  evidence: Evidence[];
  edges: Edge[];
  originId: string | null;
  onSelect: (id: string) => void;
}

export default function SourceDetail({ selected, evidence, edges, originId, onSelect }: Props) {
  if (!selected) {
    return (
      <Panel p="md">
        <Text c="dimmed" size="sm">
          Select a dot to read the source, see what it was copied from, and see what copied it.
        </Text>
      </Panel>
    );
  }

  const parentEdge = edges.find((e) => e.to === selected.id);
  const parent = parentEdge ? evidence.find((e) => e.id === parentEdge.from) : undefined;
  const followers = edges.filter((e) => e.from === selected.id).length;

  return (
    <Panel p="md" accent={`var(--mantine-color-${KIND_META[selected.kind].color}-6)`}>
      <Group gap="xs" mb={6}>
        <Badge color={KIND_META[selected.kind].color} variant="light">
          {KIND_META[selected.kind].label}
        </Badge>
        <Badge color={STANCE_META[selected.stance].color} variant="outline">
          {STANCE_META[selected.stance].label}
        </Badge>
        {selected.id === originId && (
          <Badge color="signal" variant="filled">
            Origin candidate
          </Badge>
        )}
        <Text size="sm" c="dimmed">
          {selected.outlet} | {formatDate(selected.publishedAt, selected.dateLabel)}
        </Text>
      </Group>
      <Text fw={650} fz={17} lh={1.3}>
        {selected.title}
      </Text>
      {selected.snippet && (
        <Text size="sm" c="dimmed" mt={6}>
          {selected.snippet}
        </Text>
      )}
      <Group mt="sm" gap="lg" align="center">
        <Button component="a" href={selected.url} target="_blank" rel="noopener noreferrer" size="xs" variant="default">
          Open source
        </Button>
        <Text size="sm" c="dimmed">
          Match {Math.round(selected.similarity * 100)} percent. Repeated by {followers} later source{followers === 1 ? '' : 's'}.
        </Text>
      </Group>
      {parent && (
        <Text size="sm" mt="sm">
          Wording most resembles{' '}
          <Anchor component="button" type="button" onClick={() => onSelect(parent.id)}>
            {parent.outlet}
          </Anchor>
          , published earlier.
        </Text>
      )}
    </Panel>
  );
}
