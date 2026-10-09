import { useState } from 'react';
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Chip,
  Grid,
  Group,
  Menu,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title
} from '@mantine/core';
import type { SourceKind, TraceResult } from '../../shared/types';
import { KIND_META, KIND_ORDER, STANCE_META } from '../meta';
import { buildReport, buildShareText, downloadText, formatDate, originOf, slugify } from '../report';
import { useSurface } from '../theme';
import NetworkGraph from './NetworkGraph';
import OriginGraph from './OriginGraph';
import type { ColorBy } from './OriginGraph';
import Panel from './Panel';
import RelatedPanel from './RelatedPanel';
import ScoreCard from './ScoreCard';
import SourceDetail from './SourceDetail';
import SourceList from './SourceList';
import SpreadCharts from './SpreadCharts';

interface Props {
  result: TraceResult;
  busy: boolean;
  onNewTrace: () => void;
  onTrace: (claim: string) => void;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Panel p="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fz={28} fw={700} lh={1.15} ff="var(--mantine-font-family-headings)">
        {value}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed" mt={2}>
          {hint}
        </Text>
      )}
    </Panel>
  );
}

export default function Dossier({ result, busy, onNewTrace, onTrace }: Props) {
  const s = useSurface();
  const origin = originOf(result);
  const [selectedId, setSelectedId] = useState<string | null>(result.summary.originId);
  const [tab, setTab] = useState<string>('timeline');
  const [colorBy, setColorBy] = useState<ColorBy>('kind');
  const [hidden, setHidden] = useState<SourceKind[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const selected = result.evidence.find((e) => e.id === selectedId) ?? null;
  const total = result.stanceCounts.supports + result.stanceCounts.disputes + result.stanceCounts.neutral;

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied('failed');
    }
  };

  const selectFromChart = (id: string) => setSelectedId(id);
  const selectFromList = (id: string) => {
    setSelectedId(id);
  };

  const stamp = new Date(result.fetchedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Stack gap="lg">
      <Panel>
        <Group justify="space-between" align="flex-start" gap="lg">
          <div style={{ flex: 1, minWidth: 260 }}>
            <Text size="sm" c="dimmed" fw={600}>
              Case file
            </Text>
            <Title order={2} fz={{ base: 26, sm: 34 }} mt={2}>
              {result.claim}
            </Title>
            <Group gap="xs" mt="sm">
              <Badge variant="light" color="gray">
                {stamp}
              </Badge>
              <Badge variant="light" color="gray">
                {result.region.gl.toUpperCase()} | {result.region.hl}
              </Badge>
              {result.demo && (
                <Badge variant="light" color="orange">
                  Sample data
                </Badge>
              )}
            </Group>
          </div>
          <Group gap="xs">
            <Button variant="default" onClick={onNewTrace} disabled={busy}>
              New trace
            </Button>
            <Button onClick={() => copy('share', buildShareText(result))}>
              {copied === 'share' ? 'Reply copied' : 'Copy chat reply'}
            </Button>
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <Button variant="default">Export</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => copy('report', buildReport(result))}>
                  {copied === 'report' ? 'Report copied' : 'Copy report text'}
                </Menu.Item>
                <Menu.Item onClick={() => downloadText(`${slugify(result.claim)}.md`, buildReport(result), 'text/markdown')}>
                  Download report (Markdown)
                </Menu.Item>
                <Menu.Item
                  onClick={() => downloadText(`${slugify(result.claim)}.json`, JSON.stringify(result, null, 2), 'application/json')}
                >
                  Download data (JSON)
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
        {copied === 'failed' && (
          <Alert color="red" mt="md">
            The browser blocked copying. Use Export and download the report instead.
          </Alert>
        )}
      </Panel>

      {result.warnings.map((warning) => (
        <Alert key={warning} color="yellow" variant="light">
          {warning}
        </Alert>
      ))}

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <ScoreCard result={result} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md" h="100%">
            <Panel accent="var(--mantine-color-signal-6)">
              <Text size="sm" fw={600} c="signal.6">
                Origin candidate
              </Text>
              {origin ? (
                <>
                  <Text size="sm" c="dimmed" mt={2}>
                    {origin.outlet} | {formatDate(origin.publishedAt, origin.dateLabel)}
                  </Text>
                  <Anchor
                    href={origin.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    fw={700}
                    fz={20}
                    lh={1.25}
                    ff="var(--mantine-font-family-headings)"
                    display="block"
                    mt={4}
                    c={s.ink}
                  >
                    {origin.title}
                  </Anchor>
                  {origin.snippet && (
                    <Text size="sm" c="dimmed" mt={6} lineClamp={2}>
                      {origin.snippet}
                    </Text>
                  )}
                </>
              ) : (
                <Text size="sm" c="dimmed" mt={4}>
                  No dated news or web result matched closely enough to name an origin.
                </Text>
              )}
            </Panel>

            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
              <Stat label="Outlets" value={String(result.summary.independentOutlets)} hint="Distinct domains" />
              <Stat label="Official" value={String(result.summary.primarySources)} hint="Government or institutional" />
              <Stat label="Fact checks" value={String(result.summary.factChecks)} />
              <Stat
                label="Time span"
                value={result.summary.spanDays === null ? 'Unknown' : `${result.summary.spanDays} d`}
                hint="First to last report"
              />
            </SimpleGrid>

            <Panel p="md">
              <Group justify="space-between" mb={8}>
                <Text fw={600}>How sources lean</Text>
                <Text size="xs" c="dimmed">
                  Keyword based, so open the sources to confirm
                </Text>
              </Group>
              {total > 0 ? (
                <>
                  <Progress.Root size={14} radius="xl">
                    <Progress.Section value={(result.stanceCounts.supports / total) * 100} color="green.6" />
                    <Progress.Section value={(result.stanceCounts.neutral / total) * 100} color="gray.5" />
                    <Progress.Section value={(result.stanceCounts.disputes / total) * 100} color="red.6" />
                  </Progress.Root>
                  <Group gap="lg" mt={8}>
                    {(['supports', 'neutral', 'disputes'] as const).map((key) => (
                      <Text key={key} size="sm">
                        <Text span fw={700} c={`${STANCE_META[key].color}.6`}>
                          {result.stanceCounts[key]}
                        </Text>{' '}
                        {STANCE_META[key].short.toLowerCase()}
                      </Text>
                    ))}
                  </Group>
                </>
              ) : (
                <Text size="sm" c="dimmed">
                  No sources to compare.
                </Text>
              )}
            </Panel>
          </Stack>
        </Grid.Col>
      </Grid>

      <Panel>
        <Title order={4} mb="sm">
          What to know
        </Title>
        <Stack gap="xs">
          {result.signals.map((signal) => (
            <Alert key={signal.text} variant="light" color={signal.level === 'good' ? 'teal' : signal.level === 'warn' ? 'orange' : 'blue'} p="sm">
              {signal.text}
            </Alert>
          ))}
        </Stack>
      </Panel>

      <Panel p="md">
        <Tabs value={tab} onChange={(value) => value && setTab(value)} keepMounted={false}>
          <Tabs.List mb="md">
            <Tabs.Tab value="timeline">Timeline</Tabs.Tab>
            <Tabs.Tab value="spread">Spread</Tabs.Tab>
            <Tabs.Tab value="network">Network</Tabs.Tab>
            <Tabs.Tab value="sources">Sources ({result.evidence.length})</Tabs.Tab>
            <Tabs.Tab value="questions">Questions ({result.related.questions.length})</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="timeline">
            <Stack gap="md">
              <Group justify="space-between" align="center" gap="md">
                <Text size="sm" c="dimmed" maw={560}>
                  Each dot is a source placed by date. The orange ring is the earliest close match. Lines join a source to the earlier
                  source it most resembles. Scholarly items older than the window sit at the left edge.
                </Text>
                <SegmentedControl
                  size="xs"
                  value={colorBy}
                  onChange={(v) => setColorBy(v as ColorBy)}
                  data={[
                    { value: 'kind', label: 'Colour by type' },
                    { value: 'stance', label: 'Colour by stance' }
                  ]}
                />
              </Group>
              <Chip.Group multiple value={KIND_ORDER.filter((k) => !hidden.includes(k))} onChange={(shown) => setHidden(KIND_ORDER.filter((k) => !shown.includes(k)))}>
                <Group gap={6}>
                  {KIND_ORDER.map((kind) => (
                    <Chip key={kind} value={kind} size="xs" color={KIND_META[kind].color} variant="light">
                      {KIND_META[kind].label}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
              <OriginGraph
                key={`${result.fetchedAt}-${colorBy === 'kind' ? 'k' : 's'}-${hidden.join('')}`}
                evidence={result.evidence}
                edges={result.edges}
                originId={result.summary.originId}
                selectedId={selectedId}
                colorBy={colorBy}
                hiddenKinds={hidden}
                onSelect={selectFromChart}
              />
              <SourceDetail selected={selected} evidence={result.evidence} edges={result.edges} originId={result.summary.originId} onSelect={selectFromChart} />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="spread">
            <SpreadCharts evidence={result.evidence} />
          </Tabs.Panel>

          <Tabs.Panel value="network">
            <Stack gap="md">
              <Text size="sm" c="dimmed" maw={620}>
                The origin candidate is in the centre. Each ring is one more repetition away from it, so you can see how many hands the
                story passed through. Sources with no clear link sit on the outer dashed ring.
              </Text>
              <NetworkGraph
                evidence={result.evidence}
                edges={result.edges}
                originId={result.summary.originId}
                selectedId={selectedId}
                onSelect={selectFromChart}
              />
              <SourceDetail selected={selected} evidence={result.evidence} edges={result.edges} originId={result.summary.originId} onSelect={selectFromChart} />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="sources">
            <SourceList evidence={result.evidence} originId={result.summary.originId} selectedId={selectedId} onSelect={selectFromList} />
          </Tabs.Panel>

          <Tabs.Panel value="questions">
            <RelatedPanel related={result.related} demo={result.demo} disabled={busy} onTrace={onTrace} />
          </Tabs.Panel>
        </Tabs>
      </Panel>

      <Text size="xs" c="dimmed" maw={760}>
        Origin candidates, stance labels, and the coverage score are heuristics based on the search results retrieved (
        {Object.entries(result.engineCounts)
          .map(([engine, count]) => `${engine.replace('google_', '')}: ${count}`)
          .join(', ')}
        ). They are not proof of authorship or of truth. Scholarly dates are publication years.
      </Text>
    </Stack>
  );
}
