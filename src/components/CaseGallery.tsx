import { Button, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { Scenario, TraceResult } from '../../shared/types';
import { scoreColor } from '../meta';
import { formatDate } from '../report';
import Panel from './Panel';

interface CaseCard {
  key: string;
  title: string;
  claim: string;
  blurb: string;
  scenarioId?: string;
}

interface Props {
  demo: boolean;
  scenarios: Scenario[];
  examples: { title: string; claim: string; blurb: string }[];
  history: TraceResult[];
  disabled: boolean;
  onPick: (claim: string, scenarioId?: string) => void;
  onOpenHistory: (item: TraceResult) => void;
}

export default function CaseGallery({ demo, scenarios, examples, history, disabled, onPick, onOpenHistory }: Props) {
  const cards: CaseCard[] = demo
    ? scenarios.map((s) => ({ key: s.id, title: s.title, claim: s.claim, blurb: s.blurb, scenarioId: s.id }))
    : examples.map((e) => ({ key: e.claim, ...e }));

  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Title order={2}>{demo ? 'Open a sample case' : 'Start with an example'}</Title>
        <Text c="dimmed" maw={640}>
          {demo
            ? 'Demo mode has three bundled cases with fictional outlets. Each one shows a different shape of spread.'
            : 'Pick an example to see a live trace, or paste your own claim above.'}
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {cards.map((card) => (
            <Panel key={card.key} style={{ display: 'flex', flexDirection: 'column' }}>
              <Text fw={700} ff="var(--mantine-font-family-headings)" fz={18} lh={1.25}>
                {card.title}
              </Text>
              <Text size="sm" mt={6} fw={500}>
                {card.claim}
              </Text>
              <Text size="sm" c="dimmed" mt={6} style={{ flex: 1 }}>
                {card.blurb}
              </Text>
              <Button mt="md" variant="default" disabled={disabled} onClick={() => onPick(card.claim, card.scenarioId)}>
                Trace this case
              </Button>
            </Panel>
          ))}
        </SimpleGrid>
      </Stack>

      {history.length > 0 && (
        <Stack gap="sm">
          <Title order={2}>Recent traces</Title>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {history.slice(0, 3).map((item) => (
              <Panel key={`${item.claim}${item.fetchedAt}`} accent={`var(--mantine-color-${scoreColor(item.score)}-6)`}>
                <Text fw={600} lineClamp={2}>
                  {item.claim}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {item.verdict.label}. Coverage {item.score} of 100.
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {formatDate(item.fetchedAt)}
                </Text>
                <Button mt="sm" variant="subtle" size="xs" onClick={() => onOpenHistory(item)}>
                  Reopen
                </Button>
              </Panel>
            ))}
          </SimpleGrid>
        </Stack>
      )}
    </Stack>
  );
}
